from .. import db
from sqlalchemy import text
from ..utils.auth_middleware import  require_role


# get user by email
def get_user_by_email(email):
    ''' Retorna o usuário com o email fornecido.
    '''
    user = db.session.execute(
    text("SELECT * FROM users WHERE email = :email"),
    {"email": email}).fetchone()
    return user


# Get User by their id 
def get_user_by_id(user_id):
    ''' Retorna o usuário com o ID fornecido.
    '''
    user = db.session.execute(
        text("SELECT * FROM users WHERE id = :id"),
        {"id": user_id}
    ).fetchone()
    return user

# Create user
def create_user(email, password_hash, name):
    ''' Cria um novo usuário com o email, hash de senha e nome fornecidos.
    '''
    db.session.execute(
        text("INSERT INTO users (email, password_hash, name) VALUES (:email, :password_hash, :name)"),
        {"email": email, "password_hash": password_hash, "name": name}
    )
    user_id = db.session.execute(text("SELECT LAST_INSERT_ID()")).scalar()
    db.session.commit()
    return user_id

# Update user
def update_user(user_id, data):
    ''' Atualiza os dados do usuário com o ID fornecido.
    '''
    fields = ', '.join([f"{k} = :{k}" for k in data.keys()])
    params = data.copy()
    params["id"] = user_id
    try:
        query = text(f"UPDATE users SET {fields} WHERE id = :id")
        db.session.execute(query, params)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        raise KeyError(f"Something went wrong {e}")


def update_password(user_id, new_password_hash):
    ''' Atualiza a senha do usuário com o ID fornecido.
    '''
    try:
        query = text("UPDATE users SET password_hash = :password_hash WHERE id = :id")
        db.session.execute(query, {"password_hash": new_password_hash, "id": user_id})
        db.session.commit()
    except Exception as e:
        raise KeyError(f"Something went wrong {e}")

# Delete user - quero deletar um aluno pode manter essa mesma função ?
# @require_role(['admin','professor']) 
def delete_user(user_id):
    ''' Deleta o usuário com o ID fornecido.
    '''
    try:
        query = text("DELETE FROM users WHERE id = :id")
        db.session.execute(query, {"id": user_id})
        db.session.commit()
    except Exception as e:
        raise KeyError(f"Something went wrong {e}")
