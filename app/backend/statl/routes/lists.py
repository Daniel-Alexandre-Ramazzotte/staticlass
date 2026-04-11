from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity

from statl.utils.auth_middleware import require_role

from ..services.lists_service import (
    assigned_lists_service,
    create_list_service,
    list_questions_service,
    list_results_service,
    professor_list_detail_service,
    professor_lists_service,
    publish_list_service,
    start_list_service,
    student_list_summary_service,
    submit_list_service,
    update_list_service,
)

bp = Blueprint("lists", __name__, url_prefix="/lists")


@bp.route("", methods=["POST"])
@require_role(["professor"])
def create_list():
    resposta, status = create_list_service(get_jwt_identity(), request.get_json() or {})
    return jsonify(resposta), status


@bp.route("", methods=["GET"])
@require_role(["professor"])
def get_lists():
    resposta, status = professor_lists_service(get_jwt_identity())
    return jsonify(resposta), status


@bp.route("/assigned", methods=["GET"])
@require_role(["aluno"])
def assigned_lists():
    resposta, status = assigned_lists_service(get_jwt_identity())
    return jsonify(resposta), status


@bp.route("/<int:list_id>", methods=["GET"])
@require_role(["professor"])
def get_list_detail(list_id: int):
    resposta, status = professor_list_detail_service(get_jwt_identity(), list_id)
    return jsonify(resposta), status


@bp.route("/<int:list_id>", methods=["PUT"])
@require_role(["professor"])
def update_list(list_id: int):
    resposta, status = update_list_service(
        get_jwt_identity(),
        list_id,
        request.get_json() or {},
    )
    return jsonify(resposta), status


@bp.route("/<int:list_id>/publish", methods=["POST"])
@require_role(["professor"])
def publish_list_route(list_id: int):
    resposta, status = publish_list_service(get_jwt_identity(), list_id)
    return jsonify(resposta), status


@bp.route("/<int:list_id>/questions", methods=["GET"])
@require_role(["aluno"])
def list_questions(list_id: int):
    resposta, status = list_questions_service(get_jwt_identity(), list_id)
    return jsonify(resposta), status


@bp.route("/<int:list_id>/start", methods=["POST"])
@require_role(["aluno"])
def start_list(list_id: int):
    resposta, status = start_list_service(get_jwt_identity(), list_id)
    return jsonify(resposta), status


@bp.route("/<int:list_id>/submit", methods=["POST"])
@require_role(["aluno"])
def submit_list(list_id: int):
    resposta, status = submit_list_service(
        get_jwt_identity(),
        list_id,
        request.get_json() or {},
    )
    return jsonify(resposta), status


@bp.route("/<int:list_id>/me", methods=["GET"])
@require_role(["aluno"])
def get_my_list_result(list_id: int):
    resposta, status = student_list_summary_service(get_jwt_identity(), list_id)
    return jsonify(resposta), status


@bp.route("/<int:list_id>/results", methods=["GET"])
@require_role(["professor"])
def get_list_results_route(list_id: int):
    resposta, status = list_results_service(get_jwt_identity(), list_id)
    return jsonify(resposta), status
