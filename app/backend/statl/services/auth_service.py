from flask import jsonify
from flask_jwt_extended import create_access_token
from werkzeug.security import generate_password_hash, check_password_hash
import re

from statl.security.tokens import (
    generate_reset_token,
    verify_reset_token,
    generate_verification_token,
    verify_verification_token,
)
from statl.services.email_service import send_reset_email, send_verification_email

from ..repositories.user_repository import (
    atualizar_senha,
    buscar_usuario_por_email,
    buscar_usuario_por_id,
    criar_usuario,
    verificar_email_usuario,
)

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
    if buscar_usuario_por_email(data.get("email")) is not None:
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
        
    user_id = criar_usuario(email, generate_password_hash(password), name)

    try:
        token = generate_verification_token(user_id)
        send_verification_email(to=email, token=token)
    except Exception:
        pass  # não bloqueia o registro se o email falhar

    return user_id, None, 201



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
    
    user = buscar_usuario_por_email(email)


    if user is None or not check_password_hash(user.password_hash, password):
        return None, jsonify({"error": "Email ou senha incorretos."}), 400

    if not user.active:
        return None, jsonify({"error": "Conta desativada. Contate o administrador."}), 403

    if not user.email_verified:
        return None, jsonify({"error": "Verifique seu email antes de fazer login. Cheque sua caixa de entrada."}), 403

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
    user = buscar_usuario_por_email(email)
    if not user:
        return None
    
    token = generate_reset_token(user.id)

    send_reset_email(to=user.email, token=token)
    return token





def verify_email_token(token: str) -> bool:
    ''' Verifica o token de email e ativa a conta se válido.
    '''
    user_id = verify_verification_token(token)
    if not user_id:
        return False
    user = buscar_usuario_por_id(user_id)
    if not user:
        return False
    verificar_email_usuario(user_id)
    return True


def reset_password(token: str, new_password: str):
    ''' Serviço para redefinir a senha do usuário.
    '''
    user_id = verify_reset_token(token)
    if not user_id:
        return False

    user = buscar_usuario_por_id(user_id)
    if not user:
        return False
    
    password_hash = generate_password_hash(new_password)
    atualizar_senha(user.id, password_hash)
    return True
