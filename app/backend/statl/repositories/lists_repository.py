from datetime import datetime
from typing import Iterable

from sqlalchemy import text

from .. import db


def _placeholder_clause(prefixo: str, valores: Iterable[int]) -> tuple[str, dict]:
    valores = list(valores)
    placeholders = ", ".join(f":{prefixo}{idx}" for idx in range(len(valores)))
    params = {f"{prefixo}{idx}": valor for idx, valor in enumerate(valores)}
    return placeholders, params


def create_list(professor_id: int, title: str, deadline: datetime) -> int:
    return db.session.execute(
        text("""
            INSERT INTO lists (professor_id, title, deadline, published, created_at, updated_at)
            VALUES (:professor_id, :title, :deadline, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING id
        """),
        {
            "professor_id": professor_id,
            "title": title,
            "deadline": deadline,
        },
    ).scalar_one()


def update_list_metadata(
    list_id: int,
    professor_id: int,
    title: str,
    deadline: datetime,
    turma_id: int | None = None,
    update_turma: bool = False,
) -> None:
    if update_turma:
        db.session.execute(
            text("""
                UPDATE lists
                SET title = :title,
                    deadline = :deadline,
                    turma_id = :turma_id,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = :list_id AND professor_id = :professor_id
            """),
            {
                "list_id": list_id,
                "professor_id": professor_id,
                "title": title,
                "deadline": deadline,
                "turma_id": turma_id,
            },
        )
    else:
        db.session.execute(
            text("""
                UPDATE lists
                SET title = :title,
                    deadline = :deadline,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = :list_id AND professor_id = :professor_id
            """),
            {
                "list_id": list_id,
                "professor_id": professor_id,
                "title": title,
                "deadline": deadline,
            },
        )


def replace_list_questions(list_id: int, question_ids: list[int]) -> None:
    db.session.execute(
        text("DELETE FROM list_questions WHERE list_id = :list_id"),
        {"list_id": list_id},
    )
    if not question_ids:
        return

    db.session.execute(
        text("""
            INSERT INTO list_questions (list_id, question_id, order_index)
            VALUES (:list_id, :question_id, :order_index)
        """),
        [
            {
                "list_id": list_id,
                "question_id": question_id,
                "order_index": index,
            }
            for index, question_id in enumerate(question_ids, start=1)
        ],
    )


def publish_list(list_id: int, professor_id: int) -> None:
    db.session.execute(
        text("""
            UPDATE lists
            SET published = TRUE,
                published_at = COALESCE(published_at, CURRENT_TIMESTAMP),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = :list_id AND professor_id = :professor_id
        """),
        {"list_id": list_id, "professor_id": professor_id},
    )


def add_change_log(list_id: int, professor_id: int, action: str, summary: str) -> None:
    db.session.execute(
        text("""
            INSERT INTO list_change_log (list_id, professor_id, action, summary, created_at)
            VALUES (:list_id, :professor_id, :action, :summary, CURRENT_TIMESTAMP)
        """),
        {
            "list_id": list_id,
            "professor_id": professor_id,
            "action": action,
            "summary": summary,
        },
    )


def list_change_log(list_id: int) -> list[dict]:
    return db.session.execute(
        text("""
            SELECT id, action, summary, created_at
            FROM list_change_log
            WHERE list_id = :list_id
            ORDER BY created_at DESC, id DESC
        """),
        {"list_id": list_id},
    ).mappings().all()


def get_professor_list_row(list_id: int, professor_id: int):
    return db.session.execute(
        text("""
            SELECT
                l.id,
                l.professor_id,
                l.title,
                l.deadline,
                l.published,
                l.published_at,
                l.created_at,
                l.updated_at,
                l.turma_id,
                (SELECT COUNT(*) FROM list_questions lq WHERE lq.list_id = l.id) AS question_count
            FROM lists l
            WHERE l.id = :list_id AND l.professor_id = :professor_id
        """),
        {"list_id": list_id, "professor_id": professor_id},
    ).mappings().fetchone()


def get_published_list_row(list_id: int):
    return db.session.execute(
        text("""
            SELECT
                l.id,
                l.professor_id,
                l.title,
                l.deadline,
                l.published,
                l.published_at,
                l.created_at,
                l.updated_at,
                (SELECT COUNT(*) FROM list_questions lq WHERE lq.list_id = l.id) AS question_count
            FROM lists l
            WHERE l.id = :list_id AND l.published = TRUE
        """),
        {"list_id": list_id},
    ).mappings().fetchone()


def get_list_question_ids(list_id: int) -> list[int]:
    rows = db.session.execute(
        text("""
            SELECT question_id
            FROM list_questions
            WHERE list_id = :list_id
            ORDER BY order_index ASC
        """),
        {"list_id": list_id},
    ).mappings().all()
    return [int(row["question_id"]) for row in rows]


def list_professor_question_ids(professor_id: int, question_ids: list[int]) -> list[int]:
    if not question_ids:
        return []

    placeholders, params = _placeholder_clause("qid", question_ids)
    params["professor_id"] = professor_id
    rows = db.session.execute(
        text(f"""
            SELECT id
            FROM questions
            WHERE professor_id = :professor_id
              AND id IN ({placeholders})
        """),
        params,
    ).mappings().all()
    return [int(row["id"]) for row in rows]


def list_professor_lists(professor_id: int) -> list[dict]:
    return db.session.execute(
        text("""
            SELECT
                l.id,
                l.title,
                l.deadline,
                l.published,
                l.published_at,
                l.created_at,
                l.updated_at,
                (SELECT COUNT(*) FROM list_questions lq WHERE lq.list_id = l.id) AS question_count,
                (
                    SELECT COUNT(*)
                    FROM users u
                    WHERE u.role = 'aluno' AND COALESCE(u.active, TRUE) = TRUE
                ) AS assigned_students,
                (
                    SELECT COUNT(*)
                    FROM list_submissions ls
                    WHERE ls.list_id = l.id AND ls.submitted_at IS NOT NULL
                ) AS submitted_students,
                (
                    SELECT ROUND(COALESCE(AVG(ls.score_pct), 0), 2)
                    FROM list_submissions ls
                    WHERE ls.list_id = l.id AND ls.submitted_at IS NOT NULL
                ) AS average_score_pct,
                (
                    SELECT COALESCE(MAX(question_stats.error_rate_pct), 0)
                    FROM (
                        SELECT ROUND(
                            CASE
                                WHEN COUNT(lsa.id) = 0 THEN 0
                                ELSE SUM(CASE WHEN lsa.is_correct THEN 0 ELSE 1 END) * 100.0 / COUNT(lsa.id)
                            END,
                            2
                        ) AS error_rate_pct
                        FROM list_questions lq
                        LEFT JOIN list_submissions ls
                            ON ls.list_id = lq.list_id AND ls.submitted_at IS NOT NULL
                        LEFT JOIN list_submission_answers lsa
                            ON lsa.submission_id = ls.id AND lsa.question_id = lq.question_id
                        WHERE lq.list_id = l.id
                        GROUP BY lq.question_id
                    ) question_stats
                ) AS highest_error_rate_pct
            FROM lists l
            WHERE l.professor_id = :professor_id
            ORDER BY l.created_at DESC, l.id DESC
        """),
        {"professor_id": professor_id},
    ).mappings().all()


def list_assigned_lists(student_id: int) -> list[dict]:
    return db.session.execute(
        text("""
            SELECT
                l.id,
                l.title,
                l.deadline,
                l.published,
                l.published_at,
                l.created_at,
                l.updated_at,
                (SELECT COUNT(*) FROM list_questions lq WHERE lq.list_id = l.id) AS question_count,
                ls.started_at,
                ls.submitted_at,
                ls.correct_count,
                ls.total_questions,
                ls.score_pct,
                ls.is_late
            FROM lists l
            LEFT JOIN list_submissions ls
                ON ls.list_id = l.id AND ls.student_id = :student_id
            WHERE l.published = TRUE
              AND (
                  l.turma_id IS NULL
                  OR EXISTS (
                      SELECT 1 FROM turma_alunos
                      WHERE turma_alunos.turma_id = l.turma_id
                        AND turma_alunos.student_id = :student_id
                  )
              )
            ORDER BY l.deadline ASC, l.created_at DESC, l.id DESC
        """),
        {"student_id": student_id},
    ).mappings().all()


def mark_list_started(list_id: int, student_id: int) -> None:
    db.session.execute(
        text("""
            INSERT INTO list_submissions (
                list_id,
                student_id,
                started_at,
                submitted_at,
                correct_count,
                total_questions,
                score_pct,
                is_late
            )
            VALUES (
                :list_id,
                :student_id,
                CURRENT_TIMESTAMP,
                NULL,
                0,
                0,
                0,
                FALSE
            )
            ON CONFLICT (list_id, student_id)
            DO UPDATE SET started_at = COALESCE(list_submissions.started_at, CURRENT_TIMESTAMP)
        """),
        {"list_id": list_id, "student_id": student_id},
    )


def record_list_submission(
    list_id: int,
    student_id: int,
    correct_count: int,
    total_questions: int,
    score_pct: float,
    is_late: bool,
    responses: list[dict],
) -> dict:
    row = db.session.execute(
        text("""
            INSERT INTO list_submissions (
                list_id,
                student_id,
                started_at,
                submitted_at,
                correct_count,
                total_questions,
                score_pct,
                is_late
            )
            VALUES (
                :list_id,
                :student_id,
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP,
                :correct_count,
                :total_questions,
                :score_pct,
                :is_late
            )
            ON CONFLICT (list_id, student_id)
            DO UPDATE SET
                started_at = COALESCE(list_submissions.started_at, CURRENT_TIMESTAMP),
                submitted_at = CURRENT_TIMESTAMP,
                correct_count = :correct_count,
                total_questions = :total_questions,
                score_pct = :score_pct,
                is_late = :is_late
            RETURNING id, submitted_at, score_pct, is_late
        """),
        {
            "list_id": list_id,
            "student_id": student_id,
            "correct_count": correct_count,
            "total_questions": total_questions,
            "score_pct": score_pct,
            "is_late": is_late,
        },
    ).mappings().one()
    submission_id = int(row["id"])
    db.session.execute(
        text("DELETE FROM list_submission_answers WHERE submission_id = :submission_id"),
        {"submission_id": submission_id},
    )
    if responses:
        db.session.execute(
            text("""
                INSERT INTO list_submission_answers (
                    submission_id,
                    question_id,
                    selected_answer,
                    is_correct
                )
                VALUES (
                    :submission_id,
                    :question_id,
                    :selected_answer,
                    :is_correct
                )
            """),
            [
                {
                    "submission_id": submission_id,
                    "question_id": response["question_id"],
                    "selected_answer": response["selected_answer"],
                    "is_correct": response["is_correct"],
                }
                for response in responses
            ],
        )
    return dict(row)


def get_student_list_summary(list_id: int, student_id: int):
    return db.session.execute(
        text("""
            SELECT
                l.id,
                l.title,
                l.deadline,
                l.published,
                l.published_at,
                ls.started_at,
                ls.submitted_at,
                ls.correct_count,
                ls.total_questions,
                ls.score_pct,
                ls.is_late
            FROM lists l
            LEFT JOIN list_submissions ls
                ON ls.list_id = l.id AND ls.student_id = :student_id
            WHERE l.id = :list_id AND l.published = TRUE
        """),
        {"list_id": list_id, "student_id": student_id},
    ).mappings().fetchone()


def get_list_results(list_id: int, professor_id: int) -> dict | None:
    list_row = get_professor_list_row(list_id, professor_id)
    if not list_row:
        return None

    assigned_students = db.session.execute(
        text("""
            SELECT COUNT(*)
            FROM users
            WHERE role = 'aluno' AND COALESCE(active, TRUE) = TRUE
        """)
    ).scalar_one()
    submitted_students = db.session.execute(
        text("""
            SELECT COUNT(*)
            FROM list_submissions
            WHERE list_id = :list_id AND submitted_at IS NOT NULL
        """),
        {"list_id": list_id},
    ).scalar_one()
    average_score_pct = db.session.execute(
        text("""
            SELECT ROUND(COALESCE(AVG(score_pct), 0), 2)
            FROM list_submissions
            WHERE list_id = :list_id AND submitted_at IS NOT NULL
        """),
        {"list_id": list_id},
    ).scalar_one()
    score_distribution = db.session.execute(
        text("""
            SELECT
                SUM(CASE WHEN score_pct < 50 THEN 1 ELSE 0 END) AS bucket_0_49,
                SUM(CASE WHEN score_pct >= 50 AND score_pct < 70 THEN 1 ELSE 0 END) AS bucket_50_69,
                SUM(CASE WHEN score_pct >= 70 THEN 1 ELSE 0 END) AS bucket_70_100
            FROM list_submissions
            WHERE list_id = :list_id AND submitted_at IS NOT NULL
        """),
        {"list_id": list_id},
    ).mappings().one()
    per_question = db.session.execute(
        text("""
            SELECT
                lq.question_id,
                lq.order_index,
                ROUND(
                    CASE
                        WHEN COUNT(lsa.id) = 0 THEN 0
                        ELSE SUM(CASE WHEN lsa.is_correct THEN 0 ELSE 1 END) * 100.0 / COUNT(lsa.id)
                    END,
                    2
                ) AS error_rate_pct,
                COUNT(lsa.id) AS response_count
            FROM list_questions lq
            LEFT JOIN list_submissions ls
                ON ls.list_id = lq.list_id AND ls.submitted_at IS NOT NULL
            LEFT JOIN list_submission_answers lsa
                ON lsa.submission_id = ls.id AND lsa.question_id = lq.question_id
            WHERE lq.list_id = :list_id
            GROUP BY lq.question_id, lq.order_index
            ORDER BY lq.order_index ASC
        """),
        {"list_id": list_id},
    ).mappings().all()
    risk_students = db.session.execute(
        text("""
            SELECT
                u.id AS student_id,
                u.name AS student_name,
                ls.started_at,
                ls.submitted_at,
                ls.score_pct,
                ls.is_late,
                CASE
                    WHEN ls.submitted_at IS NOT NULL AND COALESCE(ls.score_pct, 0) < 50 THEN 'critico'
                    WHEN ls.submitted_at IS NOT NULL AND COALESCE(ls.score_pct, 0) < 70 THEN 'atencao'
                    WHEN ls.started_at IS NOT NULL AND ls.submitted_at IS NULL THEN 'atencao'
                    WHEN ls.started_at IS NULL AND ls.submitted_at IS NULL THEN 'critico'
                    ELSE 'ok'
                END AS risk_band,
                CASE
                    WHEN ls.submitted_at IS NOT NULL THEN 0
                    WHEN ls.started_at IS NOT NULL THEN 1
                    ELSE 2
                END AS risk_order_group,
                CASE
                    WHEN ls.submitted_at IS NOT NULL THEN COALESCE(ls.score_pct, 999)
                    ELSE 999
                END AS risk_score_sort,
                CASE
                    WHEN ls.submitted_at IS NOT NULL AND COALESCE(ls.is_late, FALSE) THEN 1
                    ELSE 0
                END AS late_sort
            FROM users u
            LEFT JOIN list_submissions ls
                ON ls.student_id = u.id AND ls.list_id = :list_id
            WHERE u.role = 'aluno'
              AND COALESCE(u.active, TRUE) = TRUE
              AND (
                    ls.submitted_at IS NULL
                    OR COALESCE(ls.score_pct, 0) < 70
              )
            ORDER BY
                risk_order_group ASC,
                risk_score_sort ASC,
                late_sort DESC,
                u.name ASC,
                u.id ASC
        """),
        {"list_id": list_id},
    ).mappings().all()
    students = db.session.execute(
        text("""
            SELECT
                u.id AS student_id,
                u.name AS student_name,
                ls.started_at,
                ls.submitted_at,
                ls.score_pct,
                ls.is_late
            FROM users u
            LEFT JOIN list_submissions ls
                ON ls.student_id = u.id AND ls.list_id = :list_id
            WHERE u.role = 'aluno' AND COALESCE(u.active, TRUE) = TRUE
            ORDER BY u.name ASC, u.id ASC
        """),
        {"list_id": list_id},
    ).mappings().all()
    return {
        "list": dict(list_row),
        "summary": {
            "assigned_students": int(assigned_students or 0),
            "submitted_students": int(submitted_students or 0),
            "average_score_pct": average_score_pct,
            "highest_error_rate_pct": max(
                (float(row["error_rate_pct"] or 0) for row in per_question),
                default=0.0,
            ),
            "late_students": int(
                db.session.execute(
                    text("""
                        SELECT COUNT(*)
                        FROM list_submissions
                        WHERE list_id = :list_id
                          AND submitted_at IS NOT NULL
                          AND COALESCE(is_late, FALSE) = TRUE
                    """),
                    {"list_id": list_id},
                ).scalar_one()
                or 0
            ),
            "at_risk_students": int(len(risk_students)),
        },
        "risk_students": risk_students,
        "score_distribution": [
            {"bucket": "0-49", "count": int(score_distribution["bucket_0_49"] or 0)},
            {"bucket": "50-69", "count": int(score_distribution["bucket_50_69"] or 0)},
            {"bucket": "70-100", "count": int(score_distribution["bucket_70_100"] or 0)},
        ],
        "students": students,
        "per_question": per_question,
        "change_log": list_change_log(list_id),
    }
