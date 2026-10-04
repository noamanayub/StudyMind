"""Real API -> extraction -> Gemini embedding -> pgvector -> Gemini answer smoke test.

Run while the application and agent are running. Creates and removes only its own
temporary test user/material. No model responses or credentials are logged.
"""
from io import BytesIO
from pathlib import Path
import json
import secrets
import sys
import time
import uuid
import httpx
import psycopg
from dotenv import dotenv_values
from pypdf import PdfWriter
from pypdf.generic import DictionaryObject, NameObject, DecodedStreamObject

ROOT = Path(__file__).resolve().parents[1]
config = dotenv_values(ROOT / 'backend/.env')
agent_config = dotenv_values(ROOT / 'agent/.env')
if not agent_config.get('LLM_API_KEY'):
    print('BLOCKED: Set LLM_API_KEY in agent/.env, restart the agent, then rerun this check.')
    sys.exit(2)
health = httpx.get('http://127.0.0.1:8000/health', timeout=10).json()
if not health.get('providerConfigured'):
    print('BLOCKED: Restart the Python agent to load the configured Gemini key.')
    sys.exit(2)


def pdf_fixture():
    writer = PdfWriter()
    for text in ('Database lecture: organization of relational data.',
                 'Normalization reduces redundant information. Third normal form removes transitive dependencies between non-key attributes.'):
        page = writer.add_blank_page(width=595, height=842)
        font = DictionaryObject({NameObject('/Type'): NameObject('/Font'), NameObject('/Subtype'): NameObject('/Type1'), NameObject('/BaseFont'): NameObject('/Helvetica')})
        page[NameObject('/Resources')] = DictionaryObject({NameObject('/Font'): DictionaryObject({NameObject('/F1'): writer._add_object(font)})})
        stream = DecodedStreamObject()
        stream.set_data(f'BT /F1 11 Tf 40 780 Td ({text}) Tj ET'.encode('ascii'))
        page[NameObject('/Contents')] = writer._add_object(stream)
    buffer = BytesIO()
    writer.write(buffer)
    return buffer.getvalue()


user_id = None
stored_files = []
checks = []
report_path = ROOT / 'output/live-verification.json'
report_path.parent.mkdir(exist_ok=True)
report_path.write_text(json.dumps({'passed': False, 'status': 'running', 'checks': checks}))
try:
    with httpx.Client(base_url='http://127.0.0.1:5000/api/v1', headers={'Origin': config['FRONTEND_URL']}, timeout=130) as client:
        password = secrets.token_urlsafe(24)
        def call(method, path, **kwargs):
            response = client.request(method, path, **kwargs)
            if response.status_code >= 400:
                raise RuntimeError(f'{method} {path}: {response.status_code} {response.json().get("message", "Request failed")}')
            return response.json()['data']
        user = call('POST', '/auth/register', json={'name': 'Live verification', 'email': f'live-{uuid.uuid4()}@qa.example.test', 'password': password, 'confirmPassword': password})
        user_id = user['id']
        workspace = call('POST', '/workspaces', json={'name': 'Live database lecture', 'icon': 'code'})
        document = call('POST', '/documents/upload', data={'workspaceId': workspace['id']}, files={'file': ('Lecture-01.pdf', pdf_fixture(), 'application/pdf')})
        print('Uploaded a real two-page PDF. Waiting for Gemini indexing...', flush=True)
        deadline = time.monotonic() + 240
        while time.monotonic() < deadline:
            document = call('GET', f'/documents/{document["id"]}')
            if document['status'] == 'FAILED':
                raise RuntimeError(document['errorMessage'])
            if document['status'] == 'READY':
                break
            time.sleep(2)
        else:
            raise RuntimeError('Processing did not finish within four minutes.')
        checks.extend(['PDF extraction', 'Gemini embeddings', 'stored pgvector chunks'])
        conversation = call('POST', '/conversations', json={'scope': 'workspace', 'workspaceId': workspace['id']})
        answer = call('POST', f'/conversations/{conversation["id"]}/messages', json={'content': 'What does third normal form remove according to my lecture?', 'requestId': str(uuid.uuid4())})
        if not answer['sources'] or not any(s['pageNumber'] == 2 and s['documentId'] == document['id'] for s in answer['sources']):
            raise RuntimeError('The answer did not cite the correct document page.')
        checks.extend(['pgvector retrieval', 'Gemini answer', 'page 2 citation'])
        original = client.get(f'/documents/{document["id"]}/content')
        assert original.status_code == 200 and original.content.startswith(b'%PDF-')
        call('POST', f'/conversations/{conversation["id"]}/messages', json={'content': 'Explain that in simpler words.', 'requestId': str(uuid.uuid4())})
        call('POST', '/auth/logout')
        call('POST', '/auth/login', json={'email': user['email'], 'password': password})
        resumed = call('GET', f'/conversations/{conversation["id"]}?limit=100')
        assert len(resumed['messages']) == 4
        report = {'passed': True, 'checks': ['PDF extraction', 'Gemini embeddings', 'pgvector retrieval', 'Gemini answer', 'page 2 citation', 'authorized PDF access', 'follow-up', 'logout/login conversation persistence']}
        report_path.write_text(json.dumps(report, indent=2))
        print('PASS: Real Gemini document-to-answer journey, citation, and resumed conversation verified.')
except (RuntimeError, httpx.HTTPError, AssertionError) as error:
    detail = str(error).replace(agent_config.get('LLM_API_KEY', ''), '[REDACTED]')[:400]
    report_path.write_text(json.dumps({'passed': False, 'checks': checks, 'error': detail}, indent=2))
    print(f'NOT PASSED: {detail}')
    sys.exit(1)
finally:
    if user_id:
        with psycopg.connect(config['DATABASE_URL']) as conn:
            stored_files = [row[0] for row in conn.execute('SELECT stored_name FROM documents WHERE user_id=%s', [user_id]).fetchall()]
            conn.execute('DELETE FROM users WHERE id=%s', [user_id])
        for filename in stored_files:
            (ROOT / 'backend' / config.get('UPLOAD_DIR', 'uploads') / Path(filename).name).unlink(missing_ok=True)
