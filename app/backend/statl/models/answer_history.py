from datetime import datetime

from sqlalchemy import text

from statl import db


class AnswerHistory(db.Model):
    __tablename__ = "answer_history"
    __table_args__ = (
        db.UniqueConstraint("source", "source_id", "question_id", name="uq_answer_history_source_question"),
        db.Index("idx_answer_history_student_answered_at", "student_id", "answered_at"),
        db.Index("idx_answer_history_question_answered_at", "question_id", "answered_at"),
        db.Index("idx_answer_history_list_answered_at", "list_id", "answered_at"),
        db.Index("idx_answer_history_source_source_id", "source", "source_id"),
    )

    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    question_id = db.Column(
        db.Integer,
        db.ForeignKey("questions.id", ondelete="CASCADE"),
        nullable=False,
    )
    answered_at = db.Column(
        db.DateTime,
        nullable=False,
        default=datetime.utcnow,
        server_default=text("CURRENT_TIMESTAMP"),
    )
    is_correct = db.Column(db.Boolean, nullable=False, default=False, server_default="false")
    selected_answer = db.Column(db.String(1), nullable=True)
    source = db.Column(db.String(20), nullable=False)
    source_id = db.Column(db.Integer, nullable=False)
    list_id = db.Column(
        db.Integer,
        db.ForeignKey("lists.id", ondelete="SET NULL"),
        nullable=True,
    )
