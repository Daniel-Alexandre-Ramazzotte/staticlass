from flask import Blueprint, request, send_from_directory
from ..services.questions_service import check_answer, random_question, add_question_service, update_question_service, process_upload, get_images
from typing import Any, Dict
import os 

NUM_QUESTIONS = 5

# 1. Pega o diretório atual onde o arquivo está
# Resultado: .../staticlass/app/backend/statl/routes
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))

# 2. Sobe 4 níveis para chegar na raiz do projeto 'staticlass'
# Usamos '..' quatro vezes para voltar as pastas
ROOT_PROJECT_DIR = os.path.abspath(os.path.join(CURRENT_DIR, '..', '..', '..', '..'))

# 3. Agora aponta para a pasta uploads
UPLOAD_FOLDER = os.path.join(ROOT_PROJECT_DIR, 'uploads')


bp = Blueprint('questions',__name__, url_prefix='/questions')

@bp.route("/rand/<int:num>", methods = ["GET"])
def get_question_rand(num = NUM_QUESTIONS):
    return random_question(num)


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
    
    print(data)

    file_issue = request.files.get("image_q")
    file_solution = request.files.get("image_s")
    
    # ADICIONE ESTES PRINTS DE DEBUG

    path_issue = process_upload(file_issue)
    
    path_solution = process_upload(file_solution)
 
        
    data['image_q'] = path_issue
    data['image_s'] = path_solution
    print(path_solution, path_issue)

    return add_question_service(data)




@bp.route('/uploads/<path:filename>', methods = ['GET'])
def serve_image(filename):
    try:
        return send_from_directory(UPLOAD_FOLDER, filename)
    except FileNotFoundError:
        print("Arquivo não encontrado no servidor.")
        return "Arquivo não encontrado", 404