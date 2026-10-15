#!/usr/bin/env python3
"""
migrate_source_enum.py — Normaliza valores do campo source na tabela questions.

Mapeia os valores antigos do enum para os 7 valores canônicos:
  NULL    → 'outro'  (230 questões importadas sem fonte definida)
  'avulsa'→ 'outro'  (valor antigo do enum)
  'enem'  → 'ENEM'   (normalização de caixa)

O script é idempotente: rodar duas vezes é seguro (segunda execução afeta 0 linhas).

Uso:
    cd app/backend
    python -m statl.migrate_source_enum
"""

import os
from pathlib import Path
from dotenv import load_dotenv

_SCRIPT_DIR = Path(__file__).resolve().parent
load_dotenv(_SCRIPT_DIR.parent / ".env")

from sqlalchemy import text


def run_migration():
    from statl import create_app, db

    app = create_app()
    with app.app_context():
        # Step 1: NULL → 'outro'
        result = db.session.execute(
            text("UPDATE questions SET source = 'outro' WHERE source IS NULL")
        )
        print(f"  NULL → 'outro': {result.rowcount} rows")

        # Step 2: 'avulsa' → 'outro'
        result = db.session.execute(
            text("UPDATE questions SET source = 'outro' WHERE source = 'avulsa'")
        )
        print(f"  'avulsa' → 'outro': {result.rowcount} rows")

        # Step 3: 'enem' → 'ENEM'
        result = db.session.execute(
            text("UPDATE questions SET source = 'ENEM' WHERE source = 'enem'")
        )
        print(f"  'enem' → 'ENEM': {result.rowcount} rows")

        db.session.commit()
        print("Migration complete.")


if __name__ == "__main__":
    run_migration()
