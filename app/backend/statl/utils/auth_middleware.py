import jwt
from functools import wraps
from flask import request, jsonify, g
from dotenv import load_dotenv
import os

load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY")
def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')

        if not auth_header:
            return jsonify({"error": "Missing Authorization header"}), 401

        parts = auth_header.split()

        if len(parts) != 2 or parts[0].lower() != "bearer":
            return jsonify({"error": "Invalid Authorization format. Use 'Bearer <token>'"}), 401

        token = parts[1]

        try:
            decoded = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            g.user_id = decoded.get("id")
            g.role = decoded.get("role")

            if g.user_id is None or g.role is None:
                return jsonify({"error": "Token missing required fields"}), 401

        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expired"}), 401
        
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401

        return f(*args, **kwargs)
    
    return decorated

# Roles = aluno, professor, admin
def require_role(required_roles):
    if isinstance(required_roles, str):
        required_roles = [required_roles]
    
    def decorator(f):
        @wraps(f)
        @require_auth
        def decorated(*args, **kwargs):
            if g.role not in required_roles:
                return jsonify({
                    "error": "Privileges required: " + ", ".join(required_roles)
                }), 403
            return f(*args, **kwargs)
        return decorated
    return decorator