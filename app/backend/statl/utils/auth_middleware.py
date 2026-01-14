from functools import wraps
from flask import jsonify
from dotenv import load_dotenv
import os
from flask_jwt_extended import verify_jwt_in_request, get_jwt

load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY")

# Roles = aluno, professor, admin
def require_role(required_roles):
    # Garante que seja uma lista, mesmo se passar só uma string
    if isinstance(required_roles, str):
        required_roles = [required_roles]

    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            # Verifica o token JWT
            # Ele lê o header, valida o Bearer, checa expiração e assinatura
            try:
                verify_jwt_in_request()
            except Exception as e:
                return jsonify({"error": "Invalid or missing token"}), 401
            
            # Pega os dados do token já decodificado
            claims = get_jwt()
            
            # Verifica a role
            # Se 'role' não existir no token, assume que não tem permissão
            user_role = claims.get("role")
            
            if user_role not in required_roles:
                return jsonify({
                    "error": f"Acesso negado. Privilégios necessários: {', '.join(required_roles)}"
                }), 403

            return f(*args, **kwargs)
        return wrapper
    return decorator