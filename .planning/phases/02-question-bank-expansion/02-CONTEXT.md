# Phase 2: Question Bank Expansion - Context

**Gathered:** 2026-04-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Add `source` metadata to questions (which exam/origin they come from) and expose it as a filter for both professors and students. This phase does NOT add new question content — it classifies existing questions and enables navigation by source.

</domain>

<decisions>
## Implementation Decisions

### Source enum values
- **D-01:** Final enum (7 values): `vestibular`, `ENEM`, `lista`, `concurso`, `olimpíada`, `apostila`, `outro`
- **D-02:** Migration mapping: `avulsa` → `outro`; `NULL` → `outro`; `apostila` stays as-is; `concurso` stays as-is; `vestibular`/`enem` stay as-is (normalize `enem` → `ENEM` case)
- **D-03:** Backend validation: reject any `source` value not in the enum above; raise ValueError with the valid list

### Professor question editor (AddNewQuestion / update form)
- **D-04:** Source field is **optional** in the form — if left blank by the professor, backend defaults to `lista` (not `outro`)
- **D-05:** UI element: **dropdown/picker** (not chips) — even though difficulty uses chips, source gets a dropdown because 7 options would crowd the form
- **D-06:** Source must be visible and editable in both the add-new-question form and the edit/update view

### QuestionsManager professor filter
- **D-07:** Source filter is **client-side** — applied to the already-loaded question list via the existing `filteredQuestions` useMemo, same as the current local filtering pattern
- **D-08:** UI: **multi-select chips** consistent with the chapter/difficulty chip row already in QuestionsManager
- **D-09:** Source chip row should appear in the same filter section as difficulty chips; show all 7 source values

### Student free-practice filter (questions tab / CustomAccordion)
- **D-10:** Show **all 7 source values** as chips — do not hide lesser-used ones
- **D-11:** Labels in **Portuguese, title case** — but `ENEM` stays all-caps as it is an acronym: Vestibular, ENEM, Lista, Concurso, Olimpíada, Apostila, Outro
- **D-12:** Replace the current 4 hardcoded source options (`apostila`, `concurso`, `vestibular`, `enem`) with the full 7-value list using the Portuguese display labels above

### Claude's Discretion
- Exact ordering of source chips (recommend: Vestibular, ENEM, Concurso, Olimpíada, Lista, Apostila, Outro)
- Whether to add source to the question detail card displayed in QuestionsManager's expanded view
- Error message copy for invalid source on backend

</decisions>

<specifics>
## Specific Ideas

- Professor's default source when left blank = `lista` (reflects that professors typically create exercise lists, not exam questions)
- The 230 imported questions from the statistics textbook currently have `source = NULL` — these will all become `outro` after migration
- Existing questions with `source = apostila` should stay as `apostila` (they were manually set)

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

No external spec or ADR documents exist for this phase. Requirements are fully captured in the decisions above.

### Key source files to read before implementing
- `app/backend/statl/models/questions.py` — Question model; `source` column is already present (nullable String(20))
- `app/backend/statl/services/questions_service.py` — `_FONTES_VALIDAS` set and `_normalizar_fonte()` function to update with new enum
- `app/backend/statl/repositories/questions_repository.py` — `random_question_filtered()` already accepts `source` param; professor listing endpoint may need source filter added
- `app/backend/statl/routes/questions.py` — `/questions/filtered` already accepts `source` as multi-value query param; verify professor listing routes
- `app/frontend/src/components/CustomAccordion.tsx` — Source chips for student filter; currently hardcodes 4 values to update to 7
- `app/frontend/app/(professor)/QuestionsManager.tsx` — Professor list view; add source chip filter to the existing client-side filter row
- `app/frontend/app/(professor)/AddNewQuestion.tsx` — Professor question editor; add source dropdown field

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `CustomAccordion` source chip toggle pattern: `toggleS(sources, c.value)` — reuse same toggle in QuestionsManager
- `QuestionsManager` chip pattern for chapter/difficulty: wrap source chips in the same `XStack` chip row style
- `_normalizar_fonte()` in questions_service.py: just update `_FONTES_VALIDAS` set to reflect new enum

### Established Patterns
- Backend multi-value filter: `request.args.getlist("source")` pattern already in place in `/questions/filtered`
- Client-side filter: `filteredQuestions = useMemo(...)` pattern in QuestionsManager — extend to include source
- Chip multi-select: `arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]` toggle function exists in QuestionsManager

### Integration Points
- Migration: update existing rows in `questions` table — `avulsa` → `outro`, `NULL` → `outro`
- Backend service default: when professor submits without source, service must default to `lista` (not `outro`)
- The `/questions/professor/:id` endpoint does NOT currently accept a source filter — this is intentional (client-side filter handles it)

</code_context>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-question-bank-expansion*
*Context gathered: 2026-04-10*
