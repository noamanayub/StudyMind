"""Create only the dedicated runtime role described in backend/.env; do not replace existing roles."""
from pathlib import Path
from urllib.parse import urlparse, unquote
from dotenv import dotenv_values
import psycopg
from psycopg import sql

root = Path(__file__).resolve().parents[1]
config = dotenv_values(root / 'backend/.env')
runtime = urlparse(config['DATABASE_URL'])
admin = urlparse(config['DIRECT_URL'])
if runtime.path != '/study_mind' or admin.path != '/study_mind':
    raise RuntimeError('Use the dedicated study_mind database, never an existing application database.')
if runtime.hostname != admin.hostname or runtime.port != admin.port:
    raise RuntimeError('Runtime and migration connections must target the same server.')
if unquote(runtime.username or '') != 'study_mind_app' or not runtime.password:
    raise RuntimeError('Configure a password for the study_mind_app runtime role.')
with psycopg.connect(config['DIRECT_URL']) as conn:
    if conn.execute("SELECT 1 FROM pg_roles WHERE rolname='study_mind_app'").fetchone():
        print('Runtime role already exists; no password or privileges were changed.')
    else:
        conn.execute(sql.SQL('CREATE ROLE study_mind_app LOGIN PASSWORD {}').format(sql.Literal(unquote(runtime.password))))
        print('Dedicated runtime role created. Run migrations, then scripts/grant-runtime.py.')
