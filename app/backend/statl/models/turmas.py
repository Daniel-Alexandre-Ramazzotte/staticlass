from datetime import datetime

from statl import db


class Turma(db.Model):
    __tablename__ = "turmas"

    id = db.Column(db.Integer, primary_key=True)
    professor_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)


class TurmaAluno(db.Model):
    __tablename__ = "turma_alunos"
    __table_args__ = (db.PrimaryKeyConstraint("turma_id", "student_id"),)

    turma_id = db.Column(
        db.Integer,
        db.ForeignKey("turmas.id", ondelete="CASCADE"),
        nullable=False,
    )
    student_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
