from flask import Blueprint, request, jsonify, send_from_directory
from ..services.questions_service import (
    check_answer, random_question, add_question_service, update_question_service,
    process_upload, get_images, get_professor_questions_service, get_all_questions_service,
    random_question_filtered, get_chapters_service, get_topics_service,
    delete_question_service, get_question_detail_service,
)
from ..services.resultado_service import status_diaria_service, marcar_diaria_service
from typing import Any, Dict
from statl.utils.auth_middleware import require_role
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
import os

NUM_QUESTIONS = 5

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_PROJECT_DIR = os.path.abspath(os.path.join(CURRENT_DIR, '..', '..', '..', '..'))
UPLOAD_FOLDER = os.path.join(ROOT_PROJECT_DIR, 'uploads')

bp = Blueprint('questions', __name__, url_prefix='/questions')


def _ensure_question_access(question_id: int):
    question = get_question_detail_service(question_id)
    if not question:
        return None, (jsonify({"error": "questão não encontrada"}), 404)
    claims = get_jwt()
    role = claims.get("role")
    user_id = get_jwt_identity()
    if role == "admin":
        return question, None
    if role == "professor" and question.get("professor_id") == int(user_id):
        return question, None
    return None, (jsonify({"error": "acesso negado"}), 403)


@bp.route("/rand/<int:num>", methods=["GET"])
def get_question_rand(num=NUM_QUESTIONS):
    return random_question(num)


@bp.route("/filtered", methods=["GET"])
def get_questions_filtered():
    num        = request.args.get("num", NUM_QUESTIONS, type=int)
    chapter_id = request.args.get("chapter_id", type=int)
    topic_id   = request.args.get("topic_id", type=int)
    difficulty = request.args.get("difficulty", type=int)
    questions  = random_question_filtered(num, chapter_id=chapter_id,
                                          topic_id=topic_id, difficulty=difficulty)
    return jsonify(questions), 200


@bp.route("/chapters", methods=["GET"])
def get_chapters():
    return jsonify(get_chapters_service()), 200


@bp.route("/topics", methods=["GET"])
def get_topics():
    chapter_id = request.args.get("chapter_id", type=int)
    return jsonify(get_topics_service(chapter_id)), 200


@bp.route('/check', methods=['POST'])
def check_correct_answer():
    return check_answer(request.get_json())


@bp.route('/add', methods=['POST'])
@require_role(['admin', 'professor'])
def add_question():
    professor_id = get_jwt_identity()
    if request.is_json:
        data = request.get_json() or {}
    else:
        data = request.form.to_dict()
        data['image_q'] = process_upload(request.files.get("image_q"))
        data['image_s'] = process_upload(request.files.get("image_s"))
    return add_question_service(data, professor_id=professor_id)


@bp.route("/update", methods=["PUT"])
@require_role(['admin', 'professor'])
def update_question_route():
    data = request.get_json() or {}
    if not data.get("id"):
        return jsonify({"error": "id é obrigatório"}), 400
    _, error = _ensure_question_access(int(data["id"]))
    if error:
        return error
    data["professor_id"] = data.get("professor_id") or get_jwt_identity()
    return update_question_service(data)


@bp.route('/uploads/<path:filename>', methods=['GET'])
def serve_image(filename):
    try:
        return send_from_directory(UPLOAD_FOLDER, filename)
    except FileNotFoundError:
        return jsonify({"error": "arquivo não encontrado"}), 404


@bp.route('/professor/<string:professor_id>', methods=['GET'])
@require_role(['admin', 'professor'])
def get_professor_questions(professor_id):
    result = get_professor_questions_service(professor_id)
    return jsonify([dict(row) for row in result.mappings().all()]), 200


@bp.route('/admin/<string:admin_id>', methods=['GET'])
@require_role(['admin'])
def get_admin_questions(admin_id):
    result = get_all_questions_service()
    return jsonify([dict(row) for row in result.mappings().all()]), 200


@bp.route('/<int:question_id>', methods=['GET'])
@require_role(['admin', 'professor'])
def get_question(question_id):
    question, error = _ensure_question_access(question_id)
    if error:
        return error
    return jsonify(question), 200


@bp.route('/<int:question_id>', methods=['DELETE'])
@require_role(['admin', 'professor'])
def delete_question_route(question_id):
    _, error = _ensure_question_access(question_id)
    if error:
        return error
    return delete_question_service(question_id)


# ─── Questão Diária ─────────────────────────────────────────────────────────

@bp.route('/diaria/status', methods=['GET'])
@jwt_required()
def status_diaria():
    """Retorna se o aluno logado já fez a questão diária hoje.

    Resposta: { "feita": true | false }
    """
    usuario_id = get_jwt_identity()
    return jsonify(status_diaria_service(usuario_id)), 200


@bp.route('/diaria/marcar', methods=['POST'])
@jwt_required()
def marcar_diaria():
    """Registra que o aluno concluiu a questão diária de hoje."""
    usuario_id = get_jwt_identity()
    return jsonify(marcar_diaria_service(usuario_id)), 200
