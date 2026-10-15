#!/usr/bin/env python3
"""
normalize_existing.py — Normaliza questões já importadas no banco.

Converte numeração `1)`, `2)`, `3)`... → `a)`, `b)`, `c)`... nos campos:
  - questions.issue
  - questions.solution
  - alternatives.text

Uso:
    cd app/backend
    python -m statl.normalize_existing [--dry-run]
"""

import argparse
import os
import re
from pathlib import Path
from dotenv import load_dotenv

_SCRIPT_DIR = Path(__file__).resolve().parent
load_dotenv(_SCRIPT_DIR.parent / ".env")

_NUM_TO_LETTER = {'1': 'a', '2': 'b', '3': 'c', '4': 'd', '5': 'e'}
_PATTERN = re.compile(r'(?<!\d)([1-5])\)(?=\s|$)')


def _norm(text: str | None) -> str | None:
    if not text:
        return text
    return _PATTERN.sub(lambda m: _NUM_TO_LETTER[m.group(1)] + ')', text)


def run(dry_run: bool = False) -> None:
    import sqlalchemy as sa
    from sqlalchemy import text

    db_url = os.getenv("DATABASE_URL", "")
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
    if not db_url:
        raise SystemExit("DATABASE_URL não definida.")

    engine = sa.create_engine(db_url)

    with engine.begin() as conn:
        # ── Questões (issue + solution) ──────────────────────────────────────
        rows = conn.execute(text("SELECT id, issue, solution FROM questions")).fetchall()
        q_updated = 0
        for row in rows:
            new_issue = _norm(row[1])
            new_sol = _norm(row[2])
            if new_issue != row[1] or new_sol != row[2]:
                if not dry_run:
                    conn.execute(
                        text("UPDATE questions SET issue = :i, solution = :s WHERE id = :id"),
                        {"i": new_issue, "s": new_sol, "id": row[0]},
                    )
                q_updated += 1

        # ── Alternativas (text) ──────────────────────────────────────────────
        alts = conn.execute(text("SELECT id, text FROM alternatives")).fetchall()
        a_updated = 0
        for alt in alts:
            new_text = _norm(alt[1])
            if new_text != alt[1]:
                if not dry_run:
                    conn.execute(
                        text("UPDATE alternatives SET text = :t WHERE id = :id"),
                        {"t": new_text, "id": alt[0]},
                    )
                a_updated += 1

        prefix = "[DRY-RUN] " if dry_run else ""
        print(f"{prefix}Questões atualizadas : {q_updated}")
        print(f"{prefix}Alternativas atualizadas: {a_updated}")
        if dry_run:
            print("\nNenhuma alteração aplicada (--dry-run). Remova a flag para executar.")
        else:
            print("Normalização concluída.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true",
                        help="Mostra o que seria alterado sem modificar o banco")
    args = parser.parse_args()
    run(dry_run=args.dry_run)
