import logging
import threading
import uuid
from datetime import datetime, timezone
from pgvector import Vector
from app.core.config import settings
from app.core.database import connection
from app.documents.extractor import extract, InvalidDocument
from app.rag.chunker import chunk_sections
from app.llm.client import embed, ProviderUnavailable, ProviderQuotaExceeded

logger = logging.getLogger('study_mind.worker')


def claim_job():
    with connection() as conn:
        conn.execute("""UPDATE documents SET status='FAILED', error_message='Processing was interrupted. Please try again.'
                     WHERE id IN (SELECT document_id FROM processing_jobs WHERE state='RUNNING'
                     AND locked_at < now() - interval '5 minutes' AND attempts >= 3)""")
        conn.execute("""UPDATE processing_jobs SET state='FAILED', lock_token=NULL WHERE state='RUNNING'
                     AND locked_at < now() - interval '5 minutes' AND attempts >= 3""")
        job = conn.execute("""SELECT j.*, d.stored_name, d.extraction_mode FROM processing_jobs j
                     JOIN documents d ON d.id=j.document_id WHERE d.status='PROCESSING' AND j.attempts<3
                     AND ((j.state='PENDING' AND j.available_at<=now()) OR
                     (j.state='RUNNING' AND j.locked_at<now()-interval '5 minutes'))
                     ORDER BY j.available_at FOR UPDATE OF j SKIP LOCKED LIMIT 1""").fetchone()
        if job:
            job['lock_token'] = uuid.uuid4()
            job['attempts'] += 1
            conn.execute("UPDATE processing_jobs SET state='RUNNING', attempts=%s, locked_at=now(), lock_token=%s WHERE id=%s",
                         [job['attempts'], job['lock_token'], job['id']])
        return job


def process_job(job):
    path = (settings.uploads / job['stored_name']).resolve()
    if path.parent != settings.uploads:
        raise InvalidDocument('Invalid stored file location.')
    def heartbeat():
        with connection() as conn:
            updated = conn.execute("UPDATE processing_jobs SET locked_at=now() WHERE id=%s AND lock_token=%s AND state='RUNNING'", [job['id'], job['lock_token']]).rowcount
        if not updated:
            raise RuntimeError('Processing lease was released.')
    sections = extract(path, job.get('extraction_mode', 'TEXT'), heartbeat)
    chunks = chunk_sections(sections, settings.chunk_size, settings.chunk_overlap)
    vectors = []
    for start in range(0, len(chunks), 20):
        vectors.extend(embed([c['content'] for c in chunks[start:start + 20]], 'RETRIEVAL_DOCUMENT'))
        with connection() as conn:
            updated = conn.execute("UPDATE processing_jobs SET locked_at=now() WHERE id=%s AND lock_token=%s AND state='RUNNING'",
                                   [job['id'], job['lock_token']]).rowcount
            if not updated:
                return
    with connection() as conn:
        current = conn.execute("SELECT id FROM processing_jobs WHERE id=%s AND lock_token=%s AND state='RUNNING' FOR UPDATE",
                               [job['id'], job['lock_token']]).fetchone()
        if not current:
            return
        conn.execute('DELETE FROM document_chunks WHERE document_id=%s', [job['document_id']])
        for chunk, vector in zip(chunks, vectors, strict=True):
            conn.execute('''INSERT INTO document_chunks (id, document_id, chunk_index, page_number, section, content, embedding, embedding_model)
                         VALUES (%s,%s,%s,%s,%s,%s,%s,%s)''',
                         [uuid.uuid4(), job['document_id'], chunk['chunk_index'], chunk['page_number'], chunk['section'],
                          chunk['content'], Vector(vector), settings.embedding_model])
        pages = max((s.page or 0 for s in sections), default=0) or None
        conn.execute("UPDATE documents SET status='READY',error_message=NULL,page_count=%s,updated_at=now() WHERE id=%s", [pages, job['document_id']])
        conn.execute("UPDATE processing_jobs SET state='DONE',locked_at=NULL,lock_token=NULL,last_error=NULL WHERE id=%s", [job['id']])


def fail_job(job, error):
    permanent = isinstance(error, (InvalidDocument, ValueError, ProviderQuotaExceeded)) or job['attempts'] >= 3
    message = str(error) if isinstance(error, (InvalidDocument, ProviderUnavailable, ValueError)) else 'Processing failed. Please try again.'
    message = message[:300]
    with connection() as conn:
        current = conn.execute('SELECT id FROM processing_jobs WHERE id=%s AND lock_token=%s FOR UPDATE', [job['id'], job['lock_token']]).fetchone()
        if not current:
            return
        conn.execute("""UPDATE processing_jobs SET state=%s,available_at=now()+(%s * interval '1 second'),
                     locked_at=NULL,lock_token=NULL,last_error=%s WHERE id=%s""",
                     ['FAILED' if permanent else 'PENDING', 15 * 2 ** job['attempts'], message, job['id']])
        if permanent:
            conn.execute("UPDATE documents SET status='FAILED',error_message=%s,updated_at=now() WHERE id=%s", [message, job['document_id']])
    logger.warning('document_processing_failed document=%s error_type=%s', job['document_id'], type(error).__name__)


class Worker:
    def __init__(self):
        self.stop_event = threading.Event()
        self.thread = threading.Thread(target=self.run, daemon=True, name='document-worker')

    def run(self):
        while not self.stop_event.is_set():
            try:
                job = claim_job()
                if job:
                    try:
                        process_job(job)
                    except Exception as error:
                        fail_job(job, error)
                    continue
            except Exception as error:
                logger.error('worker_error type=%s time=%s', type(error).__name__, datetime.now(timezone.utc).isoformat())
            self.stop_event.wait(2)

    def start(self):
        self.thread.start()

    def stop(self):
        self.stop_event.set()
        self.thread.join(timeout=5)
