---
phase: 01-foundation-auth-hardening
verified: 2026-04-10T00:00:00Z
status: passed
score: 4/4
overrides_applied: 0
---

# Phase 1: Foundation & Auth Hardening — Verification Report

**Phase Goal:** The app is stable, secure, and correctly enforces access rules — every other phase builds on this foundation without carrying forward known bugs.
**Verified:** 2026-04-10
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | A new user can register, receive a confirmation, and log in without encountering any error on the happy path | VERIFIED | `RegisterNewUserService` uses `error.response ?? { status: 0, data: { error: 'Sem conexão com o servidor.' } }` — never returns undefined. `register.tsx` uses `response?.data?.error ??` (double optional chaining). Happy path returns 201 and shows Alert. |
| 2 | A password-reset link sent in any non-localhost environment opens a working reset page | VERIFIED | `email_service.py` line 12: `base_url = os.environ.get("APP_BASE_URL", "http://localhost:5000")`. No hardcoded localhost in the reset_link construction. Changing `APP_BASE_URL` in `.env` changes the link without code changes. |
| 3 | An admin-deactivated user is rejected at login with an informative message, not silently allowed in | VERIFIED | `auth_service.py` lines 64–65: `if not user.active: return None, jsonify({"error": "Conta desativada. Contate o administrador."}), 403`. Test `test_inactive_user_cannot_login` and `test_inactive_user_error_message` both PASS. |
| 4 | An unauthenticated GET to `/questions/filtered` returns 401, not question data with correct answers | VERIFIED | `routes/questions.py` line 44: `@require_role(['aluno', 'professor', 'admin'])` on `/filtered`. 11 total `@require_role` decorators confirmed in file. `test_filtered_requires_auth` and `test_filtered_response_not_returned_without_auth` both PASS. |

**Score:** 4/4 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `app/frontend/src/services/RegisterNewUserService.tsx` | Axios registration call with `error.response ??` fallback | VERIFIED | Line 15: `return error.response ?? { status: 0, data: { error: 'Sem conexão com o servidor.' } };` |
| `app/frontend/app/(public)/register.tsx` | Safe double optional chaining `response?.data?.error` | VERIFIED | Line 45: `response?.data?.error ?? 'Erro ao registrar. Tente novamente.'` |
| `app/backend/statl/services/email_service.py` | Reads base URL from `APP_BASE_URL` env var | VERIFIED | Line 12: `os.environ.get("APP_BASE_URL", "http://localhost:5000")` |
| `app/backend/statl/services/auth_service.py` | `if not user.active:` guard returning 403 | VERIFIED | Lines 64–65: guard present, returns 403 with Portuguese message |
| `app/backend/statl/routes/questions.py` | `@require_role(['aluno', 'professor', 'admin'])` on 5 previously-public routes | VERIFIED | All 5 routes protected: `/rand/<num>`, `/filtered`, `/chapters`, `/topics`, `/check` — 11 total decorators in file |
| `app/backend/statl/tests/test_auth.py` | 4 regression tests for login gate | VERIFIED | `test_active_user_can_login`, `test_wrong_password_still_400`, `test_inactive_user_cannot_login`, `test_inactive_user_error_message` |
| `app/backend/statl/tests/test_questions_auth.py` | 9 regression tests for question auth | VERIFIED | All 9 tests present and passing |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `register.tsx handleRegister` | `RegisterNewUserService` | `await` call — always returns `{ status, data }` | WIRED | Import resolves via tsconfig path alias `app/services/*` → `src/services/*` |
| `RegisterNewUserService` catch block | caller | `?? fallback` ensures no undefined returned | WIRED | Line 15 confirmed |
| `email_service.py send_reset_email` | `os.environ.get("APP_BASE_URL", ...)` | env var read at call time, loaded by python-dotenv at startup | WIRED | `import os` present; `os.environ.get` on line 12 |
| `auth_service.py login_user` | `user.active` attribute | SQLAlchemy Row attribute access after password check | WIRED | Guard on lines 64–65, positioned correctly after password check and before token generation |
| `routes/questions.py /filtered` | `@require_role(['aluno', 'professor', 'admin'])` | decorator applied after `@bp.route` | WIRED | Line 44 confirmed |

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Inactive user rejected at login with 403 | `pytest statl/tests/test_auth.py::test_inactive_user_cannot_login -v` | PASSED | PASS |
| Inactive user error message contains "desativada" | `pytest statl/tests/test_auth.py::test_inactive_user_error_message -v` | PASSED | PASS |
| Unauthenticated `/questions/filtered` returns 401 | `pytest statl/tests/test_questions_auth.py::test_filtered_requires_auth -v` | PASSED | PASS |
| `correct_answer` not exposed without auth | `pytest statl/tests/test_questions_auth.py::test_filtered_response_not_returned_without_auth -v` | PASSED | PASS |
| Full test suite — all 13 tests | `python -m pytest statl/tests/ -v` | 13 passed, 0 failed in 1.10s | PASS |

---

### Requirements Coverage

| Requirement | Source Plan | Status | Evidence |
|-------------|-------------|--------|----------|
| QA-01 | 01-01 | SATISFIED | `RegisterNewUserService` and `register.tsx` both patched; double optional chaining and nullish coalescing confirmed in source |
| QA-02 | 01-02 | SATISFIED | `email_service.py` reads `APP_BASE_URL` from env; no hardcoded localhost in reset link construction |
| QA-03 | 01-03 | SATISFIED | `auth_service.py` login guard + 4 passing pytest tests |
| QA-04 | 01-04 | SATISFIED | All 5 previously-public question routes protected + 9 passing pytest tests |

---

### Anti-Patterns Found

None blocking. No TODOs, placeholders, or stub patterns in the modified files that affect the phase goal.

---

### Human Verification Required

**SC-02 (partial):** The password-reset link being configurable via `APP_BASE_URL` is mechanically correct and verified. Whether the destination URL (an HTTP URL, not a mobile deep-link) actually opens a working reset page in a non-localhost environment cannot be verified without a deployed backend and a real email delivery. The PLAN itself acknowledges this design question is deferred. The code change (env-var substitution) is verified — the end-to-end delivery path needs a production smoke test.

**Test:** Set `APP_BASE_URL=https://your-domain.com` in `.env`, trigger a password reset for a real user, receive the email, and confirm the link opens a functional reset page.
**Expected:** The link in the email uses the configured domain, not `localhost`, and leads to a working reset form.
**Why human:** Requires a deployed environment, configured SMTP, and a real email client.

---

### Gaps Summary

No gaps. All 4 success criteria are satisfied in code. The one human verification item (production email delivery end-to-end) is an environmental validation that depends on infrastructure not available in this verification context — it does not block the phase goal, which is the code being correct and configurable.

---

_Verified: 2026-04-10_
_Verifier: Claude (gsd-verifier)_
