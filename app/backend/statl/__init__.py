from flask import Flask, app
from flask_sqlalchemy import SQLAlchemy
import os
from dotenv import load_dotenv
from flask_jwt_extended import JWTManager
db = SQLAlchemy()


def create_app():
    load_dotenv()
    app = Flask(__name__, instance_relative_config = True)

    app.config["SQLALCHEMY_DATABASE_URI"] = (
        f"mysql+mysqlconnector://{os.getenv('DB_USER')}:{os.getenv('DB_PASS')}"
        f"@{os.getenv('DB_HOST')}/{os.getenv('DB_NAME')}"
    )
    
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.secret_key = os.getenv("SECRET_KEY")
    app.config["JWT_SECRET_KEY"] = os.getenv("SECRET_KEY")
    jwt = JWTManager(app)
    db.init_app(app)
    
    from .routes import auth, questions
    app.register_blueprint(auth.bp)
    app.register_blueprint(questions.bp)
    from .models import questions

   

    
    with app.app_context():
        db.create_all()
    return app