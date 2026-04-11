---
phase: 04-professor-lists
plan: "01"
subsystem: api
tags: [flask, sqlalchemy, postgres, sqlite, professor-lists, submissions]
dependency_graph:
  requires: [01-04, 02-03]
  provides:
    - lists-blueprint
    - list-submission-contracts
    - professor-results-payloads
  affects: [04-02, 04-03, 04-04, phase-5]
tech_stack:
  added: []
  patterns:
    - incremental schema bootstrap for new list tables
    - repository-service-route split for list lifecycle operations
key_files:
  created:
    - app/backend/statl/models/listas.py
    - app/backend/statl/repositories/lists_repository.py
    - app/backend/statl/services/lists_service.py
    - app/backend/statl/routes/lists.py
    - app/backend/statl/tests/test_lists.py
  modified:
    - app/backend/statl/__init__.py
    - app/backend/statl/repositories/questions_repository.py
key_decisions:
  - "List status is computed on read from the deadline and submission timestamps instead of relying on a background job, so expired lists become encerrada automatically in both professor and student views."
  - "Professor analytics, assigned-list feed, start flow, and submission flow shipped in the same blueprint so the frontend can stay on a single /lists contract."
requirements_completed: [LIST-01, LIST-04, LIST-05, LIST-06, LIST-07]
metrics:
  duration: "~40min"
  completed: "2026-04-11"
  tasks_completed: 2
---

# Phase 04 Plan 01: List Backend Foundation Summary

**Phase 4 now has a dedicated backend for authored lists, ordered questions, student submissions, professor review, and deadline-aware status handling.**

## What Was Built

- Added new SQLAlchemy models and incremental schema bootstrap for `lists`, `list_questions`, `list_submissions`, `list_submission_answers`, and `list_change_log`.
- Registered a `/lists` blueprint with professor CRUD/publish endpoints plus student endpoints for assigned-list feed, list start, question payload retrieval, submission, and personal result lookup.
- Implemented professor analytics payloads with per-student completion rows, average score, per-question error rates, and change-log history.
- Extended the question repository with ordered question hydration so authored lists preserve professor-defined question order.

## Verification

- `python -m pytest statl/tests/test_lists.py -q --tb=short` -> passed
- `python -m pytest statl/tests/test_auth.py statl/tests/test_questions_auth.py statl/tests/test_gamification.py statl/tests/test_lists.py -q --tb=short` -> 21 passed

## Deviations from Plan

None. The backend foundation shipped with the full list lifecycle and analytics payloads the later UI plans depend on.
