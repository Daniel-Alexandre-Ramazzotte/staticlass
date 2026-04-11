import os
from datetime import timedelta
from flask import Flask, jsonify, request as req_flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_login import LoginManager
from flask_mail import Mail
from sqlalchemy import text
from dotenv import load_dotenv
from .config import Config

db           = SQLAlchemy()
mail         = Mail()
login_manager = LoginManager()

_PASTA_UPLOADS = os.path.normpath(
    os.path.join(os.path.abspath(os.path.dirname(__file__)), '..', '..', 'uploads')
)
os.makedirs(_PASTA_UPLOADS, exist_ok=True)


def create_app(testing: bool = False):
    load_dotenv()
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_object(Config)

    _configurar_banco(app, testing)

    app.config['UPLOAD_FOLDER']               = _PASTA_UPLOADS
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    if not testing:
        app.secret_key             = os.getenv("FLASK_SECRET_KEY", os.getenv("SECRET_KEY"))
        app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", os.getenv("SECRET_KEY"))
        app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=12)

    _configurar_cors(app)

    JWTManager(app)
    login_manager.init_app(app)
    mail.init_app(app)
    db.init_app(app)

    _registrar_blueprints(app)

    with app.app_context():
        from .models import user, chapters, quiz_resultado, questao_diaria  # noqa: F401
        from .models import questions as _modelos_questao                   # noqa: F401
        db.create_all()
        _garantir_schema_incremental(app)

    return app


def _configurar_banco(app, testing):
    if testing:
        from sqlalchemy.pool import StaticPool
        app.config.update(
            TESTING=True,
            WTF_CSRF_ENABLED=False,
            LOGIN_DISABLED=True,
            SQLALCHEMY_DATABASE_URI="sqlite:///:memory:",
            SQLALCHEMY_ENGINE_OPTIONS={
                "connect_args": {"check_same_thread": False},
                "poolclass": StaticPool,
            },
            SECRET_KEY="test-secret-key",
            JWT_SECRET_KEY="test-jwt-secret-key",
        )
        return

    url = os.getenv("DATABASE_URL")
    if not url:
        raise RuntimeError("DATABASE_URL não definida.")
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
    app.config["SQLALCHEMY_DATABASE_URI"] = url


def _configurar_cors(app):
    origens = os.getenv("CORS_ORIGINS", "*")
    lista_origens = [o.strip() for o in origens.split(",")] if origens != "*" else "*"
    CORS(app, origins=lista_origens)

    @app.before_request
    def tratar_preflight():
        if req_flask.method == 'OPTIONS':
            res = jsonify({})
            res.headers.update({
                'Access-Control-Allow-Origin':  '*',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
            })
            return res, 200

    @app.after_request
    def adicionar_cabecalhos_cors(response):
        response.headers.update({
            'Access-Control-Allow-Origin':  '*',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
        })
        return response


def _registrar_blueprints(app):
    from .routes import auth, questions, users, admin
    for blueprint in (auth.bp, questions.bp, users.bp, admin.bp):
        app.register_blueprint(blueprint)


def _garantir_schema_incremental(app):
    if db.engine.dialect.name != "postgresql":
        return

    try:
        db.session.execute(
            text("ALTER TABLE questions ADD COLUMN IF NOT EXISTS source VARCHAR(20)")
        )
        # Garante defaults nas colunas users que podem ter sido criadas sem server_default
        db.session.execute(
            text("ALTER TABLE users ALTER COLUMN active SET DEFAULT TRUE")
        )
        db.session.execute(
            text("ALTER TABLE users ALTER COLUMN score SET DEFAULT 0")
        )
        # Backfill: set active=TRUE for any user rows created before server_default was applied
        db.session.execute(
            text("UPDATE users SET active = TRUE WHERE active IS NULL")
        )
        db.session.commit()
    except Exception:
        db.session.rollback()
        app.logger.exception("Falha ao garantir schema incremental do banco.")
        raise
