from .. import db
from sqlalchemy import text


_ALLOWED_USER_UPDATE_FIELDS = {"name", "email", "score", "active", "password_hash"}


def get_user_by_email(email):
    return db.session.execute(
        text("SELECT * FROM users WHERE email = :email"),
        {"email": email},
    ).fetchone()


def get_user_by_id(user_id):
    return db.session.execute(
        text("SELECT * FROM users WHERE id = :id"),
        {"id": user_id},
    ).fetchone()


def create_user(email, password_hash, name):
    db.session.execute(
        text("INSERT INTO users (email, password_hash, name) VALUES (:email, :password_hash, :name)"),
        {"email": email, "password_hash": password_hash, "name": name},
    )
    db.session.commit()
    user = db.session.execute(
        text("SELECT id FROM users WHERE email = :email"), {"email": email}
    ).fetchone()
    return user.id


def create_professor(email, password_hash, name):
    db.session.execute(
        text("INSERT INTO users (email, password_hash, name, role) VALUES (:email, :password_hash, :name, 'professor')"),
        {"email": email, "password_hash": password_hash, "name": name},
    )
    db.session.commit()
    user = db.session.execute(
        text("SELECT id FROM users WHERE email = :email"), {"email": email}
    ).fetchone()
    return user.id


def update_user(user_id, data):
    safe = {k: v for k, v in data.items() if k in _ALLOWED_USER_UPDATE_FIELDS}
    if not safe:
        raise KeyError("Nenhum campo válido para atualizar")
    safe["id"] = user_id
    fields = ", ".join([f"{k} = :{k}" for k in safe if k != "id"])
    try:
        db.session.execute(text(f"UPDATE users SET {fields} WHERE id = :id"), safe)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        raise KeyError(f"Erro ao atualizar usuário: {e}")


def update_password(user_id, new_password_hash):
    try:
        db.session.execute(
            text("UPDATE users SET password_hash = :password_hash WHERE id = :id"),
            {"password_hash": new_password_hash, "id": user_id},
        )
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        raise KeyError(f"Erro ao atualizar senha: {e}")


def delete_user(user_id):
    try:
        db.session.execute(text("DELETE FROM users WHERE id = :id"), {"id": user_id})
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        raise KeyError(f"Erro ao deletar usuário: {e}")


def get_all_professors():
    return db.session.execute(
        text("SELECT id, name, email FROM users WHERE role = :role ORDER BY name ASC"),
        {"role": "professor"},
    ).mappings().all()


def get_all_alunos():
    return db.session.execute(
        text("SELECT id, name, email FROM users WHERE role = :role ORDER BY name ASC"),
        {"role": "aluno"},
    ).mappings().all()
