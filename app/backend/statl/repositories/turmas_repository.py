from statl import db
from sqlalchemy import text


def create_turma(professor_id: int, name: str) -> dict:
    row = db.session.execute(
        text(
            "INSERT INTO turmas (professor_id, name, created_at)"
            " VALUES (:pid, :name, CURRENT_TIMESTAMP)"
        ),
        {"pid": professor_id, "name": name},
    )
    db.session.flush()
    # Fetch back with lastrowid for SQLite compatibility (no RETURNING)
    turma_id = row.lastrowid
    fetched = db.session.execute(
        text("SELECT id, name, professor_id, created_at FROM turmas WHERE id = :id"),
        {"id": turma_id},
    ).fetchone()
    db.session.commit()
    return dict(fetched._mapping)


def list_turmas_by_professor(professor_id: int) -> list:
    return db.session.execute(
        text("""
            SELECT t.id, t.name, t.created_at, COUNT(ta.student_id) AS student_count
            FROM turmas t
            LEFT JOIN turma_alunos ta ON ta.turma_id = t.id
            WHERE t.professor_id = :pid
            GROUP BY t.id, t.name, t.created_at
            ORDER BY t.created_at DESC
        """),
        {"pid": professor_id},
    ).mappings().all()


def get_turma_by_id(turma_id: int) -> dict | None:
    row = db.session.execute(
        text("SELECT id, name, professor_id, created_at FROM turmas WHERE id = :id"),
        {"id": turma_id},
    ).fetchone()
    return dict(row._mapping) if row else None


def update_turma_name(turma_id: int, name: str) -> None:
    db.session.execute(
        text("UPDATE turmas SET name = :name WHERE id = :id"),
        {"name": name, "id": turma_id},
    )
    db.session.commit()


def delete_turma(turma_id: int) -> None:
    db.session.execute(
        text("DELETE FROM turmas WHERE id = :id"),
        {"id": turma_id},
    )
    db.session.commit()


def replace_turma_students(turma_id: int, student_ids: list) -> None:
    db.session.execute(
        text("DELETE FROM turma_alunos WHERE turma_id = :tid"),
        {"tid": turma_id},
    )
    for sid in student_ids:
        db.session.execute(
            text(
                "INSERT INTO turma_alunos (turma_id, student_id)"
                " VALUES (:tid, :sid)"
            ),
            {"tid": turma_id, "sid": sid},
        )
    db.session.commit()


def get_turma_students(turma_id: int) -> list:
    return db.session.execute(
        text("""
            SELECT u.id, u.name, u.email
            FROM turma_alunos ta
            JOIN users u ON u.id = ta.student_id
            WHERE ta.turma_id = :tid
            ORDER BY u.name
        """),
        {"tid": turma_id},
    ).mappings().all()


def validate_student_ids(student_ids: list) -> bool:
    """Validate that all given IDs exist and have role='aluno'. SQLite-compatible."""
    if not student_ids:
        return True
    placeholders = ", ".join(f":id{i}" for i in range(len(student_ids)))
    params = {f"id{i}": sid for i, sid in enumerate(student_ids)}
    row = db.session.execute(
        text(
            f"SELECT COUNT(*) AS cnt FROM users"
            f" WHERE id IN ({placeholders}) AND role = 'aluno'"
        ),
        params,
    ).fetchone()
    return int(row[0]) == len(student_ids)
