from .. import db
from sqlalchemy import text
from ..utils.auth_middleware import require_auth, require_role

## TODO: Recuperacao de senha,
## 


# get user by email
def get_user_by_email(email):
    user = db.session.execute(
    text("SELECT * FROM users WHERE email = :email"),
    {"email": email}
).fetchone()
    return user


# Get User by their id 
def get_user_by_id(user_id):
    user = db.session.execute(
        text("SELECT * FROM users WHERE id = :id"),
        {"id": user_id}
    ).fetchone()
    return user

# Create user
def create_user(email, password_hash, name):
    db.session.execute(
        text("INSERT INTO users (email, password_hash, name) VALUES (:email, :password_hash, :name)"),
        {"email": email, "password_hash": password_hash, "name": name}
    )
    user_id = db.session.execute(text("SELECT LAST_INSERT_ID()")).scalar()
    db.session.commit()
    return user_id

# Update user
@require_auth
def update_user(user_id, data):
    fields = ', '.join([f"{k}" for k in data.keys()])
    params = data.copy()
    params["id"] = user_id
    try:
        query = text(f"UPDATE users SET {fields} WHERE id = :id")
        db.session.execute(query, params)
        db.session.commit()
    except Exception as e:
        raise KeyError(f"Something went wrong {e}")
    

# Delete user
@require_role(['admin','professor'])
def delete_user(user_id):
    try:
        query = text("DELETE FROM users WHERE id = :id")
        db.session.execute(query, {"id": user_id})
        db.session.commit()
    except Exception as e:
        raise KeyError(f"Something went wrong {e}")


