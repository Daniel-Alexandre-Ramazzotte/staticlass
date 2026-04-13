# Plan 06-04 Summary: Sistema de Turmas — Backend

**Status:** Complete
**Tasks:** 2/2

## What Was Built

### Task 1 — Turmas Backend (fa5f3e1)
- `app/backend/statl/models/turmas.py` — `Turma` + `TurmaAluno` ORM models
- `app/backend/statl/repositories/turmas_repository.py` — SQLite-compatible raw SQL (no RETURNING, no ANY())
- `app/backend/statl/services/turmas_service.py` — business logic with professor ownership checks
- `app/backend/statl/routes/turmas.py` — 7 endpoints under `/turmas` prefix
- `app/backend/statl/models/listas.py` — nullable `turma_id` FK added (D-03)
- `app/backend/statl/__init__.py` — blueprint registered, model imported, DDL added
- `app/backend/statl/repositories/lists_repository.py` — `list_assigned_lists` filters by turma enrollment (D-04)
- 22 tests passing; full suite 62/62 pass

### Task 2 — Professor Enrollment Picker (119213b)
- `GET /users/alunos` added to `routes/users.py`, protected by `@require_role(['professor'])`

## Endpoints Delivered

| Method | Route | Description |
|--------|-------|-------------|
| POST | /turmas | Create turma (professor only) |
| GET | /turmas | List professor's turmas |
| GET | /turmas/:id | Turma detail + enrolled students |
| POST | /turmas/:id/alunos | Enroll aluno |
| DELETE | /turmas/:id/alunos/:aluno_id | Unenroll aluno |
| DELETE | /turmas/:id | Delete turma |
| GET | /users/alunos | All aluno accounts for enrollment picker |

## Requirements Covered
D-01, D-02, D-03, D-04 (POL-03)

## Self-Check: PASSED
- All 62 backend tests pass
- SQLite-compatible (no RETURNING, no ANY())
- `GET /lists/assigned` filters by turma enrollment when turma_id is set
