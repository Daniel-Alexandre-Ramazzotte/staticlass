from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity

from statl.utils.auth_middleware import require_role
from ..services.turmas_service import (
    create_turma_service,
    list_turmas_service,
    get_turma_service,
    update_turma_service,
    delete_turma_service,
    set_turma_students_service,
    get_turma_students_service,
)

bp = Blueprint("turmas", __name__, url_prefix="/turmas")


@bp.route("", methods=["POST"])
@require_role(["professor"])
def create_turma():
    resp, status = create_turma_service(get_jwt_identity(), request.get_json() or {})
    return jsonify(resp), status


@bp.route("", methods=["GET"])
@require_role(["professor"])
def list_turmas():
    resp, status = list_turmas_service(get_jwt_identity())
    return jsonify(resp), status


@bp.route("/<int:turma_id>", methods=["GET"])
@require_role(["professor"])
def get_turma(turma_id: int):
    resp, status = get_turma_service(get_jwt_identity(), turma_id)
    return jsonify(resp), status


@bp.route("/<int:turma_id>", methods=["PUT"])
@require_role(["professor"])
def update_turma(turma_id: int):
    resp, status = update_turma_service(get_jwt_identity(), turma_id, request.get_json() or {})
    return jsonify(resp), status


@bp.route("/<int:turma_id>", methods=["DELETE"])
@require_role(["professor"])
def delete_turma_route(turma_id: int):
    resp, status = delete_turma_service(get_jwt_identity(), turma_id)
    return jsonify(resp), status


@bp.route("/<int:turma_id>/students", methods=["POST"])
@require_role(["professor"])
def set_turma_students(turma_id: int):
    resp, status = set_turma_students_service(get_jwt_identity(), turma_id, request.get_json() or {})
    return jsonify(resp), status


@bp.route("/<int:turma_id>/students", methods=["GET"])
@require_role(["professor"])
def get_turma_students_route(turma_id: int):
    resp, status = get_turma_students_service(get_jwt_identity(), turma_id)
    return jsonify(resp), status
