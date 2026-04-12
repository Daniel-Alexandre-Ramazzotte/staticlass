---
phase: 06-polish-release-turmas
plan: 02
subsystem: auth / email-verification / deep-link
tags: [email-verification, deep-link, expo-router, flask, tdd]
dependency_graph:
  requires: [06-01]
  provides: [email-verification-deep-link-flow]
  affects: [auth, register-flow, email-service]
tech_stack:
  added: []
  patterns:
    - itsdangerous URLSafeTimedSerializer for verification tokens (existing)
    - staticlass:// deep link scheme via Expo Router
    - Always-200 resend endpoint to prevent email enumeration
key_files:
  created:
    - app/backend/statl/tests/test_email_verification.py
    - app/frontend/app/(public)/verify-email.tsx
  modified:
    - app/backend/statl/routes/auth.py
    - app/backend/statl/services/auth_service.py
    - app/backend/statl/services/email_service.py
    - app/frontend/app.json
decisions:
  - Always return 200 from /resend-verification regardless of email existence (T-06-02-01 mitigation)
  - verify-email screen uses plain axios without auth token — user is not logged in during verification
  - Cross-platform resend UX uses inline TextInput instead of Alert.prompt (works on Android + web)
  - app.json scheme changed from 'frontend' to 'staticlass' for proper deep link routing
metrics:
  duration_minutes: 26
  completed_date: "2026-04-12"
  tasks_completed: 2
  tasks_total: 2
  files_created: 2
  files_modified: 4
---

# Phase 06 Plan 02: Email Verification Deep Link Flow Summary

**One-liner:** JWT-signed deep links via `staticlass://verify-email?token=` open a new Expo Router screen that confirms or resends verification, with a public JSON endpoint instead of the HTML-returning browser fallback.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 (RED) | Failing tests for email verification | ab446bf | statl/tests/test_email_verification.py |
| 1 (GREEN) | Backend JSON verify + resend endpoints + deep link URL | e45fa98 | routes/auth.py, services/auth_service.py, services/email_service.py |
| 2 | Expo deep link scheme + verify-email screen | 065403b | app.json, app/(public)/verify-email.tsx |

## What Was Built

### Backend (Task 1)

**`POST /auth/verify-email-token`** — New JSON endpoint for mobile deep link verification. Accepts `{ "token": "<string>" }`, validates using existing `verify_verification_token` (itsdangerous HMAC, 24h expiry), returns `{ "message": "Email verificado com sucesso" }` on success or `{ "error": "Token inválido ou expirado" }` on failure. No auth header required.

**`POST /auth/resend-verification`** — New public endpoint. Always returns 200 regardless of whether the email exists or is already verified (T-06-02-01 mitigation). Calls `resend_verification_service` which silently skips if user not found or already verified.

**`send_verification_email` updated** — Verification URL changed from `{APP_BASE_URL}/auth/verify-email?token={token}` to `staticlass://verify-email?token={token}`. The `base_url` variable is removed from this function (kept in `send_reset_email` for password reset links which remain HTTP).

### Frontend (Task 2)

**`app.json` scheme** — Changed `"scheme": "frontend"` to `"scheme": "staticlass"` so `staticlass://` URLs open the app.

**`app/(public)/verify-email.tsx`** — New Expo Router screen at the `staticlass://verify-email` deep link path:
- **Loading state:** `ActivityIndicator` + "Verificando email..." while calling `POST /auth/verify-email-token`
- **Success state:** Green checkmark, "Email verificado!" heading, "Sua conta está ativa" subtext, `AppButton` (primaryGreen) navigating to login
- **Error state:** Red X, "Link inválido ou expirado" heading, inline `TextInput` for email + `AppButton` (darkBlue) labeled "Reenviar email" — after submit shows "Email reenviado! Verifique sua caixa de entrada."

## Verification Results

```
python -m pytest statl/tests/test_email_verification.py -v
12 passed in 1.27s

npm run lint
0 errors, 8 warnings (all pre-existing in unrelated files)
```

Acceptance criteria:
- `grep "staticlass://" email_service.py` — 1 match in `send_verification_email` ✓
- `base_url` in email_service.py — only in `send_reset_email` ✓
- `verify-email-token` route defined in auth.py ✓
- `resend-verification` route defined in auth.py ✓
- `scheme: staticlass` in app.json ✓
- `verify-email.tsx` exists, contains "Reenviar email", "resend-verification", "verify-email-token" ✓

## Deviations from Plan

None — plan executed exactly as written.

The plan noted "Step 3 — Expo Router registers the screen automatically" which was confirmed: the file in `(public)/verify-email.tsx` is picked up by Expo Router's file-system routing without any manual registration.

## Known Stubs

None — all endpoints are wired and functional. The resend flow calls the real `POST /auth/resend-verification` endpoint.

## Threat Flags

No new security-relevant surface beyond what was modeled in the plan's threat register. Both new endpoints are public (no auth), which is intentional and documented in the threat model. The resend endpoint's always-200 behavior mitigates T-06-02-01 (email enumeration).

## Self-Check: PASSED

Files created/exist:
- `app/backend/statl/tests/test_email_verification.py` — FOUND
- `app/frontend/app/(public)/verify-email.tsx` — FOUND

Commits exist:
- ab446bf — FOUND (test RED)
- e45fa98 — FOUND (backend GREEN)
- 065403b — FOUND (frontend)
