from flask import Blueprint, jsonify, request

from statl.utils.auth_middleware import require_role
from ..services.user_service import update_user_service, delete_user_service, get_user_by_email_service

bp = Blueprint('users', __name__, url_prefix='/users')

# Seriam utilizados para administração dos usuários


@bp.route('/update/<int:user_id>', methods=['PUT'])
@require_role('admin')
def update_user_route(user_id):
    data = request.json
    
    return update_user_service(user_id, data)

@bp.route('/delete/<int:user_id>', methods=['DELETE'])
@require_role('admin')
def delete_user_route(user_id):
    return delete_user_service(user_id)
