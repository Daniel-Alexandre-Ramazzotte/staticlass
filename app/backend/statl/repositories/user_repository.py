from .. import db
from sqlalchemy import text


_CAMPOS_ATUALIZAVEIS = {"name", "email", "score", "active", "password_hash"}


def buscar_usuario_por_email(email):
    result = db.session.execute(
        text("SELECT * FROM users WHERE email = :email"),
        {"email": email},
    )
    row = result.fetchone()
    result.close()
    return row


def buscar_usuario_por_id(usuario_id):
    result = db.session.execute(
        text("SELECT * FROM users WHERE id = :id"),
        {"id": usuario_id},
    )
    row = result.fetchone()
    result.close()
    return row


def criar_usuario(email, senha_hash, nome):
    resultado = db.session.execute(
        text("""
            INSERT INTO users (email, password_hash, name, role, active, score)
            VALUES (:email, :senha_hash, :nome, 'aluno', TRUE, 0)
            RETURNING id
        """),
        {"email": email, "senha_hash": senha_hash, "nome": nome},
    )
    new_id = resultado.scalar()
    db.session.commit()
    return new_id


def criar_professor(email, senha_hash, nome):
    return criar_usuario_com_papel(email, senha_hash, nome, "professor")


def criar_usuario_com_papel(email, senha_hash, nome, papel):
    resultado = db.session.execute(
        text("""
            INSERT INTO users (email, password_hash, name, role, active, score)
            VALUES (:email, :senha_hash, :nome, :papel, TRUE, 0)
            RETURNING id
        """),
        {"email": email, "senha_hash": senha_hash, "nome": nome, "papel": papel},
    )
    new_id = resultado.scalar()
    db.session.commit()
    return new_id


def atualizar_usuario(usuario_id, dados):
    campos = {k: v for k, v in dados.items() if k in _CAMPOS_ATUALIZAVEIS}
    if not campos:
        raise KeyError("nenhum campo válido para atualizar")
    campos["id"] = usuario_id
    atribuicoes = ", ".join(f"{k} = :{k}" for k in campos if k != "id")
    try:
        db.session.execute(text(f"UPDATE users SET {atribuicoes} WHERE id = :id"), campos)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        raise KeyError(f"erro ao atualizar usuário: {e}")


def atualizar_senha(usuario_id, nova_senha_hash):
    try:
        db.session.execute(
            text("UPDATE users SET password_hash = :senha_hash WHERE id = :id"),
            {"senha_hash": nova_senha_hash, "id": usuario_id},
        )
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        raise KeyError(f"erro ao atualizar senha: {e}")


def deletar_usuario(usuario_id):
    try:
        db.session.execute(text("DELETE FROM users WHERE id = :id"), {"id": usuario_id})
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        raise KeyError(f"erro ao deletar usuário: {e}")


def listar_professores():
    return db.session.execute(
        text("SELECT id, name, email FROM users WHERE role = 'professor' ORDER BY name"),
    ).mappings().all()


def listar_alunos():
    return db.session.execute(
        text("SELECT id, name, email FROM users WHERE role = 'aluno' ORDER BY name"),
    ).mappings().all()


def listar_usuarios_por_papel(papel):
    return db.session.execute(
        text("""
            SELECT id, name, email, active, score
            FROM users
            WHERE role = :papel
            ORDER BY name
        """),
        {"papel": papel},
    ).mappings().all()


# ── Aliases para compatibilidade com código existente ──────────────────────
get_user_by_email     = buscar_usuario_por_email
get_user_by_id        = buscar_usuario_por_id
create_user           = criar_usuario
create_professor      = criar_professor
create_user_with_role = criar_usuario_com_papel
update_user           = atualizar_usuario
update_password       = atualizar_senha
delete_user           = deletar_usuario
get_all_professors    = listar_professores
get_all_alunos        = listar_alunos
get_users_by_role     = listar_usuarios_por_papel
