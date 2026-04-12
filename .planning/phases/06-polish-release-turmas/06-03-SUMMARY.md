---
phase: 06-polish-release-turmas
plan: "03"
subsystem: student-calendar
tags: [backend, frontend, analytics, calendar, react-native]
dependency_graph:
  requires: [06-01]
  provides: [monthly-calendar-endpoint, month-calendar-component]
  affects: [profile-screen, student-analytics]
tech_stack:
  added: []
  patterns: [db-agnostic-date-query, jwt-protected-analytics, react-native-month-grid]
key_files:
  created:
    - app/backend/statl/tests/test_calendar_endpoint.py
  modified:
    - app/backend/statl/services/student_analytics_service.py
    - app/backend/statl/routes/users.py
    - app/frontend/app/(tabs)/profile.tsx
decisions:
  - "Used DB-agnostic DATE() + Python filtering instead of EXTRACT() to support both SQLite (tests) and PostgreSQL (production)"
  - "Calendar navigation locked to current year — January is earliest reachable month (D-13)"
  - "Forward arrow disabled when on current month — students cannot view future months (D-12)"
  - "student_id derived exclusively from JWT identity, never from request params (T-06-03-03)"
metrics:
  duration: "~20 minutes"
  completed: "2026-04-12T19:46:15Z"
  tasks_completed: 2
  files_modified: 4
  tests_added: 10
---

# Phase 06 Plan 03: Monthly Practice Calendar Summary

**One-liner:** Full-month calendar with month navigation replacing the 4-week rolling grid, backed by a new JWT-protected `/users/analytics/calendar` endpoint reading from `answer_history`.

## What Was Built

### Backend: GET /users/analytics/calendar

New endpoint at `/users/analytics/calendar?year=YYYY&month=M` returns:
```json
{ "year": 2026, "month": 4, "practiced_days": [1, 3, 7, 15] }
```

- Protected by `@jwt_required()` — student only sees their own data via `get_jwt_identity()`
- Validates: year must equal current year, month must be 1–12, both params required
- Returns empty `practiced_days` for future months (no error)
- DB-agnostic query using `DATE(answered_at)` + Python filtering — works with both SQLite (tests) and PostgreSQL (production)

### Frontend: MonthCalendar component

`MonthCalendar` in `app/frontend/app/(tabs)/profile.tsx` replaces the old `WeekRow`/`buildCalendar` 4-week rolling grid:

- Renders a proper month grid with leading blank cells for day-of-week alignment
- Navigation arrows (`‹` / `›`) allow going back to January of current year
- Forward arrow is disabled when viewing current month (cannot peek at future months)
- Practiced days shown with `palette.primaryGreen` background
- Future days shown at 0.3 opacity
- Loading spinner (`ActivityIndicator`) shown while fetching
- Header shows `"Abril 2026"` format using Portuguese month names

## SQLite/PostgreSQL Compatibility Decision

The plan noted `EXTRACT(DAY FROM answered_at)::INTEGER` would fail in SQLite. The DB-agnostic approach used:

```python
SELECT DISTINCT DATE(answered_at) AS practice_date
FROM answer_history
WHERE student_id = :student_id
```

Then Python filters by year/month string prefix (`"2026-04"`) and extracts `.day`. This works identically in both databases.

## Tests

10 tests in `app/backend/statl/tests/test_calendar_endpoint.py`:
- Auth gate (401 without JWT)
- Missing `year` / missing `month` → 400
- Wrong year (not current year) → 400
- Month 0 / month 13 → 400
- Happy path: returns correct practiced day integers
- Future month returns empty list (no error)
- Data isolation: student only sees own entries
- Deduplication: multiple answers on same day counted once

All 10 tests pass.

## Deviations from Plan

None — plan executed exactly as written.

## Threat Surface Scan

All new surfaces are within the plan's threat model:
- `/users/analytics/calendar` is protected by `@jwt_required()` (T-06-03-01)
- `year`/`month` parsed as `int()` with parameterized queries (T-06-03-02)
- `student_id` from JWT only, never from request params (T-06-03-03)

No new unmodeled surfaces introduced.

## Known Stubs

None — `practiced_days` is fully wired from `answer_history` through the service to the calendar component.

## Self-Check: PASSED

All 4 key files exist on disk. Both task commits (bf6e1b2, c5e3570) present in git log.
