---
plan: 02-02
phase: 02-question-bank-expansion
status: complete
tasks_completed: 2
tasks_total: 2
subsystem: frontend
tags: [source-filter, professor-editor, question-management, ui]
dependency_graph:
  requires: [02-01]
  provides: [source-dropdown-editor, source-chip-filter, source-detail-display]
  affects: [AddNewQuestion, QuestaoViewer]
tech_stack:
  added: []
  patterns: [Modal dropdown, Pressable overlay, client-side chip filter]
key_files:
  created: []
  modified:
    - app/frontend/app/(professor)/AddNewQuestion.tsx
    - app/frontend/app/(admin)/QuestaoViewer.tsx
decisions:
  - "Task 2 targets QuestaoViewer.tsx (admin) not QuestionsManager.tsx — QuestionsManager was replaced in commit 84f1d1d; plan references the old file"
  - "ENEM value corrected from 'enem' to 'ENEM' in QuestaoViewer FONTES to align with backend _FONTES_VALIDAS (02-01)"
  - "FONTES_ADD in AddNewQuestion and FONTES in QuestaoViewer are kept as separate constants — AddNewQuestion uses Modal/Pressable pattern; QuestaoViewer uses TouchableOpacity chip pattern already in place"
metrics:
  duration: ~20min
  completed_date: "2026-04-11"
---

# Phase 02 Plan 02: Professor Source Editor + Source Filter Summary

## What Was Built

Source dropdown added to AddNewQuestion (add + edit flows) using Modal/Pressable pattern; FONTES constant in QuestaoViewer expanded from 4 to 7 canonical values with ENEM casing fix and fonte line added to question detail card.

## Key Files

### Modified

- `app/frontend/app/(professor)/AddNewQuestion.tsx` — Added `Modal`, `Pressable`, `ChevronDown` imports; `FONTES_ADD` constant (7 values); `source` field on `QuestionDetail` type; `fonte`/`fonteOpen` state; edit-load population of `fonte`; `source: fonte || undefined` in `salvar()` payload; Fonte dropdown field + modal overlay between Dificuldade and Resposta correta rows
- `app/frontend/app/(admin)/QuestaoViewer.tsx` — Added `source` field to `Questao` type; expanded `FONTES` from 4 to 7 values; fixed ENEM value from `'enem'` to `'ENEM'`; added `Fonte: {value}` line to `QuestaoVestibular` detail card

## Decisions Made

- Task 2 in the plan targeted `(professor)/QuestionsManager.tsx`, but that file was replaced by `(admin)/QuestaoViewer.tsx` in the commit prior to this phase (`84f1d1d Replace legacy QuestionsManager flow`). Applied all Task 2 intent to QuestaoViewer instead — same chip filter, same source display goal.
- QuestaoViewer already had `toggleS`, `fontes` state, and chip UI for source filtering (4 values). Only changes needed: expand to 7 values, fix ENEM casing, add `source` to type, add fonte line to detail card.
- `source: fonte || undefined` (not `null`) in salvar() — undefined means key absent from JSON, so backend `update_question_service` preserves existing source on edit without explicit change (per plan pitfall note).

## Verification

- `grep "FONTES_ADD" app/frontend/app/(professor)/AddNewQuestion.tsx` — matches
- `grep "fonte || undefined" app/frontend/app/(professor)/AddNewQuestion.tsx` — matches
- `grep "FONTES" app/frontend/app/(admin)/QuestaoViewer.tsx` — 7-entry constant present
- `grep "fontes.includes" app/frontend/app/(admin)/QuestaoViewer.tsx` — matches (chip bg + filter)
- `grep "Fonte:" app/frontend/app/(admin)/QuestaoViewer.tsx` — matches (detail card line)
- `npx tsc --noEmit` targeted at modified files — no errors in AddNewQuestion or QuestaoViewer

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] ENEM value casing mismatch in QuestaoViewer FONTES**
- **Found during:** Task 2
- **Issue:** Existing `FONTES` had `value: 'enem'` (lowercase), but backend `_FONTES_VALIDAS` (updated in 02-01) uses `'ENEM'`. Source filter chips would silently fail to match backend-stored values.
- **Fix:** Changed value to `'ENEM'` to match backend allowlist
- **Files modified:** `app/frontend/app/(admin)/QuestaoViewer.tsx`
- **Commit:** 212d4cb

**2. [Rule 3 - Blocking] Target file QuestionsManager.tsx not found**
- **Found during:** Task 2 setup
- **Issue:** Plan references `app/frontend/app/(professor)/QuestionsManager.tsx` which no longer exists — replaced by `(admin)/QuestaoViewer.tsx` in commit 84f1d1d
- **Fix:** Applied all Task 2 changes to `QuestaoViewer.tsx` — same intent (source chips, source type, source detail line)
- **Files modified:** `app/frontend/app/(admin)/QuestaoViewer.tsx`
- **Commit:** 212d4cb

## Known Stubs

None — source dropdown is fully wired: state initializes empty, edit flow populates from `q.source`, save flow sends `source: fonte || undefined`.

## Commits

- `5356de1 feat(02-02): add source dropdown to AddNewQuestion editor`
- `212d4cb feat(02-02): expand FONTES to 7 values and add source display in QuestaoViewer`

## Self-Check

Files exist:
- `app/frontend/app/(professor)/AddNewQuestion.tsx` — FOUND
- `app/frontend/app/(admin)/QuestaoViewer.tsx` — FOUND

Commits exist:
- `5356de1` — FOUND
- `212d4cb` — FOUND

## Self-Check: PASSED
