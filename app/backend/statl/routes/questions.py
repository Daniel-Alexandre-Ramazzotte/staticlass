from flask import Blueprint, request
from ..services.questions_service import check_answer, random_question, add_question_service, update_question_service, process_upload
from typing import Any, Dict 

NUM_QUESTIONS = 5

bp = Blueprint('questions',__name__, url_prefix='/questions')

@bp.route("/rand", methods = ["GET"])
def get_question_rand():
    return random_question(NUM_QUESTIONS)


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
    
    file_issue = request.files.get("image_q")
    file_solution = request.files.get("image_s")
    
    # ADICIONE ESTES PRINTS DE DEBUG

    path_issue = process_upload(file_issue)
    
    path_solution = process_upload(file_solution)
 

    data['image_q'] = path_issue
    data['image_s'] = path_solution
    print(path_solution, path_issue)

    return add_question_service(data)