from .. import db
from sqlalchemy import text
from ..utils.auth_middleware import require_role
from werkzeug.utils import secure_filename
import os
from flask import current_app as app
from flask import jsonify

TABLE_NAME = "questions"



@require_role(['admin','professor'])
def add_question_to_db(data : dict):
    query = text(f"""INSERT INTO {TABLE_NAME}(id, issue, answer_a, answer_b, answer_c, answer_d, answer_e, correct_answer, solution, image_q, image_s, id_subject, id_professor) 
                 VALUES (:id, :issue, :answer_a, :answer_b, :answer_c, :answer_d, :answer_e, :correct_answer, :solution, :image_q, :image_s, :id_subject, :id_professor)""")
    print("aq")
    if data.get("id") is None:
        max_id = db.session.execute(text(f"SELECT MAX(id) FROM {TABLE_NAME}")).scalar()
        data["id"] = (max_id or 0) + 1
        
    params = {
        "id" : data.get('id'),
        "issue": data.get('issue'),
        "answer_a": data.get('answer_a'),
        "answer_b": data.get('answer_b'),
        "answer_c": data.get('answer_c'),
        "answer_d": data.get('answer_d'),
        "answer_e": data.get('answer_e'),
        "correct_answer": data.get('correct_answer'),
        "solution": data.get('solution'),
        "image_q": data.get('image_q'), 
        "image_s": data.get('image_s'),
        "id_subject": data.get('id_subject'),
        "id_professor": data.get('id_professor')
    }
    print(params)
    try:
        db.session.execute(query, params)
        db.session.commit()
        return jsonify({'message': 'question added successfully'}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
    



def add_subject_to_db(subject_name : str):
    query = text("INSERT INTO subjects (subject_name) VALUES (:subject_name)")
    try:
        db.session.execute(query, {"subject_name": subject_name})
        
        new_id = db.session.execute(text("SELECT LAST_INSERT_ID()")).scalar()
        db.session.commit()
        print(new_id)
        return new_id
    except Exception as e:
        db.session.rollback()
        raise e


@require_role(['admin','professor'])
def update_question(data : dict):
    params = ", ".join([f"{key} = :{key}" for key in data.keys() if key != "id"])

    query = text(f"UPDATE {TABLE_NAME} SET {params} WHERE id = :id")
    db.session.execute(query, data)
    db.session.commit()

@require_role(['admin','professor'])
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


def search_subject(subject_name : str):
    query = text("SELECT * FROM subjects WHERE subject_name LIKE :subject_name")
    result = db.session.execute(query, {"subject_name": f"%{subject_name}%"})
    return result

def get_professor_questions(professor_id: str):
    query = text("SELECT * FROM questions WHERE id_professor = :professor_id")
    result = db.session.execute(query, {"professor_id": professor_id})
    print(result)
    return result