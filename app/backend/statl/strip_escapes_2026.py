#!/usr/bin/env python3
"""
strip_escapes_2026.py — Remove escapes de markdown deixados pela exportação
original do Google Docs (ex: "μ \\= 50" → "μ = 50", "A \\) " → "A) ").

A fonte escapava sistematicamente todo caractere especial de markdown
(=, +, -, ., (, ), [, ], #, *, _, ~, <, >, !, %, &) mesmo sem necessidade —
nenhum desses casos é uma barra invertida intencional. Afeta issue, solution
e alternatives.text.

Uso:
    cd app/backend
    python -m statl.strip_escapes_2026 [--dry-run]
"""

import argparse
import os
import re
from pathlib import Path
from dotenv import load_dotenv

_SCRIPT_DIR = Path(__file__).resolve().parent
load_dotenv(_SCRIPT_DIR.parent / ".env")

_ESCAPED = re.compile(r'\\([=+.()\[\]#*_~<>!%&-])')


def _clean(value: str | None) -> str | None:
    if not value:
        return value
    return _ESCAPED.sub(r'\1', value)


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
        q_updated = 0
        rows = conn.execute(text("SELECT id, issue, solution FROM questions")).fetchall()
        for row in rows:
            new_issue = _clean(row[1])
            new_sol = _clean(row[2])
            if new_issue != row[1] or new_sol != row[2]:
                if not dry_run:
                    conn.execute(
                        text("UPDATE questions SET issue = :i, solution = :s WHERE id = :id"),
                        {"i": new_issue, "s": new_sol, "id": row[0]},
                    )
                q_updated += 1

        a_updated = 0
        alts = conn.execute(text("SELECT id, text FROM alternatives")).fetchall()
        for alt in alts:
            new_text = _clean(alt[1])
            if new_text != alt[1]:
                if not dry_run:
                    conn.execute(
                        text("UPDATE alternatives SET text = :t WHERE id = :id"),
                        {"t": new_text, "id": alt[0]},
                    )
                a_updated += 1

        prefix = "[DRY-RUN] " if dry_run else ""
        print(f"{prefix}Questões atualizadas: {q_updated}")
        print(f"{prefix}Alternativas atualizadas: {a_updated}")
        if dry_run:
            print("\nNenhuma alteração aplicada (--dry-run). Remova a flag para executar.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true",
                        help="Mostra o que seria alterado sem modificar o banco")
    args = parser.parse_args()
    run(dry_run=args.dry_run)
