# Phase 5: Statistics & Analytics - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-12T09:43:19-03:00
**Phase:** 05-statistics-analytics
**Areas discussed:** Canonical analytics source, student analytics structure, professor risk signal, admin KPI scope, pending todo alignment

---

## Canonical analytics source

| Option | Description | Selected |
|--------|-------------|----------|
| Keep legacy reads | Keep `quiz_resultados` / legacy aggregate reads alive while new analytics start using `answer_history` going forward | |
| Cut over + backfill answer-level data | Move to `answer_history` and backfill everything possible from exact prior answer-level sources | |
| Cut over and retire legacy analytics surfaces | Make `answer_history` canonical and remove/replace legacy analytics endpoints/screens that still depend on aggregate quiz history | ✓ |

**User's choice:** Cut over and retire legacy analytics surfaces.
**Notes:** The user first stated "exclua dados legados, implemente answer history" and then confirmed option `C`. The resulting intent is an opinionated cutover: analytics should stop being defined by legacy aggregate quiz-history reads.

---

## Student analytics structure

| Option | Description | Selected |
|--------|-------------|----------|
| Overview -> chapters -> topics -> 4-week trend | Domain dashboard ordered from high-level summary to learning breakdown to recent trend | ✓ |
| Overview -> strengths/weaknesses -> secondary drill-down | Highlight strengths/weaknesses first, keep chapter/topic drill-down secondary | |
| Other structure | Another ordering defined in free text | |

**User's choice:** Overview -> chapters -> topics -> 4-week trend.
**Notes:** The user wants a "painel de domínio", not just a generic stats card stack with recent attempts underneath.

---

## Professor risk signal

| Option | Description | Selected |
|--------|-------------|----------|
| Low accuracy on lists | Primary risk signal is poor performance/accuracy | ✓ |
| Non-submission or lateness | Primary risk signal is failure to submit on time | |
| Combined score | Accuracy and submission behavior carry similar weight | |
| Other rule | Another risk heuristic defined in free text | |

**User's choice:** Low accuracy on lists.
**Notes:** Lateness/non-submission can still appear, but the professor view should optimize first for identifying weak mastery/performance.

---

## Admin KPI scope

| Option | Description | Selected |
|--------|-------------|----------|
| Active users last 7 days | Platform adoption/activity KPI | |
| Total answers recorded | Core throughput KPI | |
| Accuracy by topic | Learning-quality KPI | |
| Activity counts by role | Operational activity split between `aluno` and `professor` | |
| All of the above | First version ships with the full KPI set | ✓ |

**User's choice:** All of the above.
**Notes:** The admin screen should be an operational KPI dashboard rather than a student ranking view with a few summary numbers.

---

## Pending todo alignment

| Option | Description | Selected |
|--------|-------------|----------|
| Keep the todo out of Phase 5 | Treat shared question-viewer neutralization as separate cleanup/backlog work | |
| Fold the todo into Phase 5 | Include the shared question-viewer namespace cleanup in this phase | ✓ |

**User's choice:** Fold the todo into Phase 5.
**Notes:** The user explicitly overrode the recommendation to defer it. The phase now includes moving the shared question viewer/listing out of the admin namespace while keeping admin-only SQL features isolated.

---

## the agent's Discretion

- Exact risk thresholds and visual severity states for "student at risk"
- Exact chart and layout choices for chapter/topic/trend sections
- Temporary compatibility handling for legacy aggregate tables after the analytics cutover
- Exact route/component split used to neutralize the shared question viewer

## Deferred Ideas

None.
