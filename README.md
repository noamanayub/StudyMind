# Study Mind

Study Mind is a source-grounded personal learning workspace. Learners organize course material, ask questions against their own documents, and use generated summaries, notes, quizzes, flashcards, study plans, timed exams, and research tools.

## What kind of project is this?

This is a full-stack web application with three cooperating services:

- **Frontend:** React 19 and Vite single-page application.
- **Application API:** Node.js 22, Express 5, and Prisma. It owns authentication, authorization, data, uploads, and public APIs.
- **Study agent:** Python 3.12, FastAPI, PostgreSQL/pgvector, and Gemini. It handles document processing, embeddings, retrieval, and AI generation. A worker in this service processes durable database jobs.

PostgreSQL stores accounts, study content, conversations, jobs, and vector embeddings. The browser calls only the Express API. Express calls the private Python agent; the agent is not exposed as a public browser API.

## Requirements

- Node.js **22.12 or later** and npm
- Python **3.12** and pip
- PostgreSQL **17** with pgvector, or Docker Desktop to run the included PostgreSQL service
- A Gemini API key for document embeddings and AI features (optional for starting the web app)

Use `127.0.0.1` consistently during local development. The API checks the frontend origin, and the Vite development server proxies `/api` to Express.

## First-time setup (PowerShell)

Run commands from the project root. Install JavaScript dependencies and the Python agent dependencies, then create local environment files from the checked-in examples:

```powershell
npm ci
python -m pip install --user -r agent/requirements-lock.txt

Copy-Item .env.example .env
Copy-Item backend/.env.example backend/.env
Copy-Item agent/.env.example agent/.env
Copy-Item frontend/.env.example frontend/.env
```

The root `.env` is used only by the optional Docker database. `backend/.env` and `agent/.env` configure the application services. `frontend/.env` is optional; the default API URL is `/api/v1`.

### Configure the database

The included Docker Compose service is the simplest fresh setup. It runs PostgreSQL 17 with pgvector bound to `127.0.0.1:5434`:

1. In root `.env`, replace `POSTGRES_PASSWORD` with a strong password.
2. In `backend/.env`, set `DIRECT_URL` to the PostgreSQL administrator connection, and set `DATABASE_URL` to the `study_mind_app` runtime role connection. Use port `5434` and database `study_mind` in both URLs.
3. In `agent/.env`, set `DATABASE_URL` to the same runtime-role URL used by the backend.
4. Start the database, create the restricted runtime role, and apply the Prisma schema:

```powershell
docker compose up -d postgres
python scripts/provision-runtime.py
npm run db:generate
npm run db:migrate
python scripts/grant-runtime.py
```

`provision-runtime.py` creates the `study_mind_app` role using the password in the runtime `DATABASE_URL`. `grant-runtime.py` gives that role access to application tables after migrations. Keep `DIRECT_URL` administrative and only in `backend/.env`; the agent and browser should use the restricted runtime role.

For an existing PostgreSQL 17 installation, create an empty `study_mind` database with pgvector available and use its host and port in both service URLs. The Windows startup helper automatically starts the project-local database on port `5433` when that installation exists at `.tools/postgres` and `backend/.env` points to port `5433`; other configured database ports must already be running.

### Configure secrets and AI

Set `JWT_SECRET` and `AGENT_SECRET` in `backend/.env` to separate random values of at least 32 characters. Put the **same** `AGENT_SECRET` in `agent/.env`. In PowerShell, generate a 64-character hexadecimal value with:

```powershell
[Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

Generate a different value for each secret. To enable document processing and AI answers, set `LLM_API_KEY` in `agent/.env` to your Gemini API key. Without it, the frontend and API can start, but provider-dependent indexing and generation will return configuration errors. Never put server secrets in `frontend/.env` or commit real `.env` files.

### Environment variables

| File | Variable | Purpose |
|---|---|---|
| Root `.env` | `POSTGRES_PASSWORD` | Password for the optional Docker PostgreSQL administrator |
| `backend/.env` | `DATABASE_URL` | Restricted application database connection |
| `backend/.env` | `DIRECT_URL` | Administrative connection used by Prisma migrations |
| `backend/.env` | `JWT_SECRET` | Signs browser session tokens; at least 32 characters |
| `backend/.env`, `agent/.env` | `AGENT_SECRET` | Shared secret for authenticated internal API calls; at least 32 characters |
| `backend/.env` | `PORT`, `NODE_ENV`, `FRONTEND_URL`, `AGENT_API_URL` | API port, runtime mode, allowed frontend origin, and internal agent URL |
| `backend/.env` | `MAX_FILE_SIZE_MB`, `UPLOAD_DIR` | Upload size limit and private upload storage path |
| `agent/.env` | `LLM_API_KEY`, `LLM_MODEL` | Gemini access and generation model |
| `agent/.env` | `EMBEDDING_MODEL`, `EMBEDDING_DIMENSIONS` | Embedding model and vector width; width must remain `768` for the current schema |
| `agent/.env` | `CHUNK_SIZE`, `CHUNK_OVERLAP`, `RETRIEVED_CHUNKS`, `MIN_SIMILARITY` | Document chunking and retrieval settings |
| `agent/.env` | `WORKER_ENABLED`, `OCR_ENABLED`, `TESSERACT_CMD`, `OCR_LANGUAGE`, `MAX_OCR_PAGES`, `MAX_MEDIA_SECONDS` | Background processing, OCR, and media-processing options |
| `frontend/.env` | `VITE_API_URL` | Browser API base path; defaults to `/api/v1` |

The example environment files contain placeholders, not working credentials. For Docker on port `5434`, use that port in both database URLs; for a native or project-local PostgreSQL server, use its configured port.

## Run the project

After setup, start the database (unless it is started by the Windows helper) and run from the project root:

```powershell
npm run dev
```

This starts the Vite frontend, Express API, and Python agent together. Open:

- Frontend: <http://127.0.0.1:5173>
- Express API: <http://127.0.0.1:5000/api/v1>
- API health: <http://127.0.0.1:5000/api/v1/health>
- Internal agent health: <http://127.0.0.1:8000/health>

The agent and PostgreSQL bind to loopback for local use. Press **Ctrl+C** to stop the application services. Do not start another copy if these ports are already in use. Uploaded originals are stored privately under `backend/uploads`; back up that directory with the database if you need to preserve local user data.

## Useful commands

```powershell
npm run lint       # ESLint for the frontend and backend source/tests
npm run build      # Production frontend build
npm test           # API and agent integration suites with a temporary database
npm run test:api   # API integration suite only
npm run db:generate
npm run db:migrate
```

Database integration tests create and remove a temporary database, so `DIRECT_URL` must have permission to create databases. `python scripts/verify-live.py`, `python scripts/verify-phase2-live.py`, and `python scripts/verify-phase3-live.py` exercise live provider behavior and require the services, worker, and a configured Gemini key. These scripts create their own temporary user/content and write reports under ignored `output/`.

## Optional OCR setup

OCR is used for scanned PDFs and images. On Windows, install the verified project-local Tesseract build with:

```powershell
powershell -NoProfile -File scripts/setup-ocr.ps1
```

Alternatively, install Tesseract and English language data with your operating system package manager and set `TESSERACT_CMD` in `agent/.env`. OCR runs locally. Image interpretation, Gemini generation, and audio transcription send the selected material to Gemini; configure the provider and review its data terms before enabling those features.




