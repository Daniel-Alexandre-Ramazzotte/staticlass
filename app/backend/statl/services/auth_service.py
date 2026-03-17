from flask import jsonify
from flask_jwt_extended import create_access_token
from statl.repositories.user_repository import get_user_by_email, create_user, update_password
from werkzeug.security import generate_password_hash, check_password_hash
from statl.security.tokens import generate_reset_token, verify_reset_token
from statl.services.email_service import send_reset_email
import re

EMAIL_REGEX = re.compile(
    r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
)

def email_valido(email: str) -> bool:
    return bool(EMAIL_REGEX.match(email))


def register_user(data):
    ''' Serviço para registrar um novo usuário.
    '''
    if not data:
        return None, jsonify({"error": "Requisicao invalida"}), 400
    if get_user_by_email(data.get("email")) is not None:
        return None, jsonify({"error": "Usuario ja registrado."}), 400

    if not all (k in data for k in ("email", "password", "confirm_password", "name")):
        return None, jsonify({"error": "Campos obrigatórios ausentes."}), 400

    if data["password"] != data["confirm_password"]:
        return None, jsonify({"error": "As senhas nao coincidem."}), 400
    
    
    email = data["email"]
    password = data["password"]
    name = data["name"]
    
    if not email_valido(email):
        return None, jsonify({"error": "Email invalido."}), 400
        
    user = create_user(email, generate_password_hash(password), name)
    return user, None, 201



# testar mais vezes
def login_user(data):
    ''' Serviço para autenticar um usuário e gerar um token JWT.
    '''

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
    # Jogar isso em outro lugar /utils/
    print(f"Gerando token para usuário: {user.email} (ID: {user.id}, Role: {user.role}, nome: {user.name})")
    token = create_access_token(
        identity=str(user.id),
        additional_claims={
            "role": user.role,
            "email": user.email,
            "name": user.name
            }
    )
    return token, None, 200




def request_password_reset(email: str):
    ''' Servico para solicitar a redefinição de senha.
    '''
    user = get_user_by_email(email)
    if not user:
        return None
    
    token = generate_reset_token(user.id)

    send_reset_email(to=user.email, token=token)
    return token





def reset_password(token: str, new_password: str):
    ''' Serviço para redefinir a senha do usuário.
    '''
    user_id = verify_reset_token(token)
    if not user_id:
        return False
    
    user = get_user_by_email(user_id)
    if not user:
        return False
    
    password_hash = generate_password_hash(new_password)
    update_password(user.id, password_hash)
    return True