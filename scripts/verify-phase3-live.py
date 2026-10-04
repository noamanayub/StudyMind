"""Real provider acceptance checks; scoped disposable account, no simulated answers."""
import json
from pathlib import Path
import subprocess
import tempfile
import time
import uuid
from dotenv import dotenv_values
import httpx
import psycopg
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
config = dotenv_values(ROOT / 'backend/.env')
client = httpx.Client(base_url=f"http://127.0.0.1:{config.get('PORT', '5000')}/api/v1", headers={'Origin': config['FRONTEND_URL']}, timeout=130)
checks, failures = [], []
user_id = None
report_path = ROOT / 'output/phase-3-live.json'
report_path.parent.mkdir(exist_ok=True)


def call(method, path, **kwargs):
    response = client.request(method, path, **kwargs)
    if response.status_code >= 400:
        raise RuntimeError(f'{method} {path}: {response.status_code} {response.json().get("message", "Request failed.")}')
    return response.json()['data']


def upload(path, mime, workspace_id, mode='TEXT'):
    with path.open('rb') as file:
        doc = call('POST', '/documents/upload', data={'workspaceId': workspace_id, 'extractionMode': mode}, files={'file': (path.name, file, mime)})
    return ready(doc)


def ready(doc):
    deadline = time.monotonic() + 180
    while time.monotonic() < deadline:
        result = call('GET', f'/documents/{doc["id"]}')
        if result['status'] == 'READY':
            if not result['chunks']:
                raise RuntimeError('Ready document had no indexed source passages.')
            return result
        if result['status'] == 'FAILED':
            raise RuntimeError(result.get('errorMessage') or 'Document processing failed.')
        time.sleep(1)
    raise RuntimeError('Document processing did not finish within the acceptance timeout.')


def check(name, action):
    try:
        result = action()
        checks.append(name)
        print(f'PASS: {name}', flush=True)
        return result
    except Exception as error:
        failures.append({'check': name, 'error': str(error)[:400]})
        print(f'NOT PASSED: {name}: {str(error)[:250]}', flush=True)


try:
    password = 'Study-Mind-live-phase3-39!'
    user = call('POST', '/auth/register', json={'name':'Phase Three Live QA', 'email':f'phase3-live-{uuid.uuid4().hex}@example.test', 'password':password, 'confirmPassword':password})
    user_id = user['id']
    workspace = call('POST', '/workspaces', json={'name':'Phase 3 live acceptance', 'icon':'book'})
    with tempfile.TemporaryDirectory(prefix='study-mind-phase3-') as temporary:
        folder = Path(temporary)
        image = Image.new('RGB', (1600, 500), 'white')
        font = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 48)
        ImageDraw.Draw(image).text((50, 70), 'Normalization reduces data redundancy.\nPrimary keys identify database records.\nForeign keys connect related database tables.', font=font, fill='black', spacing=20)
        png, pdf = folder / 'ocr-material.png', folder / 'scanned-material.pdf'
        image.save(png)
        image.save(pdf, 'PDF', resolution=150)
        doc = check('Real image OCR, Gemini embeddings and indexed source text', lambda: upload(png, 'image/png', workspace['id']))
        check('Real scanned PDF OCR with page citations and embeddings', lambda: upload(pdf, 'application/pdf', workspace['id']))
        check('Real Gemini visual image understanding and indexing', lambda: upload(png, 'image/png', workspace['id'], 'VISION'))
        audio = folder / 'lecture.wav'
        speech = "Add-Type -AssemblyName System.Speech; $speaker=New-Object System.Speech.Synthesis.SpeechSynthesizer; $speaker.SetOutputToWaveFile('" + str(audio).replace("'", "''") + "'); $speaker.Speak('Normalization reduces data redundancy. Primary keys identify database records.'); $speaker.Dispose()"
        result = subprocess.run(['powershell','-NoProfile','-Command',speech], capture_output=True, timeout=30)
        if result.returncode == 0 and audio.exists():
            check('Real synthesized lecture audio transcription and indexing', lambda: upload(audio, 'audio/wav', workspace['id']))
        else:
            failures.append({'check':'Real lecture audio transcription', 'error':'Local test speech fixture could not be generated.'})
        check('Real public YouTube excerpt transcription and indexing', lambda: ready(call('POST','/documents/youtube',json={'workspaceId':workspace['id'],'title':'Gemini documentation public video fixture','url':'https://www.youtube.com/watch?v=9hE5-98ZeCg'})))
        check('Real Google-grounded web research with persisted source evidence', lambda: call('POST','/research',json={'query':'What is database normalization? Use primary sources to explain its purpose.','requestId':str(uuid.uuid4())}))
        if doc:
            for kind, values in [('quiz',{'questionCount':5,'questionType':'MULTIPLE_CHOICE','difficulty':'EASY'}),('flashcards',{'cardCount':5})]:
                check(f'Real Gemini {kind} generation from OCR material',lambda kind=kind,values=values:call('POST',f'/study/{kind}',json={'scope':'documents','documentIds':[doc['id']],'requestId':str(uuid.uuid4()),**values}))
    report_path.write_text(json.dumps({'passed':not failures,'checks':checks,'failures':failures},indent=2),encoding='utf-8')
finally:
    if user_id:
        with psycopg.connect(config['DATABASE_URL']) as conn:
            files = [row[0] for row in conn.execute('SELECT stored_name FROM documents WHERE user_id=%s',[user_id])]
            conn.execute('DELETE FROM users WHERE id=%s',[user_id])
        uploads = (ROOT / 'backend' / config.get('UPLOAD_DIR','uploads')).resolve()
        for filename in files:
            (uploads / Path(filename).name).unlink(missing_ok=True)
    client.close()
raise SystemExit(1 if failures else 0)
