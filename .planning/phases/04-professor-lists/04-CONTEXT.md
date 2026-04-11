# Phase 4: Professor Lists - Context

**Gathered:** 2026-04-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement the end-to-end professor list workflow already defined in the roadmap: professors create, edit, publish, and review question lists with deadlines; students see assigned lists from the app, complete them, and submit results; professors review summary results plus student/question breakdowns.

This phase keeps the existing roadmap boundary: lists are still published to all students, not to custom groups or classes. It also does NOT add new import pipelines, OCR/LaTeX parsing, or a general notification system.

</domain>

<decisions>
## Implementation Decisions

### Authoring workflow
- **D-01:** Keep the professor authoring flow split into **separate screens** for `Criar lista` and `Gerenciar Listas`, matching the current UI structure. Do not collapse everything into a single composer.
- **D-02:** Published lists remain **editable** by the professor after publication.
- **D-03:** When a published list is edited, the updated version applies **immediately to all students**. No version pinning for students who already started or already submitted.
- **D-04:** Surface a visible **edit log/history** for published-list changes so list updates are transparent instead of silent.

### Student access and submission
- **D-05:** Student entry point is a **`Minhas Listas` section on the home screen**, not a separate student-only tab.
- **D-06:** Lists remain **answerable after the deadline**. Expiration does not block access or submission.
- **D-07:** Late submissions must be clearly marked as **atrasada/fora do prazo** and store/display the **actual completion date/time**.

### Professor results view
- **D-08:** The professor results experience is **summary-first** by default.
- **D-09:** Even though the landing view is summary-first, it must still expose drill-down or adjacent views for **per-student** and **per-question/per-list** information.

### the agent's Discretion
- Exact structure and placement of the student home cards inside `Minhas Listas`
- Exact presentation of late-state badges/chips/copy
- Exact edit-log UI shape (timeline, compact history list, inline metadata, etc.)
- Exact ordering and visualization of summary metrics in the professor results screen
- Data-model details for edit-log entries and late-submission timestamps, as long as they support the decisions above

### Folded Todos
- **Move shared question viewer out of admin namespace** — fold this into Phase 4. Today the professor list flow still routes through `/(admin)/QuestaoViewer`, which is structurally wrong for a professor-authored list workflow. The list-authoring experience should use a shared question picker/viewer that is no longer branded or routed as admin-only.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Roadmap and project scope
- `.planning/ROADMAP.md` — Phase 4 goal, plan breakdown, success criteria, and dependency boundary
- `.planning/PROJECT.md` — active requirements and product constraints for professor-created lists
- `.planning/STATE.md` — current milestone status and phase sequencing context

### Existing professor list entry points
- `app/frontend/app/(tabs)/_layout.tsx` — role-gated tab registration; professor already has a `listas` tab
- `app/frontend/app/(tabs)/listas.tsx` — current professor tab shell with `Criar lista`, `Gerenciar Listas`, and the legacy route to `/(admin)/QuestaoViewer`
- `app/frontend/app/(professor)/CreateNewList.tsx` — existing WIP screen for list creation
- `app/frontend/app/(professor)/ListManager.tsx` — existing WIP screen for list management

### Student entry points and quiz flow
- `app/frontend/app/(tabs)/home.tsx` — target surface for the student `Minhas Listas` section
- `app/frontend/app/(app)/QuizInProgressScreen.tsx` — existing quiz runner that Phase 4 should adapt/reuse for list-solving flow
- `app/frontend/app/(app)/ResultScreen.tsx` — existing post-quiz result handoff that will likely need list-submission integration

### Question selection and shared question-viewer cleanup
- `app/frontend/app/(admin)/QuestaoViewer.tsx` — current shared question-management UI that professor flows still depend on
- `app/frontend/app/(professor)/AddNewQuestion.tsx` — currently hardcodes return routes back into `/(admin)/QuestaoViewer`
- `app/backend/statl/routes/admin.py` — current `/admin/questoes` listing route and admin stats endpoints
- `app/backend/statl/routes/questions.py` — question filters, professor question access, and auth patterns used by authoring flows

### Reusable analytics and backend patterns
- `app/frontend/src/components/admin/EstatisticasCompartilhadas.tsx` — reusable summary-first/per-student card pattern for professor results
- `app/backend/statl/__init__.py` — blueprint registration and incremental schema pattern to follow for new list tables/columns/routes
- `app/backend/statl/routes/users.py` — existing auth-protected profile/history patterns and naming conventions for user-related reads

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `app/frontend/app/(tabs)/listas.tsx`: already provides the professor-facing entry tab and the two intended navigation branches (`Criar lista`, `Gerenciar Listas`)
- `app/frontend/app/(professor)/CreateNewList.tsx` and `ListManager.tsx`: placeholder screens that can be upgraded instead of replaced
- `app/frontend/app/(admin)/QuestaoViewer.tsx`: already has chapter/topic/difficulty/source filtering, paginated browsing, and question-detail cards that can be repurposed into a shared picker
- `app/frontend/app/(app)/QuizInProgressScreen.tsx`: existing quiz engine for rendering questions, collecting answers, and advancing through a list of selected IDs
- `app/frontend/src/components/admin/EstatisticasCompartilhadas.tsx`: already implements summary cards with expandable per-student detail, which is a strong fit for the requested summary-first professor results screen

### Established Patterns
- Role-gated navigation lives in Expo Router tab config inside `app/frontend/app/(tabs)/_layout.tsx`
- Backend auth is enforced with `@require_role(...)` / `@jwt_required()` and should be preserved for all list endpoints
- Schema changes are done incrementally in `app/backend/statl/__init__.py` through `_garantir_schema_incremental(...)`
- Question filtering already supports chapter/topic/difficulty/source, so the list composer should reuse these filters instead of inventing a new query model

### Integration Points
- Student `Minhas Listas` should plug into `app/frontend/app/(tabs)/home.tsx`
- Professor list authoring remains anchored to the existing `listas` tab and the two professor WIP screens
- The future list backend should live under its own `/lists` routes/blueprint, then register via `app/backend/statl/__init__.py`
- List completion should connect into the existing quiz/result flow rather than creating a second unrelated answering experience
- The shared question-viewer cleanup is part of this phase because list authoring currently depends on admin-routed question browsing

</code_context>

<specifics>
## Specific Ideas

- Preserve the current mental model already implied by the UI: one screen to create/build a list, another to manage and review existing lists
- Expired lists stay visible and answerable, but they must display explicit late markers plus the real completion timestamp
- Professor results should open on a summary dashboard first, then allow inspection by student and by question/list
- Published-list edits are global immediately; this is intentionally simpler than versioned submissions
- Edit history should be visible so professors can understand what changed after publication

</specifics>

<deferred>
## Deferred Ideas

- **LaTeX list ingestion (`lista-latek`)** — importing a raw LaTeX list, extracting questions/alternatives automatically, supporting open-answer fallback when no alternatives are present, and adding a raw-LaTeX fallback viewer are all outside the fixed Phase 4 boundary. This should become its own future phase.
- **Student notifications after published-list edits** — notifying everyone when a list changes implies a notification system, which the roadmap does not currently scope for Phase 4.

</deferred>

---

*Phase: 04-professor-lists*
*Context gathered: 2026-04-11*
