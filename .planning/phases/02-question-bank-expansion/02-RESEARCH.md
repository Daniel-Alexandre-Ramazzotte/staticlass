# Phase 2: Question Bank Expansion - Research

**Researched:** 2026-04-10
**Domain:** Flask backend enum migration + React Native / Tamagui UI extension
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Final enum (7 values): `vestibular`, `ENEM`, `lista`, `concurso`, `olimpíada`, `apostila`, `outro`
- **D-02:** Migration mapping: `avulsa` → `outro`; `NULL` → `outro`; `apostila` stays; `concurso` stays; `vestibular`/`enem` stay (normalize `enem` → `ENEM` case)
- **D-03:** Backend validation: reject any `source` value not in the enum above; raise ValueError with the valid list
- **D-04:** Source field is **optional** in the professor form — if left blank, backend defaults to `lista`
- **D-05:** UI element for professor form: **dropdown/picker** (not chips)
- **D-06:** Source must be visible and editable in both the add-new-question form and the edit/update view
- **D-07:** QuestionsManager source filter is **client-side** — useMemo on the already-loaded list
- **D-08:** QuestionsManager filter UI: **multi-select chips** consistent with existing chapter/difficulty chip rows
- **D-09:** Source chip row appears in the same filter section as difficulty chips, after difficulty row; shows all 7 values
- **D-10:** CustomAccordion shows **all 7 source values** as chips
- **D-11:** Labels in Portuguese title case; `ENEM` stays all-caps
- **D-12:** Replace current 4 hardcoded source options with full 7-value list using Portuguese labels

### Claude's Discretion

- Exact ordering of source chips (recommended: Vestibular, ENEM, Concurso, Olimpíada, Lista, Apostila, Outro)
- Whether to add source to the question detail card in QuestionsManager's expanded view
- Error message copy for invalid source on backend

### Deferred Ideas (OUT OF SCOPE)

- None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| QUEST-01 | Source Field: `source` column exists, enum updated to 7 values, existing rows migrated, exposed in schema | Backend: update `_FONTES_VALIDAS`, write migration SQL, verify `source` is returned in all question serialization paths |
| QUEST-02 | Professor Filter by Source: QuestionsManager shows source chips, filters client-side via useMemo | Frontend: add `sources` state + FONTES_MANAGER constant + toggle helper + extend filteredQuestions useMemo; also add `source` field to QuestionListItem and QuestionDetail types |
| QUEST-03 | Student Free-Practice Filter: CustomAccordion FONTES updated 4→7; source passed in `GET /questions/filtered` params already works | Frontend: replace FONTES constant, ensure value casing matches backend enum (especially `ENEM`) |
</phase_requirements>

---

## Summary

Phase 2 is a metadata-enrichment phase. The `source` column already exists on the `questions` table as a nullable `String(20)` — no schema migration is needed. The work is three-pronged: (1) update the backend enum and validation logic plus run a data migration to normalize existing values, (2) add a source dropdown to the professor question editor, and (3) extend the two filter UIs (professor chips + student accordion chips) to expose all 7 source values.

The codebase is in good shape for this phase. The `/questions/filtered` endpoint already accepts `source` as a multi-value query parameter and passes it through to `buscar_questoes_filtradas`. The `CustomAccordion` already has a source prop interface (`sources: string[]`, `setSources`) and a FONTES array — it just needs the 4-value array replaced with 7 values. The `QuestionsManager` has the chip pattern in place for chapter/difficulty but source state and chips need to be added. `AddNewQuestion` has no source state at all and needs a dropdown added between Dificuldade and Resposta correta.

**Primary recommendation:** Implement in order — backend migration first (02-01), then professor editor (02-02 backend-facing part), then both filter UIs (02-02 professor chips + 02-03 student accordion). The backend default of `lista` when source is omitted means professors can save questions immediately without being forced to pick a source.

---

## Standard Stack

### Core (already installed — no new dependencies)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Flask-SQLAlchemy | in requirements.txt | ORM + raw SQL via `db.session.execute(text(...))` | Project standard; all DB access in repositories layer |
| SQLAlchemy `text()` | bundled | Raw parameterized SQL | Project uses raw SQL throughout, not ORM query builder |
| Tamagui | in package.json | UI component system for React Native | Project standard; all screens use Tamagui primitives |
| React Native `Modal` | bundled with RN | Dropdown picker implementation | Already used elsewhere in the app; no new dep needed |
| `lucide-react-native` | in package.json | ChevronDown icon for dropdown trigger | Already imported in AddNewQuestion.tsx (`import { ChevronLeft } from 'lucide-react-native'`) |

[VERIFIED: codebase grep]

### No New Dependencies

The UI-SPEC.md explicitly confirms: "No new dependencies are added in this phase. All UI is built from existing Tamagui primitives already installed." [VERIFIED: 02-UI-SPEC.md registry safety section]

**Installation:** none required

---

## Architecture Patterns

### Recommended Project Structure

No new files or folders are needed for this phase. All changes are edits to existing files:

```
app/backend/statl/
├── services/questions_service.py   # update _FONTES_VALIDAS + _normalizar_fonte()
├── routes/questions.py             # no change needed (source already accepted)
└── repositories/questions_repository.py  # no change needed (source already in queries)

app/frontend/src/components/
└── CustomAccordion.tsx             # update FONTES constant (4 → 7 values)

app/frontend/app/(professor)/
├── QuestionsManager.tsx            # add sources state, FONTES_MANAGER, toggle helper, extend useMemo, add chip row
└── AddNewQuestion.tsx              # add fonte state, FONTES_ADD, dropdown field, include in payload
```

### Pattern 1: Backend Enum Update + Data Migration

**What:** Update `_FONTES_VALIDAS` set and `_normalizar_fonte()` function; run a one-time SQL UPDATE to normalize existing rows.

**When to use:** Anytime an enum changes and existing data must be brought into conformance.

**Exact changes to `questions_service.py`:**

```python
# Source: verified from /app/backend/statl/services/questions_service.py

# BEFORE:
_FONTES_VALIDAS = {"apostila", "concurso", "avulsa", "vestibular", "enem"}

def _normalizar_fonte(valor):
    if valor in (None, "", "null"):
        return None
    v = str(valor).strip().lower()
    if v not in _FONTES_VALIDAS:
        raise ValueError(f"fonte inválida — use {sorted(_FONTES_VALIDAS)} ou deixe em branco")
    return v

# AFTER (D-01, D-02, D-03, D-04):
_FONTES_VALIDAS = {"vestibular", "ENEM", "lista", "concurso", "olimpíada", "apostila", "outro"}
_FONTE_PADRAO_PROFESSOR = "lista"

def _normalizar_fonte(valor, default=None):
    if valor in (None, "", "null"):
        return default   # callers pass _FONTE_PADRAO_PROFESSOR when appropriate
    v = str(valor).strip()
    # Case-normalize: enem → ENEM (backend enum is case-sensitive for ENEM)
    if v.lower() == "enem":
        v = "ENEM"
    if v not in _FONTES_VALIDAS:
        raise ValueError(
            f"fonte inválida — valores aceitos: {sorted(_FONTES_VALIDAS)}"
        )
    return v
```

**Important:** The `default` parameter must be supplied by `_normalizar_payload` only for professor-submitted questions (add/update), not for the migration script. See Pitfall 1.

**Data migration SQL (idempotent):**

```sql
-- Run once against the production MySQL database
-- Maps old values → new enum values per D-02
UPDATE questions SET source = 'outro'     WHERE source IS NULL;
UPDATE questions SET source = 'outro'     WHERE source = 'avulsa';
UPDATE questions SET source = 'ENEM'      WHERE source = 'enem';
-- apostila, concurso, vestibular: no change needed
```

The migration can be delivered as a standalone Python script (similar to `migrate_questoes.py`) or as a `flask shell` command. A script is preferred so it can be rerun safely (add a check/log to confirm rows changed). [VERIFIED: codebase structure]

### Pattern 2: Professor Form Dropdown (AddNewQuestion)

**What:** Add `fonte` state initialized to `''` and a modal-based dropdown picker between the Dificuldade row and the Resposta correta row. Include `source` in the API payload only when non-empty.

**Key integration points verified in AddNewQuestion.tsx:**

- `QuestionDetail` type (line 15-23) — must add `source?: string | null` so the edit path can pre-populate `fonte` state
- `useEffect` that loads question for editing (line 47-72) — add `setFonte(q.source || '')` after `setDificuldade`
- `salvar()` function (line 74-110) — add `source: fonte || undefined` to payload
- Import `ChevronDown` from `lucide-react-native` — already imported (`ChevronLeft` is imported; add `ChevronDown`)
- `Modal` import from `react-native` — not currently imported; must be added to the import at line 3

**Modal import needed:**
```tsx
// Source: verified from app/frontend/app/(professor)/AddNewQuestion.tsx line 1-8
import { Input, YStack, XStack, ZStack, Text, ScrollView, Button } from 'tamagui';
// Add Modal:
import { Modal } from 'react-native';  // add to existing react-native imports if any, or new import
```

Note: `AddNewQuestion.tsx` does not currently import from `react-native` directly — it uses Tamagui for everything. The `Modal` import is the only new import needed from `react-native`.

### Pattern 3: QuestionsManager Client-Side Source Filter

**What:** Add `sources: string[]` state and a `toggleS` helper function; extend the `filteredQuestions` useMemo to include source filtering; add source chip row inside the `role === 'admin'` filter block.

**Key integration points verified in QuestionsManager.tsx:**

- `QuestionListItem` type (line 19-27) — must add `source?: string | null` for the filter to work
- `QuestionDetail` type (line 29-43) — must add `source?: string | null` for the detail card display
- `filteredQuestions` useMemo (line 182-191) — currently only filters by `searchValue`; extend to also filter by `sources`
- The `role === 'admin'` block (line 261-327) — source chips slot in after the difficulty clear button, before the "Aplicar filtros" AppButton
- `fetchQuestions` useCallback (line 80-105) — **no change needed**: source filter is client-side only (D-07); the admin path already fetches all questions for the filter set, and the professor path fetches all professor questions

**Important note on admin vs professor paths:** The admin path (`/admin/questoes`) uses server-side `chapter_id/topic_id/difficulty` params. Source does NOT get added to those server-side params (D-07 — client-side only). The professor path (`/questions/professor/:id`) also stays unchanged. The client-side filter in useMemo handles both paths uniformly.

**toggleS helper (add at module scope, same as existing toggleN):**
```tsx
// Source: pattern from app/frontend/src/components/CustomAccordion.tsx lines 43-45
function toggleS(arr: string[], val: string): string[] {
  return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
}
```

### Pattern 4: CustomAccordion FONTES Update

**What:** Replace the 4-value `FONTES` constant with the 7-value array. No other changes to the component.

**Current state (verified):**
```tsx
// Source: app/frontend/src/components/CustomAccordion.tsx lines 31-36
const FONTES = [
  { label: 'Apostila', value: 'apostila' },
  { label: 'Concurso', value: 'concurso' },
  { label: 'Vestibular', value: 'vestibular' },
  { label: 'ENEM', value: 'enem' },   // ← 'enem' lowercase must become 'ENEM'
];
```

**After (D-11, D-12, plus Claude's Discretion ordering):**
```tsx
const FONTES = [
  { label: 'Vestibular', value: 'vestibular' },
  { label: 'ENEM',       value: 'ENEM' },      // uppercase value matches backend enum
  { label: 'Concurso',   value: 'concurso' },
  { label: 'Olimpíada',  value: 'olimpíada' },
  { label: 'Lista',      value: 'lista' },
  { label: 'Apostila',   value: 'apostila' },
  { label: 'Outro',      value: 'outro' },
];
```

The `XStack flexWrap="wrap" gap="$2"` is already set in the component (line 234) — 7 chips wrap naturally. [VERIFIED: codebase]

### Anti-Patterns to Avoid

- **Changing the DB column type:** `source` is already `String(20)` and `olimpíada` (9 chars) fits within 20 chars. No ALTER TABLE needed. [VERIFIED: models/questions.py]
- **Adding source filter to server-side admin endpoint params:** D-07 explicitly locks source filtering as client-side only.
- **Making source required in the frontend form:** D-04 locks it as optional; backend defaults to `lista`.
- **Lowercasing all values in `_normalizar_fonte`:** `ENEM` must stay uppercase in the backend enum (D-01, D-02). The old code did `v = str(valor).strip().lower()` — this must change.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Dropdown/picker for mobile | Custom scrollable list from scratch | React Native `Modal` + `Pressable` list (as specified in UI-SPEC.md) | Tamagui Sheet (`<Sheet>`) is an alternative but Modal is lighter and already used in the app pattern; no new dep |
| Enum validation | Custom regex or switch statement | Updated `_FONTES_VALIDAS` set + `in` check | Already the established pattern in `_normalizar_fonte()` |
| Data migration | ORM per-row Python loop | Batch SQL `UPDATE ... WHERE source = 'old'` | Direct SQL is faster and idempotent for this simple substitution |

---

## Runtime State Inventory

> Applicable: this phase renames/remaps `source` enum values (avulsa → outro, enem → ENEM).

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | MySQL `questions` table: `source` column holds `NULL` (230 imported questions), `apostila`, `concurso`, possibly `avulsa`/`enem` from any manually-entered questions | Data migration SQL: UPDATE rows to new enum values |
| Live service config | None — no external service indexes or caches the `source` value | None |
| OS-registered state | None | None |
| Secrets/env vars | None — `source` is a data field, not a configuration key | None |
| Build artifacts | None — column already exists, no schema change | None |

**Migration is additive to existing logic:** The `migrate_apostila.py` script already uses `source='concurso'` and `source='apostila'` — these two values are unchanged in the new enum, so re-running that script after the migration remains safe. [VERIFIED: migrate_apostila.py]

The `migrate_questoes.py` script imports 230+ statistics textbook questions with `source=NULL`. After the data migration these will all become `outro` (D-02). [VERIFIED: CONTEXT.md specifics section]

---

## Common Pitfalls

### Pitfall 1: `_normalizar_fonte` Default Applies to ALL Callers
**What goes wrong:** If `_normalizar_fonte` always returns `lista` when value is empty, then `update_question_service` (which merges current values) would overwrite an existing valid `source` with `lista` whenever a professor submits an update without including `source` in the payload.
**Why it happens:** `update_question_service` (line 164) uses `dados.get("source", atual.source)` — if `source` is not in the PUT payload, it falls back to `atual.source`. But `_normalizar_payload` then calls `_normalizar_fonte(merged["source"])`, which would receive the existing DB value (already valid), so this is actually safe.
**The real danger:** If the frontend always includes `source` in the update payload (even as `undefined`/`null`), then `dados.get("source")` returns `None`, and `_normalizar_fonte(None)` would return `lista` (the new default) — overwriting the real stored value with `lista`.
**How to avoid:** The frontend must send `source: fonte || undefined` (not `source: null`) in the PUT payload. When `undefined`, `request.get_json()` won't include the key, so `dados.get("source")` falls back to `atual.source`. This matches the pattern already used for `section` and `difficulty` in AddNewQuestion.tsx line 91.
**Warning signs:** Professor edits a question that was `source='apostila'`, saves without changing source — after save, source is now `lista`.

### Pitfall 2: ENEM Case Mismatch Between Frontend and Backend
**What goes wrong:** Old `FONTES` array had `value: 'enem'` (lowercase). Backend enum now has `'ENEM'` (uppercase). If old chips send `'enem'`, the `source` filter query passes `'enem'` to the SQL `WHERE q.source IN ('enem')`, which will match nothing because stored values are `'ENEM'` after migration.
**Why it happens:** SQL `IN` with string values is case-sensitive in MySQL by default for binary collations (though many default collations are case-insensitive). The safe fix is to ensure values are consistent end-to-end.
**How to avoid:** Set `value: 'ENEM'` in all frontend FONTES constants. The backend's `_normalizar_fonte` normalizes `'enem'` → `'ENEM'` as a safety net for backward compatibility.
**Warning signs:** Student selects ENEM chip but quiz returns 0 questions despite ENEM questions existing in the DB.

### Pitfall 3: `QuestionListItem` Type Missing `source` Field
**What goes wrong:** The client-side filter `result.filter((q) => sources.includes(q.source))` fails silently (never matches) if `QuestionListItem` doesn't have `source` in its TypeScript type. TypeScript will likely warn but the runtime behavior is that `q.source` is always `undefined`, so the filter removes every question from the list when any source chip is active.
**Why it happens:** `QuestionListItem` (QuestionsManager.tsx line 19-27) currently has no `source` field — it only has `id`, `issue`, `enunciado`, `difficulty`, `chapter_id`, `capitulo`, `topico`. The API does return `source` in the JSON but the type doesn't declare it.
**How to avoid:** Add `source?: string | null` to both `QuestionListItem` and `QuestionDetail` type definitions before writing the filter logic.
**Warning signs:** Source filter chips appear active but the question list doesn't change.

### Pitfall 4: `Modal` Not Imported in AddNewQuestion
**What goes wrong:** AddNewQuestion.tsx imports nothing from `react-native` directly — all components are Tamagui. Adding the dropdown modal requires `Modal` from `react-native`.
**Why it happens:** The file uses Tamagui for all UI and `Alert` from `react-native` is not present either (alert() is the native global). TypeScript will error at build time if `Modal` is used without import.
**How to avoid:** Add `import { Modal } from 'react-native';` to AddNewQuestion.tsx.
**Warning signs:** Expo/Metro build error: "Modal is not defined" or TypeScript error.

### Pitfall 5: Migration Script Idempotency
**What goes wrong:** Running the data migration SQL twice changes rows again (e.g., setting `source='outro'` for rows that a professor already updated to a valid new value after the first migration run).
**Why it happens:** `UPDATE questions SET source = 'outro' WHERE source IS NULL` is safe (re-run when there are no NULLs → 0 rows affected). But `UPDATE ... WHERE source = 'avulsa'` is also idempotent because after the first run there are no more `avulsa` values.
**How to avoid:** All three migration UPDATE statements are inherently idempotent — safe to run more than once. Add a log/print of rows affected to confirm the migration ran.
**Warning signs:** None — this is already safe by construction.

---

## Code Examples

Verified patterns from codebase:

### Backend: Updated `_normalizar_fonte` Signature
```python
# Source: verified pattern from app/backend/statl/services/questions_service.py
_FONTES_VALIDAS = {"vestibular", "ENEM", "lista", "concurso", "olimpíada", "apostila", "outro"}
_FONTE_PADRAO_PROFESSOR = "lista"

def _normalizar_fonte(valor, default=None):
    if valor in (None, "", "null"):
        return default
    v = str(valor).strip()
    if v.lower() == "enem":
        v = "ENEM"
    if v not in _FONTES_VALIDAS:
        raise ValueError(
            f"fonte inválida — valores aceitos: {sorted(_FONTES_VALIDAS)}"
        )
    return v
```

### Backend: `_normalizar_payload` Updated Call
```python
# Source: verified from app/backend/statl/services/questions_service.py line 100
# Add professor_id check to determine correct default
"source": _normalizar_fonte(
    dados.get("source"),
    default=_FONTE_PADRAO_PROFESSOR if professor_id is not None else None
),
```

### Frontend: QuestionsManager — Extending filteredQuestions useMemo
```tsx
// Source: pattern from app/frontend/app/(professor)/QuestionsManager.tsx lines 182-191
const filteredQuestions = useMemo(() => {
  let result = questions;
  if (sources.length > 0) {
    result = result.filter((q) => sources.includes((q as any).source ?? ''));
  }
  const normalizedSearch = searchValue.trim().toLowerCase();
  if (!normalizedSearch) return result;
  return result.filter((q) => {
    const title = (q.issue || q.enunciado || '').toLowerCase();
    return title.includes(normalizedSearch);
  });
}, [questions, searchValue, sources]);
```

### Frontend: Source Chip Row in QuestionsManager (inside role === 'admin' block)
```tsx
// Source: chip pattern from QuestionsManager.tsx lines 263-315
const FONTES_MANAGER = [
  { label: 'Vestibular', value: 'vestibular' },
  { label: 'ENEM',       value: 'ENEM' },
  { label: 'Concurso',   value: 'concurso' },
  { label: 'Olimpíada',  value: 'olimpíada' },
  { label: 'Lista',      value: 'lista' },
  { label: 'Apostila',   value: 'apostila' },
  { label: 'Outro',      value: 'outro' },
];

// In JSX, after the difficulty chip row:
{FONTES_MANAGER.map((src) => (
  <Button
    key={src.value}
    size="$2"
    backgroundColor={sources.includes(src.value) ? palette.primaryBlue : palette.darkBlue}
    color={palette.offWhite}
    onPress={() => setSources((ss) => toggleS(ss, src.value))}
  >
    {src.label}
  </Button>
))}
{sources.length > 0 && (
  <Button size="$2" backgroundColor={palette.red} color={palette.offWhite}
    onPress={() => setSources([])}>
    ✕ Fonte
  </Button>
)}
```

### Frontend: Fonte field placement in AddNewQuestion
```tsx
// Source: structure verified from app/frontend/app/(professor)/AddNewQuestion.tsx lines 154-180
// Place this YStack between the Dificuldade block and the Resposta correta block:
<YStack width="100%" gap={0}>
  <RotuloLabel>Fonte:</RotuloLabel>
  <Pressable
    onPress={() => setFonteOpen(true)}
    style={{
      width: '94%', alignSelf: 'flex-end', marginTop: 4,
      backgroundColor: palette.lightBlue, borderRadius: 8,
      paddingHorizontal: 12, paddingVertical: 12,
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      minHeight: 44,
    }}
  >
    <Text style={{ color: '#fff', fontSize: 14 }}>
      {fonte
        ? FONTES_ADD.find((f) => f.value === fonte)?.label ?? fonte
        : 'Selecionar fonte...'}
    </Text>
    <ChevronDown size={16} color="#fff" />
  </Pressable>
</YStack>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `_FONTES_VALIDAS` = 5-value set with lowercase `enem` and `avulsa` | 7-value set with `ENEM` uppercase, `olimpíada`, `lista`, `outro`; `avulsa` removed | This phase | Any code path that validated or stored `avulsa` or lowercase `enem` must be updated |
| FONTES in CustomAccordion: 4 values, `value: 'enem'` lowercase | 7 values, `value: 'ENEM'` uppercase | This phase | Student source chips now match backend enum; filter will work correctly |
| AddNewQuestion: no `source` field | Dropdown/picker for source between Dificuldade and Resposta correta | This phase | Professors can tag new and edited questions with origin |

**Deprecated:**
- `avulsa`: removed from valid enum. Any future question submitted with `avulsa` will get a 400 error. The migration converts existing `avulsa` rows to `outro`.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | MySQL default collation is case-insensitive for `source` column string comparisons, so `WHERE source = 'ENEM'` will also match `'enem'` at the DB level | Pitfall 2 | LOW risk — even if collation is case-insensitive, normalizing values end-to-end to `'ENEM'` is still correct practice. The migration explicitly sets uppercase values. |
| A2 | `RETURNING id` in `adicionar_questao` SQL INSERT works in both SQLite (tests) and MySQL (production) | Code Examples | If MySQL version < 8.0.21, `RETURNING` is not supported. However, this is the existing pattern already in production — if it worked before Phase 2, it works after. No new risk introduced. |

**All other claims in this research were verified directly against the codebase source files.**

---

## Open Questions

1. **Migration delivery mechanism**
   - What we know: Other migrations (`migrate_questoes.py`, `migrate_apostila.py`) are standalone Python scripts runnable with `python -m statl.migrate_*`
   - What's unclear: Whether to deliver this as a script (`migrate_source_enum.py`) or as a `flask shell` one-liner in the plan summary
   - Recommendation: Deliver as a short Python script in `app/backend/statl/` following the existing convention — easier to rerun and self-documenting

2. **`/admin/questoes` endpoint and `source` field in response**
   - What we know: QuestionsManager uses `/admin/questoes` for the admin path (not `/questions/admin/:id`). This endpoint is in a different blueprint (users/admin routes) not reviewed here.
   - What's unclear: Whether `source` is included in the JSON response of `/admin/questoes`
   - Recommendation: Plan 02-02 must verify that `/admin/questoes` returns `source` in its question objects. If it doesn't, the client-side filter will silently not work for admins (Pitfall 3 variant).

---

## Environment Availability

Step 2.6: SKIPPED — this phase makes no external tool calls beyond the existing Flask + MySQL + Expo stack already running. No new services, CLIs, or runtimes are required.

---

## Validation Architecture

`nyquist_validation` is `false` in `.planning/config.json` — this section is omitted per configuration.

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Phase 1 already enforces `@require_role` on all question endpoints |
| V3 Session Management | no | No session changes |
| V4 Access Control | no | Source is a metadata field; no new access control rules needed |
| V5 Input Validation | yes | `_normalizar_fonte()` rejects values not in `_FONTES_VALIDAS`; raises ValueError → 400 |
| V6 Cryptography | no | No cryptographic operations |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Invalid source value injection (e.g., `source=malicious_string`) | Tampering | `_FONTES_VALIDAS` allowlist + ValueError → 400 response (D-03) |
| SQL injection via source filter param | Tampering | Already mitigated: `buscar_questoes_filtradas` uses parameterized SQL with `text()` and named params |

No new security surface is introduced. The source field follows the exact same validation pattern as `difficulty` and other validated fields. [VERIFIED: questions_repository.py `_adicionar_in` helper]

---

## Sources

### Primary (HIGH confidence)
- `app/backend/statl/services/questions_service.py` — `_FONTES_VALIDAS`, `_normalizar_fonte`, `_normalizar_payload`, `random_question_filtered` — read directly
- `app/backend/statl/models/questions.py` — `source` column definition `String(20) nullable=True` — read directly
- `app/backend/statl/repositories/questions_repository.py` — `buscar_questoes_filtradas` with `source` IN clause, `_CAMPOS_ATUALIZAVEIS` set — read directly
- `app/backend/statl/routes/questions.py` — `request.args.getlist("source")` pattern, all `@require_role` decorators — read directly
- `app/frontend/src/components/CustomAccordion.tsx` — FONTES constant (4 values, lowercase `enem`), chip render pattern — read directly
- `app/frontend/app/(professor)/QuestionsManager.tsx` — `QuestionListItem` type, `filteredQuestions` useMemo, chip pattern in admin block, absence of `sources` state — read directly
- `app/frontend/app/(professor)/AddNewQuestion.tsx` — form structure, `QuestionDetail` type, `salvar()` payload, absence of `fonte` state — read directly
- `app/frontend/src/constants/style.tsx` — `palette` colors: `primaryBlue`, `darkBlue`, `lightBlue`, `red`, `offWhite` — read directly
- `.planning/phases/02-question-bank-expansion/02-CONTEXT.md` — all locked decisions D-01 through D-12 — read directly
- `.planning/phases/02-question-bank-expansion/02-UI-SPEC.md` — component inventory, color rules, interaction states — read directly
- `app/backend/statl/tests/conftest.py` — test fixture pattern — read directly

### Secondary (MEDIUM confidence)
- `app/backend/statl/migrate_apostila.py` — confirms existing `source='concurso'` and `source='apostila'` values in production data (VERIFIED: grep)
- `app/frontend/app/(tabs)/questions.tsx` — confirms `sources` state and `params.source = sources` already wired to `PersonalizarAccordion` and `QuizInProgressScreen` router params (VERIFIED: read directly)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified from codebase, no new dependencies
- Architecture: HIGH — all files read directly, exact line numbers confirmed
- Pitfalls: HIGH — derived from code analysis of actual type definitions and function signatures
- Migration: HIGH — SQL is straightforward; migration values verified against CONTEXT.md D-02 and codebase

**Research date:** 2026-04-10
**Valid until:** 2026-05-10 (stable domain — 30-day window)
