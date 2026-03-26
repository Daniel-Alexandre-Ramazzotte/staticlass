#!/usr/bin/env python3
"""
migrate_questoes.py — Importa o banco de questões do Estatistica-Basica para o MySQL do Staticlass.

Lê o questoes.db (SQLite) do repositório Estatistica-Basica e insere as questões,
capítulos, tópicos e alternativas no banco MySQL via SQLAlchemy.

Uso:
    cd app/backend
    python -m statl.migrate_questoes [--db-path CAMINHO_DO_questoes.db]

Pré-requisitos:
    - .env configurado com DB_USER, DB_PASS, DB_HOST, DB_NAME
    - Banco MySQL com as tabelas criadas (rode o app uma vez para o db.create_all() rodar)
    - Arquivo questoes.db do repositório Estatistica-Basica
"""

import argparse
import os
import sqlite3
from pathlib import Path

from dotenv import load_dotenv

# Caminho padrão: o questoes.db fica em Desktop/Estatistica-Basica/banco_questoes/
_SCRIPT_DIR = Path(__file__).resolve().parent
_DEFAULT_DB = _SCRIPT_DIR.parent.parent.parent.parent / "Estatistica-Basica" / "banco_questoes" / "questoes.db"


def _get_sqlite_data(sqlite_path: Path):
    """Lê capítulos, tópicos e questões do SQLite."""
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
    load_dotenv()

    import sqlalchemy as sa
    from sqlalchemy import text

    # Cria engine diretamente com PyMySQL — evita depender do driver do app
    db_url = (
        f"mysql+pymysql://{os.getenv('DB_USER')}:{os.getenv('DB_PASS')}"
        f"@{os.getenv('DB_HOST')}/{os.getenv('DB_NAME')}?charset=utf8mb4"
    )
    engine = sa.create_engine(db_url)

    chapters, topics, questions, alternatives = _get_sqlite_data(sqlite_path)

    with engine.begin() as conn:
        # ------------------------------------------------------------------ #
        # 0. Criar tabelas novas se não existirem                            #
        # ------------------------------------------------------------------ #
        print("Criando tabelas (se não existirem)...")
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS chapters (
                id   INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(100) NOT NULL,
                number INT NOT NULL
            ) CHARACTER SET utf8mb4
        """))
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS topics (
                id         INT PRIMARY KEY AUTO_INCREMENT,
                name       VARCHAR(200) NOT NULL,
                chapter_id INT NOT NULL,
                FOREIGN KEY (chapter_id) REFERENCES chapters(id)
            ) CHARACTER SET utf8mb4
        """))
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS alternatives (
                id          INT PRIMARY KEY AUTO_INCREMENT,
                question_id INT NOT NULL,
                letter      CHAR(1) NOT NULL,
                text        TEXT NOT NULL,
                is_correct  TINYINT(1) DEFAULT 0,
                FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
            ) CHARACTER SET utf8mb4
        """))
        # Colunas novas na tabela questions (ignora erro se já existirem)
        for col_sql in [
            "ALTER TABLE questions ADD COLUMN original_id VARCHAR(50) NULL",
            "ALTER TABLE questions ADD COLUMN section VARCHAR(30) NULL",
            "ALTER TABLE questions ADD COLUMN difficulty TINYINT NULL",
            "ALTER TABLE questions ADD COLUMN needs_fix TINYINT(1) DEFAULT 0",
            "ALTER TABLE questions ADD COLUMN chapter_id INT NULL",
            "ALTER TABLE questions ADD COLUMN topic_id INT NULL",
        ]:
            try:
                conn.execute(text(col_sql))
            except Exception:
                pass  # coluna já existe

        # ------------------------------------------------------------------ #
        # 1. Capítulos                                                        #
        # ------------------------------------------------------------------ #
        print(f"Importando {len(chapters)} capítulos...")
        for ch in chapters:
            exists = conn.execute(
                text("SELECT id FROM chapters WHERE id = :id"), {"id": ch["id"]}
            ).fetchone()
            if not exists:
                conn.execute(
                    text("INSERT INTO chapters (id, name, number) VALUES (:id, :name, :number)"),
                    {"id": ch["id"], "name": ch["name"], "number": ch["number"]},
                )
        # commit automático pelo engine.begin()

        # ------------------------------------------------------------------ #
        # 2. Tópicos                                                          #
        # ------------------------------------------------------------------ #
        print(f"Importando {len(topics)} tópicos...")
        for tp in topics:
            exists = conn.execute(
                text("SELECT id FROM topics WHERE id = :id"), {"id": tp["id"]}
            ).fetchone()
            if not exists:
                conn.execute(
                    text("INSERT INTO topics (id, name, chapter_id) VALUES (:id, :name, :chapter_id)"),
                    {"id": tp["id"], "name": tp["name"], "chapter_id": tp["chapter_id"]},
                )
        # commit automático pelo engine.begin()

        # ------------------------------------------------------------------ #
        # 3. Questões                                                         #
        # ------------------------------------------------------------------ #
        # Mapeia IDs do SQLite → IDs no MySQL (questões importadas recebem
        # um novo id auto-increment; guardamos o mapeamento para as alternativas)
        sqlite_id_to_mysql_id: dict[int, int] = {}

        print(f"Importando {len(questions)} questões...")
        imported = skipped = 0
        for q in questions:
            # Evita duplicatas pelo original_id
            exists = conn.execute(
                text("SELECT id FROM questions WHERE original_id = :oid"),
                {"oid": q["original_id"]},
            ).fetchone()
            if exists:
                sqlite_id_to_mysql_id[q["id"]] = exists[0]
                skipped += 1
                continue

            conn.execute(
                text("""
                    INSERT INTO questions
                        (issue, correct_answer, solution,
                         original_id, section, difficulty, needs_fix,
                         chapter_id, topic_id)
                    VALUES
                        (:issue, :correct_answer, :solution,
                         :original_id, :section, :difficulty, :needs_fix,
                         :chapter_id, :topic_id)
                """),
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
            new_id = conn.execute(text("SELECT LAST_INSERT_ID()")).scalar()
            sqlite_id_to_mysql_id[q["id"]] = new_id
            imported += 1

        # commit automático pelo engine.begin()
        print(f"  {imported} importadas, {skipped} ja existiam (puladas)")

        # ------------------------------------------------------------------ #
        # 4. Alternativas                                                     #
        # ------------------------------------------------------------------ #
        print(f"Importando alternativas...")
        alt_imported = alt_skipped = 0
        for alt in alternatives:
            mysql_qid = sqlite_id_to_mysql_id.get(alt["question_id"])
            if mysql_qid is None:
                continue

            exists = conn.execute(
                text("SELECT id FROM alternatives WHERE question_id = :qid AND letter = :letter"),
                {"qid": mysql_qid, "letter": alt["letter"]},
            ).fetchone()
            if exists:
                alt_skipped += 1
                continue

            conn.execute(
                text("""
                    INSERT INTO alternatives (question_id, letter, text, is_correct)
                    VALUES (:question_id, :letter, :text, :is_correct)
                """),
                {
                    "question_id": mysql_qid,
                    "letter": alt["letter"],
                    "text": alt["text"],
                    "is_correct": bool(alt["is_correct"]),
                },
            )
            alt_imported += 1

        # commit automático pelo engine.begin()
        print(f"  {alt_imported} alternativas importadas, {alt_skipped} puladas")

        # ------------------------------------------------------------------ #
        # Resumo                                                              #
        # ------------------------------------------------------------------ #
        total_q = conn.execute(text("SELECT COUNT(*) FROM questions")).scalar()
        total_ch = conn.execute(text("SELECT COUNT(*) FROM chapters")).scalar()
        total_tp = conn.execute(text("SELECT COUNT(*) FROM topics")).scalar()
        print("\n=== Migração concluída ===")
        print(f"  Capítulos no MySQL : {total_ch}")
        print(f"  Tópicos no MySQL   : {total_tp}")
        print(f"  Questões no MySQL  : {total_q}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Migra questoes.db para o MySQL do Staticlass")
    parser.add_argument(
        "--db-path",
        type=Path,
        default=_DEFAULT_DB,
        help=f"Caminho para o questoes.db (padrão: {_DEFAULT_DB})",
    )
    args = parser.parse_args()

    if not args.db_path.exists():
        print(f"ERRO: arquivo não encontrado: {args.db_path}")
        print("Use --db-path para especificar o caminho correto.")
        raise SystemExit(1)

    print(f"Fonte: {args.db_path}")
    run_migration(args.db_path)
