from flask import Blueprint, jsonify, request

from backend.statl.utils.auth_middleware import require_role
from ..services.user_service import update_user, delete_user, get_user_by_email_service

bp = Blueprint('users', __name__, url_prefix='/users')

# Seriam utilizados para administração dos usuários


@bp.route('/update/<int:user_id>', methods=['PUT'])
@require_role('admin')
def update_user_route(user_id):
    data = request.json
    user, error, http_code = update_user(user_id, data)

    if error:
        return error, http_code
    return jsonify({"message": "User Updated", "id": user}), http_code

@bp.route('/delete/<int:user_id>', methods=['DELETE'])
@require_role('admin')
def delete_user_route(user_id):
    error, http_code = delete_user(user_id)

    if error:
        return error, http_code
    return jsonify({"message": "User Deleted"}), http_code

# @bp.route('/forgot', methods = ['GET', 'POST'])
# def forgot_password():
#     if request.method == "POST":
#         email = request.form.get("email")

#         token = 