from flask import Flask, jsonify, request as flask_request
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import os
from dotenv import load_dotenv
from flask_jwt_extended import JWTManager
from flask_login import LoginManager
from flask_mail import Mail
from .config import Config
db = SQLAlchemy()
mail = Mail()

BASE_DIR = os.path.abspath(os.path.dirname(__file__))  
UPLOAD_FOLDER = os.path.join(BASE_DIR, '..', '..', 'uploads') 
UPLOAD_FOLDER = os.path.normpath(UPLOAD_FOLDER)  


# Cria a pasta se não existir
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)


login_manager = LoginManager()

def create_app(testing: bool = False):
    load_dotenv()
    app = Flask(__name__, instance_relative_config = True)
    app.config.from_object(Config)

    if testing:
        app.config["TESTING"] = True
        app.config["WTF_CSRF_ENABLED"] = False
        app.config["LOGIN_DISABLED"] = True
        app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"
    else:
        app.config["WTF_CSRF_ENABLED"] = True
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            raise RuntimeError("DATABASE_URL não definida. O backend agora suporta apenas PostgreSQL.")
        if database_url.startswith("postgres://"):
            database_url = database_url.replace("postgres://", "postgresql://", 1)
        app.config["SQLALCHEMY_DATABASE_URI"] = database_url

    app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.secret_key = os.getenv("SECRET_KEY")
    app.config["JWT_SECRET_KEY"] = os.getenv("SECRET_KEY")
    
    CORS(app, origins='*')

    @app.before_request
    def handle_preflight():
        if flask_request.method == 'OPTIONS':
            res = jsonify({})
            res.headers['Access-Control-Allow-Origin'] = '*'
            res.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With'
            res.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS, PATCH'
            return res, 200

    @app.after_request
    def add_cors_headers(response):
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS, PATCH'
        return response
    jwt = JWTManager(app)
    login_manager.init_app(app)
    
    mail.init_app(app)
    db.init_app(app)
    
    from .routes import auth, questions, users, admin
    app.register_blueprint(auth.bp)
    app.register_blueprint(questions.bp)
    app.register_blueprint(users.bp)
    app.register_blueprint(admin.bp)

   

    
    with app.app_context():
        from .models import user           # noqa: F401
        from .models import chapters       # noqa: F401
        from .models import questions as question_models  # noqa: F401
        from .models import quiz_resultado  # noqa: F401
        from .models import questao_diaria  # noqa: F401
        db.create_all()
    return app




