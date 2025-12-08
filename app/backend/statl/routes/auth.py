from flask import ( Blueprint,jsonify, request)
from statl.services.auth_service import register_user, login_user

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