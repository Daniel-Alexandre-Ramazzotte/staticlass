from statl import db


class Question(db.Model):
    __tablename__ = "questions"
    id = db.Column(db.Integer, primary_key=True)
    issue = db.Column(db.String(255), nullable=False)
    answer_a = db.Column(db.Text, nullable=False)
    answer_b = db.Column(db.Text, nullable=False)
    answer_c = db.Column(db.Text, nullable=False)
    answer_d = db.Column(db.Text, nullable=False)
    answer_e = db.Column(db.Text, nullable=False)
    correct_answer = db.Column(db.String(1), nullable=False)
    solution = db.Column(db.Text, nullable=False)

##    subject_id = db.Column(db.Integer, db.ForeignKey("subjects.subject_id"), nullable=False)

    ##subject = db.relationship("Subject", back_populates="questoes")

    
def create_db():
    db.create_all()