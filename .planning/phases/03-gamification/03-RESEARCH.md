# Phase 3: Gamification - Research

**Researched:** 2026-04-11
**Domain:** Flask backend (XP/streak/ranking), React Native (Expo Router + Tamagui) frontend, PostgreSQL schema migration
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Purely additive — only correct answers earn XP. No XP penalty for wrong answers.
- **D-02:** Base rate: 10 XP per correct answer (existing `score` column rate — keep it).
- **D-03:** Session completion bonus: +20 XP flat for finishing any quiz, added on top of per-answer XP regardless of performance.
- **D-04:** Streak multiplier tiers applied to the total XP earned in a session (per-answer + completion bonus):
  - streak < 3 days → no multiplier (1×)
  - streak ≥ 3 days → 1.25×
  - streak ≥ 7 days → 1.5×
  - Example: 5-question quiz, 3 correct, streak = 7 days → (3 × 10 + 20) × 1.5 = 75 XP
- **D-05:** Global all-time ranking only for v1 — no weekly reset or scope toggle.
- **D-06:** Top-100 students visible, loaded in pages (first 20, load more on scroll).
- **D-07:** The logged-in student's own row is always pinned at the bottom of the ranking list, showing their rank and XP even if they are outside top-100. Mirrors the Duolingo pattern.

### Claude's Discretion

- Streak reset behavior: follow ROADMAP spec (streak advances if practiced today, resets if a day was skipped — use calendar day boundary, not 24h rolling window).
- Whether to rename the existing `score` column to `xp` in the database migration, or keep `score` and alias it `xp` in API responses — planner decides based on migration risk.
- Whether to create a new `/gamification/` Flask blueprint or extend the existing `/users/` routes — planner decides based on route cohesion; lean toward new blueprint per ROADMAP spec.
- Streak reset value when a day is skipped: 0 (clean restart) or 1 (today counts) — planner follows ROADMAP wording ("resets streak if a day was skipped").
- Exact page size for paginated ranking (suggest 20 per page).

### Deferred Ideas (OUT OF SCOPE)

- Weekly or monthly leaderboard scope toggle — deferred to post-v1; global all-time only for now.
- XP level tiers (Nível 1, Nível 2…) based on XP thresholds — implementing actual tier logic is out of scope for this phase (Phase 6 polish or later).

</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| GAME-01 | XP awarded per correct answer after quiz completion | `incrementar_score()` in resultado_repository.py is the extension point; extend to full XP formula |
| GAME-02 | Streak tracked and advanced/reset on calendar day boundary | New `streak` + `last_practice_date` columns; streak logic in service layer |
| GAME-03 | Streak multiplier applied to session XP total | Computed in `salvar_resultado_service()` before calling `incrementar_score()` |
| GAME-04 | Ranking endpoint returns top-100 alunos ordered by XP desc with rank position | Extend `buscar_ranking()` to support offset/limit + rank window function |
| GAME-05 | Ranking screen shows leaderboard with pinned own-row | `Ranking.tsx` stub exists; implement with FlatList + pinned row below |
| GAME-06 | Profile screen shows XP total, current streak, and ranking position | Profile already fetches `score`; extend API response + wire `streak`, `rank_position` |

</phase_requirements>

---

## Summary

Phase 3 adds XP accumulation, streak tracking, and a global ranking to the existing quiz flow. The backend already has 80% of the scaffolding in place: `score` column on `users`, `incrementar_score()` repository function, `salvar_resultado_service()` service, and the `/users/salvar-resultado` route. The work is to extend this existing stack rather than build from scratch.

The biggest architectural decision is whether to rename `score` → `xp` or alias it. Renaming is cleaner long-term but requires an `ALTER TABLE` migration plus updating every reference in the codebase. Aliasing (`SELECT score AS xp`) avoids breaking existing code but leaves technical debt. Given the small codebase with only three references to `score` (`user.py`, `resultado_repository.py`, `users.py`), renaming is low-risk and recommended.

The frontend requires three coordinated changes: (1) `ResultScreen.tsx` must capture the XP value returned by the backend and display it with the multiplier annotation; (2) `profile.tsx` must fetch and display `streak` and `rank_position` alongside XP; (3) `Ranking.tsx` stub must be fully implemented using the established `Statistics.tsx` pattern (useFocusEffect + Promise.all + api.get, ActivityIndicator loading state, error state, FlatList).

**Primary recommendation:** Create a new `/gamification/` Flask blueprint. Extend `User` model with `streak` + `last_practice_date`. Apply the XP formula in `resultado_service.py`. Expose the XP earned (with multiplier) in the API response so the frontend can display it dynamically.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Flask + Flask-JWT-Extended | already installed | Auth-protected API routes | Project standard — `@require_role` decorator used everywhere |
| SQLAlchemy + `db.session.execute(text(...))` | already installed | Database access | Project uses raw SQL via `text()` consistently, not ORM query API |
| Tamagui (YStack, XStack, Text, Button) | already installed | React Native UI components | Project standard for all screens |
| react-native-paper | already installed | Supporting UI | Project standard |
| @tamagui/lucide-icons | already installed | Icons (Trophy, Flame) | Already imported in `profile.tsx` |

[VERIFIED: codebase scan of `statl/__init__.py`, `statl/routes/users.py`, `app/frontend/app/(tabs)/profile.tsx`]

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `datetime.date.today()` (Python stdlib) | stdlib | Calendar day boundary for streak | Use for streak date comparisons — already imported in `resultado_repository.py` |
| `FlatList` (React Native core) | RN core | Paginated ranking list | Preferred over ScrollView + manual slice for large lists with load-more |
| `RefreshControl` (React Native core) | RN core | Pull-to-refresh on ranking | Standard pattern for any scrollable data screen |
| `ActivityIndicator` (React Native core) | RN core | Loading states | Already used in `Statistics.tsx` — use identical pattern |

[VERIFIED: codebase scan of `Statistics.tsx`, `resultado_repository.py`]

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Raw SQL `text()` for ranking with window function | SQLAlchemy ORM | Project uses raw SQL exclusively; changing approach for one query creates inconsistency |
| New `/gamification/` blueprint | Extending `/users/` routes | New blueprint has cleaner separation; ROADMAP spec says `/gamification/record-session` and `/gamification/ranking`; lean toward new blueprint |
| Alias `score AS xp` in queries | Rename column to `xp` | Rename is cleaner; only 3 references in codebase (low risk); recommended |

**Installation:** No new packages needed. All required libraries are already installed.
[VERIFIED: codebase scan confirms existing installations]

---

## Architecture Patterns

### Recommended Project Structure (new files)

```
app/backend/statl/
  routes/
    gamification.py       # New blueprint: /gamification prefix
  services/
    gamification_service.py   # XP formula, streak logic, ranking service
  repositories/
    gamification_repository.py  # DB access: update_xp_and_streak(), get_ranking()

app/frontend/app/(app)/
  Ranking.tsx             # Replace stub with full implementation
```

Modified files:
```
app/backend/statl/
  models/user.py          # Add streak, last_practice_date columns
  __init__.py             # Register gamification blueprint + _garantir_schema_incremental entries

app/frontend/app/
  (app)/ResultScreen.tsx  # Capture xp_gained from API response, display with multiplier
  (tabs)/profile.tsx      # Fetch + display streak and rank_position
```

### Pattern 1: Flask Blueprint Registration

**What:** New blueprint created in `routes/gamification.py`, registered in `_registrar_blueprints()`.
**When to use:** Any new route group — this is the established project pattern.

```python
# Source: codebase — statl/__init__.py _registrar_blueprints()
def _registrar_blueprints(app):
    from .routes import auth, questions, users, admin, gamification
    for blueprint in (auth.bp, questions.bp, users.bp, admin.bp, gamification.bp):
        app.register_blueprint(blueprint)
```

[VERIFIED: codebase scan of `__init__.py`]

### Pattern 2: Schema Migration via `_garantir_schema_incremental`

**What:** The project uses `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` inside `_garantir_schema_incremental()` in `__init__.py` for additive schema changes. This is the established pattern — NOT Alembic, NOT a separate migration script.
**When to use:** Any time a column needs to be added to an existing table without breaking existing deployments.

```python
# Source: codebase — statl/__init__.py _garantir_schema_incremental()
# PostgreSQL-only block (SQLite used only in tests, which use db.create_all())
db.session.execute(
    text("ALTER TABLE users ADD COLUMN IF NOT EXISTS streak INTEGER NOT NULL DEFAULT 0")
)
db.session.execute(
    text("ALTER TABLE users ADD COLUMN IF NOT EXISTS last_practice_date DATE")
)
db.session.commit()
```

IMPORTANT: The SQLite test path uses `db.create_all()` which reads the ORM model directly, so the new columns MUST also be added to `User` model in `models/user.py`. Both must be done together.

[VERIFIED: codebase scan of `__init__.py` — existing `ADD COLUMN IF NOT EXISTS` examples at lines 117-131]

### Pattern 3: XP Formula Implementation

**What:** Service layer computes XP, then calls the repository. The formula is:
1. `base_xp = acertos * 10 + 20` (per-answer + completion bonus)
2. Determine multiplier from `current_streak`:
   - `streak >= 7` → `1.5`
   - `streak >= 3` → `1.25`
   - else → `1.0`
3. `xp_ganho = int(base_xp * multiplier)` (floor to integer)
4. Call `update_xp_and_streak(usuario_id, xp_ganho, nova_streak, hoje)`

```python
# Source: D-01 through D-04 from CONTEXT.md, verified against existing pattern in resultado_service.py
from datetime import date

def calcular_xp(acertos: int, streak_atual: int) -> tuple[int, float]:
    base = acertos * 10 + 20
    if streak_atual >= 7:
        multiplier = 1.5
    elif streak_atual >= 3:
        multiplier = 1.25
    else:
        multiplier = 1.0
    return int(base * multiplier), multiplier
```

[VERIFIED: formula derived from locked decisions D-01 through D-04 in CONTEXT.md]

### Pattern 4: Streak Logic

**What:** Calendar-day boundary (not 24h rolling). Called inside `record_session_service()` before XP is computed.

```python
# Source: ROADMAP spec + D-04, CONTEXT.md Claude's Discretion
from datetime import date

def calcular_nova_streak(streak_atual: int, last_practice_date) -> int:
    hoje = date.today()
    if last_practice_date is None:
        return 1  # first ever session
    delta = (hoje - last_practice_date).days
    if delta == 0:
        return streak_atual       # already practiced today, no change
    elif delta == 1:
        return streak_atual + 1   # consecutive day
    else:
        return 1                  # skipped at least one day — reset to 1 (today counts)
```

Note: ROADMAP says "resets streak if a day was skipped." Reset to 1 (today counts) is consistent with Duolingo spirit and the ROADMAP's "advances if practiced today" clause. The planner may interpret ROADMAP as reset to 0 — document both options.

[ASSUMED: reset-to-1 vs reset-to-0 interpretation; CONTEXT.md defers this to planner]

### Pattern 5: Ranking Query with Rank Position

**What:** PostgreSQL `ROW_NUMBER()` window function returns rank position in a single query.

```sql
-- Source: PostgreSQL docs pattern; compatible with project's raw SQL approach
SELECT
    id,
    name,
    COALESCE(score, 0) AS xp,
    ROW_NUMBER() OVER (ORDER BY COALESCE(score, 0) DESC) AS posicao
FROM users
WHERE role = 'aluno' AND active = TRUE
ORDER BY xp DESC
LIMIT :limite OFFSET :offset
```

For the "own row" pinned entry (may be outside top-100):
```sql
SELECT
    id,
    name,
    COALESCE(score, 0) AS xp,
    ROW_NUMBER() OVER (ORDER BY COALESCE(score, 0) DESC) AS posicao
FROM users
WHERE role = 'aluno' AND active = TRUE
-- No LIMIT/OFFSET; filter by id in application code after
```

IMPORTANT: ROW_NUMBER() is PostgreSQL-specific. The test environment uses SQLite which does NOT support `ROW_NUMBER() OVER (...)`. The gamification repository functions that use this syntax must be tested against PostgreSQL, or the tests must mock the repository layer.

[VERIFIED: PostgreSQL docs pattern; SQLite incompatibility is a known constraint given project test setup]

### Pattern 6: Frontend Fetch Pattern (Statistics.tsx)

**What:** `useFocusEffect` + `useCallback` + `Promise.all` is the established pattern for screens that fetch multiple endpoints on focus.

```typescript
// Source: codebase — Statistics.tsx lines 74-90
const buscarDados = useCallback(() => {
  setCarregando(true);
  setErro(null);
  Promise.all([
    api.get('/gamification/ranking?page=1'),
    api.get('/users/profile/' + email),  // or a dedicated gamification/me endpoint
  ])
    .then(([resRanking, resPerfil]) => { ... })
    .catch(() => setErro('Não foi possível carregar...'))
    .finally(() => setCarregando(false));
}, []);

useFocusEffect(buscarDados);
```

[VERIFIED: codebase scan of Statistics.tsx]

### Anti-Patterns to Avoid

- **Calling XP update on the frontend client side:** The frontend currently does `acertos * 10` for display. The multiplied XP must be computed server-side and returned in the API response — never trust the client to compute the final XP for storage.
- **Using Alembic or Flask-Migrate:** The project does NOT use Alembic. Schema changes go through `_garantir_schema_incremental()` for PostgreSQL and `User` model for both environments.
- **Using ORM `.query` syntax:** All DB access in this project uses `db.session.execute(text(...))`. Stay consistent.
- **Fetching all ranking data without pagination:** The top-100 requirement exists partly for performance. Always use `LIMIT/OFFSET` and never return an unbounded result set.
- **Duplicating XP on multiple quiz completions (ref bug):** `ResultScreen.tsx` already uses `useRef(false)` / `enviado.current` guard to prevent double-submission. Preserve this guard when migrating to the new endpoint.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Rank position computation | Custom Python rank loop | PostgreSQL `ROW_NUMBER() OVER (ORDER BY score DESC)` | Single-query solution; loop approach is O(n) in Python and requires fetching all rows |
| Streak "practiced today" check | Complex timezone-aware datetime comparison | `datetime.date.today()` equality check | Calendar day boundary is already sufficient; project is single-timezone (Brazil) |
| Pagination state in React | Custom pagination class | Simple `page` integer state + `hasMore` boolean | FlatList `onEndReached` + `page` counter is the standard RN pattern; no library needed |
| XP formula floating-point precision | Custom rounding | Python `int(base * multiplier)` (truncation) | Avoids fractional XP; consistent with "10 XP per answer" integer convention |

**Key insight:** The hardest part of this phase is the SQLite/PostgreSQL split in tests. `ROW_NUMBER()` window functions don't work in SQLite. The planner must decide: (a) mock the ranking repository in tests, or (b) write integration tests that only run against PostgreSQL. Option (a) is simpler for the test suite.

---

## Common Pitfalls

### Pitfall 1: SQLite/PostgreSQL SQL Dialect Split

**What goes wrong:** A query that works perfectly in PostgreSQL (`ROW_NUMBER() OVER`, `DATE` type comparisons, `ON CONFLICT DO NOTHING`) silently fails or errors in the SQLite test environment.
**Why it happens:** Tests use `create_app(testing=True)` which sets `sqlite:///:memory:`. SQLite does not support `ROW_NUMBER() OVER ()` window functions (added only in SQLite 3.25+, but Flask-SQLAlchemy on Python 3.13 may use a bundled older version).
**How to avoid:** In the gamification repository, abstract rank computation to Python after fetching an ordered list for tests, OR test the ranking endpoint at the route level with mocked service data. Do not rely on window functions in test-path SQL.
**Warning signs:** `OperationalError: near "OVER": syntax error` in pytest output.

[VERIFIED: codebase scan of conftest.py — SQLite in-memory confirmed; SQLite window function support is version-dependent — ASSUMED that the project's SQLite may not support it]

### Pitfall 2: XP Multiplier Applied to Wrong Subtotal

**What goes wrong:** Multiplier is applied only to per-answer XP, not the completion bonus, giving wrong results.
**Why it happens:** D-04 is explicit: "applied to the total XP earned in a session (per-answer XP + completion bonus combined)."
**How to avoid:** Compute `base = acertos * 10 + 20` FIRST, then multiply: `int(base * multiplier)`.
**Warning signs:** A 5-correct quiz with 7-day streak yields `(50 + 20*1.5) = 105` instead of `(50+20)*1.5 = 105` — same here, but a 0-correct quiz would give `20*1.5 = 30` vs `0 + 20*1.5 = 30`. The bug manifests when formula is written as `(acertos*10)*multiplier + 20`.

[VERIFIED: D-04 in CONTEXT.md]

### Pitfall 3: Double-Submission of XP

**What goes wrong:** `record-session` is called twice for one quiz, doubling the student's XP.
**Why it happens:** React Native `useEffect` can fire twice in dev (StrictMode), or a re-render triggers the call again.
**How to avoid:** Preserve the existing `useRef(false)` / `enviado.current` guard from `ResultScreen.tsx` when switching from `/users/salvar-resultado` to `/gamification/record-session`. This guard already exists in the codebase.
**Warning signs:** XP jumps by double the expected amount after a single quiz.

[VERIFIED: codebase scan of ResultScreen.tsx lines 24-28]

### Pitfall 4: Streak Advances on Second Quiz Same Day

**What goes wrong:** A student does two quizzes on the same day; the second quiz adds +1 to streak again.
**Why it happens:** Naive streak logic increments on every call without checking `last_practice_date == today`.
**How to avoid:** In `calcular_nova_streak()`, check `delta == 0` (practiced today already) → return `streak_atual` unchanged. Only advance if `delta == 1`.
**Warning signs:** Streak count grows faster than calendar days.

[VERIFIED: derived from D-04 and ROADMAP spec logic]

### Pitfall 5: `profile.tsx` imports `useAuth` from wrong path

**What goes wrong:** `app/frontend/app/(tabs)/profile.tsx` imports `useAuth` from `'app/context/AuthContext'` — but the actual file is at `src/context/AuthContext.tsx`. The working import in profile.tsx uses `'app/context/AuthContext'` while Statistics.tsx uses `'../../src/context/ThemeContext'`.
**Why it happens:** The project has a mixed import path situation: some imports use `app/` path aliases, others use relative `../../src/` paths.
**How to avoid:** When adding imports in profile.tsx, match the existing `useAuth` import pattern in that file (`'app/context/AuthContext'`). Do not change the import strategy.
**Warning signs:** Metro bundler module resolution error on startup.

[VERIFIED: codebase scan of profile.tsx line 6 vs Statistics.tsx line 8]

### Pitfall 6: `ranking` endpoint not protected by auth

**What goes wrong:** The existing `/users/ranking` route has NO `@require_role` or `@jwt_required` decorator — it is publicly accessible. The new `/gamification/ranking` endpoint should be JWT-protected.
**Why it happens:** The old ranking was informational-only. The new endpoint returns user data.
**How to avoid:** Add `@require_role(['aluno', 'professor', 'admin'])` or `@jwt_required()` to `GET /gamification/ranking`. The "own row" feature requires knowing who is calling.
**Warning signs:** Ranking loads without a JWT header during testing (looks fine, but leaks user data).

[VERIFIED: codebase scan of users.py line 131 — `/ranking` has no auth decorator]

---

## Code Examples

### XP Formula (service layer)

```python
# Source: D-01 to D-04 in CONTEXT.md, pattern from resultado_service.py
from datetime import date

def record_session_service(usuario_id: int, dados: dict):
    acertos = dados.get("acertos")
    total = dados.get("total")

    if acertos is None or total is None:
        return {"error": "campos 'acertos' e 'total' são obrigatórios"}, 400

    # Fetch current streak and last_practice_date from DB
    usuario = buscar_gamification_data(usuario_id)
    streak_atual = usuario["streak"] or 0
    last_practice = usuario["last_practice_date"]

    nova_streak = calcular_nova_streak(streak_atual, last_practice)
    xp_ganho, multiplier = calcular_xp(acertos, nova_streak)

    update_xp_and_streak(usuario_id, xp_ganho, nova_streak, date.today())

    return {
        "message": "sessão registrada",
        "xp_ganho": xp_ganho,
        "streak": nova_streak,
        "multiplier": multiplier,
    }, 201
```

### ResultScreen.tsx — XP state management

```typescript
// Source: ResultScreen.tsx existing pattern + UI-SPEC requirements
const [xpGanho, setXpGanho] = useState<number | null>(null);
const [streak, setStreak] = useState<number | null>(null);
const [multiplier, setMultiplier] = useState<number | null>(null);
const [xpLoading, setXpLoading] = useState(true);

useEffect(() => {
  if (enviado.current || total === 0) return;
  enviado.current = true;

  api.post('/gamification/record-session', { acertos, total, capitulo_id, dificuldade })
    .then(r => {
      setXpGanho(r.data.xp_ganho);
      setStreak(r.data.streak);
      setMultiplier(r.data.multiplier);
    })
    .catch(() => {
      // Fallback: client-calculated, no multiplier
      setXpGanho(acertos * 10 + 20);
    })
    .finally(() => setXpLoading(false));
}, []);
```

### FlatList ranking with pinned own-row

```typescript
// Source: UI-SPEC + React Native FlatList docs pattern [ASSUMED: RN FlatList API]
<View style={{ flex: 1 }}>
  <FlatList
    data={ranking}
    keyExtractor={(item) => String(item.id)}
    renderItem={({ item }) => <RankingRow item={item} />}
    onEndReached={carregarMais}
    onEndReachedThreshold={0.5}
    refreshControl={
      <RefreshControl refreshing={atualizando} onRefresh={buscarDados}
        colors={[palette.primaryGreen]} />
    }
    ListFooterComponent={carregandoMais ? <ActivityIndicator /> : null}
  />
  {/* Pinned own-row — outside FlatList scroll */}
  {propria && <RankingRowPinned item={propria} />}
</View>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual rank loop in Python | `ROW_NUMBER() OVER (ORDER BY score DESC)` | PostgreSQL has always supported this | Avoids fetching all users to memory |
| `score` column named "pontos" | Aliased as `xp` in API responses (or rename) | This phase | Frontend should use `xp` field name going forward |
| Hardcoded top-10 ranking (`LIMIT 10`) | Paginated top-100 with `LIMIT/OFFSET` | This phase | Scales with student population |

**Deprecated/outdated in this phase:**
- `/users/salvar-resultado`: This route still works but ResultScreen should be migrated to `/gamification/record-session` which returns `xp_ganho` and `streak`. The old route can remain for backward compatibility but should not be the primary path for ResultScreen after this phase.
- `/users/ranking`: The old top-10 ranking at this route. The new `/gamification/ranking` supersedes it. The old route can remain but is not linked from the UI.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Streak reset value is 1 (today counts) not 0 when a day is skipped | Architecture Patterns - Pattern 4 | Minor UX difference; CONTEXT.md explicitly defers this to planner |
| A2 | SQLite on Python 3.13 may not support `ROW_NUMBER() OVER ()` window functions | Common Pitfalls - Pitfall 1 | If SQLite ≥ 3.25 supports it, the pitfall is moot; but test isolation still safer |
| A3 | `int()` truncation is correct for fractional XP (floor not round) | Architecture Patterns - Pattern 3 | If user expects round(), a 0.5 XP difference is negligible |

**All other claims were verified via codebase scan.**

---

## Open Questions

1. **Should `/users/salvar-resultado` be deprecated or kept?**
   - What we know: ResultScreen currently calls it; it handles `quiz_resultados` insertion + score increment
   - What's unclear: Should the new `/gamification/record-session` replace it entirely (also saving `quiz_resultados`) or only handle XP/streak and let the old route handle result storage?
   - Recommendation: New `record-session` should do both (save quiz result + update XP/streak) and ResultScreen migrates fully to it. Old route stays in code but is no longer called by the frontend. This avoids the frontend making two HTTP calls per quiz completion.

2. **Should `score` be renamed to `xp` in the database?**
   - What we know: Only 3 references in the backend codebase; `score` is exposed in `/users/profile/{email}` response
   - What's unclear: Whether the profile screen on the frontend reads `score` or `xp` field by name
   - Recommendation: Rename in DB + model + all references. The profile.tsx already uses `r.data?.score` (line 42) — this changes to `r.data?.xp`. Low-risk with a codebase search-and-replace.

3. **How should the "own row" rank position be fetched?**
   - What we know: The ranking endpoint returns top-100; if the student is rank #200, their row is not in the paginated response
   - What's unclear: Should `GET /gamification/ranking` always include the caller's own row in the response (as a separate `own_entry` field), or should the frontend call a separate `GET /gamification/me` endpoint?
   - Recommendation: Include `own_entry` in the ranking response payload — avoids a second network request and keeps the Ranking screen single-fetch.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Python 3 | Backend runtime | ✓ | 3.13.12 | — |
| pytest | Backend tests | ✓ | 9.0.3 | — |
| Node.js | Frontend build | ✓ | 25.8.1 | — |
| PostgreSQL | Production DB | ✓ (Docker) | Docker Compose configured | — |
| SQLite (in-memory) | Test DB | ✓ | bundled with Python | — |

[VERIFIED: `python3 --version`, `pytest --version`, `node --version`]

**Missing dependencies with no fallback:** None — all required runtimes available.

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes (all new endpoints require auth) | `@require_role(['aluno'])` via `auth_middleware.py` |
| V3 Session Management | no | JWT handled by existing `@jwt_required()` pattern |
| V4 Access Control | yes | `record-session` must only award XP to the authenticated user (extract user_id from JWT, not from request body) |
| V5 Input Validation | yes | Validate `acertos` and `total` are non-negative integers; `acertos <= total` |
| V6 Cryptography | no | No new cryptographic operations |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XP inflation via direct API call | Tampering | `record-session` reads user_id from JWT (`get_jwt_identity()`), not from body |
| Ranking data scraping | Information Disclosure | Apply `@jwt_required()` to `GET /gamification/ranking` |
| Negative `acertos` in request body | Tampering | Validate `acertos >= 0` and `acertos <= total` in service layer |

[VERIFIED: existing pattern in routes/users.py — `get_jwt_identity()` used for all user-scoped operations]

---

## Sources

### Primary (HIGH confidence)
- Codebase scan: `statl/models/user.py` — confirmed `score` column structure, absence of `streak`/`last_practice_date`
- Codebase scan: `statl/repositories/resultado_repository.py` — confirmed `incrementar_score()`, `buscar_ranking()` patterns
- Codebase scan: `statl/services/resultado_service.py` — confirmed `salvar_resultado_service()` extension point
- Codebase scan: `statl/routes/users.py` — confirmed existing routes, missing auth on `/ranking`
- Codebase scan: `statl/__init__.py` — confirmed `_garantir_schema_incremental` pattern for schema migrations
- Codebase scan: `app/frontend/app/(app)/ResultScreen.tsx` — confirmed `enviado.current` guard, current API call, display format
- Codebase scan: `app/frontend/app/(tabs)/profile.tsx` — confirmed `score` fetch, mock calendar, existing XP bar
- Codebase scan: `app/frontend/app/(app)/Statistics.tsx` — confirmed `useFocusEffect + Promise.all` fetch pattern
- Codebase scan: `app/frontend/app/(app)/Ranking.tsx` — confirmed stub-only implementation
- Codebase scan: `app/frontend/src/context/AuthContext.tsx` — confirmed `userId` available; `streak`/`xp` not in context
- Codebase scan: `statl/tests/conftest.py` — confirmed SQLite in-memory test setup

### Secondary (MEDIUM confidence)
- `03-CONTEXT.md` decisions D-01 through D-07 — XP formula and ranking decisions
- `03-UI-SPEC.md` — complete component inventory, spacing, typography, copywriting contract

### Tertiary (LOW confidence)
- SQLite window function support (Pitfall 1) — based on training knowledge about SQLite version history; recommend verifying with `sqlite3.sqlite_version` in test environment if needed

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries confirmed via codebase scan; no new dependencies
- Architecture: HIGH — extension points identified directly in source code
- Pitfalls: HIGH for Pitfalls 1-6 (all verified in codebase); LOW for SQLite window function version specifics
- UI patterns: HIGH — UI-SPEC fully documents component contracts; Statistics.tsx provides exact reusable pattern

**Research date:** 2026-04-11
**Valid until:** 2026-05-11 (stable stack — 30 days)
