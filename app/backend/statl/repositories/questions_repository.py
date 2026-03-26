from .. import db
from sqlalchemy import text

TABLE_NAME = "questions"


def add_question_to_db(data: dict):
    query = text(f"""
        INSERT INTO {TABLE_NAME}
            (issue, answer_a, answer_b, answer_c, answer_d, answer_e,
             correct_answer, solution, image_q, image_s, id_subject, id_professor)
        VALUES
            (:issue, :answer_a, :answer_b, :answer_c, :answer_d, :answer_e,
             :correct_answer, :solution, :image_q, :image_s, :id_subject, :id_professor)
    """)
    params = {
        "issue":          data.get("issue"),
        "answer_a":       data.get("answer_a"),
        "answer_b":       data.get("answer_b"),
        "answer_c":       data.get("answer_c"),
        "answer_d":       data.get("answer_d"),
        "answer_e":       data.get("answer_e"),
        "correct_answer": data.get("correct_answer"),
        "solution":       data.get("solution"),
        "image_q":        data.get("image_q"),
        "image_s":        data.get("image_s"),
        "id_subject":     data.get("id_subject"),
        "id_professor":   data.get("id_professor"),
    }
    try:
        result = db.session.execute(
            text(str(query) + " RETURNING id"), params
        )
        new_id = result.scalar()
        db.session.commit()
        return new_id
    except Exception as e:
        db.session.rollback()
        raise e


def add_subject_to_db(subject_name: str):
    try:
        result = db.session.execute(
            text("INSERT INTO subjects (subject_name) VALUES (:subject_name) RETURNING id"),
            {"subject_name": subject_name},
        )
        new_id = result.scalar()
        db.session.commit()
        return new_id
    except Exception as e:
        db.session.rollback()
        raise e


_ALLOWED_QUESTION_UPDATE_FIELDS = {
    "issue", "answer_a", "answer_b", "answer_c", "answer_d", "answer_e",
    "correct_answer", "solution", "image_q", "image_s", "id_subject",
    "difficulty", "needs_fix", "chapter_id", "topic_id",
}


def update_question(data: dict):
    safe = {k: v for k, v in data.items() if k in _ALLOWED_QUESTION_UPDATE_FIELDS}
    if not safe:
        raise ValueError("Nenhum campo válido para atualizar")
    safe["id"] = data["id"]
    params = ", ".join([f"{k} = :{k}" for k in safe if k != "id"])
    query = text(f"UPDATE {TABLE_NAME} SET {params} WHERE id = :id")
    db.session.execute(query, safe)
    db.session.commit()


def delete_question(question_id):
    try:
        db.session.execute(text(f"DELETE FROM {TABLE_NAME} WHERE id = :id"), {"id": question_id})
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        raise e


def get_random_question(amount: int):
    query = text("SELECT * FROM questions ORDER BY RANDOM() LIMIT :num_questoes")
    return db.session.execute(query, {"num_questoes": amount})


def get_question_by_id(question_id: int):
    return db.session.execute(
        text("SELECT * FROM questions WHERE id = :id"),
        {"id": question_id},
    ).fetchone()


def search_subject(subject_name: str):
    return db.session.execute(
        text("SELECT * FROM subjects WHERE subject_name LIKE :subject_name"),
        {"subject_name": f"%{subject_name}%"},
    )


def get_professor_questions(professor_id: str):
    return db.session.execute(
        text("SELECT * FROM questions WHERE id_professor = :professor_id"),
        {"professor_id": professor_id},
    )


def get_all_questions():
    return db.session.execute(text("SELECT * FROM questions"))


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
    )


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
