from ..repositories.user_repository import get_user_by_email, get_user_by_id,  create_user, update_user, delete_user
from flask import jsonify

def get_user_by_email_service(email):
    if not email:
        return jsonify({"error": "email is required"})
    result = get_user_by_email(email)
    return result

def get_user_by_id_service(user_id):
    if not user_id:
        return jsonify({"error": "user_id is required"})
    get_user_by_id(user_id)
    return jsonify({"message": "User fetched successfully"})


def update_user_service(user_id, data):
    if not data:
        return jsonify({"error": "data is incorrect"})
    if not user_id:
        return jsonify({"error": "user_id is required"})
    update_user(user_id, data)
    return jsonify({"message": "User updated successfully"})

def delete_user_service(user_id):
    if not user_id:
        return jsonify({"error": "user_id is required"})
    delete_user(user_id)
    return jsonify({"message": "User deleted successfully"})

