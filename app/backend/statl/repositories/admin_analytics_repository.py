from datetime import datetime, timedelta

from sqlalchemy import text

from .. import db


def _cutoff_7d() -> datetime:
    return datetime.utcnow() - timedelta(days=7)


def get_admin_dashboard_rows() -> dict:
    cutoff = _cutoff_7d()

    total_answers = db.session.execute(
        text("SELECT COUNT(*) FROM answer_history"),
    ).scalar_one()

    aluno_activity_7d = db.session.execute(
        text("""
            SELECT COUNT(*)
            FROM answer_history ah
            JOIN users u ON u.id = ah.student_id
            WHERE ah.answered_at >= :cutoff
              AND u.role = 'aluno'
        """),
        {"cutoff": cutoff},
    ).scalar_one()

    professor_activity_7d = db.session.execute(
        text("""
            SELECT COUNT(*)
            FROM list_change_log lcl
            WHERE lcl.created_at >= :cutoff
        """),
        {"cutoff": cutoff},
    ).scalar_one()

    active_users_7d = db.session.execute(
        text("""
            WITH active_answer_users AS (
                SELECT DISTINCT ah.student_id AS user_id
                FROM answer_history ah
                WHERE ah.answered_at >= :cutoff
            ),
            active_professor_users AS (
                SELECT DISTINCT lcl.professor_id AS user_id
                FROM list_change_log lcl
                WHERE lcl.created_at >= :cutoff
            )
            SELECT COUNT(*)
            FROM (
                SELECT user_id FROM active_answer_users
                UNION
                SELECT user_id FROM active_professor_users
            ) active_users
        """),
        {"cutoff": cutoff},
    ).scalar_one()

    accuracy_by_topic = db.session.execute(
        text("""
            SELECT
                t.id AS topic_id,
                t.name AS topic_name,
                c.name AS chapter_name,
                COUNT(ah.id) AS answered_count,
                ROUND(
                    CASE
                        WHEN COUNT(ah.id) = 0 THEN 0
                        ELSE SUM(CASE WHEN ah.is_correct THEN 1 ELSE 0 END) * 100.0 / COUNT(ah.id)
                    END,
                    2
                ) AS accuracy_pct
            FROM answer_history ah
            JOIN questions q ON q.id = ah.question_id
            LEFT JOIN topics t ON t.id = q.topic_id
            LEFT JOIN chapters c ON c.id = q.chapter_id
            WHERE t.id IS NOT NULL
            GROUP BY t.id, t.name, c.name
            ORDER BY accuracy_pct ASC, answered_count DESC, t.id ASC
        """),
    ).mappings().all()

    return {
        "kpis": {
            "active_users_7d": int(active_users_7d or 0),
            "total_answers": int(total_answers or 0),
            "aluno_activity_7d": int(aluno_activity_7d or 0),
            "professor_activity_7d": int(professor_activity_7d or 0),
        },
        "accuracy_by_topic": accuracy_by_topic,
        "role_activity": [
            {"role": "aluno", "count_7d": int(aluno_activity_7d or 0)},
            {"role": "professor", "count_7d": int(professor_activity_7d or 0)},
        ],
    }
