---
phase: 07-data-integrity
plan: "01"
subsystem: question-bank-integrity
tags: [data-integrity, migrations, questions, alternatives, original-id]
dependency_graph:
  requires: []
  provides: [questions-original-id-guard, alternatives-unique-guard, idempotent-imports]
  affects: [migrate_questoes, migrate_apostila, migrate_bcb, backend-bootstrap]
tech_stack:
  added: []
  patterns: [postgresql-dedup-ddl, unique-constraint-hardening, sqlite-rerun-verification]
key_files:
  created:
    - app/backend/statl/tests/test_data_integrity.py
  modified:
    - app/backend/statl/__init__.py
    - app/backend/statl/models/questions.py
    - app/backend/statl/migrate_questoes.py
    - app/backend/statl/migrate_apostila.py
    - app/backend/statl/migrate_bcb.py
decisions:
  - key: duplicate-original-id-disambiguation
    summary: Duplicate source `original_id` values from `questoes.db` are now disambiguated as `{original_id}__sqlite_{row_id}` so distinct source rows no longer collapse into one imported question
  - key: live-schema-hardening
    summary: Production/dev PostgreSQL is hardened at startup by deduplicating legacy rows first and only then adding DB-level UNIQUE constraints
metrics:
  completed_date: "2026-04-12"
  tasks_completed: 5
  files_changed: 6
---

# Phase 07 Plan 01: Data Integrity Hardening Summary

**One-liner:** Hardened question-bank integrity at the DB and migration layers so duplicate alternatives and duplicate `original_id` rows cannot be silently reintroduced.

## Audit Findings

- Local PostgreSQL before the fix had **0 duplicate `(question_id, letter)` pairs** and **0 duplicate `questions.original_id` values**, but it also had **no DB-level UNIQUE guard** for either case.
- Source SQLite (`banco_questoes/questoes.db`) had **70 duplicated `original_id` groups** and **4 duplicate `(question_id, letter)` pairs**, all on SQLite question `46` (`A/B/C/D` duplicated).
- This means the integrity bug was primarily **structural and source-driven**, not a current PostgreSQL data-corruption incident.

## What Was Built

### Model-level integrity guards

- Added `uq_questions_original_id` on `questions.original_id`
- Added `uq_alternative_question_letter` on `alternatives(question_id, letter)`

These now exist both in SQLAlchemy metadata and in the live PostgreSQL schema.

### PostgreSQL startup hardening

`app/backend/statl/__init__.py` now:

- removes legacy duplicate alternatives while keeping the lowest `id`
- disambiguates any legacy duplicate `original_id` rows as `__legacy_{id}`
- adds the two UNIQUE constraints only after the data is clean

This makes old environments converge safely instead of failing during boot.

### Migration hardening

`migrate_questoes.py` now:

- detects duplicate `original_id` values in the SQLite source
- generates deterministic import keys for those collisions using the SQLite row id
- inserts questions with `ON CONFLICT (original_id) DO NOTHING`
- inserts alternatives with `ON CONFLICT (question_id, letter) DO NOTHING`

`migrate_apostila.py` now:

- keeps the existing question-dedup strategy for now
- inserts alternatives with `ON CONFLICT (question_id, letter) DO NOTHING`

`migrate_bcb.py` now:

- inserts questions with `ON CONFLICT (original_id) DO NOTHING`

## Verification

### Backend test suite

- `PYTHONPATH=. pytest -q statl/tests/test_data_integrity.py` → **3 passed**
- `PYTHONPATH=. pytest -q statl/tests` → **75 passed**

### Live PostgreSQL checks

Applied manually on the running local DB:

- dedup alternatives query → `DELETE 0`
- legacy `original_id` disambiguation → `UPDATE 0`
- `ALTER TABLE ... ADD CONSTRAINT uq_alternative_question_letter` → success
- `ALTER TABLE ... ADD CONSTRAINT uq_questions_original_id` → success

Post-checks:

- duplicate alternatives in PostgreSQL → `0`
- duplicate `original_id` in PostgreSQL → `0`
- `pg_constraint.uq_alternative_question_letter` exists → `1`
- `pg_constraint.uq_questions_original_id` exists → `1`

### Rerun verification on disposable SQLite target

Because this environment blocks local Python access to the Docker PostgreSQL network and the backend image does not include `/banco_questoes`, rerun verification used a disposable SQLite target for the import logic itself.

`migrate_questoes.py`

- first run → `346 importadas, 10 já existiam`, `1015 alternativas importadas`
- second run → `0 importadas, 356 já existiam`, `0 alternativas importadas, 1015 puladas`

`migrate_apostila.py`

- first run → `80 questões inseridas, 1 pulada`
- second run → `0 questões inseridas, 81 puladas`

Final disposable DB state:

- `questions` → `426`
- `alternatives` → `1389`
- duplicate alternatives → `0`
- duplicate `original_id` → `0`

## Known Limits / Follow-up

- `migrate_apostila.py` still uses the legacy `issue LIKE` dedup for question rows; this is intentionally deferred to **07-02**
- `migrate_bcb.py` compiled and received the new `ON CONFLICT` path, but full rerun verification against PostgreSQL was not possible in this environment because the source dataset is not present inside the backend image
- `07-02` should now focus on discussion + shared utilities/unification only, not on re-fixing integrity guards already closed here
