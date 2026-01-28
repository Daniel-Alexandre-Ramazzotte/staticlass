from flask import Blueprint, jsonify, session, current_app
from ..repositories.questions_repository import get_random_question, add_question_to_db, update_question, search_subject, add_subject_to_db
import os
from werkzeug.utils import secure_filename
## Numero fixo temporario
NUM_QUESTIONS = 5

bp = Blueprint('gen',__name__, url_prefix='/g')

# TODO: Sistema de personalizacao de perguntas
# Por exemplo, selecionar categorias, niveis de dificuldade, etc.



def random_question(num = NUM_QUESTIONS):   
    result = get_random_question(num)

    random_questions = result.all()
    session['correct_answers'] = [q.correct_answer for q in random_questions]
    print(random_questions)
    for linha in random_questions:  
        print(f"ID:{linha.id}, Pergunta: {linha.issue} \n\n")

    questions = jsonify({
    "id" : [q.id for q in random_questions],
    'issue' : [q.issue for q in random_questions],
    'answers' : [
        {"id": 'A', "text": [q.answer_a for q in random_questions]},
        {"id": 'B', "text": [q.answer_b for q in random_questions]},
        {"id": 'C', "text": [q.answer_c for q in random_questions]},
        {"id": 'D', "text": [q.answer_d for q in random_questions]},
        {"id": 'E', "text": [q.answer_e for q in random_questions]}
    ],
    'correct_answer' : [q.correct_answer for q in random_questions]
    })
    return questions

def check_answer(data):
    if not data:
        return jsonify({"error": "data is incorrect"})

    if data['answer'] == session['correct_answers'][data['question_index']]:
        return jsonify({'message' : 'correct'})
    else:
        return jsonify({'message' : 'incorrect'})



def add_question_service(data):
    if not data:
        
        return jsonify({"error": "data is incorrect"})

    if not all (k in data for k in ("subject", "issue", "answer_a", "answer_b", "answer_c", "answer_d", "answer_e", "correct_answer", "solution")):
        
        return jsonify({"error": "missing fields in data"})

    
    subject_name = data.pop("subject")
   
    subject_result = search_subject(subject_name)
    
    subject = subject_result.first()
   
    if not subject:
        
        data['id_subject'] = add_subject_to_db(subject_name)
    else:
        data['id_subject'] = subject.id

    
    return add_question_to_db(data)



def update_question_service(data):
    if not data:
        return jsonify({"error": "data is incorrect"})
    
    update_question(data)

    return jsonify({'message': 'question updated successfully'})

def process_upload(file_obj):
    """
    Salva o arquivo e retorna o nome do arquivo salvo.
    Retorna None se não houver arquivo válido.
    """
    if not file_obj or file_obj.filename == '':
        return None

    filename = secure_filename(file_obj.filename)
    upload_folder = current_app.config['UPLOAD_FOLDER']
    
    # Garante que o nome seja único ou apenas salva (depende da sua regra de negócio)
    caminho_absoluto = os.path.join(upload_folder, filename)
    print("Caminho absoluto do arquivo salvo:")
    print(caminho_absoluto)
    
    try:
        file_obj.save(caminho_absoluto)
        return filename  # Retornamos apenas o nome para salvar no banco
    except Exception as e:
        print(f"Erro ao salvar arquivo: {e}") # Log simples para debug
        return None