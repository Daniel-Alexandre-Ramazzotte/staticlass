import json
import os

from flask import current_app, jsonify

from ..utils.normalize import normalize_numbering
from ..repositories.questions_repository import (
    add_question_to_db,
    delete_question,
    get_all_chapters,
    get_all_questions,
    get_alternatives_by_question,
    get_professor_questions,
    get_question_by_id,
    get_question_details,
    get_random_question,
    get_random_question_filtered,
    get_topics_by_chapter,
    update_question,
)
from werkzeug.utils import secure_filename

NUM_QUESTIONS = 5


def random_question(num=NUM_QUESTIONS):
    random_questions = get_random_question(num)
    output = []
    for question in random_questions:
        item = dict(question)
        item["alternatives"] = [
            dict(alternative) for alternative in get_alternatives_by_question(item["id"])
        ]
        output.append(item)
    return jsonify(output)


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


_VALID_SOURCES = {"apostila", "concurso", "avulsa", "vestibular", "enem"}


def _normalize_source(value):
    if value in (None, "", "null"):
        return None
    v = str(value).strip().lower()
    if v not in _VALID_SOURCES:
        raise ValueError(f"source inválido: use {sorted(_VALID_SOURCES)} ou deixe em branco")
    return v


def _normalize_alternatives(alternatives, correct_answer):
    if not isinstance(alternatives, list) or len(alternatives) < 2:
        raise ValueError("é necessário informar pelo menos duas alternativas")
    if len(alternatives) > 5:
        raise ValueError("máximo de 5 alternativas permitidas")
    normalized = []
    seen_letters = set()
    correct_letter = (correct_answer or "").upper()
    for alternative in alternatives:
        if not isinstance(alternative, dict):
            raise ValueError("alternativas inválidas")
        letter = (alternative.get("letter") or "").strip().upper()
        text = normalize_numbering((alternative.get("text") or "").strip())
        if not letter or not text:
            raise ValueError("cada alternativa precisa de letra e texto")
        if letter in seen_letters:
            raise ValueError("letras de alternativas duplicadas")
        seen_letters.add(letter)
        normalized.append(
            {
                "letter": letter,
                "text": text,
                "is_correct": letter == correct_letter,
            }
        )
    if correct_letter not in seen_letters:
        raise ValueError("a resposta correta precisa existir entre as alternativas")
    return normalized


def _coerce_optional_int(value):
    if value in (None, "", "null"):
        return None
    return int(value)


def _coerce_optional_bool(value):
    if isinstance(value, bool):
        return value
    if value in (None, "", "null"):
        return False
    if isinstance(value, str):
        return value.strip().lower() in {"1", "true", "t", "yes", "sim"}
    return bool(value)


def _normalize_question_payload(data, professor_id=None):
    if not data:
        raise ValueError("dados inválidos")

    issue = (data.get("issue") or "").strip()
    correct_answer = (data.get("correct_answer") or "").strip().upper()
    solution = (data.get("solution") or "").strip()
    raw_alternatives = data.get("alternatives")
    if isinstance(raw_alternatives, str):
        raw_alternatives = json.loads(raw_alternatives)

    if not issue or not correct_answer:
        raise ValueError("issue e correct_answer são obrigatórios")

    normalized = {
        "issue": normalize_numbering(issue),
        "correct_answer": correct_answer,
        "solution": normalize_numbering(solution) or None,
        "image_q": data.get("image_q"),
        "image_s": data.get("image_s"),
        "section": (data.get("section") or "").strip() or None,
        "source": _normalize_source(data.get("source")),
        "difficulty": _coerce_optional_int(data.get("difficulty")),
        "needs_fix": _coerce_optional_bool(data.get("needs_fix")),
        "chapter_id": _coerce_optional_int(data.get("chapter_id")),
        "topic_id": _coerce_optional_int(data.get("topic_id")),
        "professor_id": professor_id,
        "alternatives": _normalize_alternatives(raw_alternatives, correct_answer),
    }
    return normalized


def add_question_service(data, professor_id=None):
    try:
        normalized = _normalize_question_payload(data, professor_id=professor_id)
    except (ValueError, TypeError, json.JSONDecodeError) as e:
        return jsonify({"error": str(e)}), 400

    try:
        new_id = add_question_to_db(normalized)
        return jsonify({"message": "questão adicionada com sucesso", "id": new_id}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


def update_question_service(data):
    if not data or "id" not in data:
        return jsonify({"error": "dados inválidos ou id ausente"}), 400
    try:
        current = get_question_by_id(int(data["id"]))
        if not current:
            return jsonify({"error": "questão não encontrada"}), 404
        merged = {
            "issue": data.get("issue", current.issue),
            "correct_answer": data.get("correct_answer", current.correct_answer),
            "solution": data.get("solution", current.solution),
            "image_q": data.get("image_q", current.image_q),
            "image_s": data.get("image_s", current.image_s),
            "section": data.get("section", current.section),
            "source": data.get("source", current.source),
            "difficulty": data.get("difficulty", current.difficulty),
            "needs_fix": data.get("needs_fix", current.needs_fix),
            "chapter_id": data.get("chapter_id", current.chapter_id),
            "topic_id": data.get("topic_id", current.topic_id),
            "professor_id": data.get("professor_id", current.professor_id),
            "alternatives": data.get("alternatives"),
        }
        if merged["alternatives"] is None:
            merged["alternatives"] = [
                dict(alternative)
                for alternative in get_alternatives_by_question(int(data["id"]))
            ]
        normalized = _normalize_question_payload(
            merged,
            professor_id=merged.get("professor_id"),
        )
        normalized["id"] = int(data["id"])
        update_question(normalized)
        return jsonify({"message": "questão atualizada com sucesso"})
    except (ValueError, TypeError, json.JSONDecodeError) as e:
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


def get_question_detail_service(question_id: int):
    question = get_question_details(question_id)
    if not question:
        return None
    payload = dict(question)
    payload["alternatives"] = [
        dict(alternative) for alternative in get_alternatives_by_question(question_id)
    ]
    return payload


def delete_question_service(question_id: int):
    try:
        delete_question(question_id)
        return jsonify({"message": "questão removida com sucesso"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


def random_question_filtered(num, chapter_id=None, topic_id=None, difficulty=None, source=None):
    result = get_random_question_filtered(
        num,
        chapter_id=chapter_id,
        topic_id=topic_id,
        difficulty=difficulty,
        source=source,
    )
    output = []
    for q in result:
        q_dict = dict(q)
        q_dict["alternatives"] = [dict(a) for a in get_alternatives_by_question(q_dict["id"])]
        output.append(q_dict)
    return output


def get_chapters_service():
    return [dict(r) for r in get_all_chapters()]


def get_topics_service(chapter_id=None):
    return [dict(r) for r in get_topics_by_chapter(chapter_id)]
