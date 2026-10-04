import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.core.config import settings
from app.core.database import pool, connection
from app.api.chat import router
from app.api.study import router as study_router
from app.api.research import router as research_router
from app.services.worker import Worker

logging.basicConfig(level=logging.INFO, format='%(levelname)s %(name)s %(message)s')


@asynccontextmanager
async def lifespan(_app):
    pool.open()
    pool.wait(timeout=15)
    worker = Worker()
    if settings.worker_enabled:
        worker.start()
    yield
    if settings.worker_enabled:
        worker.stop()
    pool.close()


app = FastAPI(title='Study Mind Internal Agent', lifespan=lifespan, docs_url=None, redoc_url=None)
app.include_router(router)
app.include_router(study_router)
app.include_router(research_router)


@app.get('/health')
def health():
    with connection() as conn:
        conn.execute('SELECT 1')
    return {'status': 'ok', 'providerConfigured': bool(settings.llm_api_key)}
