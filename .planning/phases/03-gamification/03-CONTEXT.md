# Phase 3: Gamification - Context

**Gathered:** 2026-04-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Add XP accumulation, daily streak tracking, and a global ranking to the student experience. Every quiz session updates the student's XP (with streak multiplier) and streak counter. Students can see their XP, streak, and ranking position on the profile screen and browse the full leaderboard on a dedicated Ranking screen.

This phase does NOT add new question types, professor features, or list functionality — those belong to Phases 2 and 4.

</domain>

<decisions>
## Implementation Decisions

### XP Formula
- **D-01:** Purely additive — only correct answers earn XP. No XP penalty for wrong answers (keeps it motivating, consistent with Duolingo spirit).
- **D-02:** Base rate: **10 XP per correct answer** (existing `score` column already works this way — keep the rate).
- **D-03:** Session completion bonus: **+20 XP flat** for finishing any quiz, added on top of per-answer XP regardless of performance.
- **D-04:** Streak multiplier tiers applied to the total XP earned in a session (per-answer + completion bonus):
  - streak < 3 days → no multiplier (1×)
  - streak ≥ 3 days → **1.25×**
  - streak ≥ 7 days → **1.5×**

  Example: 5-question quiz, 3 correct, streak = 7 days → (3 × 10 + 20) × 1.5 = 75 XP

### Ranking
- **D-05:** Global all-time ranking only for v1 — no weekly reset or scope toggle.
- **D-06:** **Top-100** students visible, loaded in pages (e.g. first 20, load more on scroll).
- **D-07:** The logged-in student's own row is **always pinned at the bottom** of the ranking list, showing their rank and XP even if they are outside top-100. This mirrors the Duolingo pattern.

### Claude's Discretion
- Streak reset behavior: follow ROADMAP spec (streak advances if practiced today, resets if a day was skipped — use calendar day boundary, not 24h rolling window).
- Whether to rename the existing `score` column to `xp` in the database migration, or keep `score` and alias it `xp` in API responses — planner decides based on migration risk.
- Whether to create a new `/gamification/` Flask blueprint or extend the existing `/users/` routes — planner decides based on route cohesion; lean toward new blueprint per ROADMAP spec.
- Streak reset value when a day is skipped: 0 (clean restart) or 1 (today counts) — planner follows ROADMAP wording ("resets streak if a day was skipped").
- Exact page size for paginated ranking (suggest 20 per page).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

No external spec or ADR documents exist for this phase. Requirements are fully captured in the decisions above.

### Key source files to read before implementing

- `app/backend/statl/models/user.py` — `User` model; `score` column exists (int, nullable, default 0); `streak` and `last_practice_date` must be added
- `app/backend/statl/repositories/resultado_repository.py` — `incrementar_score()` and `buscar_ranking()` (top-10) — extend/replace for new XP formula and top-100 pagination
- `app/backend/statl/services/resultado_service.py` — `salvar_resultado_service()` awards 10 pts/correct; extend to add completion bonus and streak multiplier
- `app/backend/statl/routes/users.py` — existing `/users/salvar-resultado`, `/users/ranking`, `/users/estatisticas` routes; note which to migrate to new `/gamification/` blueprint
- `app/frontend/app/(app)/Ranking.tsx` — stub screen ("em breve"); implement leaderboard here
- `app/frontend/app/(app)/ResultScreen.tsx` — already calls `/users/salvar-resultado` and shows "+{acertos*10} pts"; update display when XP changes
- `app/frontend/app/(tabs)/home.tsx` — student subtitle currently shows "Nível 1 ⭐"; could surface streak or XP here
- `app/frontend/app/context/AuthContext.tsx` — check if XP/streak need to be added to the auth context or fetched separately on profile screen

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `score` column on `users` table — this is the current XP field; already incremented after every quiz via `incrementar_score()`
- `buscar_ranking()` in `resultado_repository.py` — returns top-10 `aluno` users by `score`; extend to top-100 with offset/limit params
- `ResultScreen.tsx` — already shows "+{acertos*10} pts" and calls the save endpoint; update copy to reflect actual XP earned (with multiplier)
- `Statistics.tsx` fetch pattern — `useFocusEffect` + `Promise.all` + `api.get()` — reuse on profile screen for XP/streak data

### Established Patterns
- XP increment: `UPDATE users SET score = COALESCE(score, 0) + :pontos WHERE id = :id` — extend this logic for streak multiplier in service layer
- Backend auth: `@require_role(['aluno'])` or `@require_role(['aluno', 'professor'])` via `auth_middleware.py`
- Frontend palette: `palette.primaryGreen` for positive stats, `palette.darkBlue` for counts, `palette.red` for reset/negative

### Integration Points
- Quiz result flow: `ResultScreen.tsx` → `POST /users/salvar-resultado` → `salvar_resultado_service()` → `incrementar_score()`. The streak + multiplier logic slots into this service call.
- Ranking screen: `Ranking.tsx` already exists as a stub in `(app)/` — just needs implementation; navigation to it is likely already wired in tab bar or from profile.
- Profile screen: XP, streak, and rank position to be added to the student profile tab (check `(tabs)/profile.tsx` or equivalent).

</code_context>

<specifics>
## Specific Ideas

- The multiplier applies to the total XP earned in a session (per-answer XP + completion bonus combined), not just the per-answer component.
- The "+N pts" display in `ResultScreen.tsx` should be updated to show the actual XP earned after multiplier (e.g. "+75 XP" instead of "+30 pts") — makes the multiplier visible to the student.
- Duolingo-style pinned own-row: if the student is rank #200, the list shows ranks 1–20 (first page), and a pinned row at the bottom always shows "#200 — Your Name — 450 XP".

</specifics>

<deferred>
## Deferred Ideas

- Weekly or monthly leaderboard scope toggle — deferred to post-v1; global all-time only for now.
- XP level tiers (Nível 1, Nível 2…) based on XP thresholds — referenced in `home.tsx` subtitle ("Nível 1 ⭐"); implementing actual tier logic is out of scope for this phase (Phase 6 polish or later).

</deferred>

---

*Phase: 03-gamification*
*Context gathered: 2026-04-11*
