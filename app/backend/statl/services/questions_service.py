from flask import Blueprint, jsonify, session
from ..repositories.questions_repository import get_random_question

## Numero fixo temporario
NUM_QUESTIONS = 5

bp = Blueprint('gen',__name__, url_prefix='/g')

# TODO: Sistema de personalizacao de perguntas
# Por exemplo, selecionar categorias, niveis de dificuldade, etc.

# TODO: mandar questao para o o banco de dados

def random_question(amount = NUM_QUESTIONS):   
    result = get_random_question(amount)

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

    