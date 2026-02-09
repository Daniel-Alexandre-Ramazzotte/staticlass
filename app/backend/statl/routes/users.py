from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from statl.utils.auth_middleware import require_role
from ..services.user_service import update_user_service, delete_user_service, get_user_by_email_service, update_own_profile_service, delete_own_account_service

bp = Blueprint('users', __name__, url_prefix='/users')

# Seriam utilizados para administração dos usuários


@bp.route('/update/<int:user_id>', methods=['PUT'])
@require_role('admin')
def update_user_route(user_id):
    data = request.json
    
    return update_user_service(user_id, data)


@bp.route('/update-me', methods=['PUT'])
@jwt_required()
def update_me():
    current_user_id = get_jwt_identity() # Pega o ID de quem está logado
    data = request.json
    
    user, error, status = update_own_profile_service(current_user_id, data)
    
    if error: return error, status
    return jsonify({"message": "Você atualizou seus dados com sucesso"}), 200

@bp.route('/delete/<int:user_id>', methods=['DELETE'])
@require_role('admin')
def delete_user_route(user_id):
    return delete_user_service(user_id)

@bp.route('/delete-me', methods=['DELETE'])
@jwt_required()
def delete_me():
    identity = get_jwt_identity() 
    
    data = request.json 
    password = data.get("password")

    if not password:
        return jsonify({"error": "A senha é necessária para excluir a conta"}), 400
    
    result, status = delete_own_account_service(identity, password)
    return jsonify(result), status



@bp.route('/profile/<email>', methods=['GET'])
def get_profile(email):
    user = get_user_by_email_service(email) 
    if user:
        return jsonify({
            "id": user.id, 
            "name": getattr(user, 'name', getattr(user, 'nome', 'Usuário')),
            "email": user.email,
            "score": getattr(user, 'score', 0)
        }), 200
    return jsonify({"message": "Usuário não encontrado"}), 404

