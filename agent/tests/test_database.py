import uuid
from datetime import datetime, timezone
from pathlib import Path
from pgvector import Vector
import pytest
from app.core.database import pool, connection
from app.core.config import settings
from app.rag import retriever
from app.services import worker


@pytest.fixture(scope='module', autouse=True)
def database_pool():
    from urllib.parse import urlsplit
    assert urlsplit(settings.database_url).path.startswith('/study_mind_test_'), 'Use scripts/test.py for isolated database tests.'
    pool.open()
    pool.wait(timeout=10)
    yield
    pool.close()


@pytest.fixture
def material():
    users = [uuid.uuid4(), uuid.uuid4()]
    workspaces = [uuid.uuid4(), uuid.uuid4()]
    documents = [uuid.uuid4(), uuid.uuid4()]
    chunks = [uuid.uuid4(), uuid.uuid4()]
    now = datetime.now(timezone.utc)
    vector = Vector([1.0] + [0.0] * 767)
    with connection() as conn:
        for i in range(2):
            conn.execute('INSERT INTO users(id,name,email,password_hash,updated_at) VALUES(%s,%s,%s,%s,%s)',
                         [users[i], 'QA learner', f'{users[i]}@qa.example.test', 'not-a-login-hash', now])
            conn.execute('INSERT INTO workspaces(id,user_id,name,updated_at) VALUES(%s,%s,%s,%s)', [workspaces[i], users[i], 'QA workspace', now])
            conn.execute('''INSERT INTO documents(id,user_id,workspace_id,original_name,stored_name,mime_type,file_size,status,updated_at)
                         VALUES(%s,%s,%s,%s,%s,%s,100,'READY',%s)''',
                         [documents[i], users[i], workspaces[i], 'QA lecture.txt', f'qa-{documents[i]}.txt', 'text/plain', now])
            conn.execute('''INSERT INTO document_chunks(id,document_id,chunk_index,page_number,content,embedding,embedding_model)
                         VALUES(%s,%s,0,12,%s,%s,%s)''',
                         [chunks[i], documents[i], f'Private notes for learner {i}', vector, settings.embedding_model])
    try:
        yield {'users': users, 'workspaces': workspaces, 'documents': documents, 'chunks': chunks, 'vector': vector}
    finally:
        with connection() as conn:
            conn.execute('DELETE FROM users WHERE id=ANY(%s)', [users])
        for document in documents:
            (settings.uploads / f'qa-{document}.txt').unlink(missing_ok=True)


def test_vector_retrieval_never_crosses_user_or_selected_scope(material, monkeypatch):
    monkeypatch.setattr(retriever, 'embed', lambda *args: [material['vector'].to_list()])
    alice, bob = map(str, material['users'])
    rows = retriever.retrieve(alice, 'notes', 'all')
    assert [r['document_id'] for r in rows] == [material['documents'][0]]
    assert rows[0]['page_number'] == 12
    assert retriever.retrieve(alice, 'notes', 'workspace', str(material['workspaces'][1])) == []
    assert retriever.retrieve(alice, 'notes', 'documents', document_ids=[str(material['documents'][1])]) == []
    assert retriever.retrieve(bob, 'notes', 'all')[0]['document_id'] == material['documents'][1]
    with connection() as conn:
        conn.execute("UPDATE documents SET status='PROCESSING' WHERE id=%s", [material['documents'][0]])
    assert retriever.retrieve(alice, 'notes', 'all') == []


def enqueue(material, attempts=0, stale=False):
    document_id = material['documents'][0]
    job_id = uuid.uuid4()
    with connection() as conn:
        conn.execute("UPDATE documents SET status='PROCESSING' WHERE id=%s", [document_id])
        conn.execute("""INSERT INTO processing_jobs(id,document_id,state,attempts,locked_at,lock_token)
                     VALUES(%s,%s,%s,%s,now()-interval '10 minutes',%s)""",
                     [job_id, document_id, 'RUNNING' if stale else 'PENDING', attempts, uuid.uuid4() if stale else None])
    return document_id, job_id


def test_processing_replaces_chunks_and_finishes_job_atomically(material, monkeypatch):
    document_id, job_id = enqueue(material)
    settings.uploads.mkdir(parents=True, exist_ok=True)
    (settings.uploads / f'qa-{document_id}.txt').write_text('Normalization reduces duplicated information.', encoding='utf-8')
    monkeypatch.setattr(worker, 'embed', lambda texts, task: [material['vector'].to_list() for _ in texts])
    job = worker.claim_job()
    assert job['id'] == job_id
    worker.process_job(job)
    with connection() as conn:
        assert conn.execute('SELECT status FROM documents WHERE id=%s', [document_id]).fetchone()['status'] == 'READY'
        rows = conn.execute('SELECT id,content FROM document_chunks WHERE document_id=%s', [document_id]).fetchall()
        assert len(rows) == 1
        assert rows[0]['id'] != material['chunks'][0]
        assert 'Normalization' in rows[0]['content']
        assert conn.execute('SELECT state FROM processing_jobs WHERE id=%s', [job_id]).fetchone()['state'] == 'DONE'
    worker.process_job(job)
    with connection() as conn:
        assert conn.execute('SELECT count(*) AS count FROM document_chunks WHERE document_id=%s', [document_id]).fetchone()['count'] == 1


def test_interrupted_jobs_reclaim_leases_and_exhausted_jobs_fail(material):
    document_id, job_id = enqueue(material, attempts=1, stale=True)
    job = worker.claim_job()
    assert job['id'] == job_id and job['attempts'] == 2
    worker.fail_job(job, worker.ProviderUnavailable('Temporary failure'))
    with connection() as conn:
        state = conn.execute('SELECT * FROM processing_jobs WHERE id=%s', [job_id]).fetchone()
        assert state['state'] == 'PENDING'
        assert state['available_at'] > datetime.now(timezone.utc)
        conn.execute("UPDATE processing_jobs SET state='RUNNING',attempts=3,locked_at=now()-interval '10 minutes' WHERE id=%s", [job_id])
    assert worker.claim_job() is None
    with connection() as conn:
        assert conn.execute('SELECT status FROM documents WHERE id=%s', [document_id]).fetchone()['status'] == 'FAILED'


def test_deleted_jobs_cannot_publish_chunks(material, monkeypatch):
    document_id, _ = enqueue(material)
    (settings.uploads / f'qa-{document_id}.txt').write_text('Database notes.', encoding='utf-8')
    job = worker.claim_job()
    monkeypatch.setattr(worker, 'embed', lambda texts, task: [material['vector'].to_list() for _ in texts])
    with connection() as conn:
        conn.execute('DELETE FROM documents WHERE id=%s', [document_id])
    worker.process_job(job)
    with connection() as conn:
        assert conn.execute('SELECT count(*) AS count FROM document_chunks WHERE document_id=%s', [document_id]).fetchone()['count'] == 0


def test_study_material_selection_is_owned_ready_and_bounded(material):
    from app.services.study_service import select_material, InsufficientMaterial
    from app.schemas.study import StudyRequest
    req = StudyRequest(userId=material['users'][0], scope='all', kind='SUMMARY')
    rows, coverage = select_material(req)
    assert [r['document_id'] for r in rows] == [material['documents'][0]]
    assert coverage['selectedChunks'] == 1
    foreign = req.model_copy(update={'scope': 'documents', 'documentIds': [material['documents'][1]]})
    with pytest.raises(InsufficientMaterial):
        select_material(foreign)
    with connection() as conn:
        for i in range(1, 40):
            conn.execute('INSERT INTO document_chunks(id,document_id,chunk_index,content,embedding,embedding_model) VALUES(%s,%s,%s,%s,%s,%s)',
                         [uuid.uuid4(), material['documents'][0], i, f'Passage {i}', material['vector'], settings.embedding_model])
    rows, coverage = select_material(req)
    assert len(rows) == 24 and coverage['totalChunks'] == 40
    assert rows[-1]['content'] == 'Passage 39'
    with connection() as conn:
        conn.execute("UPDATE documents SET status='PROCESSING' WHERE id=%s", [material['documents'][0]])
    with pytest.raises(InsufficientMaterial):
        select_material(req)
