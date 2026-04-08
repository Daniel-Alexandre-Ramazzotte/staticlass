# External Integrations
*Generated: 2026-04-08*
*Focus: External services, APIs, infrastructure, auth, and environment configuration*

## Summary

Staticlass integrates with PostgreSQL for persistent storage, Gmail SMTP for transactional email, and Fly.io for cloud deployment. Authentication is entirely self-managed via JWT. There are no third-party auth providers, payment processors, or analytics services.

---

## Data Storage

**Primary Database:**
- PostgreSQL 17 (Docker image `postgres:17-alpine`)
- Container name: `staticlass-db`
- Port: `5432`
- Connection configured via `DATABASE_URL` environment variable
- SQLAlchemy handles schema creation via `db.create_all()` at startup (`app/backend/statl/__init__.py`)
- ORM models: `app/backend/statl/models/`

**Test / Development Database:**
- SQLite in-memory — activated when `create_app(testing=True)` is called
- No setup required; used automatically by pytest

**File Storage:**
- Local filesystem only: `uploads/` directory at repository root
- Mounted into the backend Docker container via volume: `./uploads:/app/../../../uploads`
- No cloud object storage (S3, GCS, etc.) configured

**Caching:**
- None configured

**Seeded Data:**
- External question bank from [Estatistica-Basica](https://github.com/Daniel-Alexandre-Ramazzotte/Estatistica-Basica) imported via `app/backend/statl/migrate_questoes.py`
- Source: `questoes.db` (SQLite) at `~/Desktop/Estatistica-Basica/banco_questoes/`
- 230 unique questions imported; script is idempotent via `original_id`

---

## Email

**Provider:** Gmail SMTP
- SMTP host: `smtp.gmail.com`, port `587`, TLS enabled
- Configured in `app/backend/statl/config.py`
- Used for: password reset emails only (`app/backend/statl/services/email_service.py`)
- Reset link currently hardcoded to `http://localhost:5000/reset-password?token=...` — not production-ready

**Required env vars:**
- `MAIL_USERNAME` — Gmail address
- `MAIL_PASSWORD` — Gmail app password
- `MAIL_SENDER_NAME` — Display name (defaults to "Staticlass")

---

## Authentication

**Strategy:** Self-managed JWT (no third-party auth provider)

**Backend:**
- Flask-JWT-Extended 4.7.1 generates and validates tokens
- `@require_role(role)` decorator enforces role-based access in `app/backend/statl/utils/auth_middleware.py`
- Password hashing via Werkzeug utilities in `app/backend/statl/security/password.py`
- Password reset tokens signed with `itsdangerous.URLSafeTimedSerializer`, 15-minute expiry (`app/backend/statl/security/tokens.py`)
- JWT secret key from env var `JWT_SECRET_KEY` (falls back to `SECRET_KEY`)

**Frontend:**
- JWT stored in `AsyncStorage` under key `@auth_session`
- Decoded on mount with `jwt-decode` to check expiry and extract `role`, `email`, `name`, `userId`
- Auth state managed in `app/frontend/src/context/AuthContext.tsx`
- Axios interceptor in `app/frontend/src/services/api.tsx` attaches `Bearer <token>` header to every request

**Roles:** `aluno`, `professor`, `admin`

---

## Infrastructure

**Docker Compose (`docker-compose.yml` — repository root):**

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| `db` | `postgres:17-alpine` | 5432 | PostgreSQL database |
| `backend` | Local Dockerfile | 5000 | Flask API |
| `web` | `nginx:alpine` | 80 | Serves static Expo web export |

- Backend depends on `db` with health check condition
- nginx config mounted from `./nginx.conf`
- Web frontend built separately (`npx expo export`), output to `app/frontend/dist/`

**Cloud Deployment — Fly.io (`app/backend/fly.toml`):**
- App name: `staticlass-backend`
- Region: `gru` (São Paulo, Brazil)
- Internal port: `8080`
- HTTPS enforced
- Auto-stop/start machines enabled (scale to zero)
- Resources: 512 MB RAM, 1 shared CPU
- Production API URL referenced in `app/frontend/.env.example`: `https://api.staticlass.com.br/`

---

## Internal API

**Base URL (dev):**
- Android emulator: `http://10.0.2.2:5000/`
- Web dev: `http://localhost:5000/`
- Production: `EXPO_PUBLIC_API_URL` env var (default: `https://api.staticlass.com.br/`)

**Consumed by frontend from `app/frontend/src/services/api.tsx`:**

| Endpoint | Method | Used for |
|----------|--------|---------|
| `/auth/register` | POST | New user registration |
| `/auth/login` | POST | Session login, returns JWT |
| `/auth/password-reset` | POST | Request password reset email |
| `/auth/password-reset/confirm` | POST | Confirm token and set new password |
| `/questions/filtered` | GET | Quiz questions with chapter/difficulty filters |
| `/questions/chapters` | GET | Fetch chapter list for quiz filter UI |
| `/questions/topics` | GET | Fetch topics (optional `chapter_id` param) |
| `/questions/add` | POST | Professor adds question |
| `/questions/update` | PUT | Professor updates question |
| `/users/update-me` | PUT | User updates own profile |
| `/users/delete-me` | DELETE | User deletes own account |
| `/users/profile/<email>` | GET | Fetch user profile |

**Note:** `POST /questions/check` exists in the backend but is not called by the frontend; answer checking is done client-side.

---

## CORS

- Handled by Flask-CORS and a custom `before_request` / `after_request` middleware in `app/backend/statl/__init__.py`
- Allowed origins controlled by `CORS_ORIGINS` env var (defaults to `*`)
- Allowed methods: `GET, POST, PUT, DELETE, OPTIONS, PATCH`

---

## Environment Variables

### Backend (`app/backend/.env`)

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes | PostgreSQL connection string (`postgresql://...`) |
| `SECRET_KEY` | Yes | Flask secret key and JWT signing key fallback |
| `JWT_SECRET_KEY` | No | Explicit JWT signing key (falls back to `SECRET_KEY`) |
| `FLASK_SECRET_KEY` | No | Flask session key (falls back to `SECRET_KEY`) |
| `MAIL_USERNAME` | Yes* | Gmail address for sending emails |
| `MAIL_PASSWORD` | Yes* | Gmail app password |
| `MAIL_SENDER_NAME` | No | Email sender display name (default: "Staticlass") |
| `CORS_ORIGINS` | No | Comma-separated allowed origins (default: `*`) |
| `PORT` | No | Server port for Gunicorn (default: `5000`, Fly.io sets `8080`) |

*Required for password reset functionality

### Frontend (`app/frontend/.env`)

| Variable | Required | Purpose |
|----------|----------|---------|
| `EXPO_PUBLIC_API_URL` | No | Backend base URL (defaults to platform-appropriate localhost) |

---

## Webhooks & External Event Sources

- None configured. The app does not receive webhooks from external services.

---

*Integration audit: 2026-04-08*
