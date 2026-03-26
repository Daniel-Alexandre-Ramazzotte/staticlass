from flask import jsonify, current_app
from ..repositories.questions_repository import (
    get_random_question, add_question_to_db, update_question,
    search_subject, add_subject_to_db, get_professor_questions, get_all_questions,
    get_question_by_id, get_random_question_filtered, get_all_chapters,
    get_topics_by_chapter, get_alternatives_by_question,
)
import os
from werkzeug.utils import secure_filename

NUM_QUESTIONS = 5


def random_question(num=NUM_QUESTIONS):
    result = get_random_question(num)
    random_questions = result.all()

    return jsonify({
        "id":              [q.id for q in random_questions],
        "issue":           [q.issue for q in random_questions],
        "answers": [
            {"id": "A", "text": [q.answer_a for q in random_questions]},
            {"id": "B", "text": [q.answer_b for q in random_questions]},
            {"id": "C", "text": [q.answer_c for q in random_questions]},
            {"id": "D", "text": [q.answer_d for q in random_questions]},
            {"id": "E", "text": [q.answer_e for q in random_questions]},
        ],
        "correct_answer":  [q.correct_answer for q in random_questions],
        "solution":        [q.solution for q in random_questions],
        "image_questions": [q.image_q for q in random_questions],
        "image_solutions": [q.image_s for q in random_questions],
    })


def check_answer(data):
    if not data:
        return jsonify({"error": "dados inválidos"}), 400

    question_id = data.get("question_id")
    answer = data.get("answer", "").upper()

    if not question_id or not answer:
        return jsonify({"error": "question_id e answer são obrigatórios"}), 400

    question = get_question_by_id(question_id)
    if not question:
        return jsonify({"error": "questão não encontrada"}), 404

    if answer == question.correct_answer:
        return jsonify({"message": "correct"})
    return jsonify({"message": "incorrect", "correct_answer": question.correct_answer})


def add_question_service(data):
    if not data:
        return jsonify({"error": "dados inválidos"}), 400

    required = ("issue", "answer_a", "answer_b", "answer_c", "answer_d",
                "answer_e", "correct_answer", "solution")
    if not all(k in data for k in required):
        return jsonify({"error": "campos obrigatórios ausentes"}), 400

    subject_name = data.pop("subject", None)
    if subject_name:
        subject = search_subject(subject_name).first()
        data["id_subject"] = subject.id if subject else add_subject_to_db(subject_name)

    try:
        new_id = add_question_to_db(data)
        return jsonify({"message": "questão adicionada com sucesso", "id": new_id}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


def update_question_service(data):
    if not data or "id" not in data:
        return jsonify({"error": "dados inválidos ou id ausente"}), 400
    try:
        update_question(data)
        return jsonify({"message": "questão atualizada com sucesso"})
    except ValueError as e:
        return jsonify({"error": str(e)}), 400


def process_upload(file_obj):
    if not file_obj or file_obj.filename == "":
        return None
    filename = secure_filename(file_obj.filename)
    caminho = os.path.join(current_app.config["UPLOAD_FOLDER"], filename)
    try:
        file_obj.save(caminho)
        return filename
    except Exception as e:
        current_app.logger.error(f"Erro ao salvar arquivo: {e}")
        return None


def get_images():
    upload_folder = current_app.config["UPLOAD_FOLDER"]
    return os.listdir(upload_folder)


def get_professor_questions_service(professor_id):
    return get_professor_questions(professor_id)


def get_all_questions_service():
    return get_all_questions()


def random_question_filtered(num, chapter_id=None, topic_id=None, difficulty=None):
    result = get_random_question_filtered(num, chapter_id=chapter_id,
                                          topic_id=topic_id, difficulty=difficulty)
    output = []
    for q in result.mappings().all():
        q_dict = dict(q)
        q_dict["alternatives"] = [dict(a) for a in get_alternatives_by_question(q_dict["id"])]
        output.append(q_dict)
    return output


def get_chapters_service():
    return [dict(r) for r in get_all_chapters()]


def get_topics_service(chapter_id=None):
    return [dict(r) for r in get_topics_by_chapter(chapter_id)]
