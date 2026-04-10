---
phase: 01-foundation-auth-hardening
plan: 03
subsystem: auth
tags: [flask, jwt, sqlite, pytest, active-flag]

requires: []
provides:
  - "Active flag enforced at login — inactive users receive HTTP 403"
  - "NULL active backfill in _garantir_schema_incremental for production safety"
  - "4 pytest regression tests for login gate (test_auth.py)"
  - "Populated conftest.py with app/client fixtures for all future backend tests"
affects: [01-04, phase-2, phase-3]

tech-stack:
  added: [pytest]
  patterns: [TDD red-green, Flask test client via create_app(testing=True)]

key-files:
  created:
    - app/backend/statl/tests/test_auth.py
  modified:
    - app/backend/statl/services/auth_service.py
    - app/backend/statl/__init__.py
    - app/backend/statl/tests/conftest.py

key-decisions:
  - "Used `if not user.active:` (not `== False`) — handles both False and NULL correctly"
  - "403 message in Portuguese: 'Conta desativada. Contate o administrador.'"
  - "NULL backfill placed inside _garantir_schema_incremental (PostgreSQL-only block) — SQLite test env never runs it"
  - "conftest.py uses function scope fixtures so each test gets a fresh in-memory DB"

patterns-established:
  - "Flask test pattern: create_app(testing=True) + db.create_all() in conftest fixture"
  - "TDD flow: RED commit (failing tests) → GREEN commit (implementation) — both committed atomically per task"

requirements-completed:
  - QA-03

duration: 15min
completed: 2026-04-10
---

# Plan 01-03: Inactive User Gate — Summary

**`if not user.active:` guard + NULL backfill added to login flow; 4 pytest tests confirm inactive users receive 403**

## Performance

- **Duration:** ~15 min
- **Tasks:** 2/2
- **Files modified:** 4

## Accomplishments

- Added 3-line active guard to `login_user` in `auth_service.py` — inactive users now get HTTP 403 with a Portuguese error message
- Added `UPDATE users SET active = TRUE WHERE active IS NULL` backfill in `_garantir_schema_incremental` to protect existing production rows
- Populated `conftest.py` with `app` and `client` fixtures (function scope, fresh in-memory SQLite per test) — enables all future backend tests
- Created `test_auth.py` with 4 regression tests: active login passes, inactive blocked, error message checked, wrong password still 400

## Task Commits

1. **Task 1: Write failing tests (RED)** — `d4ec36f` (test)
2. **Task 2: Add active guard + backfill (GREEN)** — `ff07ecd` (fix)

## Files Created/Modified

- `app/backend/statl/services/auth_service.py` — added `if not user.active: return 403` block after password check
- `app/backend/statl/__init__.py` — added NULL backfill in `_garantir_schema_incremental`
- `app/backend/statl/tests/conftest.py` — populated with `app` and `client` fixtures
- `app/backend/statl/tests/test_auth.py` — created with 4 auth regression tests

## Decisions Made

- `if not user.active:` chosen over `if user.active == False:` — the `not` form correctly treats NULL as inactive, which is the safe default
- Error message in Portuguese to match the app's language convention
- Backfill scoped to PostgreSQL dialect only — SQLite test env doesn't need it

## Deviations from Plan

None — plan executed exactly as written. Rate limit interrupted the agent mid-execution; Task 2 was completed inline by the orchestrator.

## Issues Encountered

- Agent hit API rate limit after Task 1 (RED tests committed). Task 2 was completed inline. All 4 tests pass (GREEN confirmed).

## Next Phase Readiness

- `conftest.py` is now populated — Plan 01-04 can use the same fixture pattern for question auth tests
- `test_auth.py` serves as the reference test pattern for `test_questions_auth.py`

---
*Phase: 01-foundation-auth-hardening*
*Completed: 2026-04-10*
