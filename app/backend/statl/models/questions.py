from statl import db


class Question(db.Model):
    __tablename__ = "questions"
    id = db.Column(db.Integer, primary_key=True)
    # Enunciado e alternativas (formato legado — professor cria via app)
    issue = db.Column(db.Text, nullable=False)
    answer_a = db.Column(db.Text, nullable=True)
    answer_b = db.Column(db.Text, nullable=True)
    answer_c = db.Column(db.Text, nullable=True)
    answer_d = db.Column(db.Text, nullable=True)
    answer_e = db.Column(db.Text, nullable=True)
    correct_answer = db.Column(db.String(1), nullable=True)
    solution = db.Column(db.Text, nullable=True)
    # Imagens (upload pelo professor)
    image_q = db.Column(db.String(500), nullable=True)
    image_s = db.Column(db.String(500), nullable=True)
    # Relações legadas
    id_subject = db.Column(db.Integer, nullable=True)
    id_professor = db.Column(db.Integer, nullable=True)
    # Campos do banco de questões PROPET (importados via migrate_questoes.py)
    original_id = db.Column(db.String(50), nullable=True)
    section = db.Column(db.String(30), nullable=True)   # estatistica_basica | probabilidade | inferencia
    difficulty = db.Column(db.SmallInteger, nullable=True)  # 1=fácil, 2=médio, 3=difícil
    needs_fix = db.Column(db.Boolean, default=False)
    chapter_id = db.Column(db.Integer, db.ForeignKey("chapters.id"), nullable=True)
    topic_id = db.Column(db.Integer, db.ForeignKey("topics.id"), nullable=True)

    chapter = db.relationship("Chapter", foreign_keys=[chapter_id])
    topic = db.relationship("Topic", foreign_keys=[topic_id])
    alternatives = db.relationship("Alternative", back_populates="question",
                                   cascade="all, delete-orphan", lazy="dynamic")


class Alternative(db.Model):
    __tablename__ = "alternatives"
    id = db.Column(db.Integer, primary_key=True)
    question_id = db.Column(db.Integer, db.ForeignKey("questions.id", ondelete="CASCADE"),
                            nullable=False)
    letter = db.Column(db.String(1), nullable=False)   # A, B, C, D, E
    text = db.Column(db.Text, nullable=False)
    is_correct = db.Column(db.Boolean, default=False)

    question = db.relationship("Question", back_populates="alternatives")


def create_db():
    db.create_all()
