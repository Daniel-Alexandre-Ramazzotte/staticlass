# Codebase Concerns

*Generated: 2026-04-08*
*Focus: Tech debt, known issues, security concerns, scalability limits, and areas needing attention*

## Summary

Staticlass is an early-stage academic app with a working core but several significant gaps in security, testing, and robustness. The highest-priority issues are the complete absence of automated tests, missing authentication on public-facing quiz endpoints, no password strength enforcement, and a hardcoded `localhost` URL in a password-reset email. Several frontend features are placeholders (mock data, stub screens), and the score system is trivially manipulable by any authenticated user.

---

## High Severity

### No Automated Tests
- **Issue:** The test suite is entirely empty. `app/backend/statl/tests/conftest.py` is a 0-byte file. There are no test files anywhere in the backend or frontend.
- **Files:** `app/backend/statl/tests/conftest.py` (empty)
- **Impact:** Any regression in auth, question delivery, score saving, or role enforcement goes undetected. Refactors cannot be validated.
- **Fix approach:** Add pytest tests starting with auth (`/auth/register`, `/auth/login`), role enforcement (`require_role`), and the quiz result save flow. Use the existing `create_app(testing=True)` factory which sets up SQLite in-memory.

---

### Hardcoded `localhost` in Password-Reset Email
- **Issue:** `send_reset_email()` constructs the reset link as `http://localhost:5000/reset-password?token={token}`. Every user who requests a password reset receives a link pointing to `localhost`, which is unreachable outside the developer's machine.
- **Files:** `app/backend/statl/services/email_service.py`, line 12
- **Impact:** Password reset is completely non-functional in any deployed or shared environment.
- **Fix approach:** Replace with an env var: `APP_BASE_URL` or `FRONTEND_URL`. Also remove the `print()` debug statements on lines 34–35 of the same file.

---

### Debug `print()` Calls Left in Production Code
- **Issue:** `email_service.py` contains `print(current_app.config["MAIL_SERVER"])` and `print(current_app.config["MAIL_PORT"])` that execute on every password-reset request. The comment on line 6 reads `# Falta configurar o email e o servidor SMTP` indicating this code was never finished.
- **Files:** `app/backend/statl/services/email_service.py`, lines 34–35
- **Impact:** Leaks configuration details to stdout in production logs. Email feature is in an incomplete state.
- **Fix approach:** Remove prints; use `current_app.logger.debug(...)`. Fully implement and test the SMTP flow end-to-end.

---

### Score Manipulation: Client-Controlled Scoring
- **Issue:** Quiz answer checking happens entirely on the client (`QuizInProgressScreen.tsx`, line 143: `userAnswer === current.correct_answer`). The frontend then posts `{ acertos, total }` to `/users/salvar-resultado`. The backend trusts these values without validation — any authenticated user can post arbitrary `acertos`/`total` values to inflate their score.
- **Files:** `app/frontend/app/(app)/QuizInProgressScreen.tsx` lines 143–152; `app/backend/statl/routes/users.py` lines 147–153; `app/backend/statl/services/resultado_service.py` lines 10–29
- **Impact:** Leaderboard/ranking is trivially cheatable.
- **Fix approach:** Move answer checking server-side. Persist question IDs and user answers in a quiz session, then validate on the backend before awarding points. The existing `POST /questions/check` endpoint exists but is unused.

---

### No Password Strength Enforcement
- **Issue:** `register_user()` and all password-change paths accept any non-empty string as a valid password. There is no minimum length, complexity, or common-password check.
- **Files:** `app/backend/statl/services/auth_service.py` lines 17–40; `app/backend/statl/services/user_service.py` line 74–78
- **Impact:** Users can register with passwords like `"a"` or `"1"`.
- **Fix approach:** Add a validator (e.g., minimum 8 characters) in `app/backend/statl/utils/validators.py` and call it from both `register_user()` and `update_own_profile_service()`.

---

### Inactive Users Can Log In
- **Issue:** The `users` table has an `active` column but `login_user()` in `auth_service.py` never checks it. An admin can mark a user as `active=False` via the update endpoints, but that user can still log in and receive a valid JWT.
- **Files:** `app/backend/statl/services/auth_service.py` lines 45–72; `app/backend/statl/models/user.py` line 13
- **Impact:** Deactivating a user has no effect on their access.
- **Fix approach:** Add `if not user.active: return None, jsonify({"error": "conta desativada"}), 403` in `login_user()` after fetching the user.

---

### CORS Wildcard in Production
- **Issue:** `CORS_ORIGINS` defaults to `"*"` if not set (`app/backend/statl/__init__.py`, line 71). The `after_request` hook also unconditionally sets `'Access-Control-Allow-Origin': '*'` for every response (lines 87–93), overriding any origin restriction set via the env var.
- **Files:** `app/backend/statl/__init__.py`, lines 70–93
- **Impact:** Any website can make credentialed cross-origin requests to the API. The env-var-based restriction is silently defeated by the after_request hook.
- **Fix approach:** Remove the manual `after_request` CORS headers; let Flask-CORS handle it exclusively. Set `CORS_ORIGINS` to the actual frontend origin in production.

---

### `GET /questions/rand/<num>` is Unauthenticated
- **Issue:** The `/questions/rand/<int:num>` endpoint has no `@jwt_required()` or `@require_role()` guard. All quiz question content (including `correct_answer`) is returned to anonymous callers.
- **Files:** `app/backend/statl/routes/questions.py`, lines 37–39
- **Impact:** Any unauthenticated caller can bulk-fetch questions with correct answers. The `/questions/filtered`, `/questions/check`, `/questions/chapters`, and `/questions/topics` endpoints are similarly unprotected.
- **Fix approach:** Decide whether question browsing requires authentication. If so, add `@jwt_required()` to at minimum `/rand/<num>` and `/filtered`.

---

### `GET /questions/professor/<professor_id>` Has No Ownership Check
- **Issue:** The route at line 109–113 of `app/backend/statl/routes/questions.py` requires `professor` or `admin` role, but any professor can pass any other professor's ID and receive that professor's questions. The JWT identity is never compared against the URL parameter.
- **Files:** `app/backend/statl/routes/questions.py`, lines 109–113
- **Impact:** Professors can enumerate each other's proprietary questions.
- **Fix approach:** Add `if role != 'admin' and str(get_jwt_identity()) != professor_id: return 403` before calling the service.

---

## Medium Severity

### `RETURNING id` is PostgreSQL-Only Syntax
- **Issue:** Both `criar_usuario()` and `criar_usuario_com_papel()` in `user_repository.py` use `RETURNING id` (lines 27, 44). `adicionar_questao()` in `questions_repository.py` also uses it (line 69). This syntax does not work on SQLite, which is the database used in `create_app(testing=True)`.
- **Files:** `app/backend/statl/repositories/user_repository.py` lines 27, 44; `app/backend/statl/repositories/questions_repository.py` line 69
- **Impact:** Any test that exercises user creation or question creation will fail against the SQLite test database. This is likely why the test suite is empty — tests silently fail or the team has not attempted to run them.
- **Fix approach:** Use SQLAlchemy ORM `db.session.add()` + `db.session.flush()` + `obj.id` which is dialect-agnostic, or use `db.session.execute(...).lastrowid` for SQLite compatibility.

---

### `RANDOM()` is PostgreSQL/SQLite-Only
- **Issue:** `buscar_questoes_aleatorias()` and `buscar_questoes_filtradas()` use `ORDER BY RANDOM()` (lines 150, 230 of `questions_repository.py`). MySQL uses `RAND()`. If the app is ever moved to MySQL, these queries silently return ordered results.
- **Files:** `app/backend/statl/repositories/questions_repository.py`, lines 150, 230
- **Impact:** Low risk in current setup (PostgreSQL in prod), but relevant since the CLAUDE.md and docker-compose reference MySQL.
- **Fix approach:** Abstract the random function via a SQLAlchemy `func.random()` or check `db.engine.dialect.name` as already done in `_garantir_schema_incremental`.

---

### Register Flow Has Unvalidated Error Path (Noted in CLAUDE.md)
- **Issue:** `RegisterNewUserService.tsx` catches errors and returns `error.response`, which can be `undefined` if the network is down or the server returns no body. The `register.tsx` screen checks `response?.status !== 201` but if `response` is `undefined`, it falls back to the generic string `'Erro ao registrar. Tente novamente.'`, hiding the real error from the user.
- **Files:** `app/frontend/src/services/RegisterNewUserService.tsx` lines 13–16; `app/frontend/app/(public)/register.tsx` lines 43–49
- **Impact:** Users receive a generic error message on network failures and some 5xx responses — intermittent registration failures are invisible. This is explicitly listed as a pending item in CLAUDE.md.
- **Fix approach:** Normalize the return value: always return `{ status, data }` or throw a typed error. Check `response` for `undefined` before accessing `.status`.

---

### `FileReader` API Used in React Native (Web-Only)
- **Issue:** `QuizInProgressScreen.tsx` uses `new FileReader()` (line 106) to convert a blob response to base64. `FileReader` is a browser API not available in native React Native environments.
- **Files:** `app/frontend/app/(app)/QuizInProgressScreen.tsx`, lines 101–115
- **Impact:** Image loading in quiz questions fails on Android/iOS native builds. Only works in Expo web or when running in a browser context.
- **Fix approach:** Use `expo-file-system` or fetch the image as base64 directly via the `responseType: 'arraybuffer'` path, then use `btoa()` or a Buffer polyfill. Alternatively, serve image URLs directly and use `<Image source={{ uri: url }}>` with a proper auth header via an interceptor.

---

### `buscar_todas_questoes()` Hard-Limited to 1000 with No Pagination
- **Issue:** `get_all_questions_service()` calls `buscar_todas_questoes(limite=1000)` (line 169–173 in `questions_repository.py`). The `/questions/admin/<admin_id>` route returns this entire result as a single JSON response with no pagination.
- **Files:** `app/backend/statl/repositories/questions_repository.py` lines 169–173; `app/backend/statl/routes/questions.py` lines 116–120
- **Impact:** As question count grows, this becomes a large memory allocation on every admin page load. At 230+ questions currently and growing, the limit of 1000 will eventually be hit.
- **Fix approach:** Add `page`/`per_page` parameters like the `/admin/questoes` endpoint already does correctly.

---

### Schema Migration via `ALTER TABLE` on Every Startup
- **Issue:** `_garantir_schema_incremental()` in `__init__.py` runs `ALTER TABLE` statements on every application startup (lines 102–120). This includes altering column defaults for `users.active` and `users.score` every time the server starts.
- **Files:** `app/backend/statl/__init__.py`, lines 102–120
- **Impact:** Startup overhead; the `ALTER TABLE` for `users` columns runs even when the schema is already correct. This is a workaround for missing proper migration tooling, not a real migration system.
- **Fix approach:** Introduce Alembic (`flask-migrate`) for proper schema migrations. Remove the `_garantir_schema_incremental` workaround once migrations are in place.

---

### No Input Validation on `num` Parameter in Quiz Endpoints
- **Issue:** `GET /questions/filtered` and `GET /questions/rand/<num>` accept arbitrary integers for `num`. A caller can request `num=100000` and receive a massive JSON payload.
- **Files:** `app/backend/statl/routes/questions.py`, lines 44, 38; `app/backend/statl/repositories/questions_repository.py` lines 148–152
- **Impact:** Memory exhaustion / slow responses under any abusive or accidental large-value request.
- **Fix approach:** Clamp `num` to a reasonable maximum (e.g., `min(num, 50)`).

---

### `console.log` of Sensitive Data in Production Builds
- **Issue:** `AuthContext.tsx` line 76 logs the full decoded JWT payload including email, role, and user ID on every login: `console.log('Token decodificado no signIn:', decoded)`. `RegisterNewUserService.tsx` line 9 and `RecoverPasswordService.tsx` line 4 log the full request data including passwords to the console unconditionally (not guarded by `__DEV__`).
- **Files:** `app/frontend/src/context/AuthContext.tsx` line 76; `app/frontend/src/services/RegisterNewUserService.tsx` line 9; `app/frontend/src/services/RecoverPasswordService.tsx` line 4
- **Impact:** PII (email, name) and potentially passwords are logged in production builds. These appear in device logs accessible via `adb logcat`.
- **Fix approach:** Wrap in `if (__DEV__)` guards or remove entirely. Never log passwords.

---

### No Database Indexes Defined
- **Issue:** The SQLAlchemy models (`user.py`, `questions.py`, `chapters.py`) define no indexes beyond primary keys. Frequently queried columns — `users.email`, `users.role`, `questions.chapter_id`, `questions.topic_id`, `questions.difficulty`, `quiz_resultados.usuario_id` — have no indexes.
- **Files:** `app/backend/statl/models/user.py`; `app/backend/statl/models/questions.py`
- **Impact:** As the dataset grows, login lookups by email, filtered quiz queries, and statistics aggregations will degrade. `users.email` is particularly critical as it is used on every login.
- **Fix approach:** Add `index=True` to `User.email`, `User.role`, `Question.chapter_id`, `Question.topic_id`, `Question.difficulty`, and `quiz_resultados.usuario_id` in the model definitions.

---

## Low Severity

### Hardcoded API Fallback URL for Emulator
- **Issue:** `api.tsx` line 7 defaults to `http://10.0.2.2:5000/` (Android emulator loopback) if `EXPO_PUBLIC_API_URL` is not set. Physical device testing silently connects to the wrong host.
- **Files:** `app/frontend/src/services/api.tsx`, line 5–7
- **Impact:** Developers testing on physical devices must manually edit the source file, which risks accidentally committing device-specific URLs. This is documented in CLAUDE.md as a manual step.
- **Fix approach:** Make `EXPO_PUBLIC_API_URL` a required env var with a clear build-time error if missing. Add `.env.example` documenting the variable.

### Profile Screen Contains Hardcoded Mock Data
- **Issue:** The activity calendar in `profile.tsx` lines 48–53 is hardcoded mock data (`[true, true, false, ...]`). The streak counter shows `"Sequência: 4 dias"` (line 135) and the professor section shows `"0 listas preparadas"` (line 103) — neither is connected to real data.
- **Files:** `app/frontend/app/(tabs)/profile.tsx`, lines 48–53, 103, 135
- **Impact:** Users see fabricated engagement data, which undermines trust when they notice their real activity isn't reflected.
- **Fix approach:** Implement a `GET /users/calendar` endpoint returning daily activity booleans, or derive from `questao_diaria_historico`. Connect the streak counter to real consecutive-day logic.

### `listas.tsx` Has No Role Guard
- **Issue:** The `listas` tab (`app/frontend/app/(tabs)/listas.tsx`) is shown in the tab bar and navigates to professor-only routes (`/(professor)/...`) without checking the user's role. A student who reaches this tab can attempt to navigate to professor screens.
- **Files:** `app/frontend/app/(tabs)/listas.tsx`; `app/frontend/app/(tabs)/_layout.tsx`
- **Impact:** Students see a professor-only tab. Backend routes are protected, but the UX presents invalid navigation options.
- **Fix approach:** Conditionally hide or disable the tab for non-professor roles using the `role` value from `useAuth()`.

### Legacy Routes Left in Production
- **Issue:** `users.py` lines 114–125 contain a block labeled `# Rotas legadas (mantidas para compatibilidade com frontend antigo)` exposing `PUT /users/update/<id>` and `DELETE /users/delete/<id>`. These have no callers in the current frontend.
- **Files:** `app/backend/statl/routes/users.py`, lines 114–125
- **Impact:** Dead surface area increases attack surface. The `DELETE /users/delete/<id>` route accepts any admin-role JWT without verifying the target user's role, potentially allowing deletion of other admins.
- **Fix approach:** Remove legacy routes after confirming no active callers. If kept, add role-guard to prevent admin-on-admin deletion.

### `daily.tsx` Level Label is Hardcoded
- **Issue:** `daily.tsx` line 70 hardcodes `"Nível 1 ⭐"` regardless of the user's actual score or progress. The `home.tsx` screen does the same in the subtitle variable (line 86: `'Nível 1 ⭐'`).
- **Files:** `app/frontend/app/(tabs)/daily.tsx` line 70; `app/frontend/app/(tabs)/home.tsx` line 86
- **Impact:** Cosmetic — the level display never advances.
- **Fix approach:** Derive the level from the user's `score` fetched from `/users/profile/<email>`, or add a level-calculation utility.

### `buscar_historico` Hard-Limited to 10 Without Exposure
- **Issue:** `buscar_historico()` in `resultado_repository.py` has `limite=10` hardcoded as a default with no way for callers to change it. The service and route also pass no override.
- **Files:** `app/backend/statl/repositories/resultado_repository.py` line 35; `app/backend/statl/services/resultado_service.py` line 33
- **Impact:** The statistics screen shows a maximum of 10 historical quiz attempts regardless of how many the user has completed.
- **Fix approach:** Expose a `limit` parameter through the service and route (`GET /users/historico?limit=20`).

### `CheckAnswer.tsx` Service Is Unused
- **Issue:** `app/frontend/src/services/CheckAnswer.tsx` exists and wraps `POST /questions/check`, but no screen calls it — answer checking was moved client-side in `QuizInProgressScreen.tsx`.
- **Files:** `app/frontend/src/services/CheckAnswer.tsx`
- **Impact:** Dead code that creates false impression the backend validates answers.
- **Fix approach:** Remove the file or replace the client-side check with a call to this service once server-side answer validation is implemented.

### `Flask-Login` Imported but Unused
- **Issue:** `flask_login` is in `requirements.txt` and `LoginManager` is initialized in `create_app()`, but `@login_required` is never used anywhere in the codebase. All auth is handled via Flask-JWT-Extended.
- **Files:** `app/backend/statl/__init__.py` line 6, line 37; `app/backend/requirements.txt`
- **Impact:** Unnecessary dependency, slight startup overhead, confusion for future contributors.
- **Fix approach:** Remove `flask_login` from `requirements.txt` and its initialization from `create_app()`.
