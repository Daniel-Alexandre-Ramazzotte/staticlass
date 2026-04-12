# Phase 5: Statistics & Analytics - Context

**Gathered:** 2026-04-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the canonical analytics layer for Staticlass around per-answer history, then expose it in three places: a student-facing performance dashboard, professor-facing list analytics that highlight struggling students and problematic questions, and an admin-facing operational dashboard with platform KPIs.

This phase also folds in the pending cleanup to move the shared question viewer out of the admin namespace, even though that is structural work rather than pure analytics.

This phase does NOT add new practice modes, class/group management, notifications, or predictive/recommendation features.

</domain>

<decisions>
## Implementation Decisions

### Canonical analytics source
- **D-01:** Create `answer_history` as the canonical source of truth for Phase 5 analytics.
- **D-02:** Replace legacy student analytics reads that depend on `quiz_resultados`-backed endpoints/screens; do not keep the old analytics UX as a parallel source.
- **D-03:** Do not preserve synthetic legacy analytics that cannot be represented at answer level. If any historical migration is performed, it should only promote exact answer-level data into `answer_history`, not reconstructed aggregates.

### Student analytics experience
- **D-04:** The student stats experience should become a **domain-oriented dashboard**, not just a generic summary/history screen.
- **D-05:** Section order is fixed: **overview KPIs first, then chapter breakdown, then topic breakdown, then a 4-week accuracy trend**.

### Professor analytics focus
- **D-06:** Professor analytics should prioritize **identifying students at risk by low accuracy on lists**.
- **D-07:** Non-submission and lateness can still be shown, but they are secondary signals; the primary risk lens is accuracy.

### Admin dashboard scope
- **D-08:** The admin analytics surface should become an **operational platform dashboard**, not a ranking/list-of-students screen with a few extra numbers.
- **D-09:** The first version must include all of these KPIs: **active users in the last 7 days, total answers recorded, accuracy by topic, and activity counts by role (`aluno` / `professor`)**.

### Shared question-viewer cleanup
- **D-10:** Fold the pending cleanup into Phase 5: move the shared question viewer out of the admin namespace and expose its shared listing route through a neutral path/endpoint.
- **D-11:** Preserve admin-only SQL capabilities as admin-only; only the shared question-browsing/viewing surface should be neutralized.

### the agent's Discretion
- Exact schema for `answer_history` beyond the roadmap minimum, as long as it cleanly supports student, professor, and admin analytics.
- Exact thresholding/visual treatment for "student at risk", as long as **low accuracy** is the primary signal.
- Exact chart type and visual density for chapter/topic breakdowns and the 4-week trend.
- Whether aggregate legacy tables remain in the codebase temporarily for compatibility or audit, as long as they stop being the analytics source of truth.
- Exact route/component structure used to replace the current admin-namespaced shared question viewer.

### Folded Todos
- **Move shared question viewer out of admin namespace** — include this pending structural cleanup in Phase 5. The current shared question viewer/listing still carries admin semantics even when used outside admin workflows. This phase should move it to a neutral route/endpoint while preserving admin-only features such as SQL tooling.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Roadmap and scope
- `.planning/ROADMAP.md` — Phase 5 goal, plan breakdown, success criteria, and dependencies on Phases 3 and 4
- `.planning/PROJECT.md` — product constraints, active requirements, and v1 boundaries
- `.planning/STATE.md` — current milestone status and current focus
- `.planning/todos/pending/2026-04-10-move-shared-question-viewer-out-of-admin-namespace.md` — folded todo that is now part of Phase 5 scope

### Current student analytics and legacy reads
- `app/backend/statl/repositories/resultado_repository.py` — current `quiz_resultados` persistence and legacy aggregated student stats/history queries
- `app/backend/statl/services/resultado_service.py` — current student stats/history response shaping
- `app/backend/statl/routes/users.py` — existing `/users/estatisticas` and `/users/historico` endpoints to replace or retire
- `app/frontend/app/(app)/Statistics.tsx` — current student statistics screen that is summary/history oriented
- `app/frontend/app/(tabs)/profile.tsx` — current student profile entry point that links to statistics and already shows XP/streak/rank context

### Quiz flow and answer capture
- `app/frontend/app/(app)/QuizInProgressScreen.tsx` — free-practice and list quiz flow where per-answer capture originates
- `app/frontend/app/(app)/ResultScreen.tsx` — current completion flow for free practice and lists; key integration point for answer-history write and post-quiz analytics handoff
- `app/backend/statl/services/gamification_service.py` — current session recording path that already runs when quizzes finish
- `app/backend/statl/routes/gamification.py` — ranking/session endpoints that interact with the post-quiz flow

### List answer data and professor analytics
- `app/backend/statl/models/listas.py` — `list_submissions` and `list_submission_answers` schema
- `app/backend/statl/repositories/lists_repository.py` — existing per-student, per-question, and summary analytics for published lists
- `app/backend/statl/routes/lists.py` — current professor/student list analytics endpoints and integration points
- `app/frontend/src/components/lists/ListResultsPanel.tsx` — current summary-first professor results UI that can be evolved toward risk-oriented analytics

### Admin analytics surfaces
- `app/backend/statl/routes/admin.py` — current admin stats endpoints and admin-only SQL route
- `app/frontend/app/(admin)/EstatisticasAdmin.tsx` — admin stats screen entry point
- `app/frontend/app/(tabs)/stats.tsx` — admin tab surface for statistics
- `app/frontend/src/components/admin/EstatisticasCompartilhadas.tsx` — reusable ranking/student card patterns currently used in admin analytics

### Schema and navigation constraints
- `app/backend/statl/__init__.py` — incremental PostgreSQL schema setup pattern to extend with Phase 5 tables/indexes
- `app/frontend/app/(tabs)/_layout.tsx` — role-gated tab registration; confirms where admin stats and student navigation live

### Shared question-viewer cleanup
- `app/frontend/app/(admin)/QuestaoViewer.tsx` — current admin-namespaced screen still hosting shared question browsing
- `app/frontend/src/components/questions/SharedQuestionViewer.tsx` — shared question-viewer component already extracted at component level
- `app/frontend/app/(tabs)/listas.tsx` — professor flow that still depends on admin-semantic question-viewer routing

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `app/frontend/app/(app)/Statistics.tsx`: existing student stats screen that can be upgraded instead of replaced from scratch
- `app/frontend/app/(tabs)/profile.tsx`: already fetches profile, ranking, and history data and is the natural launch point into richer student analytics
- `app/backend/statl/repositories/lists_repository.py`: already computes submission rates, average scores, and per-question error rates for professor list results
- `app/frontend/src/components/lists/ListResultsPanel.tsx`: already embodies the summary-first professor analytics pattern from Phase 4
- `app/frontend/src/components/admin/EstatisticasCompartilhadas.tsx`: existing admin ranking/student cards can be repurposed or partially retired depending on the new KPI layout
- `app/frontend/src/components/questions/SharedQuestionViewer.tsx`: shared viewer logic already exists at component level, reducing the cost of removing admin-only routing semantics

### Established Patterns
- Role-gated navigation is centralized in `app/frontend/app/(tabs)/_layout.tsx`
- Frontend analytics/profile screens use `useFocusEffect` plus API fetches to refresh on focus
- PostgreSQL schema changes are applied incrementally in `app/backend/statl/__init__.py`
- Quiz completion already flows through `QuizInProgressScreen` -> `ResultScreen` -> backend session recording
- Professor list analytics already rely on answer-level rows in `list_submission_answers`, which is the closest existing pattern to the new canonical `answer_history`

### Integration Points
- `answer_history` must connect to the free-practice flow and the list-submission flow so analytics stop depending on aggregate-only quiz history
- Student analytics should replace the current legacy stats contract used by `Statistics.tsx` and its profile entry point
- Professor analytics should extend the current list-results pipeline rather than inventing a second unrelated professor stats surface
- Admin operational KPIs should replace the current ranking-centric admin stats surfaces
- Shared question-viewer cleanup spans frontend routes/components and backend shared question-listing endpoints, but must leave admin SQL tooling isolated

</code_context>

<specifics>
## Specific Ideas

- The student dashboard should feel like a **learning-domain panel**: quick overview first, then chapter mastery, then topic-level detail, then recent trend.
- The professor view should answer "who is struggling?" before it answers "what happened overall?".
- The admin dashboard should read like operational health for the app, not just leaderboard administration.
- The analytics cutover should be opinionated: Phase 5 is the point where `answer_history` becomes canonical and legacy aggregate analytics stop defining the UX.
- Even though the shared question-viewer cleanup is not analytics work, the user explicitly wants it bundled into this phase rather than deferred again.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within Phase 5 scope, except for the explicit decision to fold the pending shared question-viewer cleanup into this phase.

</deferred>

---

*Phase: 05-statistics-analytics*
*Context gathered: 2026-04-12*
