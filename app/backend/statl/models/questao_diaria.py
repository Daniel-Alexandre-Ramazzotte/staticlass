from statl import db
from datetime import date


class QuestaoDialaria(db.Model):
    """Registra que um aluno fez a questão diária em determinada data.
    A constraint única impede que o mesmo aluno registre mais de uma vez por dia."""

    __tablename__ = "questao_diaria_historico"
    __table_args__ = (
        db.UniqueConstraint("usuario_id", "data", name="uq_usuario_data"),
    )

    id         = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"),
                           nullable=False, index=True)
    # Apenas a data (sem hora), para resetar diariamente à meia-noite
    data       = db.Column(db.Date, nullable=False, default=date.today)
