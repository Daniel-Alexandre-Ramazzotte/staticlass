from .. import db
from sqlalchemy import text

TABLE_NAME = "questions"


def add_question_to_db(data: dict):
    query = text(
        f"""
        INSERT INTO {TABLE_NAME}
            (issue, correct_answer, solution, image_q, image_s,
             section, difficulty, needs_fix, chapter_id, topic_id, professor_id)
        VALUES
            (:issue, :correct_answer, :solution, :image_q, :image_s,
             :section, :difficulty, :needs_fix, :chapter_id, :topic_id, :professor_id)
        RETURNING id
    """
    )
    params = {
        "issue": data.get("issue"),
        "correct_answer": data.get("correct_answer"),
        "solution": data.get("solution"),
        "image_q": data.get("image_q"),
        "image_s": data.get("image_s"),
        "section": data.get("section"),
        "difficulty": data.get("difficulty"),
        "needs_fix": bool(data.get("needs_fix", False)),
        "chapter_id": data.get("chapter_id"),
        "topic_id": data.get("topic_id"),
        "professor_id": data.get("professor_id"),
    }
    alternatives = data.get("alternatives", [])
    try:
        result = db.session.execute(query, params)
        new_id = result.scalar()
        for alternative in alternatives:
            db.session.execute(
                text(
                    """
                    INSERT INTO alternatives (question_id, letter, text, is_correct)
                    VALUES (:question_id, :letter, :text, :is_correct)
                    """
                ),
                {
                    "question_id": new_id,
                    "letter": alternative["letter"],
                    "text": alternative["text"],
                    "is_correct": bool(alternative["is_correct"]),
                },
            )
        db.session.commit()
        return new_id
    except Exception as e:
        db.session.rollback()
        raise e


_ALLOWED_QUESTION_UPDATE_FIELDS = {
    "issue",
    "correct_answer",
    "solution",
    "image_q",
    "image_s",
    "section",
    "difficulty",
    "needs_fix",
    "chapter_id",
    "topic_id",
}


def update_question(data: dict):
    alternatives = data.get("alternatives")
    safe = {k: v for k, v in data.items() if k in _ALLOWED_QUESTION_UPDATE_FIELDS}
    if not safe and alternatives is None:
        raise ValueError("Nenhum campo válido para atualizar")
    try:
        if safe:
            safe["id"] = data["id"]
            params = ", ".join([f"{k} = :{k}" for k in safe if k != "id"])
            query = text(f"UPDATE {TABLE_NAME} SET {params} WHERE id = :id")
            db.session.execute(query, safe)
        if alternatives is not None:
            db.session.execute(
                text("DELETE FROM alternatives WHERE question_id = :question_id"),
                {"question_id": data["id"]},
            )
            for alternative in alternatives:
                db.session.execute(
                    text(
                        """
                        INSERT INTO alternatives (question_id, letter, text, is_correct)
                        VALUES (:question_id, :letter, :text, :is_correct)
                        """
                    ),
                    {
                        "question_id": data["id"],
                        "letter": alternative["letter"],
                        "text": alternative["text"],
                        "is_correct": bool(alternative["is_correct"]),
                    },
                )
        db.session.commit()
    except Exception:
        db.session.rollback()
        raise


def delete_question(question_id):
    try:
        db.session.execute(text(f"DELETE FROM {TABLE_NAME} WHERE id = :id"), {"id": question_id})
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        raise e


def get_random_question(amount: int):
    query = text(
        """
        SELECT * FROM questions
        ORDER BY RANDOM()
        LIMIT :num_questoes
        """
    )
    return db.session.execute(query, {"num_questoes": amount}).mappings().all()


def get_question_by_id(question_id: int):
    return db.session.execute(
        text("SELECT * FROM questions WHERE id = :id"),
        {"id": question_id},
    ).fetchone()


def get_professor_questions(professor_id: str):
    return db.session.execute(
        text("SELECT * FROM questions WHERE professor_id = :professor_id ORDER BY id DESC"),
        {"professor_id": professor_id},
    )


def get_all_questions():
    return db.session.execute(text("SELECT * FROM questions"))


def get_question_details(question_id: int):
    return db.session.execute(
        text(
            """
            SELECT
                q.*,
                c.name AS chapter_name,
                c.number AS chapter_number,
                t.name AS topic_name
            FROM questions q
            LEFT JOIN chapters c ON c.id = q.chapter_id
            LEFT JOIN topics t ON t.id = q.topic_id
            WHERE q.id = :id
            """
        ),
        {"id": question_id},
    ).mappings().fetchone()


def get_random_question_filtered(amount: int, chapter_id=None, topic_id=None, difficulty=None):
    conditions = []
    params = {"num_questoes": amount}

    if chapter_id is not None:
        conditions.append("chapter_id = :chapter_id")
        params["chapter_id"] = chapter_id
    if topic_id is not None:
        conditions.append("topic_id = :topic_id")
        params["topic_id"] = topic_id
    if difficulty is not None:
        conditions.append("difficulty = :difficulty")
        params["difficulty"] = difficulty

    where = f"WHERE {' AND '.join(conditions)}" if conditions else ""
    return db.session.execute(
        text(f"SELECT * FROM questions {where} ORDER BY RANDOM() LIMIT :num_questoes"),
        params,
    ).mappings().all()


def get_all_chapters():
    return db.session.execute(text("SELECT * FROM chapters ORDER BY number")).mappings().all()


def get_topics_by_chapter(chapter_id=None):
    if chapter_id:
        return db.session.execute(
            text("SELECT * FROM topics WHERE chapter_id = :cid ORDER BY id"),
            {"cid": chapter_id},
        ).mappings().all()
    return db.session.execute(text("SELECT * FROM topics ORDER BY chapter_id, id")).mappings().all()


def get_alternatives_by_question(question_id: int):
    return db.session.execute(
        text("SELECT * FROM alternatives WHERE question_id = :qid ORDER BY letter"),
        {"qid": question_id},
    ).mappings().all()
