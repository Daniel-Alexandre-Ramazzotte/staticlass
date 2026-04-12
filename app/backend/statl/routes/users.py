from flask import Blueprint, jsonify, request
from datetime import date
from flask_jwt_extended import jwt_required, get_jwt_identity
from statl.utils.auth_middleware import require_role
from ..services.user_service import (
    create_managed_user_service,
    delete_managed_user_service,
    delete_own_account_service,
    get_user_by_email_service,
    get_users_by_role_service,
    update_managed_user_service,
    update_own_profile_service,
)
from ..services.resultado_service import (
    buscar_historico_service,
    buscar_estatisticas_service,
)
from ..services.student_analytics_service import (
    student_activity_service,
    student_dashboard_service,
)

bp = Blueprint('users', __name__, url_prefix='/users')


# ── Perfil próprio ─────────────────────────────────────────────────────────

@bp.route('/update-me', methods=['PUT'])
@jwt_required()
def atualizar_perfil():
    _, erro, status = update_own_profile_service(get_jwt_identity(), request.json)
    if erro:
        return erro, status
    return jsonify({"message": "dados atualizados"}), 200


@bp.route('/delete-me', methods=['DELETE'])
@jwt_required()
def deletar_conta():
    senha = (request.json or {}).get("password")
    if not senha:
        return jsonify({"error": "senha é necessária para excluir a conta"}), 400
    resultado, status = delete_own_account_service(get_jwt_identity(), senha)
    return jsonify(resultado), status


@bp.route('/profile/<email>', methods=['GET'])
@jwt_required()
def perfil(email):
    usuario = get_user_by_email_service(email)
    if not usuario:
        return jsonify({"message": "usuário não encontrado"}), 404
    last_practice_date = getattr(usuario, "last_practice_date", None)
    if isinstance(last_practice_date, date):
        last_practice_date = last_practice_date.isoformat()
    elif isinstance(last_practice_date, str):
        last_practice_date = last_practice_date[:10]
    else:
        last_practice_date = None

    return jsonify({
        "id": usuario.id,
        "name": usuario.name,
        "email": usuario.email,
        "xp": usuario.xp,
        "streak": usuario.streak,
        "last_practice_date": last_practice_date,
    }), 200


# ── Gestão de professores (admin) ──────────────────────────────────────────

@bp.route('/admin/professors', methods=['GET'])
@require_role('admin')
def listar_professores():
    return jsonify([dict(r) for r in get_users_by_role_service('professor')]), 200


@bp.route('/admin/professors', methods=['POST'])
@require_role('admin')
def criar_professor():
    resultado, erro, status = create_managed_user_service(request.json, 'professor')
    if erro:
        return erro, status
    return jsonify({"message": "professor criado", **resultado}), 201


@bp.route('/admin/professors/<int:usuario_id>', methods=['PUT'])
@require_role('admin')
def atualizar_professor(usuario_id):
    return update_managed_user_service(usuario_id, request.json or {}, 'professor')


@bp.route('/admin/professors/<int:usuario_id>', methods=['DELETE'])
@require_role('admin')
def deletar_professor(usuario_id):
    return delete_managed_user_service(usuario_id, 'professor')


# ── Gestão de alunos (admin) ───────────────────────────────────────────────

@bp.route('/admin/alunos', methods=['GET'])
@require_role('admin')
def listar_alunos():
    return jsonify([dict(r) for r in get_users_by_role_service('aluno')]), 200


@bp.route('/admin/alunos', methods=['POST'])
@require_role('admin')
def criar_aluno():
    resultado, erro, status = create_managed_user_service(request.json, 'aluno')
    if erro:
        return erro, status
    return jsonify({"message": "aluno criado", **resultado}), 201


@bp.route('/admin/alunos/<int:usuario_id>', methods=['PUT'])
@require_role('admin')
def atualizar_aluno(usuario_id):
    return update_managed_user_service(usuario_id, request.json or {}, 'aluno')


@bp.route('/admin/alunos/<int:usuario_id>', methods=['DELETE'])
@require_role('admin')
def deletar_aluno(usuario_id):
    return delete_managed_user_service(usuario_id, 'aluno')

# ── Ranking e resultados ───────────────────────────────────────────────────


@bp.route('/estatisticas', methods=['GET'])
@jwt_required()
def estatisticas():
    return jsonify(buscar_estatisticas_service(get_jwt_identity())), 200


@bp.route('/historico', methods=['GET'])
@jwt_required()
def historico():
    return jsonify(buscar_historico_service(get_jwt_identity())), 200


@bp.route('/analytics/dashboard', methods=['GET'])
@jwt_required()
def analytics_dashboard():
    return jsonify(student_dashboard_service(get_jwt_identity())), 200


@bp.route('/analytics/activity', methods=['GET'])
@jwt_required()
def analytics_activity():
    return jsonify(student_activity_service(get_jwt_identity())), 200
