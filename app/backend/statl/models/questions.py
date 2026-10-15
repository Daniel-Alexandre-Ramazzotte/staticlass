from statl import db


class Question(db.Model):
    __tablename__ = "questions"
    __table_args__ = (
        db.UniqueConstraint("original_id", name="uq_questions_original_id"),
    )
    id = db.Column(db.Integer, primary_key=True)
    issue = db.Column(db.Text, nullable=False)
    question_type = db.Column(db.String(30), nullable=False, server_default='multiple_choice')
    correct_answer = db.Column(db.String(1), nullable=True)
    solution = db.Column(db.Text, nullable=True)
    image_q = db.Column(db.String(500), nullable=True)
    image_s = db.Column(db.String(500), nullable=True)
    image_q_position = db.Column(db.String(10), nullable=False, server_default='depois')
    original_id = db.Column(db.String(50), nullable=True)
    section = db.Column(db.String(30), nullable=True)
    source = db.Column(db.String(20), nullable=True)  # 'apostila' | 'concurso' | None
    difficulty = db.Column(db.SmallInteger, nullable=True)
    needs_fix = db.Column(db.Boolean, nullable=False, default=False)
    chapter_id = db.Column(db.Integer, db.ForeignKey("chapters.id"), nullable=True)
    topic_id = db.Column(db.Integer, db.ForeignKey("topics.id"), nullable=True)
    professor_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)

    chapter = db.relationship("Chapter", foreign_keys=[chapter_id])
    topic = db.relationship("Topic", foreign_keys=[topic_id])
    professor = db.relationship("User", foreign_keys=[professor_id])
    alternatives = db.relationship(
        "Alternative",
        back_populates="question",
        cascade="all, delete-orphan",
        lazy="dynamic",
    )


class Alternative(db.Model):
    __tablename__ = "alternatives"
    __table_args__ = (
        db.UniqueConstraint("question_id", "letter", name="uq_alternative_question_letter"),
    )
    id = db.Column(db.Integer, primary_key=True)
    question_id = db.Column(db.Integer, db.ForeignKey("questions.id", ondelete="CASCADE"),
                            nullable=False)
    letter = db.Column(db.String(1), nullable=False)   # A, B, C, D, E
    text = db.Column(db.Text, nullable=False)
    is_correct = db.Column(db.Boolean, default=False)

    question = db.relationship("Question", back_populates="alternatives")


class QuestionProposal(db.Model):
    __tablename__ = "question_proposals"
    id = db.Column(db.Integer, primary_key=True)
    question_id = db.Column(db.Integer, db.ForeignKey("questions.id", ondelete="CASCADE"), nullable=False)
    proposer_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    status = db.Column(db.String(20), nullable=False, default='pending')
    changes = db.Column(db.JSON, nullable=False)
    reason = db.Column(db.Text, nullable=True)
    admin_note = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    reviewed_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    reviewed_at = db.Column(db.DateTime, nullable=True)

    question = db.relationship("Question", foreign_keys=[question_id])
    proposer = db.relationship("User", foreign_keys=[proposer_id])
    reviewer = db.relationship("User", foreign_keys=[reviewed_by])


def create_db():
    db.create_all()
