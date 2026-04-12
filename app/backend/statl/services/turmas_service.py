from datetime import datetime

from ..repositories.turmas_repository import (
    create_turma,
    list_turmas_by_professor,
    get_turma_by_id,
    update_turma_name,
    delete_turma,
    replace_turma_students,
    get_turma_students,
    validate_student_ids,
)


def _prof_id(identity: str) -> int:
    return int(identity)


def _serialize_value(v):
    if isinstance(v, datetime):
        return v.isoformat()
    return v


def create_turma_service(identity: str, data: dict) -> tuple:
    name = (data.get("name") or "").strip()
    if not name:
        return {"error": "name é obrigatório"}, 400
    turma = create_turma(_prof_id(identity), name)
    return {k: _serialize_value(v) for k, v in turma.items()}, 201


def list_turmas_service(identity: str) -> tuple:
    rows = list_turmas_by_professor(_prof_id(identity))
    result = []
    for r in rows:
        row = dict(r)
        result.append({k: _serialize_value(v) for k, v in row.items()})
    return result, 200


def get_turma_service(identity: str, turma_id: int) -> tuple:
    turma = get_turma_by_id(turma_id)
    if not turma:
        return {"error": "Turma não encontrada"}, 404
    if turma["professor_id"] != _prof_id(identity):
        return {"error": "Sem permissão"}, 403
    students = [dict(s) for s in get_turma_students(turma_id)]
    serialized = {k: _serialize_value(v) for k, v in turma.items()}
    serialized["students"] = students
    return serialized, 200


def update_turma_service(identity: str, turma_id: int, data: dict) -> tuple:
    turma = get_turma_by_id(turma_id)
    if not turma:
        return {"error": "Turma não encontrada"}, 404
    if turma["professor_id"] != _prof_id(identity):
        return {"error": "Sem permissão"}, 403
    name = (data.get("name") or "").strip()
    if not name:
        return {"error": "name é obrigatório"}, 400
    update_turma_name(turma_id, name)
    return {"id": turma_id, "name": name}, 200


def delete_turma_service(identity: str, turma_id: int) -> tuple:
    turma = get_turma_by_id(turma_id)
    if not turma:
        return {"error": "Turma não encontrada"}, 404
    if turma["professor_id"] != _prof_id(identity):
        return {"error": "Sem permissão"}, 403
    delete_turma(turma_id)
    return {}, 204


def set_turma_students_service(identity: str, turma_id: int, data: dict) -> tuple:
    turma = get_turma_by_id(turma_id)
    if not turma:
        return {"error": "Turma não encontrada"}, 404
    if turma["professor_id"] != _prof_id(identity):
        return {"error": "Sem permissão"}, 403
    student_ids = data.get("student_ids", [])
    if not isinstance(student_ids, list):
        return {"error": "student_ids deve ser uma lista"}, 400
    try:
        ids = [int(x) for x in student_ids]
    except (TypeError, ValueError):
        return {"error": "IDs inválidos"}, 400
    if ids and not validate_student_ids(ids):
        return {"error": "IDs inválidos"}, 400
    replace_turma_students(turma_id, ids)
    return {"enrolled": len(ids)}, 200


def get_turma_students_service(identity: str, turma_id: int) -> tuple:
    turma = get_turma_by_id(turma_id)
    if not turma:
        return [{"error": "Turma não encontrada"}], 404
    if turma["professor_id"] != _prof_id(identity):
        return [{"error": "Sem permissão"}], 403
    return [dict(s) for s in get_turma_students(turma_id)], 200
