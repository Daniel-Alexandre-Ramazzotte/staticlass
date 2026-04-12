---
phase: 05-statistics-analytics
plan: 01
subsystem: analytics
tags: [postgres, flask, sqlalchemy, react-native, answer-history, gamification, lists]
requires:
  - phase: 03-gamification
    provides: XP/streak session recording and post-quiz result flow
  - phase: 04-professor-lists
    provides: list submissions and per-answer list response tables
provides:
  - Canonical answer-level analytics persistence in `answer_history`
  - Free-practice answer capture wired into `/gamification/record-session`
  - List-submission mirroring and idempotent historical list backfill
affects: [student analytics, professor analytics, admin dashboard]
tech-stack:
  added: []
  patterns: [canonical answer history, mirrored list-answer writes, idempotent analytics backfill]
key-files:
  created:
    - app/backend/statl/models/answer_history.py
    - app/backend/statl/repositories/answer_history_repository.py
  modified:
    - app/backend/statl/__init__.py
    - app/backend/statl/repositories/resultado_repository.py
    - app/backend/statl/services/gamification_service.py
    - app/backend/statl/services/lists_service.py
    - app/frontend/app/(app)/ResultScreen.tsx
    - app/backend/statl/tests/test_gamification.py
    - app/backend/statl/tests/test_lists.py
key-decisions:
  - "Phase 5 uses `answer_history` as the canonical per-answer analytics source."
  - "Legacy free-practice aggregates remain write-compatible, but answer-level analytics are captured only from real answer payloads."
  - "Historical backfill promotes exact list answers only; quiz summary rows are not expanded into synthetic answer history."
patterns-established:
  - "Analytics writes happen in the same logical transaction as the source workflow that generated them."
  - "List resubmission analytics replace prior canonical rows for the same submission id instead of appending duplicates."
requirements-completed: [STAT-01, STAT-02, STAT-03, STAT-04, STAT-05]
duration: 18 min
completed: 2026-04-12
---

# Phase 5: Statistics & Analytics Summary

**Canonical answer-history storage now captures free-practice sessions and list submissions at answer level, with exact historical list answers backfilled into a single analytics source.**

## Performance

- **Duration:** 18 min
- **Started:** 2026-04-12T10:00:00-03:00
- **Completed:** 2026-04-12T10:17:46-03:00
- **Tasks:** 3
- **Files modified:** 9

## Accomplishments
- Added `answer_history` as the canonical per-answer analytics table and repository surface.
- Wired free-practice completion to persist validated answer rows alongside the existing session result and XP/streak update.
- Mirrored list submissions into canonical analytics rows and added idempotent backfill for historical list answers.

## Task Commits

No commits were created in this session. The plan was implemented directly in the working tree because the repository already contained unrelated in-progress changes and no commit was requested.

## Files Created/Modified
- `app/backend/statl/models/answer_history.py` - SQLAlchemy model for canonical answer-level analytics rows
- `app/backend/statl/repositories/answer_history_repository.py` - insert, replace, and backfill helpers for answer history
- `app/backend/statl/__init__.py` - model registration, PostgreSQL schema bootstrap, and startup backfill trigger
- `app/backend/statl/repositories/resultado_repository.py` - returns the inserted quiz session id for analytics linking
- `app/backend/statl/services/gamification_service.py` - validates free-practice answer payloads and persists canonical rows transactionally
- `app/backend/statl/services/lists_service.py` - mirrors list submissions into `answer_history` on submit/resubmit
- `app/frontend/app/(app)/ResultScreen.tsx` - sends per-answer payloads for free-practice and marks list XP calls as `source: 'list'`
- `app/backend/statl/tests/test_gamification.py` - asserts canonical rows exist for free-practice and invalid answer payloads fail with `400`
- `app/backend/statl/tests/test_lists.py` - asserts list submissions populate and replace canonical analytics rows

## Decisions Made
- Used the existing quiz result row as the `source_id` for free-practice analytics so summary and answer-level records stay linked.
- Kept list analytics canonicalization inside the list submission service rather than the frontend flow, which prevents duplicate or skipped writes.
- Ran historical promotion from `list_submissions` plus `list_submission_answers` at app startup so existing professor list data becomes analytics-ready without fabricating older quiz detail.

## Deviations from Plan

None. The plan was executed as written.

## Issues Encountered

- Existing user changes were already present in `app/backend/statl/__init__.py` and list-related files, so the implementation had to preserve those edits while layering the analytics foundation on top.

## User Setup Required

None. No external service configuration was added.

## Next Phase Readiness

Wave 2 can now read from a stable canonical analytics source:
- student analytics can aggregate overview, chapter/topic mastery, and 4-week activity from `answer_history`
- professor analytics can use canonical list answers for risk-first reporting
- admin metrics can count platform activity from answer-history and list-change data

---
*Phase: 05-statistics-analytics*
*Completed: 2026-04-12*
