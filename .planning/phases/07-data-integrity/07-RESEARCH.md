# Phase 07: Data Integrity & Migration Refactor - Research

**Researched:** 2026-04-12
**Domain:** backend migration scripts + question-bank cleanup
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from 07-CONTEXT.md)

### Locked Decisions

- **D-01:** `migrate_apostila.py` must generate a stable `original_id` from `hash(issue + correct_answer)`.
- **D-02:** Sequential synthetic IDs such as `apostila-001` are not acceptable.
- **D-03:** `issue LIKE` snippet dedup is superseded and must be removed from the supported import flow.
- **D-04:** `migrate_questoes.py` and `migrate_apostila.py` remain independent entry points.
- **D-05:** Shared DB/upsert/taxonomy logic belongs in `app/backend/statl/utils/migration_utils.py`.
- **D-06:** A mandatory `migrate_all` wrapper is not required for v1.
- **D-07:** BCB/BACEN/CVM is out of scope for v1 and must be removed from the supported migration surface.
- **D-08:** `migrate_bcb.py` must be deleted.
- **D-09:** BCB-specific taxonomy and traces such as the extra `Séries Temporais` chapter/topic must not remain part of the supported v1 model.
- **D-10:** The stricter user decision is authoritative: remove BCB from everything, not merely stop importing new BCB data.
- **D-11:** The canonical source enum remains `vestibular`, `ENEM`, `lista`, `concurso`, `olimpíada`, `apostila`, `outro`.
- **D-12:** The canonical spelling is `olimpíada`.
- **D-13:** The difficulty scale remains `1=fácil`, `2=médio`, `3=difícil`.

### Claude's Discretion

- Exact helper boundaries inside `migration_utils.py`
- Whether sequence resync stays as a defensive helper even after explicit-ID inserts are removed
- Whether legacy unsupported-row cleanup is delivered as a neutral one-shot script or another non-BCB-branded path

### Deferred Ideas

- A convenience wrapper such as `python -m statl.migrate_all`
- Any future reintroduction of Certo/Errado / BCB-style questions

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DATA-02 | Migration script unification: shared utilities, `migrate_bcb.py` deleted, apostila hash-based `original_id`, sequence corruption removed | Verified directly in current importers, source-normalization script, and BCB cleanup/import surface |

</phase_requirements>

---

## Summary

Phase 07-01 already hardened the schema at the database layer. The remaining work for Phase 07 is narrower: finish `DATA-02` by making the two supported importers self-contained and removing BCB from the supported backend surface.

The codebase is close, but not finished. `migrate_questoes.py` already protects against duplicate SQLite `original_id` values by disambiguating them with the SQLite row ID, yet it still inserts chapters and topics with explicit IDs, leaves imported questions with `source=NULL`, and keeps a redundant existence query before an `ON CONFLICT` alternative insert. `migrate_apostila.py` still deduplicates by `issue LIKE` and does not persist `original_id`, so a fresh database still depends on a later repair step to converge to the canonical source contract.

**Primary recommendation:** implement a shared `migration_utils.py`, keep the two import entry points independent, preserve the existing duplicate-`original_id` protection in `migrate_questoes.py`, move apostila identity to a deterministic hash of `issue + correct_answer`, and replace the BCB-branded importer/cleanup surface with deletion or a neutral legacy-cleanup path. That completes `DATA-02` without reopening the work already finished in `07-01`.

---

## Verified Findings

### 1. `migrate_questoes.py` already solved one hard problem, but still leaks structural debt

Verified in [app/backend/statl/migrate_questoes.py](/home/danielar/Desktop/staticlass/app/backend/statl/migrate_questoes.py:1):

- `_build_import_original_id()` already turns duplicate SQLite `original_id` values into unique import keys such as `foo__sqlite_123`.
- Question insertions now use `ON CONFLICT (original_id) DO NOTHING`, which aligns with the 07-01 uniqueness hardening.
- Chapters and topics are still inserted with explicit IDs:
  - `INSERT INTO chapters (id, name, number) ...`
  - `INSERT INTO topics (id, name, chapter_id) ...`
- Alternatives still do a redundant `SELECT id FROM alternatives ...` before an insert that already uses `ON CONFLICT`.
- Imported SQLite questions still omit `source`, which means fresh imports can land with `source=NULL`.

Implication:
- The duplicate-`original_id` fix from 07-01 should be preserved.
- The remaining refactor target is the taxonomy/sequence/source path, not the question-identity logic already added here.

### 2. `migrate_apostila.py` is still the weakest importer

Verified in [app/backend/statl/migrate_apostila.py](/home/danielar/Desktop/staticlass/app/backend/statl/migrate_apostila.py:1):

- The script is a standalone hardcoded importer with a large `QUESTIONS` list.
- It still deduplicates by a text-snippet heuristic (`issue LIKE ...`) instead of a stable identifier.
- It does not persist `original_id`.
- It depends on the database already being in the right taxonomy/sequence state when it runs.

Implication:
- `migrate_apostila.py` is the correct place to introduce deterministic hash-based `original_id`.
- The helper layer should remove its dependence on fragile text matching and external sequence state.

### 3. Fresh imports still rely on post-import repair to normalize `source`

Verified in [app/backend/statl/migrate_source_enum.py](/home/danielar/Desktop/staticlass/app/backend/statl/migrate_source_enum.py:1) and [app/backend/statl/services/questions_service.py](/home/danielar/Desktop/staticlass/app/backend/statl/services/questions_service.py:25):

- `migrate_source_enum.py` currently patches three legacy cases after the fact:
  - `NULL -> 'outro'`
  - `'avulsa' -> 'outro'`
  - `'enem' -> 'ENEM'`
- `_FONTES_VALIDAS` already uses the canonical set including `olimpíada`.
- `migrate_questoes.py` still produces `source=NULL` on a fresh database today.

Implication:
- The import pipeline is not yet self-contained.
- `migrate_questoes.py` should write canonical `source='outro'` during import so a fresh DB no longer requires `migrate_source_enum.py` just to become valid.

### 4. BCB cleanup knowledge exists, but the current surface conflicts with the new phase context

Verified in [app/backend/statl/undo_bcb.py](/home/danielar/Desktop/staticlass/app/backend/statl/undo_bcb.py:1):

- The existing cleanup script already knows how to identify unsupported legacy rows:
  - questions with `correct_answer='?'`
  - Certo/Errado rows without alternatives
  - rows under the `Séries Temporais` chapter
- It also removes the `Séries Temporais` chapter and its topics.

Implication:
- The SQL heuristics are useful.
- The BCB-branded command surface is not. If cleanup remains necessary, it should be ported to a neutral one-shot path and the old BCB-named script should disappear.

### 5. Remaining BCB references are narrowly scoped

Verified with repo grep:

- `migrate_bcb.py` contains the importer and taxonomy creation for `Séries Temporais`.
- `undo_bcb.py` contains the removal heuristics.
- No other runtime files in `app/backend/statl` still expose `BCB`, `BACEN`, or `CVM`.
- No remaining `olimpiada` typo was found in the touched backend surface; the canonical spelling already in code is `olimpíada`.

Implication:
- The cleanup blast radius is manageable.
- Deleting or neutralizing those two files is sufficient to remove the BCB-specific surface from the backend runtime.

---

## Recommended Execution Shape

### Pattern 1: Shared migration utility layer

Create `app/backend/statl/utils/migration_utils.py` with shared helpers for:

- engine creation from `DATABASE_URL`
- stable content-hash generation constrained to `questions.original_id` length
- chapter/topic get-or-create by canonical names, not explicit IDs
- idempotent question upsert by `original_id`
- idempotent alternative insert with `ON CONFLICT`
- optional defensive sequence resync if needed for legacy repair, not as a permanent requirement

This keeps `migrate_questoes.py` and `migrate_apostila.py` independent while eliminating duplicated SQL and sequence assumptions.

### Pattern 2: Preserve questoes-specific duplicate-source protection

The `_build_import_original_id()` behavior in `migrate_questoes.py` should survive the refactor. It is already the correct answer for duplicated `original_id` values in the SQLite source and should not be simplified away when utilities are extracted.

Recommendation:
- keep the function local to `migrate_questoes.py`, or move it only if the semantics remain identical
- treat it as import-source-specific logic, not a generic helper

### Pattern 3: Hash-based apostila identity within 50 characters

The schema uses `String(50)` for `questions.original_id`, so the hash format must fit that limit.

Recommended format:

```text
apostila__{sha256(issue + "|" + correct_answer)[:32]}
```

Why this shape:
- deterministic across runs
- independent of list order
- includes answer key in the identity as required by the user decision
- fits within 50 characters

### Pattern 4: Neutral legacy cleanup instead of BCB-branded commands

If legacy unsupported-row removal is still required after deleting `migrate_bcb.py`, keep the behavior but remove the branding.

Recommended path:
- delete `migrate_bcb.py`
- delete `undo_bcb.py`
- if cleanup must remain available, replace it with a neutral one-shot script such as `cleanup_legacy_question_bank.py`
- keep the CLI/docstring generic and describe the rows as unsupported legacy question shapes, not as BCB data

---

## No New Dependencies

The work can be completed with the existing stack:

- `sqlalchemy`
- `dotenv`
- standard-library `hashlib`
- existing backend test harness in `app/backend/statl/tests`

No package changes are required.

---

## Risks To Watch During Execution

1. Refactoring taxonomy inserts from explicit IDs to name-based upserts must not silently remap existing SQLite questions to the wrong topic. The plan should preserve the SQLite source-to-destination topic mapping by using chapter/topic names, not source IDs, as the stable contract.
2. If a neutral cleanup script replaces `undo_bcb.py`, the new implementation must remain idempotent and must not remove valid multiple-choice questions that merely happen to have unusual answer keys.
3. Tests should verify fresh-import behavior, not only incremental behavior. The core regression here is "fresh DB ends up valid without a repair pass."
