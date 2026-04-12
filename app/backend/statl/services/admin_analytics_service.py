from decimal import Decimal

from ..repositories.admin_analytics_repository import get_admin_dashboard_rows


def _serialize_number(value):
    if value is None:
        return 0
    if isinstance(value, Decimal):
        return float(value)
    return float(value)


def admin_dashboard_service():
    rows = get_admin_dashboard_rows()
    return {
        "kpis": {
            "active_users_7d": int(rows["kpis"]["active_users_7d"]),
            "total_answers": int(rows["kpis"]["total_answers"]),
            "aluno_activity_7d": int(rows["kpis"]["aluno_activity_7d"]),
            "professor_activity_7d": int(rows["kpis"]["professor_activity_7d"]),
        },
        "accuracy_by_topic": [
            {
                "topic_id": int(row["topic_id"]),
                "topic_name": row["topic_name"],
                "chapter_name": row["chapter_name"],
                "answered_count": int(row["answered_count"] or 0),
                "accuracy_pct": _serialize_number(row["accuracy_pct"]),
            }
            for row in rows["accuracy_by_topic"]
        ],
        "role_activity": [
            {
                "role": row["role"],
                "count_7d": int(row["count_7d"] or 0),
            }
            for row in rows["role_activity"]
        ],
    }, 200
