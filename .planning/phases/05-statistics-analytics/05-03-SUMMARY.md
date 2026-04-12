# Phase 05-03 Summary

## Professor Analytics
- `GET /lists/<id>/results` now returns `risk_students`, `score_distribution`, `late_students`, and `at_risk_students` alongside the existing summary, student roster, per-question breakdown, and change log.
- Risk ordering is server-side and risk-first: submitted low-score students come first, then late submissions at the same score, then `em_andamento`, then `nova`.
- Risk bands are normalized to `critico`, `atencao`, and `ok`, with low accuracy as the primary signal and lateness handled as a secondary signal.
- `score_distribution` is emitted in the fixed buckets `0-49`, `50-69`, and `70-100`.

## Admin Dashboard
- A new admin-only `GET /admin/stats/dashboard` endpoint now provides the operational payload for both admin stats screens.
- The payload is KPI-first: `active_users_7d`, `total_answers`, `aluno_activity_7d`, and `professor_activity_7d`.
- The dashboard also returns `accuracy_by_topic` sorted worst-first and `role_activity` for `aluno` and `professor`.
- KPI totals are sourced from canonical Phase 5 activity data, not the old ranking-centric student aggregate path.

## Screen Cutovers
- `app/frontend/src/components/lists/ListResultsPanel.tsx` now opens with `Alunos em risco` before the existing `Questões`, student roster, and `Histórico de alterações` sections.
- `app/frontend/app/(tabs)/stats.tsx` and `app/frontend/app/(admin)/EstatisticasAdmin.tsx` now call `/admin/stats/dashboard` and no longer render ranking/alunos tabs.
- The admin stats screens now render KPI cards first, then topic accuracy, then role activity.

## Neutral Browse Cleanup
- `app/frontend/src/components/questions/SharedQuestionViewer.tsx` now calls `GET /questions/browse` instead of `/admin/questoes`.
- `app/backend/statl/routes/questions.py` now exposes `GET /questions/browse` for `admin` and `professor`, while preserving `can_manage` semantics and the legacy `professor_id` compatibility fallback.
- `app/frontend/app/(professor)/ProfessorMenu.tsx` now sends `Gerenciar Questões` to `/(app)/QuestionPicker`.
- `/admin/sql` remains admin-only and unchanged.
