---
phase: 07-data-integrity
plan: "02"
subsystem: question-bank-integrity
tags: [data-integrity, migrations, questions, alternatives, original-id]
dependency_graph:
  requires: [07-01]
  provides: [migration-utils, deterministic-apostila-identity, bcb-removal]
  affects: [migrate_questoes, migrate_apostila]
tech_stack:
  added: []
  patterns: [shared-migration-helpers, content-hash-original-id]
key_files:
  created:
    - app/backend/statl/utils/migration_utils.py
  modified:
    - app/backend/statl/migrate_questoes.py
    - app/backend/statl/migrate_apostila.py
    - app/backend/statl/tests/test_data_integrity.py
  deleted:
    - app/backend/statl/migrate_bcb.py
decisions:
  - key: apostila-original-id-contract
    summary: "original_id = 'apostila__' + sha256(issue.strip() + '|' + correct_answer.strip().upper())[:32], replacing the fragile issue-LIKE-snippet dedup"
  - key: chapter-topic-lookup-by-name
    summary: migrate_questoes.py no longer inserts chapters/topics with explicit source IDs; it resolves/creates them by (name, number) via get_or_create_chapter/get_or_create_topic, avoiding sequence collisions on a fresh DB
  - key: undo_bcb-already-absent
    summary: undo_bcb.py and the "Séries Temporais" BCB taxonomy were already removed in an earlier session; no neutral cleanup_legacy_question_bank.py was needed since there was nothing left to clean
metrics:
  completed_date: "2026-07-25"
  tasks_completed: 3
  files_changed: 5
---

# Phase 07 Plan 02: Migration Layer Unification Summary

**One-liner:** `migrate_questoes.py` and `migrate_apostila.py` now share `migration_utils.py` for engine setup, taxonomy upsert, and idempotent question/alternative inserts; the apostila importer uses a deterministic content-hash `original_id` instead of text-snippet dedup; `migrate_bcb.py` is deleted.

## What Was Built

### `app/backend/statl/utils/migration_utils.py` (new)

- `get_engine()` — loads `.env` and builds the SQLAlchemy engine from `DATABASE_URL`
- `content_hash(issue, correct_answer, prefix="")` — deterministic `sha256(issue.strip() + "|" + correct_answer.strip().upper())[:32]`, optionally prefixed
- `get_or_create_chapter(conn, *, name, number)` / `get_or_create_topic(conn, *, name, chapter_id)` — lookup-by-identity, create if missing
- `upsert_question(conn, payload)` — `ON CONFLICT (original_id) DO NOTHING`, returns `(id, was_inserted)`
- `upsert_alternatives(conn, question_id, alternatives)` — `ON CONFLICT (question_id, letter) DO NOTHING`

### `migrate_questoes.py`

- No longer inserts chapters/topics with explicit SQLite IDs — resolves/creates them by name via the shared helpers, removing the sequence-collision risk on a fresh database
- Explicitly writes `source='outro'` on every imported question (previously left `NULL`)
- Keeps `_build_import_original_id()` unchanged (still covered by its existing regression test)

### `migrate_apostila.py`

- Replaced `issue LIKE :snippet` dedup with `content_hash(issue, correct_answer, prefix="apostila__")`
- Existing 81 apostila/concurso-sourced rows in the live DB were backfilled with this same hash so they're recognized as already-imported going forward
- One row that the old snippet-based dedup had incorrectly merged with a near-duplicate stem was recovered as a distinct question

### Removed

- `migrate_bcb.py` deleted (no remaining references). `undo_bcb.py` and the BCB-specific "Séries Temporais" taxonomy were already gone from an earlier session — verified live (`chapters` table has exactly the 4 canonical entries) — so no neutral replacement script was needed.

## Verification

### Idempotency (the actual point of this phase)

Tested against a disposable throwaway Postgres database (never against the live DB a second time, after an earlier mistake — see below):

```
migrate_questoes  run 1: 346 imported, 10 already existed
migrate_questoes  run 2: 0 imported, 356 already existed
migrate_apostila  run 1: 81 imported, 0 already existed
migrate_apostila  run 2: 0 imported, 81 already existed
```

### ⚠️ Incident during this work

Running `migrate_questoes.py` against the **live** database (to sanity-check it) re-imported 277 rows that had been intentionally deleted in an earlier cleanup session (broken/duplicate questions with no recoverable alternatives). This is expected behavior for an idempotent *source* importer — it has no memory of manual post-import deletions — but it was still a real regression. Fixed immediately by deleting the 277 reintroduced rows (`id > 327`, precisely matching the reimport count) and switching all further idempotency testing to a disposable database. Live count verified back at 218 afterward.

**Lesson recorded:** never re-run a full source migration against the live DB to "test" it — always test against a throwaway database.

### Backend test suite

```
pytest statl/tests/test_data_integrity.py -q  → 7 passed (3 pre-existing + 4 new)
pytest statl/tests/ -q                         → 84 passed
```

### Plan verification greps

All of `07-02-PLAN.md`'s automated `<verify>` blocks pass:
- shared helpers present in `migration_utils.py`
- no explicit-ID chapter/topic inserts in `migrate_questoes.py`
- `source` is written on every imported row
- no `issue LIKE` dedup remains in `migrate_apostila.py`
- `migrate_bcb.py` / `undo_bcb.py` do not exist
