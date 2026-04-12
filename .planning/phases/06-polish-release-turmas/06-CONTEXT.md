# Phase 6: Polish, Release & Turmas — Context

**Gathered:** 2026-04-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Stabilize the app for first real use by real students and professors: full E2E walkthroughs, production environment validation on Fly.io, UX polish (loading/empty states, error messages, navigation), an interactive attendance calendar on the student profile, email verification for new self-registered accounts, and a Sistema de Turmas that lets professors assign lists to specific groups of students instead of all students.

This phase does NOT add new question types, AI features, LaTeX import, or PR-style question review workflows (those are backlog).
</domain>

<decisions>
## Implementation Decisions

### Sistema de Turmas — data model and enrollment
- **D-01:** Enrollment is professor-managed. On the turma create/edit screen, the professor sees all registered `aluno` users and manually adds whoever belongs to that class.
- **D-02:** A student can belong to multiple turmas simultaneously (multiple professors, multiple disciplines per semester).
- **D-03:** Lists published before turmas existed remain visible to all students. There is no migration or forced association. The `turma_id` on a list is nullable; null means "all students".
- **D-04:** When a professor publishes a list to a specific turma, only students enrolled in that turma see it on their home screen.

### Sistema de Turmas — UI placement
- **D-05:** Professor accesses turma management from a new "Turmas" entry in the existing `ProfessorMenu` screen, alongside the existing list and question entries.
- **D-06:** When creating or editing a published list, the professor can optionally associate it with a turma. The turma picker is part of the list authoring flow, not a separate step.

### Email verification
- **D-07:** New self-registered accounts (`aluno` role via the public register screen) require email verification before first login.
- **D-08:** Admin-created accounts (professors, admins, and any account created via admin panel) are already active — no verification required.
- **D-09:** Verification uses deep linking (expo-linking / Expo scheme) so the verification link opens the app directly and lands on a confirmation screen.
- **D-10:** If the verification token is expired, the app shows a clear error screen with a "Reenviar email" button that triggers a new verification email — no manual navigation required.

### Interactive attendance calendar
- **D-11:** The source of truth for calendar data is `answer_history`. Any entry in `answer_history` for a given day marks that day as practiced — free practice and list answers both count.
- **D-12:** Calendar navigation is bounded: users can navigate backward through past months but cannot navigate forward past the current month. No data exists for future dates.
- **D-13:** Calendar is locked to the current year (as stated in roadmap). Month navigation stays within the current calendar year.

### Production environment
- **D-14:** Fly.io environment already exists. Plan 06-02 validates it — environment variables, database connectivity, password reset links, email verification links, and image upload paths all resolve correctly in production.
- **D-15:** Frontend distribution for v1 is internal APK (direct distribution to PET students and professors). No Play Store / App Store submission for v1.

### Claude's Discretion
- Exact turma data model (table name, columns, FK structure) beyond what supports decisions D-01 through D-06.
- Visual treatment of enrolled-student list in the turma editor (search, alphabetical, chips, etc.).
- Exact calendar day visualization (dot, background color, icon) for practiced vs. not-practiced days.
- Whether the `expo-linking` scheme uses `staticlass://` or an existing scheme already in `app.json`.
- Exact copy and visual hierarchy on the verification pending / expired token screens.
- Loading skeleton vs. spinner for calendar and turma screens — Claude decides based on existing app patterns.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Roadmap and scope
- `.planning/ROADMAP.md` — Phase 6 goal, plan breakdown (06-01 through 06-05), success criteria, and dependency chain
- `.planning/PROJECT.md` — product constraints, active requirements, v1 non-goals (OAuth, web version, real-time chat)
- `.planning/STATE.md` — current milestone status

### Sistema de Turmas — integration points
- `app/backend/statl/models/listas.py` — existing `lists` and `list_submissions` schema; turmas will add a `turmas` table and a `turma_id` FK on `lists`
- `app/backend/statl/routes/lists.py` — existing list CRUD; publish endpoint needs turma association
- `app/frontend/app/(tabs)/home.tsx` — student home; already has "Minhas Listas" section; needs to filter by enrolled turmas when `turma_id` is set
- `app/frontend/app/(professor)/ListManager.tsx` — list management screen; needs turma picker
- `app/frontend/app/(professor)/CreateNewList.tsx` — list creation screen; needs turma association field
- `app/backend/statl/__init__.py` — blueprint registration and schema creation; new turmas blueprint goes here

### Email verification — existing implementation
- `app/backend/statl/services/email_service.py` — existing email sending logic
- `app/backend/statl/security/tokens.py` — existing JWT token generation (also used for password reset)
- `app/backend/statl/routes/auth.py` — existing register and login endpoints; verification gate goes here
- `app/backend/statl/models/user.py` — user model; `email_verified` flag (or equivalent) to add
- `app/frontend/app/(public)/register.tsx` — register screen; post-register state needs to show "check your email"

### Calendar — data source
- `app/frontend/app/(tabs)/profile.tsx` — student profile where calendar lives; currently has static streak display
- `app/backend/statl/routes/users.py` — `/users/historico` endpoint; calendar endpoint or extension goes here
- `app/backend/statl/models/answer_history.py` — canonical per-answer source for practice day data

### ProfessorMenu — UI entry point
- `app/frontend/app/(professor)/` — professor screens directory; new turma screens go here
</canonical_refs>
