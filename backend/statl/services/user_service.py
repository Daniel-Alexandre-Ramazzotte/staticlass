from ..repositories.user_repository import get_user_by_email, get_user_by_id, get_email

def get_user_by_email_service(email):
    result = get_user_by_email(email)
    return result

def get_user_by_id_service(user_id):
    result = get_user_by_id(user_id)
    return result


def update_user(user_id, data):
    pass

def delete_user(user_id):
    pass


def recover_password_service():
    pass