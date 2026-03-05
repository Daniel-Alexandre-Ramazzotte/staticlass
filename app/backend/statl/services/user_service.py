from ..repositories.user_repository import get_user_by_email, get_user_by_id,  create_user, update_user, delete_user
from werkzeug.security import generate_password_hash
from flask import jsonify
from werkzeug.security import check_password_hash

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

def delete_own_account_service(user_id, provided_password):
    user = get_user_by_id(user_id)
    if not user:
        return {"error": "Usuário não encontrado"}, 400

    # Verifica se a senha digitada está correta
    if not check_password_hash(user.password_hash, provided_password):
        return {"error": "Senha incorreta. Não foi possível excluir a conta."}, 400
    try: 
        delete_user(user_id) 
        return {"message": "Conta excluída com sucesso"}, 200
    except Exception as e:
        return {"error": f"Erro ao deletar no banco: {str(e)}"}, 500


def update_own_profile_service(user_id, data):
    # Import local para evitar erro de importação circular
    from statl.services.auth_service import email_valido
    
    user = get_user_by_id(user_id)
    if not user:
        return None, jsonify({"error": "Usuário não encontrado"}), 400

    changes = {}

    if "name" in data and data["name"] and data["name"] != user.name:
        changes["name"] = data["name"]

    if "email" in data and data["email"] and data["email"] != user.email:
        new_email = data["email"]
        if not email_valido(new_email):
            return None, jsonify({"error": "Email inválido"}), 400
        if get_user_by_email(new_email):
            return None, jsonify({"error": "Email já em uso"}), 400
        changes["email"] = new_email

    if "password" in data and data["password"]:
        if data["password"] != data.get("confirm_password"):
            return None, jsonify({"error": "As senhas não coincidem"}), 400
        changes["password_hash"] = generate_password_hash(data["password"])

    if not changes:
        return user, None, 200

    update_user(user_id, changes)
    
    updated_user = get_user_by_id(user_id)
    return updated_user, None, 200