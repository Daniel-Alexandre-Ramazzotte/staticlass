from flask import ( Blueprint,jsonify, request)
from statl.services.auth_service import register_user, login_user
from flask_jwt_extended import decode_token
bp = Blueprint('auth', __name__, url_prefix='/auth')

#create
@bp.route('/register', methods=['POST'])
def register():
    data = request.json

    user, error, http_code = register_user(data)

    if error:
        return error, http_code
    return jsonify({"message": "User Created", "id": user}), http_code

# login
@bp.route('/login', methods=['GET', 'POST'])
def login():
    data = request.json
    
    token, error, http_code = login_user(data)
    if error:
        return error, http_code
    return jsonify({"token": token})

@bp.route('/debug-token', methods=['GET', 'POST'])
def debug_token_manual():
    print("--- INICIANDO DEBUG DO TOKEN ---")
    
    # 1. Verifica se o Header existe
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({"erro": "O header Authorization não foi enviado"}), 400
    
    print(f"Header recebido: {auth_header}")

    # 2. Verifica se tem a palavra Bearer
    if not auth_header.startswith("Bearer "):
        return jsonify({"erro": "Faltou a palavra 'Bearer ' no início do header"}), 400
    
    # 3. Tenta pegar só o código do token
    try:
        token_string = auth_header.split(" ")[1] # Pega a parte depois do espaço
    except IndexError:
        return jsonify({"erro": "Token vazio ou mal formatado"}), 400

    # 4. Tenta decodificar manualmente (Isso vai revelar o erro real)
    try:
        # A função decode_token lança exceções específicas que o @jwt_required esconde
        decoded = decode_token(token_string)
        return jsonify({
            "status": "SUCESSO",
            "mensagem": "O token está perfeito!",
            "payload": decoded
        }), 200
        
    except Exception as e:

        print(f"ERRO PYTHON: {str(e)}")
        return jsonify({
            "status": "FALHA",
            "tipo_erro": type(e).__name__, # Ex: ExpiredSignatureError, DecodeError
            "mensagem_erro": str(e)        # A explicação detalhada
        }), 422