# Architecture

*Generated: 2026-04-08*
*Focus: Architecture patterns, layers, data flow, auth flow, key design decisions*

## Summary

Staticlass is a full-stack mobile quiz application. The backend is a strictly-layered Flask REST API (Routes → Services → Repositories) with JWT-based auth and role-based access control. The frontend is a React Native/Expo app using file-based routing (Expo Router), a React Context for auth state, and Axios for API communication. There is no shared state management library — all state is local React state or Context.

---

## Backend Architecture Pattern

**Pattern:** Strict 3-layer architecture — Routes → Services → Repositories

The comment in `app/backend/statl/routes/auth.py` line 6 names it explicitly:
```
# Rotas -> Services -> Repositories
# Portaria -> Regras de Negócio -> Banco de Dados
```

Each layer has a single responsibility and no layer skips the one below it.

---

## Backend Layers

**Routes (HTTP Interface):**
- Location: `app/backend/statl/routes/`
- Files: `auth.py`, `questions.py`, `users.py`, `admin.py`
- Responsibility: Parse HTTP request, call service functions, return HTTP response. No business logic.
- Uses: `@require_role` decorator from `app/backend/statl/utils/auth_middleware.py`, Flask-JWT-Extended decorators

**Services (Business Logic):**
- Location: `app/backend/statl/services/`
- Files: `auth_service.py`, `questions_service.py`, `user_service.py`, `resultado_service.py`, `email_service.py`
- Responsibility: Validation, normalization, orchestration. Calls repository functions. Returns data or `(response, error, http_code)` tuples to routes.
- Pattern: Service functions return `(data, error, http_code)` tuples — routes destructure and handle both success and error paths.

**Repositories (Database Access):**
- Location: `app/backend/statl/repositories/`
- Files: `questions_repository.py`, `user_repository.py`, `resultado_repository.py`
- Responsibility: All SQL via SQLAlchemy `text()`. No business logic. Each repository operates on one domain.
- Pattern: Raw SQL with named parameters. Repositories expose bilingual aliases (Portuguese functions + English aliases for compatibility).

**Models (ORM Schema):**
- Location: `app/backend/statl/models/`
- Files: `user.py`, `questions.py`, `chapters.py`, `quiz_resultado.py`, `questao_diaria.py`
- Responsibility: SQLAlchemy ORM class definitions used by `db.create_all()` to create tables. Repositories do NOT use ORM queries — they use raw SQL via `text()`.
- Note: Models define schema; queries are written by hand in repositories.

---

## Backend App Factory

**Entry point:** `app/backend/statl/__init__.py` — `create_app(testing: bool = False)`

Startup sequence:
1. Load `.env` via `dotenv`
2. Apply `Config` (Flask-Mail settings from `app/backend/statl/config.py`)
3. Configure database: PostgreSQL from `DATABASE_URL` env var, or SQLite in-memory when `testing=True`
4. Configure CORS (from `CORS_ORIGINS` env var, default `*`)
5. Initialize extensions: `JWTManager`, `LoginManager`, `Mail`, `SQLAlchemy`
6. Register blueprints: `auth`, `questions`, `users`, `admin`
7. Call `db.create_all()` to create all ORM-defined tables
8. Run `_garantir_schema_incremental()` to apply ALTER TABLE migrations for PostgreSQL

---

## Backend Role-Based Access Control

Implemented as a decorator in `app/backend/statl/utils/auth_middleware.py`:

```python
@require_role(['admin', 'professor'])
def add_question():
    ...
```

The decorator calls `verify_jwt_in_request()`, extracts the `role` claim from the JWT, and returns 401 or 403 if unauthorized. Roles are: `aluno` (default), `professor`, `admin`.

---

## Frontend Architecture Pattern

**Pattern:** File-based routing with React Context for global state

Expo Router maps the `app/frontend/app/` directory to screens. Route groups control navigation scope. All global state (auth, theme) is managed via React Context providers.

---

## Frontend Route Groups

| Group | Path | Purpose | Visible to |
|---|---|---|---|
| `(public)` | `app/(public)/` | Unauthenticated screens | All (no session) |
| `(tabs)` | `app/(tabs)/` | Main tab bar | All authenticated |
| `(app)` | `app/(app)/` | Quiz flow (stack navigation) | All authenticated |
| `(professor)` | `app/(professor)/` | Professor management | Professor role |
| `(admin)` | `app/(admin)/` | Admin panel | Admin role |

**Navigation guard** is in `app/frontend/app/_layout.tsx` (`InitialLayout` component):
- Reads `session` and `isLoading` from `AuthContext`
- If no session and not in `(public)` → redirect to `/(public)/login`
- If session and in `(public)` → redirect to `/(tabs)/home`

Tab visibility is role-conditional: the `(tabs)/_layout.tsx` reads `role` from `AuthContext` and sets `href: null` on tabs that should not appear for a given role.

---

## Frontend Context Providers

**AuthContext** (`app/frontend/src/context/AuthContext.tsx`):
- Wraps entire app via `RootLayout`
- On mount: reads `@auth_session` from AsyncStorage, decodes JWT with `jwt-decode`, checks expiry
- Exposes: `session`, `role`, `email`, `name`, `userId`, `isLoading`, `signIn()`, `signOut()`
- `signIn(token)`: decodes token, sets state, writes to AsyncStorage
- `signOut()`: clears state, removes from AsyncStorage

**ThemeContext** (`app/frontend/src/context/ThemeContext.tsx`):
- Supports `'claro' | 'escuro' | 'sistema'` theme modes
- Persists preference to AsyncStorage under key `@staticlass_tema`
- Exposes: `tema`, `temaEfetivo`, `paleta`, `alternarTema()`, `definirTema()`
- `paleta` provides color tokens; screens should use `useTema()` for theme-aware colors

Provider hierarchy in `app/frontend/app/_layout.tsx`:
```
ThemeProvider
  └─ AuthProvider
       └─ InitialLayout (GestureHandlerRootView > TamaguiProvider > Stack)
```

---

## Frontend API Client

**Location:** `app/frontend/src/services/api.tsx`

- Axios instance with `baseURL` resolved at runtime:
  - `EXPO_PUBLIC_API_URL` env var (highest priority)
  - `http://localhost:5000/` on web
  - `http://10.0.2.2:5000/` on Android emulator (default)
- Request interceptor: reads `@auth_session` from AsyncStorage and attaches `Authorization: Bearer <token>` to every request
- Custom `paramsSerializer`: serializes arrays as repeated query params (e.g., `chapter_id=1&chapter_id=2`) for multi-filter support

---

## Data Flow — Quiz Request

```
1. QuestionsScreen (app/(tabs)/questions.tsx)
   │  User selects filters → calls router.push to QuizInProgressScreen
   │
2. QuizInProgressScreen (app/(app)/QuizInProgressScreen.tsx)
   │  On focus: calls api.get('/questions/filtered', { params })
   │
3. api.tsx (Axios interceptor)
   │  Attaches Authorization header → HTTP GET to Flask backend
   │
4. questions.py route (GET /questions/filtered)
   │  Extracts query params → calls random_question_filtered()
   │
5. questions_service.py
   │  Calls buscar_questoes_filtradas() → calls _embutir_alternativas()
   │
6. questions_repository.py
   │  SQL: SELECT q.*, c.name, t.name FROM questions q JOIN ... WHERE ... ORDER BY RANDOM() LIMIT :n
   │  SQL: SELECT question_id, letter, text, is_correct FROM alternatives WHERE question_id IN (...)
   │
7. Response: JSON array of questions with embedded alternatives
   │
8. QuizInProgressScreen renders questions
   │  User answers are compared client-side: userAnswer === current.correct_answer
   │  No answer-check API call is made
   │
9. On completion: router.push to ResultScreen with JSON-serialized results
   │
10. ResultScreen calls POST /users/salvar-resultado to persist score
```

---

## Auth Flow — Login

```
1. login.tsx (app/(public)/login.tsx)
   │  POST /auth/login with {email, password}
   │
2. auth.py route → login_user() in auth_service.py
   │  Checks password hash, creates JWT with claims: {role, email, name}
   │  identity = str(user.id)
   │
3. Frontend receives {token: "..."}
   │  Calls signIn(token) on AuthContext
   │  Decodes token client-side, sets state, writes to AsyncStorage
   │
4. _layout.tsx useEffect detects session change
   │  router.replace('/(tabs)/home')
```

---

## Auth Flow — Password Reset

```
1. POST /auth/password-reset {email}
   │  auth_service.request_password_reset()
   │  Generates itsdangerous URLSafeTimedSerializer token (15 min TTL)
   │  Sends token via email (Flask-Mail → Gmail SMTP)
   │
2. POST /auth/password-reset/confirm {token, new_password}
   │  auth_service.reset_password()
   │  Verifies token with verify_reset_token()
   │  Updates password_hash in DB
```

---

## Key Design Decisions

**Client-side answer checking:** The quiz checks correctness on the frontend (`userAnswer === current.correct_answer`). The `POST /questions/check` endpoint exists but is unused.

**Raw SQL in repositories:** All database queries use `sqlalchemy.text()` with named parameters rather than ORM query API. This is consistent across all repositories.

**Schema migrations via ALTER TABLE:** New columns are added in `_garantir_schema_incremental()` in `app/backend/statl/__init__.py` rather than a migration tool. Only runs on PostgreSQL.

**Bilingual aliases in repositories:** Functions are named in Portuguese (`buscar_usuario_por_email`) with English aliases (`get_user_by_email`) at module bottom for backward compatibility.

**Role-conditional tab visibility:** Instead of separate navigation stacks per role, the app uses a single `(tabs)` layout that conditionally hides/shows tabs using `href: null`. Role-specific screens live in `(professor)/` and `(admin)/` route groups.

**Alternatives embedded in question responses:** The `/questions/filtered` endpoint always includes alternatives in the response JSON. Batch loading via `_buscar_alternativas_em_lote()` prevents N+1 queries.
