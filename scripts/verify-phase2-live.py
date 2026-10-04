"""Real Gemini Phase 2 acceptance check; cleans only its own temporary account."""
from pathlib import Path
import json
import secrets
import sys
import time
import uuid
import httpx
import psycopg
from dotenv import dotenv_values

ROOT = Path(__file__).resolve().parents[1]
config = dotenv_values(ROOT / 'backend/.env')
report_path = ROOT / 'output/phase-2-live.json'
report_path.parent.mkdir(exist_ok=True)
checks = []
user_id = None
try:
    with httpx.Client(base_url='http://127.0.0.1:5000/api/v1', headers={'Origin': config['FRONTEND_URL']}, timeout=130) as client:
        def call(method, path, **kwargs):
            response = client.request(method, path, **kwargs)
            if response.status_code >= 400:
                raise RuntimeError(f'{method} {path}: {response.status_code} {response.json().get("message", "Request failed")}')
            return response.json()['data']
        password = secrets.token_urlsafe(24)
        user = call('POST', '/auth/register', json={'name': 'Phase 2 live verification', 'email': f'live-phase2-{uuid.uuid4()}@qa.example.test', 'password': password, 'confirmPassword': password})
        user_id = user['id']
        workspace = call('POST', '/workspaces', json={'name': 'Relational databases'})
        text = '''Relational database revision

A relation is a table. A tuple is a row. An attribute is a column. A primary key uniquely identifies each row. A foreign key references another table's primary key.

Normalization reduces duplication and update anomalies. First normal form requires atomic values and no repeating groups. Second normal form removes partial dependencies on composite keys. Third normal form removes transitive dependencies among non-key attributes.

An inner join returns matching rows from both tables. A left join preserves every row in the left table and adds matching right rows, or nulls when no match exists. An index speeds up reads but can slow writes.

A transaction is a group of operations treated as a unit. Atomicity means all operations succeed or all are rolled back. Consistency preserves constraints. Isolation separates concurrent transactions. Durability preserves committed changes.
'''
        document = call('POST', '/documents/upload', data={'workspaceId': workspace['id']}, files={'file': ('Database-revision.txt', text.encode(), 'text/plain')})
        deadline = time.monotonic() + 240
        while time.monotonic() < deadline:
            document = call('GET', f'/documents/{document["id"]}')
            if document['status'] == 'FAILED':
                raise RuntimeError(document['errorMessage'])
            if document['status'] == 'READY':
                break
            time.sleep(2)
        else:
            raise RuntimeError('Document did not finish processing.')
        checks.append('Real document processing and Gemini embeddings')
        call('PATCH', '/users/me/preferences', json={'answerStyle': 'DETAILED', 'explanationLevel': 'BEGINNER', 'readingSize': 'LARGE', 'density': 'COMPACT', 'reduceMotion': True})
        note = call('POST', '/notes', json={'title': 'Normalization revision note', 'content': 'First normal form uses atomic values.'})
        assert any(item['id'] == note['id'] for group in call('GET', '/search?q=normalization')['groups'] for item in group['items'])
        assert call('GET', '/statistics')['notes'] == 1
        checks.extend(['Saved preferences', 'Manual notes', 'Global search', 'Actual statistics'])
        print('Document indexed; manual notes, preferences, search and statistics verified. Checking real Gemini generation...', flush=True)
        for route in ['summarize', 'notes', 'quiz', 'flashcards']:
            payload = {'scope': 'documents', 'documentIds': [document['id']], 'requestId': str(uuid.uuid4()), 'questionCount': 5, 'questionType': 'MIXED', 'cardCount': 5}
            generated = call('POST', f'/study/{route}', json=payload)
            resource = 'summaries' if route == 'summarize' else 'quizzes' if route == 'quiz' else route
            detail = call('GET', f'/{resource}/{generated["id"]}')
            assert detail['sources'] and all(s['documentId'] == document['id'] for s in detail['sources'])
            if route == 'quiz':
                assert len(detail['questions']) == 5 and all('correctAnswer' not in q for q in detail['questions'])
            elif route == 'flashcards':
                card = detail['cards'][0]
                call('PATCH', f'/flashcards/{generated["id"]}/cards/{card["id"]}', json={'status': 'KNOWN'})
                assert call('GET', f'/flashcards/{generated["id"]}')['cards'][0]['status'] == 'KNOWN'
            else:
                assert detail['content']
            checks.append(f'Real Gemini {route} generation, persistence and validated citations')
        report_path.write_text(json.dumps({'passed': True, 'checks': checks}, indent=2))
        print('PASS: Phase 2 real Gemini generation and persistence verified.')
except (RuntimeError, httpx.HTTPError, AssertionError) as error:
    report_path.write_text(json.dumps({'passed': False, 'checks': checks, 'error': str(error)[:400]}, indent=2))
    print(f'NOT PASSED: {error}')
    sys.exit(1)
finally:
    if user_id:
        with psycopg.connect(config['DATABASE_URL']) as conn:
            files = [row[0] for row in conn.execute('SELECT stored_name FROM documents WHERE user_id=%s', [user_id])]
            conn.execute('DELETE FROM users WHERE id=%s', [user_id])
        for filename in files:
            (ROOT / 'backend' / config.get('UPLOAD_DIR', 'uploads') / Path(filename).name).unlink(missing_ok=True)
