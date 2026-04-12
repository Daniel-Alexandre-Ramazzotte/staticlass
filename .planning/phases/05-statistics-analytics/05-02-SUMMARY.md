# Phase 05-02 Summary

## Backend payloads

`GET /users/analytics/dashboard`

```json
{
  "overview": {
    "total_answers": 42,
    "correct_answers": 31,
    "overall_accuracy_pct": 73.8
  },
  "chapters": [
    {
      "chapter_id": 1,
      "chapter_name": "Estatística Básica",
      "answered_count": 12,
      "correct_count": 9,
      "accuracy_pct": 75.0
    }
  ],
  "topics": [
    {
      "topic_id": 11,
      "topic_name": "Distribuição de frequências",
      "chapter_id": 1,
      "chapter_name": "Estatística Básica",
      "answered_count": 5,
      "correct_count": 4,
      "accuracy_pct": 80.0
    }
  ],
  "trend_4w": [
    {
      "week_start": "2026-03-16",
      "label": "16 mar",
      "answered_count": 8,
      "correct_count": 6,
      "accuracy_pct": 75.0
    }
  ]
}
```

Rules:
- `trend_4w` always returns exactly 4 weekly buckets ordered oldest to newest.
- Chapter and topic rows are aggregated from `answer_history` joined to `questions`, `chapters`, and `topics`.
- Empty analytics returns zeroed overview values, empty `chapters` and `topics`, and four zeroed trend buckets.

`GET /users/analytics/activity`

```json
{
  "days": ["2026-04-01", "2026-04-03", "2026-04-07"]
}
```

Rules:
- `days` contains unique `YYYY-MM-DD` strings from the last 28 days only.
- The route derives the student id only from the JWT identity.

## UI section order

`app/frontend/app/(app)/Statistics.tsx` now renders sections in this exact order:
- overview KPI cards
- chapter breakdown
- topic breakdown
- 4-week trend

The screen no longer calls `/users/estatisticas` or `/users/historico`.

## Profile calendar cutover

`app/frontend/app/(tabs)/profile.tsx` now loads the calendar from `/users/analytics/activity` and keeps the existing `buildCalendar()` helper.

Fetch failure behavior is unchanged:
- previous calendar data remains visible if the analytics request fails
- the app still refreshes XP, streak, and ranking from the other profile endpoints when those requests succeed
