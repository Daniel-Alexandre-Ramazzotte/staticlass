from statl import db


class User(db.Model):
    __tablename__ = "users"

    id            = db.Column(db.Integer, primary_key=True)
    email         = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    name          = db.Column(db.String(255), nullable=False)
    role          = db.Column(db.String(20), nullable=False, default="aluno")
    score         = db.Column(db.Integer, nullable=True, default=0)
    active        = db.Column(db.Boolean, nullable=False, default=True)
