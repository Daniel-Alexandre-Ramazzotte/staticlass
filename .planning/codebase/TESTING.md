# Testing Patterns
*Generated: 2026-04-08*
*Focus: Testing frameworks, file organization, coverage state, and how to run tests*

## Summary
The backend has a minimal pytest setup with a single `conftest.py` stub and no actual test files. The frontend has no test files at all and no testing framework installed. Practically, this codebase has **zero automated test coverage** as of this analysis date.

---

## Backend

### Framework
- **Runner**: `pytest` (not declared in `requirements.txt`; expected to be installed separately)
- **Config file**: None — no `pytest.ini`, `setup.cfg`, or `pyproject.toml` found
- **Test database**: SQLite in-memory, configured via `create_app(testing=True)` in `app/backend/statl/__init__.py`

### Run Command
```bash
cd app/backend
pytest
```

### Test File Locations
```
app/backend/statl/tests/
└── conftest.py   # stub only — 1 line (empty)
```

The `tests/` directory exists at `app/backend/statl/tests/` but contains only `conftest.py`, which is empty (1 line). There are no `test_*.py` files anywhere in the backend.

### How the Test App Factory Works
`create_app(testing=True)` applies these overrides (defined in `app/backend/statl/__init__.py`):
```python
app.config.update(
    TESTING=True,
    WTF_CSRF_ENABLED=False,
    LOGIN_DISABLED=True,
    SQLALCHEMY_DATABASE_URI="sqlite:///:memory:",
)
```
This means tests can use an isolated in-memory SQLite database. Any future test should call `create_app(testing=True)` as its fixture factory. Flask-Mail and JWT are still initialized — email sending would need to be mocked.

### Intended Test Structure (inferred from conftest location)
Tests would be co-located under `app/backend/statl/tests/` and named `test_<module>.py`:
```
app/backend/statl/tests/
├── conftest.py        # app fixture, client fixture
├── test_auth.py       # registration, login, password reset
├── test_questions.py  # CRUD, filtering, access control
└── test_users.py      # profile update, admin user management
```

### What Would Be Tested (gaps)
Every service and route is currently untested. Key areas of highest risk:

- **`app/backend/statl/routes/auth.py`**: `POST /auth/register`, `POST /auth/login` — core user flows
- **`app/backend/statl/services/auth_service.py`**: `register_user`, `login_user` — validation logic, JWT generation
- **`app/backend/statl/services/questions_service.py`**: `_normalizar_payload`, `_normalizar_alternativas` — complex validation with many branches
- **`app/backend/statl/utils/auth_middleware.py`**: `require_role` — security boundary, verifies JWT and role claims
- **`app/backend/statl/repositories/questions_repository.py`**: `buscar_questoes_filtradas` — dynamic query builder with list parameters

### Seed Scripts (manual test helpers)
These are not tests but can populate the dev database for manual verification:
- `app/backend/seed_admin.py` — creates admin user
- `app/backend/seed_test_users.py` — creates test users
- `app/backend/seed_alunos_ficticios.py` — creates bulk fake student accounts

---

## Frontend

### Framework
No testing framework is installed. `package.json` includes only:
- **Linter**: `eslint ^9.25.0` with `eslint-config-expo ~10.0.0`
- **Type checker**: `typescript ~5.9.2`

There is no Jest, Vitest, React Native Testing Library, Detox, or any other test runner.

### Lint Command
```bash
cd app/frontend
npm run lint
# Runs: expo lint
```
ESLint config at `app/frontend/eslint.config.js` extends `eslint-config-expo/flat` with `dist/*` ignored.

### Test Files
None. `find` across the entire `app/frontend/` directory returns zero `.test.ts`, `.test.tsx`, `.spec.ts`, `.spec.tsx` files (excluding `node_modules` and `dist`).

### What Would Be Tested (gaps)
The most logic-bearing frontend code that would benefit from tests:

- **`app/frontend/src/context/AuthContext.tsx`**: JWT decoding, expiry check, `signIn`/`signOut` state transitions
- **`app/frontend/src/services/api.tsx`**: Axios interceptors — token attachment, error response passthrough
- **`app/frontend/src/services/CheckLogin.tsx`**, **`RegisterNewUserService.tsx`**: Service wrappers — error.response passthrough behavior
- **`app/frontend/app/(app)/QuizInProgressScreen.tsx`**: `parseIds`, `parseStrs` — pure utility functions easy to unit test; `handleNextQuestion` — answer comparison logic

### Type Checking as a Quality Gate
TypeScript strict mode is enabled (`"strict": true` in `app/frontend/tsconfig.json`). Running the type checker serves as a partial substitute for tests:
```bash
cd app/frontend
npx tsc --noEmit
```

---

## Coverage State

| Area | Files | Test Coverage |
|------|-------|---------------|
| Backend routes | `statl/routes/*.py` (4 files) | None |
| Backend services | `statl/services/*.py` (4 files) | None |
| Backend repositories | `statl/repositories/*.py` (3 files) | None |
| Backend security/utils | `statl/security/`, `statl/utils/` | None |
| Frontend screens | `app/(tabs)/`, `(app)/`, `(professor)/`, `(admin)/`, `(public)/` | None |
| Frontend context | `src/context/` | None |
| Frontend services | `src/services/` | None |
| Frontend components | `src/components/` | None |

**Effective coverage: 0%**

---

## Recommended First Tests

When adding tests, start with the highest-value, lowest-effort targets:

1. **Backend `conftest.py`**: add `app` and `client` pytest fixtures using `create_app(testing=True)` — this unlocks all route-level tests
2. **`test_auth.py`**: test `POST /auth/register` (happy path + duplicate email + missing fields) and `POST /auth/login` (correct/wrong credentials)
3. **`test_questions_service.py`**: unit-test `_normalizar_payload` and `_normalizar_alternativas` directly — no HTTP required, pure Python
4. **Frontend**: install `jest` + `@testing-library/react-native` and test `AuthContext` expiry logic and `parseIds`/`parseStrs` utilities from `QuizInProgressScreen.tsx`
