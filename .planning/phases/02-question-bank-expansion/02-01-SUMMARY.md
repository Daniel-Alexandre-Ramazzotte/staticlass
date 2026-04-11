---
plan: 02-01
phase: 02-question-bank-expansion
status: complete
tasks_completed: 2
tasks_total: 2
---

# Plan 02-01 Summary: Backend Source Enum Update

## What Was Built

Updated the backend source enum from 5 old values to 7 canonical values, fixed ENEM casing normalization, added professor submission default, and created an idempotent data migration script.

## Key Files

### Modified
- `app/backend/statl/services/questions_service.py` — Updated `_FONTES_VALIDAS` to 7 values, added `_FONTE_PADRAO_PROFESSOR = "lista"`, rewrote `_normalizar_fonte` with `default` param and ENEM case normalization

### Created
- `app/backend/statl/migrate_source_enum.py` — Idempotent migration script with 3 UPDATE statements

## Decisions Made

- `_normalizar_fonte` now accepts a `default` kwarg — returns `default` when value is blank, allowing professor submissions to default to `'lista'` without affecting migration/test calls
- ENEM normalization uses `v.lower() == "enem"` check before allowlist validation to accept both casings from old clients
- Migration script follows `migrate_apostila.py` pattern (Flask app context, `db.session.execute(text(...))`)

## Verification

- `_normalizar_fonte('enem')` → `'ENEM'` ✓
- `_normalizar_fonte(None, default='lista')` → `'lista'` ✓
- `_normalizar_fonte('avulsa')` → raises `ValueError` ✓
- `grep -c "UPDATE questions" migrate_source_enum.py` → 3 ✓
- `python -m pytest statl/tests/ -x -q` → 13 passed ✓

## Notes

- Docker/MySQL was not running during execution — migration script must be run against production DB before Phase 2 goes live: `cd app/backend && python -m statl.migrate_source_enum`
- Script is idempotent: safe to run multiple times

## Commits

- `feat(02-01): update source enum to 7 canonical values`
- `feat(02-01): add idempotent source enum migration script`
