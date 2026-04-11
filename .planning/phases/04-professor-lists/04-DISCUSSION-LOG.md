# Phase 4: Professor Lists - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-11
**Phase:** 04-professor-lists
**Areas discussed:** authoring workflow, student surface, deadline behavior, professor results, shared question-viewer todo

---

## Authoring workflow

| Option | Description | Selected |
|--------|-------------|----------|
| Separate create/manage screens | Keep `Criar lista` and `Gerenciar Listas` as distinct professor screens, matching current UI | ✓ |
| Single combined composer | Merge authoring and management into one larger professor workspace | |
| Draft-first wizard | Force list creation through a staged wizard before management | |

**User's choice:** Keep it separate, the same way the current UI is already structured.
**Notes:** Published lists remain editable. The user also asked for an edit log/history to make post-publication changes visible.

---

## Student surface

| Option | Description | Selected |
|--------|-------------|----------|
| Home section | Add `Minhas Listas` directly to the student home screen | ✓ |
| Dedicated student tab | Create a separate student navigation destination just for lists | |
| Details-first flow | Keep access out of home and drive students through a dedicated list hub first | |

**User's choice:** Put it on the home screen.
**Notes:** This keeps the professor-only `listas` tab as-is while giving students a lightweight entry point on `home.tsx`.

---

## Deadline behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Hard block after deadline | Expired lists become read-only and cannot be answered anymore | |
| Late submissions allowed | Students can still answer after the deadline, but the submission is marked late | ✓ |
| Read-only expired review | Expired lists stay visible only for consultation, not response | |

**User's choice:** Allow response after expiry, but mark it as late and store/display when it was completed.
**Notes:** When a published list is edited later, the changed version should apply immediately to everyone instead of preserving older versions per student.

---

## Professor results

| Option | Description | Selected |
|--------|-------------|----------|
| Summary-first | Open results on an overview, with drill-down for students and questions | ✓ |
| Student-first | Open directly on a per-student roster with detail expansion | |
| Question-first | Lead with hardest questions / item analysis before overall summary | |

**User's choice:** Summary-first.
**Notes:** Even with summary-first landing, the user wants information by student and also by questions/lists available in the same overall results experience.

---

## Shared question-viewer todo

| Option | Description | Selected |
|--------|-------------|----------|
| Fold into Phase 4 | Fix the shared question viewer routing/ownership while building professor lists | ✓ |
| Defer to later cleanup | Leave the admin-routed viewer in place for now and clean it up later | |

**User's choice:** Fold it into this phase.
**Notes:** The professor list flow should not continue depending on `/(admin)/QuestaoViewer`.

---

## the agent's Discretion

- Exact student home card layout and empty/loading states for `Minhas Listas`
- Exact edit-log presentation style
- Exact badge/copy treatment for late submissions
- Exact summary metrics and ordering for professor analytics

## Deferred Ideas

- `lista-latek`: import raw LaTeX lists, extract questions/alternatives, support open-answer fallback, and expose a raw-LaTeX fallback toggle
- Notify students when a published list is edited
