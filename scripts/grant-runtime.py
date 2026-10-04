"""Grant existing application tables to the runtime role; never print connection strings."""
from pathlib import Path
from dotenv import dotenv_values
import psycopg

root = Path(__file__).resolve().parents[1]
config = dotenv_values(root / 'backend/.env')
with psycopg.connect(config['DIRECT_URL']) as conn:
    database = conn.execute('SELECT current_database()').fetchone()[0]
    if database != 'study_mind':
        raise RuntimeError('Expected the dedicated study_mind database.')
    conn.execute('GRANT CONNECT ON DATABASE study_mind TO study_mind_app')
    conn.execute('GRANT USAGE ON SCHEMA public TO study_mind_app')
    conn.execute('GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO study_mind_app')
    conn.execute('REVOKE ALL ON TABLE _prisma_migrations FROM study_mind_app')
    conn.execute('GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO study_mind_app')
print('Restricted runtime permissions applied to Study Mind tables.')
