# Technology Stack
*Generated: 2026-04-08*
*Focus: Languages, frameworks, dependencies, tooling, and runtime environments*

## Summary

Staticlass is a full-stack mobile/web quiz application. The backend is a Python 3.12 Flask REST API with PostgreSQL (production) or SQLite (testing). The frontend is a React Native 0.81 app built with Expo 54 and TypeScript 5.9, targeting Android, iOS, and web.

---

## Languages

**Backend:**
- Python 3.12 — all backend code under `app/backend/`
- Dockerfile (`app/backend/Dockerfile`) pins `python:3.12-slim` as the base image

**Frontend:**
- TypeScript 5.9 (`~5.9.2`) — all source files under `app/frontend/src/`
- JavaScript — config files (`babel.config.js`, scripts)

---

## Runtime

**Backend:**
- Python 3.12 (production via Docker; system Python 3.13 on dev machine)
- WSGI server: Gunicorn (installed in Dockerfile) — 1 worker, port configurable via `PORT` env var (default `5000`)
- Dev server: Flask built-in (`flask --app statl run`)

**Frontend:**
- Node.js — v25.8.1 (dev machine)
- npm 11.11.1

**Package Managers:**
- Backend: `pip` — lockfile: none (only `requirements.txt`)
- Frontend: `npm` — lockfile: `app/frontend/package-lock.json` present

---

## Frameworks

**Backend:**
- Flask 3.1.2 — HTTP routing, app factory in `app/backend/statl/__init__.py`
- Flask-SQLAlchemy 3.1.1 — ORM layer over SQLAlchemy 2.0.45
- Flask-JWT-Extended 4.7.1 — JWT auth; `JWTManager` registered in app factory
- Flask-Login 0.6.3 — session management (used alongside JWT)
- Flask-CORS 5.0.1 — CORS headers; additional manual CORS middleware in `app/backend/statl/__init__.py`
- Flask-Mail 0.10.0 — transactional email (password reset)
- Flask-WTF 1.2.2 / WTForms 3.2.1 — form validation utilities

**Frontend:**
- Expo 54 (`~54.0.33`) — build toolchain, OTA updates, native module management
- Expo Router 6 (`~6.0.23`) — file-based routing; entry point `expo-router/entry`
- React 19.1.0 / React Native 0.81.5 — UI framework
- React Navigation 7 — navigation primitives (bottom tabs, drawer, stack)
- Tamagui 1.144.2 — component library and theming system
- react-native-paper 5.14.5 — supplemental Material Design components
- react-native-reanimated 4.1.1 — animation engine
- react-native-gesture-handler 2.28.0 — gesture system

---

## Key Dependencies

**Backend (`app/backend/requirements.txt`):**

| Package | Version | Purpose |
|---------|---------|---------|
| SQLAlchemy | 2.0.45 | ORM and query building |
| Werkzeug | 3.1.5 | WSGI utilities, password hashing |
| itsdangerous | 2.2.0 | Password reset token signing (`app/backend/statl/security/tokens.py`) |
| python-dotenv | 1.2.1 | Loads `app/backend/.env` into environment |
| psycopg2-binary | 2.9.10 | PostgreSQL driver |

**Frontend (`app/frontend/package.json`):**

| Package | Version | Purpose |
|---------|---------|---------|
| axios | ^1.13.2 | HTTP client; configured in `app/frontend/src/services/api.tsx` |
| jwt-decode | ^4.0.0 | Decode JWT on client; used in `app/frontend/src/context/AuthContext.tsx` |
| @react-native-async-storage/async-storage | 2.2.0 | JWT persistence key `@auth_session` |
| expo-linear-gradient | ~15.0.8 | Gradient UI elements |
| expo-image | ~3.0.11 | Optimized image rendering |
| react-native-webview | 13.15.0 | Renders KaTeX math content |
| katex | ^0.16.44 | Math formula rendering (statistics content) |
| lucide-react-native | ^0.562.0 | Icon set |
| @tamagui/lucide-icons | ^1.144.2 | Tamagui-wrapped Lucide icons |
| expo-haptics | ~15.0.8 | Haptic feedback |

---

## Build Tools & Transpilers

**Frontend:**
- Babel — `app/frontend/babel.config.js` uses `babel-preset-expo`
- Metro — bundler provided by Expo (no explicit config file)
- TypeScript compiler — strict mode enabled; path aliases `@/*` → `./src/*` configured in `app/frontend/tsconfig.json`
- Expo React Compiler experiment enabled in `app/frontend/app.json` (`"reactCompiler": true`)
- Expo New Architecture enabled (`"newArchEnabled": true`)
- Web export: `expo export --platform web` → outputs to `app/frontend/dist/`

**Backend:**
- No transpilation; plain Python modules

---

## Linting

**Frontend:**
- ESLint 9 with `eslint-config-expo`
- Run: `npm run lint` from `app/frontend/`

**Backend:**
- No linter configured

---

## Testing

**Backend:**
- pytest — run `pytest` from `app/backend/`
- Test config: `create_app(testing=True)` switches DB to `sqlite:///:memory:` (see `app/backend/statl/__init__.py`)
- Conftest: `app/backend/statl/tests/conftest.py` (currently empty)

**Frontend:**
- No test framework configured

---

## Deployment Targets

**Backend:**
- Production: Fly.io (`app/backend/fly.toml`) — region `gru` (São Paulo), 512 MB RAM, shared CPU, port 8080
- Local: Docker Compose (`docker-compose.yml`), port 5000
- API base URL for mobile emulator: `http://10.0.2.2:5000/`
- API base URL for production: configurable via `EXPO_PUBLIC_API_URL`

**Frontend:**
- Mobile: Android (`com.propet.staticlass`), iOS
- Web: static export served by nginx in Docker Compose, mounted from `app/frontend/dist/`

---

*Stack analysis: 2026-04-08*
