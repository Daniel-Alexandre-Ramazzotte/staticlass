from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, get_jwt

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
@require_role(["professor", "admin"])
def create_turma():
    resp, status = create_turma_service(get_jwt_identity(), request.get_json() or {})
    return jsonify(resp), status


@bp.route("", methods=["GET"])
@require_role(["professor", "admin"])
def list_turmas():
    resp, status = list_turmas_service(get_jwt_identity(), _is_admin())
    return jsonify(resp), status


def _is_admin() -> bool:
    return get_jwt().get("role") == "admin"


@bp.route("/<int:turma_id>", methods=["GET"])
@require_role(["professor", "admin"])
def get_turma(turma_id: int):
    resp, status = get_turma_service(get_jwt_identity(), turma_id, _is_admin())
    return jsonify(resp), status


@bp.route("/<int:turma_id>", methods=["PUT"])
@require_role(["professor", "admin"])
def update_turma(turma_id: int):
    resp, status = update_turma_service(get_jwt_identity(), turma_id, request.get_json() or {}, _is_admin())
    return jsonify(resp), status


@bp.route("/<int:turma_id>", methods=["DELETE"])
@require_role(["professor", "admin"])
def delete_turma_route(turma_id: int):
    resp, status = delete_turma_service(get_jwt_identity(), turma_id, _is_admin())
    return jsonify(resp), status


@bp.route("/<int:turma_id>/students", methods=["POST"])
@require_role(["professor", "admin"])
def set_turma_students(turma_id: int):
    resp, status = set_turma_students_service(get_jwt_identity(), turma_id, request.get_json() or {}, _is_admin())
    return jsonify(resp), status


@bp.route("/<int:turma_id>/students", methods=["GET"])
@require_role(["professor", "admin"])
def get_turma_students_route(turma_id: int):
    resp, status = get_turma_students_service(get_jwt_identity(), turma_id, _is_admin())
    return jsonify(resp), status


@bp.route("/<int:turma_id>/invite", methods=["POST"])
@require_role(["professor", "admin"])
def invite_students(turma_id: int):
    from statl.services.invite_service import parse_email_list, process_invite_list
    data = request.get_json() or {}
    raw_list = data.get("raw_list", "")
    entries = data.get("entries", None)
    if entries is None:
        entries = parse_email_list(raw_list)
    result = process_invite_list(turma_id, entries)
    return jsonify(result), 200

