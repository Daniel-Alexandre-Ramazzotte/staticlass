#!/usr/bin/env python3
"""
migrate_questoes.py — Importa o banco de questões para o PostgreSQL do Staticlass.

Uso:
    DATABASE_URL="postgresql://usuario:senha@localhost:5432/staticlass" \
    python -m statl.migrate_questoes [--db-path CAMINHO_DO_questoes.db]
"""

import argparse
import os
import sqlite3
from pathlib import Path

_SCRIPT_DIR = Path(__file__).resolve().parent
_DEFAULT_DB = _SCRIPT_DIR.parent.parent.parent.parent / "Estatistica-Basica" / "banco_questoes" / "questoes.db"


def _get_sqlite_data(sqlite_path: Path):
    conn = sqlite3.connect(str(sqlite_path))
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    chapters = cur.execute("SELECT * FROM chapters ORDER BY number").fetchall()
    topics = cur.execute("SELECT * FROM topics ORDER BY id").fetchall()
    questions = cur.execute("SELECT * FROM questions ORDER BY id").fetchall()
    alternatives = cur.execute("SELECT * FROM alternatives ORDER BY question_id, letter").fetchall()
    conn.close()
    return chapters, topics, questions, alternatives


def run_migration(sqlite_path: Path):
    import sqlalchemy as sa
    from sqlalchemy import text

    db_url = os.getenv("DATABASE_URL", "")
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
    if not db_url:
        raise SystemExit("DATABASE_URL não definida.")

    engine = sa.create_engine(db_url)
    chapters, topics, questions, alternatives = _get_sqlite_data(sqlite_path)

    with engine.begin() as conn:
        print(f"Importando {len(chapters)} capítulos...")
        for ch in chapters:
            exists = conn.execute(
                text("SELECT id FROM chapters WHERE id = :id"),
                {"id": ch["id"]},
            ).fetchone()
            if not exists:
                conn.execute(
                    text("INSERT INTO chapters (id, name, number) VALUES (:id, :name, :number)"),
                    {"id": ch["id"], "name": ch["name"], "number": ch["number"]},
                )

        print(f"Importando {len(topics)} tópicos...")
        for tp in topics:
            exists = conn.execute(
                text("SELECT id FROM topics WHERE id = :id"),
                {"id": tp["id"]},
            ).fetchone()
            if not exists:
                conn.execute(
                    text("INSERT INTO topics (id, name, chapter_id) VALUES (:id, :name, :chapter_id)"),
                    {"id": tp["id"], "name": tp["name"], "chapter_id": tp["chapter_id"]},
                )

        sqlite_id_to_pg_id: dict[int, int] = {}
        print(f"Importando {len(questions)} questões...")
        imported = skipped = 0
        for q in questions:
            exists = conn.execute(
                text("SELECT id FROM questions WHERE original_id = :oid"),
                {"oid": q["original_id"]},
            ).fetchone()
            if exists:
                sqlite_id_to_pg_id[q["id"]] = exists[0]
                skipped += 1
                continue

            result = conn.execute(
                text(
                    """
                    INSERT INTO questions
                        (issue, correct_answer, solution, original_id, section,
                         difficulty, needs_fix, chapter_id, topic_id)
                    VALUES
                        (:issue, :correct_answer, :solution, :original_id, :section,
                         :difficulty, :needs_fix, :chapter_id, :topic_id)
                    RETURNING id
                    """
                ),
                {
                    "issue": q["statement"],
                    "correct_answer": q["answer_key"],
                    "solution": q["explanation"] or "",
                    "original_id": q["original_id"],
                    "section": q["section"],
                    "difficulty": q["difficulty"],
                    "needs_fix": bool(q["needs_fix"]),
                    "chapter_id": q["chapter_id"],
                    "topic_id": q["topic_id"],
                },
            )
            sqlite_id_to_pg_id[q["id"]] = result.scalar()
            imported += 1

        print(f"  {imported} importadas, {skipped} já existiam")

        print("Importando alternativas...")
        alt_imported = alt_skipped = 0
        for alt in alternatives:
            pg_qid = sqlite_id_to_pg_id.get(alt["question_id"])
            if pg_qid is None:
                continue
            exists = conn.execute(
                text("SELECT id FROM alternatives WHERE question_id = :qid AND letter = :letter"),
                {"qid": pg_qid, "letter": alt["letter"]},
            ).fetchone()
            if exists:
                alt_skipped += 1
                continue
            conn.execute(
                text(
                    """
                    INSERT INTO alternatives (question_id, letter, text, is_correct)
                    VALUES (:question_id, :letter, :text, :is_correct)
                    """
                ),
                {
                    "question_id": pg_qid,
                    "letter": alt["letter"],
                    "text": alt["text"],
                    "is_correct": bool(alt["is_correct"]),
                },
            )
            alt_imported += 1

        print(f"  {alt_imported} alternativas importadas, {alt_skipped} puladas")

        total_q = conn.execute(text("SELECT COUNT(*) FROM questions")).scalar()
        total_ch = conn.execute(text("SELECT COUNT(*) FROM chapters")).scalar()
        total_tp = conn.execute(text("SELECT COUNT(*) FROM topics")).scalar()
        print("\n=== Migração concluída ===")
        print(f"  Capítulos : {total_ch}")
        print(f"  Tópicos   : {total_tp}")
        print(f"  Questões  : {total_q}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--db-path", type=Path, default=_DEFAULT_DB)
    args = parser.parse_args()
    if not args.db_path.exists():
        raise SystemExit(f"ERRO: arquivo não encontrado: {args.db_path}")
    print(f"Fonte: {args.db_path}")
    run_migration(args.db_path)
