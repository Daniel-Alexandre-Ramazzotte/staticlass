---
phase: 01-foundation-auth-hardening
plan: 02
subsystem: auth
tags: [email, password-reset, env-var, flask, python-dotenv]

# Dependency graph
requires: []
provides:
  - "send_reset_email reads base URL from APP_BASE_URL env var instead of hardcoded localhost"
  - "APP_BASE_URL defined in .env with dev default http://localhost:5000"
  - ".env files added to .gitignore to prevent secret leakage"
affects: [auth, infra, deploy]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Env var lookup pattern: os.environ.get('KEY', 'fallback') at function call time, loaded by python-dotenv at app startup"

key-files:
  created: []
  modified:
    - app/backend/statl/services/email_service.py
    - app/backend/.env
    - .gitignore

key-decisions:
  - "Fallback to http://localhost:5000 preserves dev behavior when APP_BASE_URL is not set"
  - "APP_BASE_URL value in .env set to http://localhost:5000 (safe dev default; must be updated for production)"
  - "Auto-added .env to .gitignore as Rule 2 fix for threat T-01-02-04 (secret leakage prevention)"

patterns-established:
  - "Backend env config: all deployment-specific URLs go in .env, read via os.environ.get() with local fallback"

requirements-completed: [QA-02]

# Metrics
duration: 8min
completed: 2026-04-09
---

# Phase 01 Plan 02: Configurable Password Reset URL Summary

**Password reset email now reads base URL from APP_BASE_URL env var via os.environ.get(), removing hardcoded localhost:5000 and enabling production deployment without code changes**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-04-09T00:00:00Z
- **Completed:** 2026-04-09T00:08:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- `send_reset_email` no longer hardcodes `http://localhost:5000` — base URL now comes from `APP_BASE_URL` env var
- `app/backend/.env` created in worktree with `APP_BASE_URL=http://localhost:5000` as dev default
- `.env` files added to `.gitignore` (threat T-01-02-04 mitigation — prevents accidental secret commit)

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace hardcoded URL in email_service.py with APP_BASE_URL env var** - `157a552` (fix)
2. **Task 2: Add APP_BASE_URL to .env with production placeholder + gitignore .env** - `28898a8` (fix)

## Files Created/Modified

- `app/backend/statl/services/email_service.py` - Added `import os`; replaced hardcoded reset_link with `base_url = os.environ.get("APP_BASE_URL", "http://localhost:5000")` and `reset_link = f"{base_url}/reset-password?token={token}"`
- `app/backend/.env` - Created with DATABASE_URL, SECRET_KEY, and new APP_BASE_URL=http://localhost:5000
- `.gitignore` - Added `.env` and `app/backend/.env` patterns

## Decisions Made

- Fallback default is `http://localhost:5000` — matches prior hardcoded behavior so no dev workflow disruption
- Value in `.env` is also `http://localhost:5000` (not a secret); production operators must update this to their actual domain before deploying
- Deep-link design (HTTP URL vs mobile deep link `staticlass://reset-password?token=...`) deferred — scoped out of this plan per plan objective

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added .env patterns to .gitignore**
- **Found during:** Task 2 (Add APP_BASE_URL to .env)
- **Issue:** Threat model T-01-02-04 requires `.env` be gitignored to prevent secret leakage; `.gitignore` at root only contained `banco_questoes/` — no `.env` entry
- **Fix:** Appended `.env` and `app/backend/.env` to root `.gitignore`
- **Files modified:** `.gitignore`
- **Verification:** `git status` shows `.env` not tracked (appears in neither staged nor untracked after creation)
- **Committed in:** `28898a8` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical security)
**Impact on plan:** Auto-fix directly required by the plan's own threat model (T-01-02-04). No scope creep.

## Issues Encountered

- The `.env` file does not exist in the git worktree (not tracked by git as expected), so it was created fresh in the worktree directory with the same content as the main repo's `.env` plus the new `APP_BASE_URL` key.

## User Setup Required

For production deployment, update `app/backend/.env`:
```
APP_BASE_URL=https://your-actual-domain.com
```

Then restart Flask. No code changes needed.

## Next Phase Readiness

- Password reset email link is now deployment-configurable
- `.env` gitignore protection in place
- Remaining auth hardening (active-user login check, register flow validation) continues in plans 01-03 and 01-04

---
*Phase: 01-foundation-auth-hardening*
*Completed: 2026-04-09*
