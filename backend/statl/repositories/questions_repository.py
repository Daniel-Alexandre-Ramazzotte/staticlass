from .. import db
from sqlalchemy import text
from ..utils.auth_middleware import require_auth

TABLE_NAME = "questions"

# CRUD
# Create 
# TODO: Verificar os campos do banco de dados 
def create_question(data : dict):
    # Verificar como fazer para colocar a imagem

    query = text(f"""INSERT INTO {TABLE_NAME}(issue, answer_a, answer_b, answer_c, answer_d, answer_e, correct_answer, solution) 
                 VALUES (:issue, :answer_a, :answer_b, :answer_c, :answer_d, :answer_e, :correct_answer, :solution)""")
    db.session.execute(query, data)
    db.session.commit()


def update_question():
    ## Generalizar o maximo possivel para poder atualizar qualquer campo de qualquer coluna da tabela
    # query = text(f"UPDATE questions SET ")
    pass

@require_auth
def delete_question(question_id):
    query = text(f"DELETE FROM {TABLE_NAME} WHERE id = :id")
    try:
        db.session.execute(query, {"id": question_id})
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        raise e


def get_random_question(amount : int):
    query = text("SELECT * FROM questions ORDER BY RAND() LIMIT :num_questoes")
    result = db.session.execute(query, {"num_questoes": amount})
   
    return result

def get_question_by_id(question_id : int):
    query = text(f"SELECT * FROM questions WHERE id = :id")
    result = db.session.execute(query, {"id": question_id})
    return result


