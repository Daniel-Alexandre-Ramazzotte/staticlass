from datetime import datetime

from statl import db


class QuestionList(db.Model):
    __tablename__ = "lists"

    id = db.Column(db.Integer, primary_key=True)
    professor_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title = db.Column(db.String(255), nullable=False)
    deadline = db.Column(db.DateTime, nullable=False)
    published = db.Column(db.Boolean, nullable=False, default=False, server_default="false")
    published_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )
    turma_id = db.Column(
        db.Integer,
        db.ForeignKey("turmas.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )


class QuestionListQuestion(db.Model):
    __tablename__ = "list_questions"
    __table_args__ = (
        db.UniqueConstraint("list_id", "question_id", name="uq_list_question"),
        db.UniqueConstraint("list_id", "order_index", name="uq_list_order_index"),
    )

    id = db.Column(db.Integer, primary_key=True)
    list_id = db.Column(
        db.Integer,
        db.ForeignKey("lists.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    question_id = db.Column(
        db.Integer,
        db.ForeignKey("questions.id", ondelete="CASCADE"),
        nullable=False,
    )
    order_index = db.Column(db.Integer, nullable=False)


class QuestionListSubmission(db.Model):
    __tablename__ = "list_submissions"
    __table_args__ = (
        db.UniqueConstraint("list_id", "student_id", name="uq_list_submission_student"),
    )

    id = db.Column(db.Integer, primary_key=True)
    list_id = db.Column(
        db.Integer,
        db.ForeignKey("lists.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    student_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    started_at = db.Column(db.DateTime, nullable=True)
    submitted_at = db.Column(db.DateTime, nullable=True)
    correct_count = db.Column(db.Integer, nullable=False, default=0, server_default="0")
    total_questions = db.Column(db.Integer, nullable=False, default=0, server_default="0")
    score_pct = db.Column(db.Numeric(5, 2), nullable=False, default=0, server_default="0")
    is_late = db.Column(db.Boolean, nullable=False, default=False, server_default="false")


class QuestionListSubmissionAnswer(db.Model):
    __tablename__ = "list_submission_answers"

    id = db.Column(db.Integer, primary_key=True)
    submission_id = db.Column(
        db.Integer,
        db.ForeignKey("list_submissions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    question_id = db.Column(
        db.Integer,
        db.ForeignKey("questions.id", ondelete="CASCADE"),
        nullable=False,
    )
    selected_answer = db.Column(db.String(1), nullable=True)
    is_correct = db.Column(db.Boolean, nullable=False, default=False, server_default="false")


class QuestionListChangeLog(db.Model):
    __tablename__ = "list_change_log"

    id = db.Column(db.Integer, primary_key=True)
    list_id = db.Column(
        db.Integer,
        db.ForeignKey("lists.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    professor_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    action = db.Column(db.String(40), nullable=False)
    summary = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
