# Phase 07: Data Integrity & Migration Refactor - Context

**Gathered:** 2026-04-12
**Status:** Ready for replanning

<domain>
## Phase Boundary

Make the question-import pipeline trustworthy and internally consistent for v1. This phase covers migration infrastructure, stable import identifiers, sequence-safe inserts, and removal of unsupported legacy ingestion paths.

This phase does **not** add new question capabilities. It clarifies the final shape of the supported question bank and removes migration/storage paths that are no longer part of v1.

</domain>

<decisions>
## Implementation Decisions

### Apostila question identity
- **D-01:** `migrate_apostila.py` must generate a stable `original_id` from **`hash(issue + correct_answer)`**.
- **D-02:** Do **not** use sequential synthetic IDs like `apostila-001`; ordering must not affect import identity.
- **D-03:** Do **not** use `issue LIKE` or any text-snippet heuristic for deduplication once this phase is implemented.

### Migration script structure
- **D-04:** `migrate_questoes.py` and `migrate_apostila.py` remain **independent entry points**.
- **D-05:** A shared `migration_utils.py` module must hold the common DB connection, upsert, and sequence-resync logic.
- **D-06:** A single mandatory `python -m statl.migrate_all` entry point is **not** required for v1.

### BCB removal from v1
- **D-07:** BCB/BACEN/CVM is **out of scope for v1** and must be removed from the supported migration surface.
- **D-08:** `migrate_bcb.py` must be deleted.
- **D-09:** BCB-specific taxonomy and legacy traces must be removed from the final supported model for this phase, including references such as the extra `Séries Temporais` chapter/topic when they exist only because of BCB import.
- **D-10:** This decision **supersedes** the earlier plan text that said “BCB data already imported stays in place”. The user’s latest decision is stricter: **tire BCB de tudo**.

### Canonical schema values
- **D-11:** The supported `source` enum for v1 remains the 7-value set already established in Phase 02: `vestibular`, `ENEM`, `lista`, `concurso`, `olimpíada`, `apostila`, `outro`.
- **D-12:** The canonical spelling is **`olimpíada`** with accent; any outdated `olimpiada` variant in docs, plans, or code should be corrected when touched by this phase.
- **D-13:** Difficulty scale remains unchanged for v1: `1 = fácil`, `2 = médio`, `3 = difícil`.

### the agent's Discretion
- Exact helper function names and module organization inside `migration_utils.py`
- Whether sequence resync is implemented as a dedicated helper or embedded in the shared upsert flow
- Whether BCB cleanup is implemented as explicit SQL cleanup, a migration utility, or a one-shot script, as long as the final supported v1 surface matches decisions D-07 through D-10

</decisions>

<specifics>
## Specific Ideas

- The user explicitly wants BCB removed more aggressively than the existing `07-02-PLAN.md` describes.
- The user explicitly approved the stricter interpretation of “tirar BCB de tudo”, not merely “stop importing new BCB data”.
- The current plans for Phase 07 were written before this clarification and should be treated as needing **replanning**, especially `07-02`.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope and superseded plan context
- `.planning/ROADMAP.md` — current roadmap definition for Phase 07 and DATA-01 / DATA-02 requirements
- `.planning/phases/07-data-integrity/07-01-PLAN.md` — original plan 01 assumptions and acceptance criteria
- `.planning/phases/07-data-integrity/07-02-PLAN.md` — original plan 02 text; parts of it are now superseded by this context, especially the BCB retention assumption
- `.planning/phases/07-data-integrity/07-01-SUMMARY.md` — what was already executed in 07-01 and should not be reopened unnecessarily

### Prior decisions that still apply
- `.planning/PROJECT.md` — project constraints and v1 boundaries
- `.planning/phases/02-question-bank-expansion/02-CONTEXT.md` — canonical `source` enum and normalization rules that still apply here
- `.planning/phases/06-polish-release-turmas/06-CONTEXT.md` — latest stable product context before this data-integrity phase

### Current code surface
- `app/backend/statl/migrate_questoes.py` — SQLite import path to be refactored onto shared utilities
- `app/backend/statl/migrate_apostila.py` — hardcoded apostila import path to be refactored and given hashed `original_id`
- `app/backend/statl/migrate_bcb.py` — legacy importer to delete
- `app/backend/statl/undo_bcb.py` — existing BCB cleanup logic to audit or adapt if useful
- `app/backend/statl/models/questions.py` — canonical question / alternative schema and constraints
- `app/backend/statl/__init__.py` — bootstrap-time schema hardening and integration point for any incremental cleanup
- `app/backend/statl/services/questions_service.py` — current canonical `_FONTES_VALIDAS` set containing `olimpíada`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `app/backend/statl/__init__.py` already contains PostgreSQL incremental schema hardening hooks; this is the existing place for one-shot cleanup logic when needed.
- `app/backend/statl/undo_bcb.py` already encodes how BCB content was identified and removed in older workflows; it is the first place to inspect before inventing new cleanup logic.

### Established Patterns
- Import scripts are standalone `python -m statl.migrate_*` entry points and already read `DATABASE_URL` from `.env`.
- Phase 07-01 already hardened uniqueness at the DB layer; Phase 07-02 should build on that instead of re-solving it.
- The canonical source enum is already enforced in `questions_service.py`; this phase should align migration infrastructure and docs to that existing contract.

### Integration Points
- `migrate_questoes.py` still needs shared helpers and sequence-safe chapter/topic handling.
- `migrate_apostila.py` still needs to replace snippet-based question dedup with hashed `original_id`.
- BCB references exist in code, docs, roadmap-adjacent planning files, and cleanup scripts; the replanned phase needs a coherent strategy for removing them from the supported v1 surface.

</code_context>

<deferred>
## Deferred Ideas

- A future convenience wrapper like `python -m statl.migrate_all` can be considered later, but it is not required for this phase.
- Any future reintroduction of Certo/Errado / BCB-style questions should be treated as a separate phase with its own schema and UX discussion, not piggybacked onto this v1 cleanup.

</deferred>

---

*Phase: 07-data-integrity*
*Context gathered: 2026-04-12*
