from ..repositories.user_repository import (
    create_professor,
    create_user,
    create_user_with_role,
    delete_user,
    get_all_alunos,
    get_all_professors,
    get_user_by_email,
    get_user_by_id,
    get_users_by_role,
    update_user,
)
from werkzeug.security import generate_password_hash, check_password_hash
from flask import jsonify


def get_user_by_email_service(email):
    if not email:
        return None
    return get_user_by_email(email)


def get_user_by_id_service(user_id):
    if not user_id:
        return None
    return get_user_by_id(user_id)


def update_user_service(user_id, data):
    if not data or not user_id:
        return jsonify({"error": "dados inválidos"}), 400
    try:
        update_user(user_id, data)
        return jsonify({"message": "usuário atualizado com sucesso"}), 200
    except KeyError as e:
        return jsonify({"error": str(e)}), 400


def delete_user_service(user_id):
    if not user_id:
        return jsonify({"error": "user_id é obrigatório"}), 400
    try:
        delete_user(user_id)
        return jsonify({"message": "usuário removido com sucesso"}), 200
    except KeyError as e:
        return jsonify({"error": str(e)}), 500


def delete_own_account_service(user_id, provided_password):
    user = get_user_by_id(user_id)
    if not user:
        return {"error": "usuário não encontrado"}, 404
    if not check_password_hash(user.password_hash, provided_password):
        return {"error": "senha incorreta"}, 400
    try:
        delete_user(user_id)
        return {"message": "conta excluída com sucesso"}, 200
    except Exception as e:
        return {"error": f"erro ao deletar conta: {str(e)}"}, 500


def update_own_profile_service(user_id, data):
    from statl.services.auth_service import email_valido

    user = get_user_by_id(user_id)
    if not user:
        return None, jsonify({"error": "usuário não encontrado"}), 404

    changes = {}

    if data.get("name") and data["name"] != user.name:
        changes["name"] = data["name"]

    if data.get("email") and data["email"] != user.email:
        new_email = data["email"]
        if not email_valido(new_email):
            return None, jsonify({"error": "email inválido"}), 400
        if get_user_by_email(new_email):
            return None, jsonify({"error": "email já em uso"}), 400
        changes["email"] = new_email

    if data.get("password"):
        if data["password"] != data.get("confirm_password"):
            return None, jsonify({"error": "as senhas não coincidem"}), 400
        changes["password_hash"] = generate_password_hash(data["password"])

    if not changes:
        return user, None, 200

    try:
        update_user(user_id, changes)
    except KeyError as e:
        return None, jsonify({"error": str(e)}), 400

    return get_user_by_id(user_id), None, 200


def get_all_professors_service():
    return get_all_professors()


def create_professor_service(data):
    from statl.services.auth_service import email_valido

    if not data:
        return None, jsonify({"error": "dados inválidos"}), 400

    email = (data.get("email") or "").strip()
    name  = (data.get("name") or "").strip()

    if not email or not name:
        return None, jsonify({"error": "nome e email são obrigatórios"}), 400
    if not email_valido(email):
        return None, jsonify({"error": "email inválido"}), 400
    if get_user_by_email(email):
        return None, jsonify({"error": "email já está em uso"}), 400

    raw_password = data.get("password") or "Professor@123"
    professor_id = create_professor(email, generate_password_hash(raw_password), name)

    return {"id": professor_id, "temporary_password": raw_password}, None, 201


def get_all_alunos_service():
    return get_all_alunos()


def get_users_by_role_service(role):
    return get_users_by_role(role)


def create_managed_user_service(data, role):
    from statl.services.auth_service import email_valido

    if role not in {"professor", "aluno"}:
        return None, jsonify({"error": "papel inválido"}), 400
    if not data:
        return None, jsonify({"error": "dados inválidos"}), 400

    email = (data.get("email") or "").strip()
    name = (data.get("name") or "").strip()
    password = data.get("password") or ("Professor@123" if role == "professor" else "Aluno@123")

    if not email or not name:
        return None, jsonify({"error": "nome e email são obrigatórios"}), 400
    if not email_valido(email):
        return None, jsonify({"error": "email inválido"}), 400
    if get_user_by_email(email):
        return None, jsonify({"error": "email já está em uso"}), 400

    user_id = create_user_with_role(email, generate_password_hash(password), name, role)
    return {"id": user_id, "temporary_password": password}, None, 201


def update_managed_user_service(user_id, data, role):
    from statl.services.auth_service import email_valido

    if not data or not user_id:
        return jsonify({"error": "dados inválidos"}), 400

    user = get_user_by_id(user_id)
    if not user:
        return jsonify({"error": "usuário não encontrado"}), 404
    if user.role != role:
        return jsonify({"error": "usuário não pertence ao grupo informado"}), 400

    changes = {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip()
    password = data.get("password") or ""
    active = data.get("active")

    if name and name != user.name:
        changes["name"] = name
    if email and email != user.email:
        if not email_valido(email):
            return jsonify({"error": "email inválido"}), 400
        other_user = get_user_by_email(email)
        if other_user and other_user.id != user.id:
            return jsonify({"error": "email já está em uso"}), 400
        changes["email"] = email
    if password:
        changes["password_hash"] = generate_password_hash(password)
    if active is not None:
        changes["active"] = bool(active)

    if not changes:
        return jsonify({"message": "nenhuma alteração realizada"}), 200

    try:
        update_user(user_id, changes)
        return jsonify({"message": "usuário atualizado com sucesso"}), 200
    except KeyError as e:
        return jsonify({"error": str(e)}), 400


def delete_managed_user_service(user_id, role):
    user = get_user_by_id(user_id)
    if not user:
        return jsonify({"error": "usuário não encontrado"}), 404
    if user.role != role:
        return jsonify({"error": "usuário não pertence ao grupo informado"}), 400
    return delete_user_service(user_id)
