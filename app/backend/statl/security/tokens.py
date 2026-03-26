from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
from flask import current_app

def generate_reset_token(user_id: int) -> str:
    ''' Gera um token de redefinição de senha para o usuário com o ID fornecido.
    '''
    serializer = URLSafeTimedSerializer(
        current_app.config["SECRET_KEY"]
    )

    token = serializer.dumps(
        {"user_id": user_id},
        salt="password-reset"
    )

    return token


def verify_reset_token(token: str, expiration: int = 900):
    ''' Verifica o token de redefinição de senha e retorna o ID do usuário se o token for válido.
    '''
    serializer = URLSafeTimedSerializer(
        current_app.config["SECRET_KEY"]
    )

    try:
        data = serializer.loads(
            token,
            salt="password-reset",
            max_age=expiration
        )
    except SignatureExpired:
        return None  # token válido, porém expirado
    except BadSignature:
        return None  # token inválido

    return data["user_id"]