from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
import os
from dotenv import load_dotenv
from flask_jwt_extended import JWTManager
from flask_login import LoginManager
from flask_mail import Mail

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

    app.config["SQLALCHEMY_DATABASE_URI"] = (
        f"mysql+mysqlconnector://{os.getenv('DB_USER')}:{os.getenv('DB_PASS')}"
        f"@{os.getenv('DB_HOST')}/{os.getenv('DB_NAME')}"
    )
    app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.secret_key = os.getenv("SECRET_KEY")
    app.config["JWT_SECRET_KEY"] = os.getenv("SECRET_KEY")

    if testing:
        app.config["TESTING"] = True
        app.config["WTF_CSRF_ENABLED"] = False
        app.config["LOGIN_DISABLED"] = True
        app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"
    else:
        app.config["WTF_CSRF_ENABLED"] = True
    
    jwt = JWTManager(app)
    login_manager.init_app(app)
    mail.init_app(app)
    db.init_app(app)
    
    from .routes import auth, questions, users
    app.register_blueprint(auth.bp)
    app.register_blueprint(questions.bp)
    app.register_blueprint(users.bp)

   

    
    with app.app_context():
        db.create_all()
    return app




