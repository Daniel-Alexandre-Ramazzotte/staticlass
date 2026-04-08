from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt


def require_role(papeis_permitidos):
    """Decorator que valida JWT e verifica se o papel do usuário está autorizado."""
    if isinstance(papeis_permitidos, str):
        papeis_permitidos = [papeis_permitidos]

    def decorador(funcao):
        @wraps(funcao)
        def wrapper(*args, **kwargs):
            try:
                verify_jwt_in_request()
            except Exception:
                return jsonify({"error": "token inválido ou ausente"}), 401

            papel_usuario = get_jwt().get("role")
            if papel_usuario not in papeis_permitidos:
                return jsonify({
                    "error": f"acesso negado — requer: {', '.join(papeis_permitidos)}"
                }), 403

            return funcao(*args, **kwargs)
        return wrapper
    return decorador
