from flask import jsonify
from flask_jwt_extended import create_access_token
from statl.repositories.user_repository import get_user_by_email, create_user
from werkzeug.security import generate_password_hash, check_password_hash


def register_user(data):
    if not data:
        return None, jsonify({"error": "Requisicao invalida"}), 400
    if get_user_by_email(data.get("email")) is not None:
        return None, jsonify({"error": "Usuario ja registrado."}), 400
    try:
        email = data["email"]
        password = data["password"]
        name = data["name"]
    except KeyError as e:
        return None, jsonify({"error": f"Campo obrigatório ausente: {e}"}), 400
        
    user = create_user(email, generate_password_hash(password), name)
    return user, None, 201



# testar mais vezes
def login_user(data):
    
    if not data:
        return None, jsonify({"error": "Requisicao invalida"}), 400
    try:
        email = data["email"]
        password = data["password"]
    
    except KeyError as e:
        return None, jsonify({"error": f"Campo obrigatório ausente: {e}"}), 400
    
    user = get_user_by_email(email)


    if user is None or not check_password_hash(user.password_hash, password):
        return None, jsonify({"error": "Email ou senha incorretos."}), 400

    # Entender melhor a logica
    token = create_access_token(
        identity=str(user.id),
        additional_claims={"role": user.role}
    )
    return token, None, 200

