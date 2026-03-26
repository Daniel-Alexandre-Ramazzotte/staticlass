from statl import db
from datetime import datetime


class QuizResultado(db.Model):
    """Armazena o resultado de cada tentativa de quiz feita por um aluno."""

    __tablename__ = "quiz_resultados"

    id         = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"),
                           nullable=False, index=True)
    acertos    = db.Column(db.Integer, nullable=False)
    total      = db.Column(db.Integer, nullable=False)
    # Filtros usados no quiz (opcionais — podem ser NULL se o aluno não filtrou)
    capitulo_id = db.Column(db.Integer, db.ForeignKey("chapters.id", ondelete="SET NULL"),
                            nullable=True)
    dificuldade = db.Column(db.Integer, nullable=True)   # 1=Fácil, 2=Médio, 3=Difícil
    criado_em   = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
