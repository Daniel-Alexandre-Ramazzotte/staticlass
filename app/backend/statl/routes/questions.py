from flask import Blueprint, request
from ..services.questions_service import check_answer, random_question, add_question_service, update_question_service, process_upload
from typing import Any, Dict 

NUM_QUESTIONS = 5

bp = Blueprint('questions',__name__, url_prefix='/questions')

@bp.route("/rand", methods = ["GET"])
def get_question_rand():
    return random_question(NUM_QUESTIONS)


# ## Pensa
# @bp.route("/rand/<int:num>", methods = ["GET"])
# def get_question_rand_num(num):
#     return random_question(num)

@bp.route("/update", methods = ["PUT"])
def update_question_route():
    data = request.get_json()
    return update_question_service(data)

@bp.route('/check', methods = ['POST'])
def check_correct_answer():
    data = request.get_json()
    return check_answer(data)

# TODO: 

@bp.route('/add', methods = ['POST'])
def add_question():
    data: Dict[str, Any] = request.form.to_dict()
    print("\n--- DEBUG DO HEADER ---")
    content_type = request.headers.get('Content-Type')
    print(f"1. Content-Type recebido: {content_type}")
    
    # Verifica o tamanho do pacote (bytes)
    # Se for 0, o Postman não mandou nada.
    # Se for grande (>1000), o arquivo chegou mas o Flask não leu.
    raw_data = request.get_data()
    print(f"2. Tamanho total dos dados: {len(raw_data)} bytes")
    
    print(f"3. Chaves de Arquivo: {request.files.keys()}")
    print("-----------------------\n")
    file_issue = request.files.get("image_q")
    file_solution = request.files.get("image_s")

    path_issue = process_upload(file_issue)

    path_solution = process_upload(file_solution)
 

    data['image_q'] = path_issue
    data['image_s'] = path_solution
    print(data)
    return add_question_service(data)