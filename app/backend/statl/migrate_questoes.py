#!/usr/bin/env python3
"""
migrate_questoes.py — Importa o banco de questões para o PostgreSQL do Staticlass.

Uso:
    DATABASE_URL="postgresql://usuario:senha@localhost:5432/staticlass" \
    python -m statl.migrate_questoes [--db-path CAMINHO_DO_questoes.db]
"""

import argparse
import sqlite3
from collections import Counter
from pathlib import Path

from statl.utils.normalize import normalize_numbering

from .utils.migration_utils import (
    get_engine,
    get_or_create_chapter,
    get_or_create_topic,
    upsert_alternatives,
    upsert_question,
)

_SCRIPT_DIR = Path(__file__).resolve().parent
_DEFAULT_DB = _SCRIPT_DIR.parent.parent.parent / "banco_questoes" / "questoes.db"


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


def _build_import_original_id(question, duplicated_original_ids: set[str]) -> str:
    raw_original_id = (question["original_id"] or "").strip()
    if raw_original_id and raw_original_id not in duplicated_original_ids:
        return raw_original_id
    if raw_original_id:
        return f"{raw_original_id}__sqlite_{question['id']}"
    return f"sqlite__{question['id']}"


def run_migration(sqlite_path: Path):
    from sqlalchemy import text

    engine = get_engine()
    chapters, topics, questions, alternatives = _get_sqlite_data(sqlite_path)
    duplicated_original_ids = {
        original_id
        for original_id, count in Counter(
            q["original_id"] for q in questions if q["original_id"]
        ).items()
        if count > 1
    }

    with engine.begin() as conn:
        print(f"Importando {len(chapters)} capítulos...")
        sqlite_chapter_to_pg: dict[int, int] = {
            ch["id"]: get_or_create_chapter(conn, name=ch["name"], number=ch["number"])
            for ch in chapters
        }

        print(f"Importando {len(topics)} tópicos...")
        sqlite_topic_to_pg: dict[int, int] = {}
        for tp in topics:
            pg_chapter_id = sqlite_chapter_to_pg.get(tp["chapter_id"])
            if pg_chapter_id is None:
                continue
            sqlite_topic_to_pg[tp["id"]] = get_or_create_topic(
                conn, name=tp["name"], chapter_id=pg_chapter_id
            )

        sqlite_id_to_pg_id: dict[int, int] = {}
        print(f"Importando {len(questions)} questões...")
        if duplicated_original_ids:
            print(
                "  Fonte com original_id duplicado detectado:"
                f" {len(duplicated_original_ids)} chaves serão desambiguadas com o id SQLite"
            )
        imported = skipped = 0
        for q in questions:
            if not q["answer_key"]:
                skipped += 1
                continue

            import_original_id = _build_import_original_id(q, duplicated_original_ids)

            inserted_id, foi_inserida = upsert_question(
                conn,
                {
                    "issue": normalize_numbering(q["statement"]),
                    "original_id": import_original_id,
                    "correct_answer": q["answer_key"],
                    "solution": normalize_numbering(q["explanation"] or ""),
                    "chapter_id": sqlite_chapter_to_pg.get(q["chapter_id"]),
                    "topic_id": sqlite_topic_to_pg.get(q["topic_id"]),
                    "difficulty": q["difficulty"],
                    "section": q["section"],
                    "needs_fix": bool(q["needs_fix"]),
                    "source": "outro",
                },
            )
            sqlite_id_to_pg_id[q["id"]] = inserted_id
            if not foi_inserida:
                skipped += 1
                continue

            imported += 1

        print(f"  {imported} importadas, {skipped} já existiam")

        print("Importando alternativas...")
        alt_imported = alt_skipped = 0
        for alt in alternatives:
            pg_qid = sqlite_id_to_pg_id.get(alt["question_id"])
            if pg_qid is None:
                continue
            inseridas = upsert_alternatives(
                conn,
                pg_qid,
                [{
                    "letter": alt["letter"],
                    "text": normalize_numbering(alt["text"]),
                    "is_correct": bool(alt["is_correct"]),
                }],
            )
            alt_imported += inseridas
            alt_skipped += 1 - inseridas

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
