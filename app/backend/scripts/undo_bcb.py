#!/usr/bin/env python3
"""
undo_bcb.py — Remove as questões importadas pelo migrate_bcb.py.

Critérios de identificação das questões BCB:
  1. correct_answer = '?' — exclusivo das questões BCB sem gabarito
  2. correct_answer IN ('C', 'E') + sem alternativas — Certo/Errado sem alts
  3. Capítulo "Séries Temporais" (number=5) — criado exclusivamente pelo migrate_bcb

Também remove o capítulo "Séries Temporais" e seus tópicos, se existirem.

Uso:
    cd app/backend
    python -m statl.undo_bcb [--dry-run]
"""

import argparse
import os
from pathlib import Path
from dotenv import load_dotenv

_SCRIPT_DIR = Path(__file__).resolve().parent
load_dotenv(_SCRIPT_DIR.parent / ".env")


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
        # ── 1. Identificar IDs das questões BCB ──────────────────────────────
        # correct_answer = '?' → exclusivo BCB (sem gabarito)
        sem_gabarito = conn.execute(text(
            "SELECT id FROM questions WHERE correct_answer = '?'"
        )).fetchall()

        # correct_answer IN ('C','E') e sem alternativas → Certo/Errado BCB
        certo_errado = conn.execute(text("""
            SELECT q.id
            FROM questions q
            LEFT JOIN alternatives a ON a.question_id = q.id
            WHERE q.correct_answer IN ('C', 'E')
              AND a.id IS NULL
        """)).fetchall()

        # Questões do capítulo "Séries Temporais" (criado pelo migrate_bcb)
        series_q = conn.execute(text("""
            SELECT q.id FROM questions q
            JOIN chapters c ON c.id = q.chapter_id
            WHERE c.number = 5 AND c.name = 'Séries Temporais'
        """)).fetchall()

        ids = set(r[0] for r in sem_gabarito + certo_errado + series_q)

        if not ids:
            print("Nenhuma questão BCB encontrada no banco.")
            return

        print(f"Questões identificadas para remoção: {len(ids)}")
        print(f"  - Sem gabarito (?):              {len(sem_gabarito)}")
        print(f"  - Certo/Errado sem alternativas: {len(certo_errado)}")
        print(f"  - Capítulo Séries Temporais:     {len(series_q)}")

        # ── 2. Capítulo Séries Temporais (número 5) ──────────────────────────
        cap = conn.execute(text(
            "SELECT id FROM chapters WHERE number = 5 AND name = 'Séries Temporais'"
        )).fetchone()

        if dry_run:
            print("\n[DRY-RUN] Nenhuma alteração aplicada.")
            if cap:
                print(f"[DRY-RUN] Removeria capítulo 'Séries Temporais' (id={cap[0]}) e seus tópicos.")
            return

        # ── 3. Remover alternativas (CASCADE já faz, mas por segurança) ──────
        for qid in ids:
            conn.execute(text("DELETE FROM alternatives WHERE question_id = :id"), {"id": qid})

        # ── 4. Remover questões ───────────────────────────────────────────────
        result = conn.execute(
            text(f"DELETE FROM questions WHERE id = ANY(:ids)"),
            {"ids": list(ids)},
        )
        print(f"\nQuestões removidas: {result.rowcount}")

        # ── 5. Remover tópicos e capítulo de Séries Temporais ────────────────
        if cap:
            cap_id = cap[0]
            top_result = conn.execute(
                text("DELETE FROM topics WHERE chapter_id = :cid"),
                {"cid": cap_id},
            )
            print(f"Tópicos de 'Séries Temporais' removidos: {top_result.rowcount}")
            conn.execute(text("DELETE FROM chapters WHERE id = :cid"), {"cid": cap_id})
            print("Capítulo 'Séries Temporais' removido.")

        total = conn.execute(text("SELECT COUNT(*) FROM questions")).scalar()
        print(f"\nTotal de questões restantes no banco: {total}")
        print("Concluído.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true",
                        help="Apenas mostra o que seria removido, sem alterar o banco")
    args = parser.parse_args()
    run(dry_run=args.dry_run)
