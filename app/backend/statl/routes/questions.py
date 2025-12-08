from flask import Blueprint, request
from ..services.questions_service import check_answer, random_question

NUM_QUESTIONS = 5

bp = Blueprint('questions',__name__, url_prefix='/g')

@bp.route("/rand", methods = ["GET"])
def get_question_rand():
    return random_question(NUM_QUESTIONS)


# ## Pensa
# @bp.route("/rand/<int:num>", methods = ["GET"])
# def get_question_rand_num(num):
#     return random_question(num)


@bp.route('/check', methods = ['POST'])
def check_correct_answer():
    data = request.get_json()
    return check_answer(data)

# TODO: 

