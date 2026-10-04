"""Run integration suites in a new migrated database, separate from learner data."""
import argparse
import os
from pathlib import Path
import subprocess
import sys
import tempfile
from urllib.parse import urlsplit, urlunsplit
import uuid

from dotenv import dotenv_values
import psycopg
from psycopg import sql

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--suite', choices=['all', 'api', 'agent'], default='all')
args = parser.parse_args()
config = dotenv_values(ROOT / 'backend/.env')
database_name = 'study_mind_test_' + uuid.uuid4().hex


def database_url(url, database):
    parts = urlsplit(url)
    return urlunsplit(parts._replace(path='/' + database))


env = os.environ.copy()
env.update({key: value for key, value in config.items() if value is not None})
env['DATABASE_URL'] = database_url(config['DATABASE_URL'], database_name)
env['DIRECT_URL'] = database_url(config['DIRECT_URL'], database_name)
env['STUDY_MIND_TEST'] = '1'
env['WORKER_ENABLED'] = 'false'
runtime_role = urlsplit(config['DATABASE_URL']).username
admin_url = database_url(config['DIRECT_URL'], 'postgres')
created = False
try:
    with psycopg.connect(admin_url, autocommit=True) as admin:
        admin.execute(sql.SQL('CREATE DATABASE {}').format(sql.Identifier(database_name)))
        created = True
    with tempfile.TemporaryDirectory(prefix='study-mind-test-') as upload_dir:
        env['UPLOAD_DIR'] = upload_dir
        # Prisma owns schema changes in tests as it does in the application.
        result = subprocess.run(['node', str(ROOT / 'node_modules/prisma/build/index.js'), 'migrate', 'deploy',
                                 '--schema', str(ROOT / 'backend/prisma/schema.prisma')],
                                cwd=ROOT, env=env, capture_output=True, text=True)
        if result.returncode:
            raise RuntimeError('Test database migration failed. Check local PostgreSQL and pgvector setup.')
        with psycopg.connect(env['DIRECT_URL']) as conn:
            conn.execute(sql.SQL('GRANT USAGE ON SCHEMA public TO {}').format(sql.Identifier(runtime_role)))
            conn.execute(sql.SQL('GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA public TO {}').format(sql.Identifier(runtime_role)))
            conn.execute(sql.SQL('REVOKE ALL ON TABLE _prisma_migrations FROM {}').format(sql.Identifier(runtime_role)))
        print('Running against an isolated, freshly migrated test database.', flush=True)
        if args.suite in ('all', 'api'):
            tests = [str(path) for path in (ROOT / 'backend/tests').glob('*.test.js')]
            subprocess.run(['node', '--test', '--test-concurrency=1', *tests], cwd=ROOT / 'backend', env=env, check=True)
        if args.suite in ('all', 'agent'):
            subprocess.run([sys.executable, '-m', 'pytest', 'tests', '-q'], cwd=ROOT / 'agent', env=env, check=True)
finally:
    if created:
        with psycopg.connect(admin_url, autocommit=True) as admin:
            admin.execute(sql.SQL('DROP DATABASE {} WITH (FORCE)').format(sql.Identifier(database_name)))
        print('Removed the temporary test database.', flush=True)
