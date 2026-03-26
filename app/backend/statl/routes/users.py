from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from statl.utils.auth_middleware import require_role
from ..services.user_service import (
    update_user_service, delete_user_service, get_user_by_email_service,
    update_own_profile_service, delete_own_account_service,
    get_all_professors_service, create_professor_service, get_all_alunos_service,
)
from ..services.resultado_service import (
    salvar_resultado_service, buscar_historico_service, buscar_ranking_service,
)

bp = Blueprint('users', __name__, url_prefix='/users')


@bp.route('/update/<int:user_id>', methods=['PUT'])
@require_role('admin')
def update_user_route(user_id):
    return update_user_service(user_id, request.json)


@bp.route('/update-me', methods=['PUT'])
@jwt_required()
def update_me():
    user, error, status = update_own_profile_service(get_jwt_identity(), request.json)
    if error:
        return error, status
    return jsonify({"message": "dados atualizados com sucesso"}), 200


@bp.route('/delete/<int:user_id>', methods=['DELETE'])
@require_role('admin')
def delete_user_route(user_id):
    return delete_user_service(user_id)


@bp.route('/delete-me', methods=['DELETE'])
@jwt_required()
def delete_me():
    data = request.json or {}
    password = data.get("password")
    if not password:
        return jsonify({"error": "a senha é necessária para excluir a conta"}), 400
    result, status = delete_own_account_service(get_jwt_identity(), password)
    return jsonify(result), status


@bp.route('/profile/<email>', methods=['GET'])
@jwt_required()
def get_profile(email):
    user = get_user_by_email_service(email)
    if not user:
        return jsonify({"message": "usuário não encontrado"}), 404
    return jsonify({
        "id":    user.id,
        "name":  user.name,
        "email": user.email,
        "score": user.score,
    }), 200


@bp.route('/admin/get-all-professors', methods=['GET'])
@require_role('admin')
def get_all_professors():
    return jsonify([dict(row) for row in get_all_professors_service()]), 200


@bp.route('/admin/create-professor', methods=['POST'])
@require_role('admin')
def create_professor():
    result, error, status = create_professor_service(request.json)
    if error:
        return error, status
    return jsonify({
        "message":            "professor criado com sucesso",
        "id":                 result["id"],
        "temporary_password": result["temporary_password"],
    }), 201


@bp.route('/admin/get-all-alunos', methods=['GET'])
@require_role('admin')
def get_all_alunos():
    return jsonify([dict(row) for row in get_all_alunos_service()]), 200


# ─── Ranking ────────────────────────────────────────────────────────────────

@bp.route('/ranking', methods=['GET'])
def get_ranking():
    """Retorna top 10 alunos por pontuação. Público — não exige autenticação."""
    return jsonify(buscar_ranking_service()), 200


# ─── Histórico e Resultado do Quiz ──────────────────────────────────────────

@bp.route('/historico', methods=['GET'])
@jwt_required()
def get_historico():
    """Retorna os últimos 10 resultados de quiz do aluno logado."""
    usuario_id = get_jwt_identity()
    return jsonify(buscar_historico_service(usuario_id)), 200


@bp.route('/salvar-resultado', methods=['POST'])
@jwt_required()
def salvar_resultado():
    """Salva o resultado de um quiz e adiciona pontos ao score do aluno.

    Corpo esperado (JSON):
        acertos    (int) — número de questões corretas
        total      (int) — total de questões do quiz
        capitulo_id (int, opcional)
        dificuldade (int, opcional) — 1, 2 ou 3
    """
    usuario_id = get_jwt_identity()
    dados = request.get_json() or {}
    resposta, status = salvar_resultado_service(usuario_id, dados)
    return jsonify(resposta), status
