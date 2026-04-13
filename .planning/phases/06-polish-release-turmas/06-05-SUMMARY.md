---
phase: 06-polish-release-turmas
plan: "05"
subsystem: frontend-professor-turmas
tags: [turmas, professor, enrollment, ui, lists]
dependency_graph:
  requires: [06-04]
  provides: [turma-management-ui, turma-list-association]
  affects: [professor-flow, student-list-visibility]
tech_stack:
  added: []
  patterns: [useFocusEffect-load, Alert-picker, turma-toggle-enrollment]
key_files:
  created:
    - app/frontend/app/(professor)/TurmaManager.tsx
    - app/frontend/app/(professor)/TurmaEditor.tsx
  modified:
    - app/frontend/app/(tabs)/listas.tsx
    - app/frontend/app/(professor)/CreateNewList.tsx
    - app/backend/statl/repositories/lists_repository.py
    - app/backend/statl/services/lists_service.py
decisions:
  - key: alert-based-turma-picker
    summary: Used Alert.alert with button list for turma selection in CreateNewList (no external picker library needed)
  - key: turma-id-sentinel
    summary: Used "UNSET" sentinel string in update_list_service to distinguish explicit null (clear turma) from absent key (keep current turma)
metrics:
  duration_minutes: 35
  completed_date: "2026-04-12"
  tasks_completed: 2
  files_changed: 6
---

# Phase 06 Plan 05: Turmas Management UI Summary

**One-liner:** Professor turma CRUD UI with TurmaManager + TurmaEditor screens, enrollment toggle, and optional turma_id association in list authoring flow.

## What Was Built

### TurmaManager screen (`app/frontend/app/(professor)/TurmaManager.tsx`)
- Lists all professor turmas loaded from `GET /turmas` on screen focus
- Each card shows turma name, student count, "Gerenciar alunos" (→ TurmaEditor) and "Excluir" (with Alert confirm)
- "Nova turma" button at bottom: Alert.prompt for name → `POST /turmas` → refreshes list
- Empty state card when no turmas exist
- Pattern matches ListManager.tsx (XStack header, ScrollView, card layout, palette colors)

### TurmaEditor screen (`app/frontend/app/(professor)/TurmaEditor.tsx`)
- Receives `id` param (turma id) from TurmaManager navigation
- Loads `GET /turmas/<id>` and `GET /users/alunos` in parallel on focus
- Editable turma name field + "Salvar nome" → `PUT /turmas/<id>`
- Full aluno list with tap-to-toggle enrollment (green highlight + checkmark for enrolled rows)
- "Salvar matrículas" → `POST /turmas/<id>/students` with current enrolled_ids array

### listas.tsx Turmas button (D-05)
- Added "Turmas" AppButton (primaryBlue) between "Gerenciar Listas" and "Gerenciar Questões"
- Navigates to `/(professor)/TurmaManager` via `router.push`

### CreateNewList turma picker (D-06)
- Added `turmaId` and `turmas` state
- `useEffect` loads `GET /turmas` on mount
- `hydrateFromServer` reads `turma_id` from server response and sets state
- `persistDraft` and `handleSavePublishedChanges` both include `turma_id` in PUT payload
- Turma picker card shows between Metadados and Questões cards
- Selection via `Alert.alert` with "Sem turma (todos os alunos)" as first option (null) + turma list

### Backend turma_id passthrough fixes (Rule 2 — missing functionality)
Four changes were required to complete the data path:

1. **`lists_repository.get_professor_list_row`** — Added `l.turma_id` to SELECT so the field is available in the returned row
2. **`lists_repository.update_list_metadata`** — Extended to accept `turma_id` + `update_turma` flag; runs alternative UPDATE query including `turma_id = :turma_id` when flag is set
3. **`lists_service.update_list_service`** — Reads `turma_id` from request payload using "UNSET" sentinel to distinguish explicit null (clear turma) from absent key (keep current); passes through to repository
4. **`lists_service._serialize_professor_detail`** — Added `"turma_id": row["turma_id"]` to response so frontend can hydrate it on load

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical Functionality] Backend turma_id passthrough was entirely absent**
- **Found during:** Task 1 (Step 0 as specified in plan)
- **Issue:** `update_list_metadata` had no turma_id in SET clause; `get_professor_list_row` did not SELECT turma_id; `_serialize_professor_detail` did not return turma_id; `update_list_service` did not pass turma_id through
- **Fix:** Updated all four locations as described above
- **Files modified:** `lists_repository.py`, `lists_service.py`
- **Commit:** 9f3494d

## Known Stubs

None — turma_id flows from backend to frontend and back; enrollment filtering is enforced server-side (implemented in plan 06-04 via `list_assigned_lists` SQL with `turma_id IS NULL OR EXISTS (SELECT 1 FROM turma_alunos ...)` predicate).

## Threat Flags

None — all new surface (GET /turmas, POST /turmas/:id/students) is gated by `@require_role(["professor"])` from plan 06-04. Student turma filter enforcement is server-side SQL (plan 06-04). `GET /users/alunos` accepted per T-06-05-02 disposition.

## Checkpoint: Human Verification Required

Task 2 automation is complete. The following manual E2E verification steps are needed:

**Professor flow:**
1. Login as professor → Listas tab → "Turmas" button visible
2. Tap "Turmas" → TurmaManager loads with empty state
3. Tap "Nova turma" → enter name → turma appears in list
4. Tap "Gerenciar alunos" → TurmaEditor loads all registered alunos
5. Tap alunos to enroll → "Salvar matrículas" → alert confirms
6. Go back → "Criar lista" → select turma in picker → Publish

**Student flow:**
7. Enrolled aluno → Home → sees the turma-targeted list
8. Non-enrolled aluno → Home → does NOT see the turma-targeted list
9. List with no turma (turma_id=null) → visible to all alunos

## Self-Check: PASSED

- FOUND: app/frontend/app/(professor)/TurmaManager.tsx
- FOUND: app/frontend/app/(professor)/TurmaEditor.tsx
- FOUND: .planning/phases/06-polish-release-turmas/06-05-SUMMARY.md
- FOUND: commit 9f3494d (feat(06-05): TurmaManager + TurmaEditor screens and backend turma_id passthrough)
- FOUND: commit 9a899fc (feat(06-05): wire Turmas button in listas.tsx and turma picker in CreateNewList)
