---
phase: 02-question-bank-expansion
plan: "03"
subsystem: frontend
tags: [ui, filters, sources, quiz]
dependency_graph:
  requires: []
  provides: [FONTES-7-values]
  affects: [app/frontend/app/(tabs)/questions.tsx, QuizInProgressScreen]
tech_stack:
  added: []
  patterns: [closed-constant-filter, chip-toggle]
key_files:
  modified:
    - app/frontend/src/components/CustomAccordion.tsx
decisions:
  - "FONTES ordering: Vestibular → ENEM → Concurso → Olimpíada → Lista → Apostila → Outro (per D-11 + discretion)"
  - "ENEM value kept uppercase to match backend MySQL enum (not normalized to lowercase)"
metrics:
  duration: "3m"
  completed: "2026-04-11"
  tasks_completed: 1
  files_changed: 1
---

# Phase 02 Plan 03: FONTES Constant Expansion Summary

**One-liner:** Expanded FONTES filter constant from 4 to 7 source values with uppercase ENEM fix matching backend MySQL enum.

## What Was Built

Updated the `FONTES` constant in `CustomAccordion.tsx` from a 4-entry array to the canonical 7-value list. The key fix was changing `value: 'enem'` (lowercase) to `value: 'ENEM'` (uppercase) so the source filter query parameter matches the backend's stored enum values in MySQL. Three new entries were added: Olimpíada, Lista, Outro.

## Task Outcomes

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Replace FONTES constant with 7-value array | 27b19cc | app/frontend/src/components/CustomAccordion.tsx |

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None.

## Threat Flags

None — source values flow from a closed UI constant; backend uses parameterized SQL. No new trust boundaries introduced.

## Self-Check: PASSED

- File exists: app/frontend/src/components/CustomAccordion.tsx — FOUND
- Commit 27b19cc — FOUND (git log confirms)
- FONTES has exactly 7 entries — VERIFIED (grep count = 7)
- value: 'ENEM' uppercase present — VERIFIED
- value: 'enem' lowercase absent — VERIFIED
- value: 'olimpíada' (accented) present — VERIFIED
