import re

from werkzeug.security import generate_password_hash

from ..repositories.turmas_repository import get_turma_by_id, is_student_enrolled, add_single_student
from ..repositories.user_repository import (
    buscar_usuario_por_email,
    buscar_usuario_por_ra,
    criar_usuario_pendente,
    verificar_email_usuario,
    atualizar_usuario,
)
from ..security.tokens import generate_invite_token, verify_invite_token
from ..services.email_service import send_invite_email

_PATTERN = re.compile(r'^"?([^"<]+?)"?\s*<([^>@\s]+@[^>]+)>')


def parse_email_list(raw: str) -> list[dict]:
    results = []
    for line in raw.splitlines():
        line = line.strip().rstrip(",")
        if not line:
            continue
        m = _PATTERN.match(line)
        if m:
            results.append({"name": m.group(1).strip(), "email": m.group(2).strip().lower()})
        elif "@" in line:
            email = line.strip().lower()
            results.append({"name": email.split("@")[0], "email": email})
    return results


def process_invite_list(turma_id: int, entries: list[dict]) -> dict:
    turma = get_turma_by_id(turma_id)
    if not turma:
        return {"enrolled": 0, "invited": 0, "skipped": 0, "errors": ["Turma não encontrada"]}

    enrolled = invited = skipped = 0
    errors = []

    for entry in entries:
        email = entry.get("email", "").lower().strip()
        nome = entry.get("name", email.split("@")[0]).strip()
        if not email:
            continue
        try:
            user = buscar_usuario_por_email(email)
            if user is not None:
                if is_student_enrolled(turma_id, user.id):
                    skipped += 1
                else:
                    add_single_student(turma_id, user.id)
                    enrolled += 1
            else:
                user_id = criar_usuario_pendente(email, nome)
                add_single_student(turma_id, user_id)
                token = generate_invite_token(email, turma_id)
                send_invite_email(to=email, nome=nome, turma_name=turma["name"], token=token)
                invited += 1
        except Exception as e:
            errors.append(f"{email}: {e}")

    return {"enrolled": enrolled, "invited": invited, "skipped": skipped, "errors": errors}


def get_invite_metadata(token: str) -> tuple[dict | None, str | None]:
    data = verify_invite_token(token)
    if not data:
        return None, "Convite inválido ou expirado"
    turma = get_turma_by_id(data["turma_id"])
    if not turma:
        return None, "Turma não encontrada"
    user = buscar_usuario_por_email(data["email"])
    nome = user.name if user else data["email"].split("@")[0]
    return {"email": data["email"], "name": nome, "turma_name": turma["name"]}, None


def complete_invite_registration(token: str, name: str, password: str, ra: str | None) -> tuple[bool, str]:
    data = verify_invite_token(token)
    if not data:
        return False, "Convite inválido ou expirado"
    email = data["email"]
    turma_id = data["turma_id"]

    user = buscar_usuario_por_email(email)
    if not user:
        return False, "Usuário não encontrado"

    if ra:
        ra = ra.strip().upper()
        existing = buscar_usuario_por_ra(ra)
        if existing and existing.id != user.id:
            return False, "RA já cadastrado por outro usuário"

    from statl import db
    from sqlalchemy import text
    try:
        db.session.execute(
            text("UPDATE users SET name = :name, password_hash = :ph, email_verified = TRUE, ra = :ra WHERE id = :id"),
            {"name": name, "ph": generate_password_hash(password), "ra": ra, "id": user.id},
        )
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return False, f"Erro ao atualizar cadastro: {e}"

    if not is_student_enrolled(turma_id, user.id):
        add_single_student(turma_id, user.id)

    return True, ""
