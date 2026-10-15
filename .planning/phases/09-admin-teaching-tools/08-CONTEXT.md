# Phase 9: Admin Teaching Tools & Ano de Ingresso — Context

**Gathered:** 2026-04-12
**Status:** Planned (awaiting Phase 8 completion)

<domain>
## Phase Boundary

Extend teaching capabilities to the admin role and add an enrollment-year field to the student directory.

Specifically:
- Admin gains a "Turmas" button in the admin menu with full CRUD (mirrors professor's TurmaManager/TurmaEditor from Phase 6)
- Admin gains a "Criar Lista" button with a full question tableview picker (filters + manual row selection)
- The `users` table gains an `ano_ingresso` (nullable int) column; the turma editor (professor and admin) exposes it as a client-side filter when selecting students to enroll
- The `ano_ingresso` field is a **placeholder in this phase** — existing users will have `null`; collecting the value at registration is deferred

This phase does NOT redesign auth, add new question types, or touch gamification.
</domain>

<decisions>
## Implementation Decisions

### Admin Turma Management
- **D-01:** Admin's turma screens are separate files (`AdminTurmaManager`, `AdminTurmaEditor`) rather than reusing the professor screens, because admin may need to see turmas across all professors in the future. For v1, admin sees only turmas they created — same scoping as professor. This can be relaxed later without a breaking change.
- **D-02:** Admin turma management is accessed from a new "Turmas" card/button in the existing `AdminMenu` screen, consistent with how professor accesses it from the listas tab.
- **D-03:** Enrollment flow is identical to professor: `GET /users/alunos` lists all students; admin taps to toggle enrollment; `POST /turmas/<id>/students` persists.

### Ano de Ingresso Filter
- **D-04:** `ano_ingresso` is added as a nullable `Integer` column on the `users` table via a new migration. Default is `null` for existing rows. No backfill.
- **D-05:** `GET /users/alunos` response includes `ano_ingresso` in each student object (null if not set).
- **D-06:** The turma editor (both professor and admin) renders a text input labeled "Filtrar por ano de ingresso" above the student list. Filtering is **client-side only** — no backend changes needed for the filter itself. When the input is blank, all students are shown. When a year is entered, the list shows only students whose `ano_ingresso` matches.
- **D-07:** The register screen receives a new optional field "Ano de ingresso" — it is shown in the UI but not required/validated in v1. A blank submission sets `ano_ingresso = null`. The field label should hint it will be used for class management.
- **D-08:** Professor's existing `TurmaEditor` screen is updated to include the filter input (same pattern as admin version).

### Admin Lista Creation
- **D-09:** Admin's list creation screen is a new `AdminCreateList` screen that mirrors `CreateNewList` from the professor flow. It reuses the same API endpoints (`POST /lists`, `PUT /lists/<id>`, `POST /lists/<id>/publish`) — admin JWT is already accepted by those endpoints if `@require_role` allows admin.
- **D-10:** The question picker inside AdminCreateList is a scrollable tableview (FlatList) of all questions from `GET /questions/filtered` (no `num` cap — returns full set). Each row shows: question id, abbreviated issue text, chapter, topic, difficulty chip, source chip. A checkbox on each row toggles selection.
- **D-11:** Filter bar above the tableview: chapter dropdown (from `GET /questions/chapters`), difficulty selector (Fácil/Médio/Difícil), source selector (existing enum). Filters are applied client-side against the already-loaded question list.
- **D-12:** Admin-created lists can optionally target a turma (same `turma_id` picker as professor). Null means visible to all alunos.
- **D-13:** Admin's list creation is accessed from a new "Criar Lista" button in `AdminMenu`, separate from "Gerenciar Questões".

### Backend Role Access
- **D-14:** Check `@require_role` guards on `/turmas` and `/lists` endpoints. Admin role must be included alongside professor. If not already, add `['admin', 'professor']` to the decorator. No new endpoints needed.

### Claude's Discretion
- Visual treatment of the question tableview rows (compact vs. expanded, truncation length).
- Whether the ano de ingresso input uses a numeric keyboard or plain text.
- Whether AdminCreateList and CreateNewList share a common component or are kept separate files.
- Exact placement of "Turmas" and "Criar Lista" within AdminMenu — between or after existing entries.
- Loading state for the question tableview (spinner vs. skeleton rows).
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Roadmap and scope
- `.planning/ROADMAP.md` — Phase 8 goal, requirements (TUR-03, TUR-04, LIST-08), success criteria
- `.planning/PROJECT.md` — product constraints and v1 non-goals
- `.planning/STATE.md` — current milestone status

### Turmas — existing backend (Phase 6)
- `app/backend/statl/routes/turmas.py` — CRUD + `/turmas/<id>/students` endpoints (from 06-04)
- `app/backend/statl/services/turmas_service.py` — business logic
- `app/backend/statl/repositories/turmas_repository.py` — SQL queries
- `app/backend/statl/models/turmas.py` — ORM model (`Turma`, `TurmaAluno`)

### Turmas — existing frontend (Phase 6)
- `app/frontend/app/(professor)/TurmaManager.tsx` — professor turma list screen (06-05)
- `app/frontend/app/(professor)/TurmaEditor.tsx` — professor enrollment editor (06-05); needs ano de ingresso filter added

### Lists — existing implementation
- `app/backend/statl/routes/lists.py` — list CRUD; verify `@require_role` includes admin
- `app/backend/statl/services/lists_service.py` — list business logic
- `app/frontend/app/(professor)/CreateNewList.tsx` — professor list creation screen; reference for AdminCreateList

### Admin menu entry point
- `app/frontend/app/(admin)/AdminMenu.tsx` — admin home screen; new buttons go here

### User model — ano de ingresso
- `app/backend/statl/models/user.py` — add `ano_ingresso = db.Column(db.Integer, nullable=True)`
- `app/backend/statl/routes/users.py` — `GET /users/alunos`; add `ano_ingresso` to response
- `app/frontend/app/(public)/register.tsx` — add optional ano de ingresso input
</canonical_refs>
