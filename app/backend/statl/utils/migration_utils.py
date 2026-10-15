"""
migration_utils.py — utilidades compartilhadas pelos importadores de questões
(migrate_questoes.py, migrate_apostila.py).

Centraliza: engine a partir de DATABASE_URL, hash determinístico pra
original_id (dedup idempotente sem depender de LIKE em trecho de texto),
upsert de taxonomia (capítulo/tópico) por nome, e upsert idempotente de
questões e alternativas via ON CONFLICT DO NOTHING.
"""

import hashlib
import os
from pathlib import Path

_BACKEND_DIR = Path(__file__).resolve().parent.parent.parent


def get_engine():
    """Carrega .env de app/backend/ e cria a engine a partir de DATABASE_URL."""
    import sqlalchemy as sa
    from dotenv import load_dotenv

    load_dotenv(_BACKEND_DIR / ".env")
    db_url = os.getenv("DATABASE_URL", "")
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
    if not db_url:
        raise SystemExit("DATABASE_URL não definida.")
    return sa.create_engine(db_url)


def content_hash(issue: str, correct_answer: str, prefix: str = "") -> str:
    """original_id determinístico = hash sha256(issue + correct_answer).
    Usado quando a fonte não tem um id externo confiável — rodar o
    script duas vezes sempre gera o mesmo original_id para a mesma questão,
    então o ON CONFLICT (original_id) DO NOTHING garante idempotência.
    Cabe dentro do limite de 50 caracteres de questions.original_id."""
    payload = f"{issue.strip()}|{(correct_answer or '').strip().upper()}"
    digest = hashlib.sha256(payload.encode("utf-8")).hexdigest()[:32]
    return f"{prefix}{digest}" if prefix else digest


def get_or_create_chapter(conn, *, name: str, number: int) -> int:
    """Busca capítulo por number; cria por nome/number se não existir."""
    from sqlalchemy import text

    existing = conn.execute(
        text("SELECT id FROM chapters WHERE number = :number"), {"number": number}
    ).scalar()
    if existing is not None:
        return existing
    return conn.execute(
        text("INSERT INTO chapters (name, number) VALUES (:name, :number) RETURNING id"),
        {"name": name, "number": number},
    ).scalar_one()


def get_or_create_topic(conn, *, name: str, chapter_id: int) -> int:
    """Busca tópico por (name, chapter_id); cria se não existir."""
    from sqlalchemy import text

    existing = conn.execute(
        text("SELECT id FROM topics WHERE name = :name AND chapter_id = :chapter_id"),
        {"name": name, "chapter_id": chapter_id},
    ).scalar()
    if existing is not None:
        return existing
    return conn.execute(
        text("INSERT INTO topics (name, chapter_id) VALUES (:name, :chapter_id) RETURNING id"),
        {"name": name, "chapter_id": chapter_id},
    ).scalar_one()


def upsert_question(conn, payload: dict) -> tuple[int, bool]:
    """INSERT idempotente por original_id (ON CONFLICT DO NOTHING).
    payload aceita: issue, original_id, correct_answer, solution, chapter_id,
    topic_id, difficulty, section, source, needs_fix.
    Retorna (question_id, foi_inserida_agora)."""
    from sqlalchemy import text

    result = conn.execute(
        text("""
            INSERT INTO questions
                (issue, correct_answer, solution, original_id, section,
                 difficulty, needs_fix, chapter_id, topic_id, source)
            VALUES
                (:issue, :correct_answer, :solution, :original_id, :section,
                 :difficulty, :needs_fix, :chapter_id, :topic_id, :source)
            ON CONFLICT (original_id) DO NOTHING
            RETURNING id
        """),
        {
            "issue": payload["issue"],
            "correct_answer": payload.get("correct_answer"),
            "solution": payload.get("solution"),
            "original_id": payload["original_id"],
            "section": payload.get("section"),
            "difficulty": payload.get("difficulty"),
            "needs_fix": payload.get("needs_fix", False),
            "chapter_id": payload.get("chapter_id"),
            "topic_id": payload.get("topic_id"),
            "source": payload.get("source"),
        },
    )
    new_id = result.scalar()
    if new_id is not None:
        return new_id, True

    existing_id = conn.execute(
        text("SELECT id FROM questions WHERE original_id = :oid"),
        {"oid": payload["original_id"]},
    ).scalar()
    return existing_id, False


def upsert_alternatives(conn, question_id: int, alternatives: list[dict]) -> int:
    """INSERT idempotente de alternativas por (question_id, letter).
    Cada item de `alternatives` precisa de letter/text/is_correct.
    Retorna quantas foram inseridas agora (não conta as já existentes)."""
    from sqlalchemy import text

    inserted = 0
    for alt in alternatives:
        result = conn.execute(
            text("""
                INSERT INTO alternatives (question_id, letter, text, is_correct)
                VALUES (:qid, :letter, :text, :is_correct)
                ON CONFLICT (question_id, letter) DO NOTHING
                RETURNING id
            """),
            {
                "qid": question_id,
                "letter": alt["letter"],
                "text": alt["text"],
                "is_correct": bool(alt.get("is_correct", False)),
            },
        )
        if result.scalar() is not None:
            inserted += 1
    return inserted
