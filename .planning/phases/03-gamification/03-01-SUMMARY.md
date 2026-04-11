---
phase: 03-gamification
plan: "01"
subsystem: api
tags: [flask, sqlalchemy, jwt, postgres, sqlite, gamification]
dependency_graph:
  requires: [01-03, 01-04, 02-03]
  provides:
    - gamification-blueprint
    - record-session-endpoint
    - xp-streak-data-model
  affects: [03-02, 03-03, 03-04, phase-5]
tech_stack:
  added: []
  patterns:
    - service-layer XP calculation with calendar-day streak logic
    - hard cutover from score-based fields/routes to xp-based gamification contracts
key_files:
  created:
    - app/backend/statl/repositories/gamification_repository.py
    - app/backend/statl/services/gamification_service.py
    - app/backend/statl/routes/gamification.py
    - app/backend/statl/tests/test_gamification.py
  modified:
    - app/backend/statl/models/user.py
    - app/backend/statl/__init__.py
    - app/backend/statl/repositories/resultado_repository.py
    - app/backend/statl/repositories/user_repository.py
    - app/backend/statl/routes/admin.py
    - app/backend/statl/routes/users.py
    - app/backend/statl/services/resultado_service.py
key_decisions:
  - "Renamed the persistent user score field to xp in the model and PostgreSQL incremental schema path, then removed score-based API usage instead of carrying a compatibility layer."
  - "record-session saves quiz history and gamification state together so /users/historico and the new profile calendar stay fed by the same completion event."
  - "Streak multiplier is based on the streak value after the current session is accounted for, so crossing day 3/day 7 thresholds immediately changes the awarded XP."
requirements_completed: [GAME-01, GAME-02, GAME-03]
metrics:
  duration: "~35min"
  completed: "2026-04-11"
  tasks_completed: 2
---

# Phase 03 Plan 01: XP Backend + Streak Engine Summary

**A dedicated gamification backend now records completed quiz sessions, awards server-side XP with streak multipliers, and exposes XP/streak data directly from the user profile contract.**

## What Was Built

- Added `xp`, `streak`, and `last_practice_date` to the `User` model and extended the PostgreSQL incremental schema path to rename `score` to `xp` safely in existing databases.
- Created a new `/gamification` blueprint with `POST /gamification/record-session`, backed by a repository/service pair that validates input, stores quiz history, computes XP, advances or resets the streak, and persists the updated state.
- Cut over admin and management flows to consume `xp` directly, leaving the schema migration as the only place where `score` still appears for backward-safe database upgrade logic.

## Verification

- `python -m pytest statl/tests` -> 18 passed
- `python - <<'PY' ... create_app(testing=True) ... PY` -> app boots with the `gamification` blueprint registered

## Deviations from Plan

### Auto-fixed Issues

**1. [Migration scope] score->xp cleanup touched more files than the plan listed**
- **Issue:** The plan enumerated the primary backend files, but the real codebase also had `score` references in user repository helpers, admin stats queries, and seed scripts.
- **Fix:** Updated those call sites to use `xp` natively and later consolidated the old seed scripts into `app/backend/seed_demo_data.py`.
- **Files modified:** `app/backend/statl/repositories/user_repository.py`, `app/backend/statl/routes/admin.py`, `app/backend/seed_demo_data.py`

## Notes

- `app/backend/statl/tests/test_gamification.py` covers the multiplier formula, same-day streak behavior, ranking pagination contract, and profile payload fields. That test file also verifies the backend behavior introduced in plan 03-02.
