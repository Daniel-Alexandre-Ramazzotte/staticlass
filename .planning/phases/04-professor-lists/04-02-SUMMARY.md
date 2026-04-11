---
phase: 04-professor-lists
plan: "02"
subsystem: ui
tags: [react-native, expo-router, professor, question-picker, authoring]
dependency_graph:
  requires: [04-01, 02-02]
  provides:
    - professor-list-authoring
    - shared-question-picker
    - publish-workflow
  affects: [04-03, 04-04, phase-6]
tech_stack:
  added: []
  patterns:
    - shared question-browser component reused across professor and admin flows
    - route-param based question picker modes for authoring versus management
key_files:
  created:
    - app/frontend/app/(app)/QuestionPicker.tsx
    - app/frontend/src/components/questions/SharedQuestionViewer.tsx
  modified:
    - app/frontend/app/(tabs)/listas.tsx
    - app/frontend/app/(professor)/CreateNewList.tsx
    - app/frontend/app/(professor)/AddNewQuestion.tsx
    - app/frontend/app/(admin)/QuestaoViewer.tsx
key_decisions:
  - "Professor list composition no longer depends on the admin route tree; the picker lives under /(app) and is shared through a neutral component."
  - "Publishing and later edits both stay on the same CreateNewList screen so professors do not bounce between separate draft and management flows."
requirements_completed: [LIST-01, LIST-02, LIST-03]
metrics:
  duration: "~35min"
  completed: "2026-04-11"
  tasks_completed: 2
---

# Phase 04 Plan 02: Professor Authoring Workflow Summary

**Professors can now create, edit, publish, and revise lists through a dedicated authoring flow without touching the admin-only question manager.**

## What Was Built

- Added a new `/(app)/QuestionPicker` route that can operate in authoring mode for list composition or management mode for standalone professor question browsing.
- Extracted the reusable question browsing UI into `SharedQuestionViewer`, then rewired `QuestaoViewer` to consume it while retaining the admin SQL tab.
- Rebuilt `CreateNewList` around the real `/lists` API so list metadata, question selection, publish action, and change-log visibility all live in one professor-facing screen.
- Updated `AddNewQuestion` and the professor `listas` tab so the normal professor path returns to the shared picker instead of the admin namespace.

## Verification

- `npx expo lint 'app/(app)/QuestionPicker.tsx' 'app/(admin)/QuestaoViewer.tsx' 'app/(professor)/CreateNewList.tsx' 'src/components/questions/SharedQuestionViewer.tsx' 'app/(professor)/AddNewQuestion.tsx' 'app/(tabs)/listas.tsx'` -> passed
- `rg -F "Histórico de alterações" app/frontend/app/(professor)/CreateNewList.tsx` -> present

## Deviations from Plan

### Auto-fixed Issues

**1. [Route ownership] The existing list-authoring path was hard-wired to an admin screen**
- **Issue:** The previous professor workflow depended on `/(admin)/QuestaoViewer`, which mixed professor authoring with admin-only question management.
- **Fix:** Split the shared question-browser UI into `SharedQuestionViewer`, introduced `/(app)/QuestionPicker`, and left the admin SQL affordances only in the admin route.
- **Files modified:** `app/frontend/app/(admin)/QuestaoViewer.tsx`, `app/frontend/app/(app)/QuestionPicker.tsx`, `app/frontend/src/components/questions/SharedQuestionViewer.tsx`
