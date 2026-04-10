---
phase: 01-foundation-auth-hardening
plan: 04
subsystem: auth
tags: [flask, jwt, pytest, auth-middleware, require_role]

requires:
  - phase: 01-03
    provides: "conftest.py with app/client fixtures, test_auth.py pattern, @require_role decorator already present in questions.py"

provides:
  - "@require_role(['aluno', 'professor', 'admin']) enforced on /questions/filtered, /rand/<num>, /chapters, /topics, /check"
  - "9 pytest regression tests confirming 401 for unauthenticated callers on all five previously-public routes"
  - "Explicit assertion that correct_answer is not leaked to unauthenticated callers"

affects: [phase-2, phase-3, phase-4, phase-5]

tech-stack:
  added: []
  patterns:
    - "Role-based auth enforcement via @require_role — applied to all question endpoints serving answer data"
    - "Test pattern: _make_token(app, role=...) + _auth_headers(token) for JWT-protected endpoint tests"

key-files:
  created:
    - app/backend/statl/tests/test_questions_auth.py
  modified:
    - app/backend/statl/routes/questions.py

key-decisions:
  - "Used @require_role(['aluno', 'professor', 'admin']) to mean 'any authenticated user' — all three roles are valid quiz consumers"
  - "Decorator order: @bp.route before @require_role (Flask applies bottom-up; require_role wraps function first, then bp.route registers it)"
  - "No @jwt_required() stacked alongside @require_role — require_role already calls verify_jwt_in_request() internally"
  - "Authenticated test assertions use 'not in (401, 403)' rather than '== 200' — test DB is empty so 200 with empty list is also valid"

patterns-established:
  - "All question endpoints now require auth — @require_role(['aluno', 'professor', 'admin']) is the minimum for any route serving question data"
  - "Test token helper: create_access_token(identity=user_id, additional_claims={'role': ..., 'email': ..., 'name': ...}) within app.app_context()"

requirements-completed:
  - QA-04

duration: 10min
completed: 2026-04-10
---

# Phase 01 Plan 04: Question Endpoint Auth Enforcement — Summary

**Five previously-public question endpoints now require JWT authentication via @require_role(['aluno', 'professor', 'admin']), blocking unauthenticated access to correct_answer and is_correct fields**

## Performance

- **Duration:** ~10 min
- **Tasks:** 2/2
- **Files modified:** 2

## Accomplishments

- Added `@require_role(['aluno', 'professor', 'admin'])` to `/questions/filtered`, `/rand/<num>`, `/chapters`, `/topics`, and `/check` — unauthenticated callers now receive HTTP 401 with `{"error": "token inválido ou ausente"}`
- Created `test_questions_auth.py` with 9 regression tests covering all five routes for both unauthenticated (401) and authenticated (not 401/403) scenarios
- Explicit test confirms `correct_answer` does not appear in any unauthenticated response body
- Full test suite (13 tests) passes with no regressions from plans 01-01 through 01-03

## Task Commits

1. **Task 1: Add @require_role to five public question routes** — `1f3ab24` (feat)
2. **Task 2: Write regression tests for question endpoint authentication** — `df46858` (test)

## Files Created/Modified

- `app/backend/statl/routes/questions.py` — added `@require_role(['aluno', 'professor', 'admin'])` to `/rand/<num>`, `/filtered`, `/chapters`, `/topics`, `/check`
- `app/backend/statl/tests/test_questions_auth.py` — created with 9 pytest regression tests for QA-04

## Decisions Made

- `@require_role(['aluno', 'professor', 'admin'])` chosen over a custom "any authenticated" shorthand — consistent with the existing pattern in the file and explicit about which roles are permitted
- Decorator order follows established pattern: `@bp.route` first, `@require_role` second (Flask bottom-up application)
- `/questions/uploads/<filename>` intentionally left open per threat model T-01-04-07 — image files contain no answer data; adding auth would require frontend changes

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- All question endpoints are now auth-gated — Phase 2 (Question Bank Expansion) can build on this with confidence that new endpoints will follow the same pattern
- The frontend Axios interceptor already attaches tokens on every request, so no frontend changes are needed
- `test_questions_auth.py` serves as the reference pattern for any future question endpoint tests

## Self-Check: PASSED

- `app/backend/statl/routes/questions.py` — confirmed 11 `@require_role` decorators (6 existing + 5 new)
- `app/backend/statl/tests/test_questions_auth.py` — created, 9 tests, all pass
- `git log` confirms commits `1f3ab24` (feat) and `df46858` (test) exist
- `python -m pytest statl/tests/ -v` — 13 passed, 0 failed

---
*Phase: 01-foundation-auth-hardening*
*Completed: 2026-04-10*
