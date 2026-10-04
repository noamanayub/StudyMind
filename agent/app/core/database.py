from contextlib import contextmanager
from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool
from pgvector.psycopg import register_vector
from .config import settings


def configure(conn):
    register_vector(conn)
    conn.commit()


pool = ConnectionPool(settings.database_url, min_size=1, max_size=5,
                      kwargs={'row_factory': dict_row}, configure=configure, open=False)


@contextmanager
def connection():
    with pool.connection(timeout=10) as conn:
        yield conn
