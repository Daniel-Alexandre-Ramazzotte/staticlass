---
phase: 06-polish-release-turmas
plan: 01
subsystem: infra
tags: [flask, expo-router, env, flyio, chromium, e2e]
requires: []
provides:
  - "Backend production config now reads app base URL and mail settings from environment variables."
  - "Frontend API client now uses localhost only in development and defaults to the Fly backend outside dev."
  - "Aluno, professor, and admin routed screens were verified locally through the static export without blank screens or unmatched routes."
affects: [06-02, 06-03, 06-04, release]
tech-stack:
  added: []
  patterns:
    - "Environment-driven Flask config for URLs and mail credentials"
    - "__DEV__-gated frontend API base selection"
key-files:
  created:
    - app/backend/.env.example
    - .planning/phases/06-polish-release-turmas/06-01-SUMMARY.md
  modified:
    - app/backend/statl/config.py
    - app/backend/statl/services/email_service.py
    - app/frontend/src/services/api.tsx
key-decisions:
  - "Frontend web builds should talk to localhost only in dev; production builds fall back to the Fly API URL."
  - "Local Chromium verification used auth/bootstrap helper pages that rewrite history before hydrating the exported bundle, avoiding false negatives from the plain file server's lack of SPA rewrites."
patterns-established:
  - "Document all required backend env vars in .env.example whenever prod config is touched."
  - "For static Expo export smoke tests, verify routed screens through authenticated helper entry points instead of raw *.html routes."
requirements-completed: []
duration: 30min
completed: 2026-04-12
---

# Phase 06 Plan 01: Production Config and Role Walkthrough Summary

**Environment-driven backend mail/base-url config plus a production-safe frontend API fallback, with local headless validation of aluno, professor, and admin screens across the exported app.**

## Performance

- **Duration:** 30 min
- **Started:** 2026-04-12T15:48:47-03:00
- **Completed:** 2026-04-12T16:18:30-03:00
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Removed production config leakage from the backend by sourcing mail and base URL settings from environment variables and documenting the required values in `app/backend/.env.example`.
- Ensured the frontend API client only points at localhost during development and falls back to `https://staticlass-backend.fly.dev/` outside `__DEV__`.
- Verified local routed screens for all three roles with Chromium headless against the exported app: aluno home shell, professor home + `Listas` + `CreateNewList` + `ListManager`, and admin home + `QuestaoViewer` + `ProfessorManager` + `AlunoManager`.
- Re-ran backend and frontend checks: `create_app(testing=True)` succeeded, targeted backend tests passed, and frontend lint stayed at `0 errors, 8 warnings`.

## Task Commits

1. **Task 1: Audit and fix production configuration** - `f736c21` (`fix(06-01): clean production backend config`)
2. **Task 2: Lock frontend production API base and complete local routed walkthrough** - `ec338ec` (`fix(06-01): prefer production api outside dev`)

## Files Created/Modified

- `app/backend/.env.example` - Placeholder env contract for local and Fly deployments.
- `app/backend/statl/config.py` - Mail/base-url config now comes from environment variables.
- `app/backend/statl/services/email_service.py` - Removed debug prints and kept URL generation aligned with env-driven base URL.
- `app/frontend/src/services/api.tsx` - Uses localhost only during development and the Fly backend outside dev.

## Decisions Made

- Kept the backend localhost fallback only where it is explicitly a local-development default (`email_service.py` URL fallback), but removed hardcoded service credentials/config from runtime config.
- Treated the frontend API base change as part of `06-01`, because production builds inheriting localhost would invalidate the role walkthrough and release hardening goals.
- Used history-rewrite helper pages for the static export walkthrough because direct `*.html` routes produced false `Unmatched Route` failures under the simple file server.

## Deviations from Plan

### Auto-fixed Issues

**1. Frontend production bundle inherited localhost API base**
- **Found during:** Task 2
- **Issue:** The app API client defaulted to localhost on web/mobile whenever `EXPO_PUBLIC_API_URL` was absent, which is correct for local dev but wrong for a release build.
- **Fix:** Split local dev URL selection into `LOCAL_URL_BASE` and used the Fly backend as the non-dev fallback.
- **Files modified:** `app/frontend/src/services/api.tsx`
- **Verification:** Chromium headless loaded professor/admin management routes from the exported app without unmatched-route or blank-screen failures while the local backend served the data.
- **Committed in:** `ec338ec`

---

**Total deviations:** 1 auto-fixed
**Impact on plan:** Necessary for release correctness. No scope creep beyond the plan's production-connectivity requirement.

## Issues Encountered

- The plain Python file server does not provide SPA rewrites for Expo Router paths, so direct requests such as `listas.html` were not reliable evidence. Verification switched to authenticated helper pages that rewrite history before loading `index.html`.
- The walkthrough was executed locally against the Docker backend and exported frontend, not against a live Fly browser session. The production fallback URL is now encoded correctly, but Fly secret presence still needs confirmation in deployment validation.

## Production Environment Validation Status

- **Connectivity mode used:** Local backend (`http://localhost:5000`) plus exported frontend served from `http://127.0.0.1:4174/`
- **Validated locally:** role landing shells, professor list authoring/management entry screens, and admin management screens all hydrated without blank screens or unmatched routes
- **Production fallback configured:** `app/frontend/src/services/api.tsx` now falls back to `https://staticlass-backend.fly.dev/` outside `__DEV__`

## Fly.io Secrets To Verify

- `DATABASE_URL`
- `SECRET_KEY`
- `JWT_SECRET_KEY`
- `FLASK_SECRET_KEY`
- `APP_BASE_URL`
- `MAIL_SERVER`
- `MAIL_PORT`
- `MAIL_USE_TLS`
- `MAIL_USERNAME`
- `MAIL_PASSWORD`
- `MAIL_DEFAULT_SENDER`

## Next Phase Readiness

- Ready for wave 2 plans (`06-02`, `06-03`, `06-04`).
- No blocking UI/runtime regression was found in the local routed walkthrough.
- Fly deployment validation should explicitly confirm the backend secret set and password-reset / email-verification links in the live environment.

---
*Phase: 06-polish-release-turmas*
*Completed: 2026-04-12*
