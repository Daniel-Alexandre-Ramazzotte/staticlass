---
phase: 04-professor-lists
plan: "03"
subsystem: ui
tags: [react-native, expo-router, student, quiz, results, home]
dependency_graph:
  requires: [04-01]
  provides:
    - assigned-lists-home-feed
    - list-aware-quiz-flow
    - list-result-view
  affects: [04-04, phase-5, phase-6]
tech_stack:
  added: []
  patterns:
    - existing quiz and result screens extended through route params instead of duplicating screens
    - submission-view mode for read-only result revisits
key_files:
  modified:
    - app/frontend/app/(tabs)/home.tsx
    - app/frontend/app/(app)/QuizInProgressScreen.tsx
    - app/frontend/app/(app)/ResultScreen.tsx
key_decisions:
  - "The student list flow reuses the existing quiz shell, with `list_id`, `list_title`, and `list_mode` controlling whether the screen runs free practice or assigned-list behavior."
  - "ResultScreen supports both fresh submission and later read-only review so students can reopen a completed or late list without mutating server state."
requirements_completed: [LIST-04, LIST-05, LIST-07]
metrics:
  duration: "~30min"
  completed: "2026-04-11"
  tasks_completed: 3
---

# Phase 04 Plan 03: Student List Workflow Summary

**Students now see assigned lists on the home tab, complete them through the normal quiz flow, and revisit a deadline-aware result screen after submission.**

## What Was Built

- Reworked the aluno home tab to load `/lists/assigned`, render "Minhas Listas", and route each card into either an in-progress quiz or a read-only submission view.
- Extended `QuizInProgressScreen` so it can fetch list questions, call `/lists/:id/start`, preserve ordered authored questions, and carry list metadata forward to the result route.
- Extended `ResultScreen` so list completions submit through `/lists/:id/submit`, re-open through `/lists/:id/me`, and visibly mark late submissions.
- Kept gamification integration for fresh list submissions by recording the completed session after the list result is accepted.

## Verification

- `npx expo lint 'app/(tabs)/home.tsx' 'app/(app)/QuizInProgressScreen.tsx' 'app/(app)/ResultScreen.tsx'` -> passed
- `rg -F "Minhas Listas" app/frontend/app/(tabs)/home.tsx` -> present
- `rg -F "Fora do prazo" app/frontend/app/(app)/ResultScreen.tsx` -> present

## Deviations from Plan

None. The student list flow shipped on top of the existing quiz screens instead of forking a second quiz implementation.
