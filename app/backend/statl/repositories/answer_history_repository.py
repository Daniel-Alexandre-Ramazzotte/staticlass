from sqlalchemy import text

from .. import db


def _prepare_rows(student_id: int, source: str, source_id: int, list_id: int | None, answered_at, answers: list[dict]):
    return [
        {
            "student_id": student_id,
            "question_id": answer["question_id"],
            "answered_at": answered_at,
            "is_correct": answer["is_correct"],
            "selected_answer": answer["selected_answer"],
            "source": source,
            "source_id": source_id,
            "list_id": list_id,
        }
        for answer in answers
    ]


def create_answer_history_rows(
    student_id: int,
    source: str,
    source_id: int,
    list_id: int | None,
    answered_at,
    answers: list[dict],
) -> None:
    if not answers:
        return

    db.session.execute(
        text("""
            INSERT INTO answer_history (
                student_id,
                question_id,
                answered_at,
                is_correct,
                selected_answer,
                source,
                source_id,
                list_id
            )
            VALUES (
                :student_id,
                :question_id,
                :answered_at,
                :is_correct,
                :selected_answer,
                :source,
                :source_id,
                :list_id
            )
        """),
        _prepare_rows(student_id, source, source_id, list_id, answered_at, answers),
    )


def replace_list_answer_history_rows(
    student_id: int,
    submission_id: int,
    list_id: int,
    answered_at,
    answers: list[dict],
) -> None:
    db.session.execute(
        text("""
            DELETE FROM answer_history
            WHERE source = 'list' AND source_id = :submission_id
        """),
        {"submission_id": submission_id},
    )
    create_answer_history_rows(
        student_id=student_id,
        source="list",
        source_id=submission_id,
        list_id=list_id,
        answered_at=answered_at,
        answers=answers,
    )


def backfill_list_answer_history() -> int:
    if db.engine.dialect.name == "sqlite":
        stmt = text("""
            INSERT OR IGNORE INTO answer_history (
                student_id,
                question_id,
                answered_at,
                is_correct,
                selected_answer,
                source,
                source_id,
                list_id
            )
            SELECT
                ls.student_id,
                lsa.question_id,
                ls.submitted_at,
                lsa.is_correct,
                lsa.selected_answer,
                'list' AS source,
                ls.id AS source_id,
                ls.list_id
            FROM list_submissions ls
            JOIN list_submission_answers lsa
                ON lsa.submission_id = ls.id
            WHERE ls.submitted_at IS NOT NULL
        """)
    else:
        stmt = text("""
            INSERT INTO answer_history (
                student_id,
                question_id,
                answered_at,
                is_correct,
                selected_answer,
                source,
                source_id,
                list_id
            )
            SELECT
                ls.student_id,
                lsa.question_id,
                ls.submitted_at,
                lsa.is_correct,
                lsa.selected_answer,
                'list' AS source,
                ls.id AS source_id,
                ls.list_id
            FROM list_submissions ls
            JOIN list_submission_answers lsa
                ON lsa.submission_id = ls.id
            WHERE ls.submitted_at IS NOT NULL
            ON CONFLICT (source, source_id, question_id) DO NOTHING
        """)

    result = db.session.execute(stmt)
    return int(result.rowcount or 0)
