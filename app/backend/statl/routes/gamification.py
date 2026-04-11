from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required

from statl.utils.auth_middleware import require_role

from ..services.gamification_service import ranking_service, record_session_service

bp = Blueprint("gamification", __name__, url_prefix="/gamification")


@bp.route("/record-session", methods=["POST"])
@require_role(["aluno"])
def record_session():
    resposta, status = record_session_service(
        get_jwt_identity(), request.get_json() or {}
    )
    return jsonify(resposta), status


@bp.route("/ranking", methods=["GET"])
@jwt_required()
def ranking():
    claims = get_jwt()
    try:
        page = int(request.args.get("page", 1))
    except (TypeError, ValueError):
        page = 1

    resposta, status = ranking_service(
        get_jwt_identity(),
        claims.get("role", ""),
        page,
    )
    return jsonify(resposta), status
