from flask import Blueprint, jsonify, request
from statl.services.auth_service import register_user, login_user, request_password_reset, reset_password

bp = Blueprint('auth', __name__, url_prefix='/auth')

# Rotas -> Services -> Repositories
# Portaria -> Regras de Negócio -> Banco de Dados

#create
@bp.route('/register', methods=['POST'])
def register():
    data = request.json

    user, error, http_code = register_user(data)

    if error:
        return error, http_code
    return jsonify({"message": "User Created", "id": user}), http_code

# login
@bp.route('/login', methods=['POST'])
def login():
    data = request.json

    token, error, http_code = login_user(data)
    if error:
        return error, http_code
    return jsonify({"access_token": token})
    



@bp.route("/password-reset", methods=["POST"])
def request_reset():

    ''' Solicita a redefinição de senha para o email fornecido.
    '''
    data = request.get_json()
    email = data.get("email")

    if not email:
        return jsonify({"error": "Email é obrigatório"}), 400

    token = request_password_reset(email)

    return jsonify({
        "message": "Se o email existir, um link de recuperação será enviado."
    }), 200


@bp.route("/password-reset/confirm", methods=["POST"])
def confirm_reset():
    ''' Redefine a senha usando o token e a nova senha fornecidos.
    '''
    data = request.get_json()

    token = data.get("token")
    new_password = data.get("new_password")

    if not token or not new_password:
        return jsonify({"error": "Token e nova senha são obrigatórios"}), 400

    success = reset_password(token, new_password)

    if not success:
        return jsonify({"error": "Token inválido ou expirado"}), 400

    return jsonify({"message": "Senha redefinida com sucesso"}), 200

