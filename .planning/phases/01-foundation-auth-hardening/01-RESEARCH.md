# Phase 1: Foundation & Auth Hardening - Research

**Researched:** 2026-04-09
**Domain:** Flask auth flows, error propagation, JWT middleware, environment config
**Confidence:** HIGH — all findings are direct codebase reads, no inference required

---

## Summary

Phase 1 corrects four known bugs in the existing codebase. All four are localized, surgical changes: none requires architectural refactoring or new dependencies. The codebase already has the right layered structure (Routes → Services → Repositories), the `@require_role` decorator already works correctly, and the JWT auth pattern is consistent throughout. The gaps are specifically: missing `active` check in `login_user`, hardcoded `localhost` URL in `send_reset_email`, three public question endpoints lacking `@require_role`, and an intermittent error in the register flow caused by Axios throwing on 4xx responses (which yields `undefined` when `error.response` is also absent, e.g., network error).

The register flow bug root cause is: `RegisterNewUserService` returns `error.response` on catch, but the caller `register.tsx` reads `response?.status` and `response?.data.error`. If the network is unavailable (no `error.response`), `response` is `undefined`, and the condition `response?.status !== 201` is `true` but `response?.data.error` is also `undefined`, so the fallback message "Erro ao registrar. Tente novamente." is shown. This explains the "intermittent generic error" described in CLAUDE.md — it is a network-absence path, not a backend path.

**Primary recommendation:** Four isolated fixes, each confined to a single file or function. No new libraries needed for any of them.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| QA-01 | Fluxo de cadastro (Register) funciona sem erros intermitentes | Root cause identified: `error.response` can be `undefined` on network failure; fix is to guard both cases in the service and the screen |
| QA-02 | Link de reset de senha é funcional em produção (não hardcoded localhost) | Hardcoded string found in `email_service.py` line 12; fix reads `APP_BASE_URL` from env with sensible fallback |
| QA-03 | Usuários inativos não conseguem fazer login | `login_user` in `auth_service.py` has no `active` check; `User.active` column exists; fix is a 2-line guard |
| QA-04 | Endpoints de questões exigem autenticação (correct_answer não exposta publicamente) | Three routes lack `@require_role`: `/rand/<num>`, `/filtered`, `/chapters`, `/topics`; `correct_answer` is returned by `/filtered` without auth |
</phase_requirements>

---

## Bug Analysis (Per Plan)

### 01-01: Register Fix (QA-01)

**Files involved:**
- `app/frontend/src/services/RegisterNewUserService.tsx` (the service)
- `app/frontend/app/(public)/register.tsx` (the screen)
- `app/backend/statl/routes/auth.py` (the route)
- `app/backend/statl/services/auth_service.py` (the service)

**Root cause — confirmed by code read:** [VERIFIED: codebase read]

`RegisterNewUserService.tsx` wraps the Axios call in try/catch and returns `error.response` on failure. Axios throws for any HTTP 4xx/5xx, so on a 400 (e.g., "email já cadastrado") this works: `error.response` is the Axios response object with `.status` and `.data`. However, on a network failure (no internet, server down), `error.response` is `undefined`. The caller `register.tsx` does `response?.status !== 201` — this is `true` when `response` is `undefined` — and then `response?.data.error` evaluates to `undefined`, so the generic fallback message is shown.

This is why the error is **intermittent**: it only surfaces when there is no backend response at all (network failures, CORS preflight errors, cold-start timeouts). When the backend correctly returns a 400, the flow works. The CLAUDE.md note "já foi corrigido para retornar `error.response`" is correct — that fix prevents a throw, but does not protect against the undefined-response path.

**Backend side:** `register_user` in `auth_service.py` returns `(user, None, 201)` on success or `(None, jsonify({...}), 400)` on error. The route correctly calls `return error, http_code`. No bug on the backend. [VERIFIED: codebase read]

**Fix pattern:**
In `RegisterNewUserService.tsx`, ensure a well-formed object is always returned even when `error.response` is undefined:

```typescript
// Source: codebase read of RegisterNewUserService.tsx
} catch (error: any) {
  console.error('Error:', error);
  // Return a synthetic response if network fails (no error.response)
  return error.response ?? { status: 0, data: { error: 'Sem conexão com o servidor.' } };
}
```

In `register.tsx`, the check `response?.status !== 201` already handles this, but the error message access `response?.data.error` should also have a fallback:

```typescript
setErrorMessage(
  response?.data?.error ?? 'Erro ao registrar. Tente novamente.'
);
```

**Regression test:** pytest test with `create_app(testing=True)` that posts to `/auth/register` twice with the same email and asserts 400 + JSON error body. No new test infrastructure needed — the conftest.py exists but is empty; Wave 0 must create the test file.

---

### 01-02: Password Reset Production Fix (QA-02)

**Files involved:**
- `app/backend/statl/services/email_service.py` (the bug: hardcoded URL)
- `app/backend/.env` (where `APP_BASE_URL` will be added)

**Root cause — confirmed by code read:** [VERIFIED: codebase read]

Line 12 of `email_service.py`:
```python
reset_link = f"http://localhost:5000/reset-password?token={token}"
```

This is a literal hardcoded string. The app already reads env vars via `python-dotenv` and `os.getenv`. The `Config` class in `config.py` reads `MAIL_USERNAME`, `MAIL_PASSWORD`, etc., from env. There is no `APP_BASE_URL` variable defined anywhere yet.

The frontend `RecoverPassword.tsx` screen (which renders the reset form) is in `(public)/RecoverPassword.tsx`. The deep link format must match whatever route the Expo Router uses for the confirm-reset page. Since this is a mobile app, the reset link likely needs to open the app via a deep link scheme (e.g., `exp://` or a custom scheme) rather than `http://localhost:5000`. However, the current code implies a web-based reset flow — the email links to `/reset-password` which is not an Expo Router route. This design ambiguity is worth flagging: the immediate fix (read URL from env) is correct regardless, but the planner should note that the actual deep-link integration may need separate attention.

**Fix pattern:**
```python
# Source: email_service.py, line 12 — replace hardcoded string
base_url = os.environ.get("APP_BASE_URL", "http://localhost:5000")
reset_link = f"{base_url}/reset-password?token={token}"
```

Add to `.env`:
```
APP_BASE_URL=https://your-production-domain.com
```

No config.py change needed — `os.environ.get` reads directly from the environment.

---

### 01-03: Inactive User Gate (QA-03)

**Files involved:**
- `app/backend/statl/services/auth_service.py` — `login_user` function
- `app/backend/statl/models/user.py` — `User.active` column (already exists)
- `app/backend/statl/repositories/user_repository.py` — `get_user_by_email` (returns full row including `active`)

**Root cause — confirmed by code read:** [VERIFIED: codebase read]

`login_user` in `auth_service.py` (lines 45–72) checks:
1. Data present
2. Email/password keys exist
3. User found by email AND password hash matches

It does NOT check `user.active`. The `User` model has `active = db.Column(db.Boolean, nullable=False, server_default='true')`. The `get_user_by_email` / `buscar_usuario_por_email` does `SELECT * FROM users WHERE email = :email` — it returns all columns including `active`.

**Fix pattern:** Add a single guard after the password check:

```python
# Source: auth_service.py — insert after line 61
if not user.active:
    return None, jsonify({"error": "Conta desativada. Contate o administrador."}), 403
```

This is exactly 3 lines of addition. The `user` row object returned by SQLAlchemy's `text()` query supports attribute access (it is a `Row` object from SQLAlchemy 2.x — confirmed by the pattern used throughout the repository). [VERIFIED: codebase read of user_repository.py and SQLAlchemy pattern]

**Test:** Create a user, set `active=False` via direct DB update, attempt login, assert 403.

---

### 01-04: Question Endpoint Authentication (QA-04)

**Files involved:**
- `app/backend/statl/routes/questions.py` — the route definitions

**Audit of all `/questions` routes:** [VERIFIED: codebase read]

| Route | Method | Has `@require_role` or `@jwt_required` | Notes |
|-------|--------|----------------------------------------|-------|
| `/rand/<int:num>` | GET | NO | Returns questions with `correct_answer` |
| `/filtered` | GET | NO | Returns questions with `correct_answer` + `alternatives` |
| `/chapters` | GET | NO | Returns metadata only (no answers) |
| `/topics` | GET | NO | Returns metadata only (no answers) |
| `/check` | POST | NO | Exposes `correct_answer` in incorrect-answer response |
| `/add` | POST | YES (`@require_role(['admin', 'professor'])`) | Correct |
| `/update` | PUT | YES (`@require_role(['admin', 'professor'])`) | Correct |
| `/uploads/<path:filename>` | GET | NO | Image files — low-risk, no answer data |
| `/professor/<professor_id>` | GET | YES (`@require_role(['admin', 'professor'])`) | Correct |
| `/admin/<admin_id>` | GET | YES (`@require_role(['admin'])`) | Correct |
| `/<question_id>` | GET | YES (`@require_role(['admin', 'professor'])`) | Correct |
| `/<question_id>` | DELETE | YES (`@require_role(['admin', 'professor'])`) | Correct |
| `/diaria/status` | GET | YES (`@jwt_required()`) | Correct |
| `/diaria/marcar` | POST | YES (`@jwt_required()`) | Correct |

**Routes that expose `correct_answer` without auth:**
- `GET /rand/<num>` — returns full question including `correct_answer`
- `GET /filtered` — returns full question including `correct_answer` and `alternatives` with `is_correct` field
- `POST /check` — returns `correct_answer` in the response when the user's answer is wrong

**Routes that don't expose `correct_answer` but should still require auth:**
- `GET /chapters` — safe, but inconsistent policy
- `GET /topics` — safe, but inconsistent policy

**Decision for planner:** QA-04 says "endpoints exigem autenticação" and "correct_answer não exposta publicamente." The minimum fix to satisfy QA-04 is adding `@require_role` (or `@jwt_required`) to `/rand`, `/filtered`, and `/check`. The `/chapters` and `/topics` routes are arguably public metadata — but to be conservative and consistent, they should also require auth. The planner should decide scope; research recommends requiring JWT on all five.

**`correct_answer` in `/filtered` via `alternatives[n].is_correct`:** The `_embutir_alternativas` function embeds alternatives with `is_correct: True/False`, which effectively reveals the answer. Simply requiring JWT is sufficient to protect this — no schema change needed.

**Fix pattern:**

```python
# Source: routes/questions.py — add decorator to public routes
@bp.route("/rand/<int:num>", methods=["GET"])
@require_role(['aluno', 'professor', 'admin'])
def get_question_rand(num=NUM_QUESTIONS):
    return random_question(num)

@bp.route("/filtered", methods=["GET"])
@require_role(['aluno', 'professor', 'admin'])
def get_questions_filtered():
    ...

@bp.route('/check', methods=['POST'])
@require_role(['aluno', 'professor', 'admin'])
def check_correct_answer():
    ...
```

Note: `@require_role` with a list of all roles is equivalent to "authenticated user of any role." Alternatively, `@jwt_required()` from flask_jwt_extended works but does not check role. The existing pattern in the codebase uses `@require_role`, so follow that pattern for consistency.

**Frontend impact:** The frontend Axios instance (`api.tsx`) already attaches the JWT token on every request via an interceptor (`api.interceptors.request.use`). So authenticated screens will continue to work without change. However: the `/chapters` and `/topics` routes are called from `questions.tsx` on mount — these calls will start returning 401 if the user's token has expired. This is the correct behavior, but the planner should note it.

---

## Standard Stack

### Core (existing — no new packages needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Flask | 3.1.2 | HTTP framework | Already in requirements.txt |
| Flask-JWT-Extended | 4.7.1 | JWT generation and validation | Already provides `@jwt_required`, `verify_jwt_in_request` |
| flask_mail | 0.10.0 | Email sending | Already configured |
| python-dotenv | 1.2.1 | `.env` loading | Already in use |
| Axios | (from package.json) | HTTP client in frontend | Already in use; interceptors handle JWT |

[VERIFIED: requirements.txt codebase read]

### No new dependencies required for any plan in this phase.

---

## Architecture Patterns

### Existing Pattern: Routes → Services → Repositories

All backend changes must follow this layered pattern. [VERIFIED: CLAUDE.md directive, codebase structure]

- Routes (`statl/routes/`) handle HTTP only — no business logic
- Services (`statl/services/`) hold business logic
- Repositories (`statl/repositories/`) hold all DB access

**For Plan 01-01 (Register Fix):**
- Backend has no bug — no backend change needed
- Frontend fix is in `src/services/RegisterNewUserService.tsx` and `app/(public)/register.tsx`

**For Plan 01-02 (Password Reset):**
- Change is in `statl/services/email_service.py` (service layer — correct placement)
- Add env var to `.env`

**For Plan 01-03 (Inactive User Gate):**
- Change is in `statl/services/auth_service.py` (service layer — correct placement)

**For Plan 01-04 (Question Auth):**
- Change is in `statl/routes/questions.py` (route layer — correct placement for decorators)

### Role Values

The `role` claim in JWT can be: `"aluno"`, `"professor"`, `"admin"`. [VERIFIED: codebase read of `User` model and `create_access_token` calls]

The `@require_role` decorator accepts a string or list. [VERIFIED: `auth_middleware.py` read]

### SQLAlchemy Row Access

The repository uses raw `text()` queries returning SQLAlchemy 2.x `Row` objects. These support attribute access (e.g., `user.active`, `user.role`). [VERIFIED: pattern in `auth_service.py` lines 61, 64–70]

### Environment Variables

The app uses `python-dotenv` to load `.env` at startup in `create_app`. New env vars added to `.env` will be available via `os.getenv()` / `os.environ.get()` immediately on restart. [VERIFIED: `__init__.py` line 23]

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JWT validation | Custom token parsing | `verify_jwt_in_request()` + `@require_role` | Already exists; handles expiry, signature, claims |
| Password hashing | Custom hash | `werkzeug.security.check_password_hash` | Already in use; bcrypt-compatible |
| Email sending | SMTP socket code | `flask_mail.Message` + `mail.send()` | Already configured |
| URL configuration | Hardcoded strings | `os.environ.get("APP_BASE_URL", fallback)` | Simple, idiomatic |

---

## Common Pitfalls

### Pitfall 1: SQLAlchemy Row vs Dict — `active` attribute access

**What goes wrong:** `user.active` works on a `Row` object returned by `text()` queries only if accessed by column name. It returns a Python value directly (True/False), not a DB type.

**How to avoid:** Use `if not user.active:` — do not do `if user.active == False:` which may behave differently for `None`.

**Warning signs:** If `active` column is NULL in the DB (old rows created before the `server_default='true'` fix), `not None` evaluates to `True`, which would incorrectly block logins. The `_garantir_schema_incremental` in `__init__.py` sets `DEFAULT TRUE` on PostgreSQL, but existing NULL rows are not backfilled by an `ALTER COLUMN ... SET DEFAULT`. Add a `WHERE active IS NOT NULL` guard or a backfill migration.

### Pitfall 2: `@require_role` vs `@jwt_required` — import and order

**What goes wrong:** If `@require_role` is placed after a route parameter decorator, or if both `@require_role` and `@jwt_required` are stacked, the JWT is validated twice.

**How to avoid:** Use only `@require_role` (it internally calls `verify_jwt_in_request()`). Do not also add `@jwt_required`. [VERIFIED: `auth_middleware.py` read]

**Decorator order:** Flask decorators apply bottom-up, so the correct order is:
```python
@bp.route("/filtered", methods=["GET"])
@require_role(['aluno', 'professor', 'admin'])
def get_questions_filtered():
```
This matches the existing pattern in the file (see `/add`, `/professor/<id>`).

### Pitfall 3: Axios 4xx throws — `error.response` can be undefined

**What goes wrong:** If the server returns a valid 4xx, `error.response` is an Axios response object. If there is no server response (network failure, DNS failure, CORS preflight blocked), `error.response` is `undefined`.

**How to avoid:** Always provide a fallback in the catch block:
```typescript
return error.response ?? { status: 0, data: { error: 'Sem conexão com o servidor.' } };
```

**Warning signs:** Intermittent "generic error" messages that cannot be reproduced when the server is running.

### Pitfall 4: Deep-link vs HTTP for password reset

**What goes wrong:** The email contains `http://your-domain/reset-password?token=...` but this is a React Native app — there is no web server serving a `/reset-password` HTML page. The link will open in a browser and hit nothing.

**What is known:** The current `RecoverPassword.tsx` screen exists in `(public)/` in the Expo Router, but it is rendered in-app, not via a browser URL. The email reset link design assumes a web endpoint.

**What is unclear:** Whether the intention is (a) a mobile deep link (`staticlass://reset-password?token=...`), (b) a web companion page not yet built, or (c) both. This is an open question the planner should surface. For Plan 01-02, the minimum fix is making the base URL configurable — the deeper design question is deferred.

### Pitfall 5: `RETURNING id` clause — SQLite incompatibility

**What goes wrong:** `RETURNING id` is PostgreSQL syntax. The test environment uses SQLite (`create_app(testing=True)`), which supports `RETURNING` only in SQLite 3.35.0+.

**Status:** The current `criar_usuario` already uses `RETURNING id`. If tests currently pass, the installed SQLite version supports it. [ASSUMED — not verified by checking SQLite version on this machine]

**How to avoid:** Keep using the existing pattern — do not introduce a new SQL pattern that diverges from what's already used.

---

## Code Examples

### Adding `@require_role` to an existing route

```python
# Source: existing pattern in statl/routes/questions.py lines 76-78
@bp.route('/add', methods=['POST'])
@require_role(['admin', 'professor'])
def add_question():
    professor_id = get_jwt_identity()
    ...
```

Apply the same pattern to `/rand`, `/filtered`, `/check` with `['aluno', 'professor', 'admin']`.

### Adding active check to login_user

```python
# Source: statl/services/auth_service.py — insert after line 61
user = get_user_by_email(email)

if user is None or not check_password_hash(user.password_hash, password):
    return None, jsonify({"error": "Email ou senha incorretos."}), 400

# NEW: block inactive users
if not user.active:
    return None, jsonify({"error": "Conta desativada. Contate o administrador."}), 403
```

### Reading base URL from environment in email_service.py

```python
# Source: statl/services/email_service.py line 12 — replace hardcoded string
import os
base_url = os.environ.get("APP_BASE_URL", "http://localhost:5000")
reset_link = f"{base_url}/reset-password?token={token}"
```

### Guarding against undefined error.response in frontend service

```typescript
// Source: src/services/RegisterNewUserService.tsx
} catch (error: any) {
  console.error('Error:', error);
  return error.response ?? { status: 0, data: { error: 'Sem conexão com o servidor.' } };
}
```

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Python 3 | Backend tests | Yes | 3.13.12 | — |
| pip | Package install | Yes | 26.0.1 | — |
| pytest | Backend tests | Not found in PATH | — | `pip install pytest` in Wave 0 |
| PostgreSQL | Production DB | Not checked | — | Docker compose (see CLAUDE.md) |

**pytest not in PATH** — the backend test directory exists (`statl/tests/conftest.py`) but `pytest` is not available as a shell command. Wave 0 must `pip install pytest` (or verify it is installed in the project virtualenv). The backend's `requirements.txt` does not include pytest — it must be added or installed separately for dev.

---

## Project Constraints (from CLAUDE.md)

These are binding directives that the planner must not contradict:

1. **Architecture:** Strictly layered Routes → Services → Repositories. Business logic only in Services.
2. **Auth middleware:** Use `@require_role(role)` decorator for role-based route protection.
3. **Database:** MySQL in production (PostgreSQL via Docker per `.env`), SQLite in-memory for `testing=True`.
4. **Frontend service pattern:** API calls go through `src/services/api.tsx` Axios instance which attaches JWT automatically.
5. **Pending issue documented:** RegisterNewUserService "já foi corrigido para retornar `error.response`" — the fix is partial; research confirms the remaining gap is the undefined-response path.
6. **Test command:** `cd app/backend && pytest` — this is the stated command, though pytest must be installed first.

---

## Validation Architecture

`nyquist_validation` is set to `false` in `.planning/config.json` — this section is skipped per configuration.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | SQLite version on this machine supports `RETURNING id` syntax | Common Pitfalls #5 | Tests would fail on `create_user` calls; would need alternative ID-fetch pattern |
| A2 | The frontend's `RecoverPassword.tsx` is intended to be reached via deep link, not a browser URL | Common Pitfalls #4 | If a web companion was intended, Plan 01-02 scope is larger than a single env var change |

---

## Open Questions

1. **Password reset deep-link design**
   - What we know: The email sends an `http://` link; the frontend has a `RecoverPassword.tsx` screen rendered in-app via Expo Router.
   - What is unclear: How does a user get from clicking the email link to the in-app screen? Is a custom URL scheme configured? Is there a web landing page planned?
   - Recommendation: For Plan 01-02, scope the fix to making the base URL configurable. Flag the deep-link design as a separate open question for the team. Do not block 01-02 on it.

2. **NULL `active` values in existing rows**
   - What we know: The `_garantir_schema_incremental` sets `DEFAULT TRUE` on PostgreSQL but does not backfill NULLs. `criar_usuario` and `criar_usuario_com_papel` explicitly set `active = TRUE` in the INSERT.
   - What is unclear: Are there any existing users in the production DB with `active = NULL`? (Created before the `server_default` fix in commit `99b52f9`.)
   - Recommendation: Plan 01-03 should include a one-time `UPDATE users SET active = TRUE WHERE active IS NULL` migration step.

3. **`/check` endpoint scope for QA-04**
   - What we know: `POST /check` is not used by the quiz (per CLAUDE.md: "A checagem de resposta é feita no cliente"). It does expose `correct_answer`.
   - What is unclear: Should it be protected or deprecated entirely?
   - Recommendation: Protect it with `@require_role` like the other endpoints. Do not deprecate in Phase 1.

---

## Sources

### Primary (HIGH confidence — all direct codebase reads)
- `app/backend/statl/routes/questions.py` — full audit of all route decorators
- `app/backend/statl/routes/auth.py` — register and login routes
- `app/backend/statl/services/auth_service.py` — `login_user`, `register_user`, `request_password_reset`
- `app/backend/statl/services/email_service.py` — hardcoded localhost URL confirmed on line 12
- `app/backend/statl/repositories/user_repository.py` — `get_user_by_email` SELECT confirmed
- `app/backend/statl/models/user.py` — `active` column confirmed
- `app/backend/statl/utils/auth_middleware.py` — `@require_role` decorator implementation confirmed
- `app/frontend/src/services/RegisterNewUserService.tsx` — `error.response` return confirmed
- `app/frontend/app/(public)/register.tsx` — caller pattern `response?.status` and `response?.data.error` confirmed
- `app/frontend/src/services/api.tsx` — JWT interceptor confirmed; `EXPO_PUBLIC_API_URL` env var confirmed
- `app/backend/statl/config.py` — email config confirmed, no `APP_BASE_URL` present
- `.planning/config.json` — `nyquist_validation: false` confirmed

### Tertiary (LOW confidence — not verified this session)
- `RETURNING id` SQLite compatibility [ASSUMED — A1]

---

## Metadata

**Confidence breakdown:**
- Bug identification: HIGH — every bug was located by direct file read, not inference
- Fix patterns: HIGH — patterns derived from existing working code in the same files
- Test approach: MEDIUM — conftest.py exists but is empty; pytest not in PATH
- Deep-link design gap (A2): LOW — requires team decision

**Research date:** 2026-04-09
**Valid until:** 2026-06-01 (stable stack, no external dependencies changing)
