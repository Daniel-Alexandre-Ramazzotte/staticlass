from __future__ import annotations

from datetime import date, timedelta
from typing import Any

from sqlalchemy import text

from .. import db


def _normalize_day(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, date):
        return value.isoformat()
    if hasattr(value, "date"):
        return value.date().isoformat()
    return str(value)[:10]


def _pt_br_week_label(day_value: date) -> str:
    months = {
        1: "jan",
        2: "fev",
        3: "mar",
        4: "abr",
        5: "mai",
        6: "jun",
        7: "jul",
        8: "ago",
        9: "set",
        10: "out",
        11: "nov",
        12: "dez",
    }
    return f"{day_value.day:02d} {months[day_value.month]}"


def _as_float(value: Any) -> float:
    if value is None:
        return 0.0
    return float(value)


def _as_int(value: Any) -> int:
    if value is None:
        return 0
    return int(value)


def get_student_dashboard(student_id: int) -> dict[str, Any]:
    today = date.today()
    start_date = today - timedelta(days=27)
    rows = db.session.execute(
        text("""
            SELECT
                ah.answered_at,
                ah.is_correct,
                q.chapter_id,
                c.name AS chapter_name,
                c.number AS chapter_number,
                q.topic_id,
                t.name AS topic_name
            FROM answer_history ah
            JOIN questions q ON q.id = ah.question_id
            LEFT JOIN chapters c ON c.id = q.chapter_id
            LEFT JOIN topics t ON t.id = q.topic_id
            WHERE ah.student_id = :student_id
              AND ah.answered_at >= :start_date
              AND ah.answered_at < :end_date
            ORDER BY ah.answered_at ASC, ah.id ASC
        """),
        {
            "student_id": student_id,
            "start_date": start_date,
            "end_date": today + timedelta(days=1),
        },
    ).mappings().all()

    overview = {
        "total_answers": 0,
        "correct_answers": 0,
        "overall_accuracy_pct": 0.0,
    }
    chapters: dict[tuple[Any, Any], dict[str, Any]] = {}
    topics: dict[tuple[Any, Any], dict[str, Any]] = {}

    buckets = []
    for week_index in range(4):
        week_start = start_date + timedelta(days=week_index * 7)
        buckets.append(
            {
                "week_start": week_start.isoformat(),
                "label": _pt_br_week_label(week_start),
                "answered_count": 0,
                "correct_count": 0,
                "accuracy_pct": 0.0,
            }
        )

    for row in rows:
        is_correct = bool(row["is_correct"])
        overview["total_answers"] += 1
        overview["correct_answers"] += 1 if is_correct else 0

        answered_at = row["answered_at"]
        if hasattr(answered_at, "date"):
            answered_date = answered_at.date()
        else:
            answered_date = date.fromisoformat(_normalize_day(answered_at))

        bucket_index = min(3, max(0, (answered_date - start_date).days // 7))
        bucket = buckets[bucket_index]
        bucket["answered_count"] += 1
        bucket["correct_count"] += 1 if is_correct else 0

        chapter_id = row["chapter_id"]
        chapter_key = (chapter_id, row["chapter_name"] or "Sem capítulo")
        chapter_entry = chapters.setdefault(
            chapter_key,
            {
                "chapter_id": chapter_id,
                "chapter_name": row["chapter_name"] or "Sem capítulo",
                "chapter_number": _as_int(row["chapter_number"]) if row["chapter_number"] is not None else None,
                "answered_count": 0,
                "correct_count": 0,
                "_sort_key": (
                    _as_int(row["chapter_number"]) if row["chapter_number"] is not None else 10**9,
                    row["chapter_name"] or "Sem capítulo",
                ),
            },
        )
        chapter_entry["answered_count"] += 1
        chapter_entry["correct_count"] += 1 if is_correct else 0

        topic_id = row["topic_id"]
        topic_key = (topic_id, row["topic_name"] or "Sem tópico", chapter_id)
        topic_entry = topics.setdefault(
            topic_key,
            {
                "topic_id": topic_id,
                "topic_name": row["topic_name"] or "Sem tópico",
                "chapter_id": chapter_id,
                "chapter_name": row["chapter_name"] or "Sem capítulo",
                "answered_count": 0,
                "correct_count": 0,
                "_sort_key": (
                    _as_int(row["chapter_number"]) if row["chapter_number"] is not None else 10**9,
                    row["topic_name"] or "Sem tópico",
                ),
            },
        )
        topic_entry["answered_count"] += 1
        topic_entry["correct_count"] += 1 if is_correct else 0

    total_answers = overview["total_answers"]
    overview["overall_accuracy_pct"] = round(
        (overview["correct_answers"] * 100.0 / total_answers) if total_answers else 0.0,
        1,
    )

    chapter_rows = []
    for entry in sorted(chapters.values(), key=lambda item: item["_sort_key"]):
        answered_count = entry["answered_count"]
        correct_count = entry["correct_count"]
        chapter_rows.append(
            {
                "chapter_id": entry["chapter_id"],
                "chapter_name": entry["chapter_name"],
                "answered_count": _as_int(answered_count),
                "correct_count": _as_int(correct_count),
                "accuracy_pct": round(
                    (correct_count * 100.0 / answered_count) if answered_count else 0.0,
                    1,
                ),
            }
        )

    topic_rows = []
    for entry in sorted(topics.values(), key=lambda item: item["_sort_key"]):
        answered_count = entry["answered_count"]
        correct_count = entry["correct_count"]
        topic_rows.append(
            {
                "topic_id": entry["topic_id"],
                "topic_name": entry["topic_name"],
                "chapter_id": entry["chapter_id"],
                "chapter_name": entry["chapter_name"],
                "answered_count": _as_int(answered_count),
                "correct_count": _as_int(correct_count),
                "accuracy_pct": round(
                    (correct_count * 100.0 / answered_count) if answered_count else 0.0,
                    1,
                ),
            }
        )

    for bucket in buckets:
        answered_count = bucket["answered_count"]
        correct_count = bucket["correct_count"]
        bucket["accuracy_pct"] = round(
            (correct_count * 100.0 / answered_count) if answered_count else 0.0,
            1,
        )

    return {
        "overview": overview,
        "chapters": chapter_rows,
        "topics": topic_rows,
        "trend_4w": buckets,
    }


def get_student_activity_days(student_id: int, days: int = 28) -> list[str]:
    days = max(1, int(days))
    start_date = date.today() - timedelta(days=days - 1)

    rows = db.session.execute(
        text("""
            SELECT ah.answered_at
            FROM answer_history ah
            WHERE ah.student_id = :student_id
              AND ah.answered_at >= :start_date
            ORDER BY ah.answered_at ASC
        """),
        {
            "student_id": student_id,
            "start_date": start_date,
        },
    ).mappings().all()

    unique_days = {
        _normalize_day(row["answered_at"])
        for row in rows
        if _normalize_day(row["answered_at"])
    }
    return sorted(unique_days)
