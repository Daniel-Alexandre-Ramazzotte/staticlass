#!/usr/bin/env python3
"""
cleanup_questions_2026.py — Varredura do banco de questões (jul/2026).

Duas etapas, cada uma auditada manualmente antes da execução:

  1. Remove questões quebradas/duplicadas:
     - 24 duplicatas redundantes (texto idêntico a outra questão que já
       possui alternativas; mantém a cópia com menor id que tem alternativas)
     - 32 questões órfãs sem nenhuma alternativa cadastrada e sem duplicata
       recuperável (confirmado: a fonte SQLite original também não tem esses
       dados — não há como recuperar)

  2. Vincula 12 imagens já existentes em uploads/ às questões corretas
     (correspondência conferida visualmente, uma a uma, contra o conteúdo
     de cada questão).

Uso:
    cd app/backend
    python -m statl.cleanup_questions_2026 [--dry-run]
"""

import argparse
import os
from pathlib import Path
from dotenv import load_dotenv

_SCRIPT_DIR = Path(__file__).resolve().parent
load_dotenv(_SCRIPT_DIR.parent / ".env")

DELETE_IDS = [
    # 24 duplicatas redundantes (texto idêntico a uma questão já completa)
    90, 93, 95, 96, 97, 99, 121, 122, 123, 124, 125, 126, 128, 134, 135,
    136, 137, 138, 142, 143, 145, 146, 148, 149,
    # 32 órfãs sem alternativas, sem duplicata recuperável
    98, 100, 129, 130, 131, 132, 133, 139, 140, 141, 144, 147, 150, 151,
    152, 153, 165, 166, 167, 168, 169, 176, 177, 178, 179, 180, 181, 193,
    194, 195, 196, 197,
    # 3 encontradas numa segunda checagem: canônicas de grupos duplicados
    # onde AMBAS as cópias estavam sem alternativas (fonte também não tem
    # esse dado — confirmado em banco_questoes/questoes.db)
    127, 81, 79,
    # 4 near-duplicatas encontradas numa terceira checagem: texto idêntico
    # ao de uma questão já mantida, diferindo só por um placeholder de
    # imagem quebrado (![][imageN]) ou pontuação nas alternativas
    89, 91, 92, 94,
]

# (question_id, coluna, arquivo) — conferido visualmente contra o conteúdo de cada questão
# (ids 89, 91, 92 foram removidos como near-duplicatas depois desta checagem;
# a questão canônica de cada uma permanece: 1, 4, 5)
IMAGE_LINKS = [
    (1, "image_q", "q1.jpg"),
    (2, "image_q", "q2.jpg"),
    (3, "image_s", "r3.jpg"),
    (4, "image_q", "q4.jpg"),
    (5, "image_q", "q5.jpg"),
    (7, "image_q", "q7.jpg"),
    (8, "image_q", "q8.jpg"),
    (9, "image_q", "q9.jpg"),
    (10, "image_q", "q10.jpg"),
    (12, "image_q", "q12.jpg"),
    (46, "image_q", "q13.jpg"),
]


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
        # ── 1. Remover quebradas/duplicadas ──────────────────────────────
        existing = conn.execute(
            text("SELECT id FROM questions WHERE id = ANY(:ids)"),
            {"ids": DELETE_IDS},
        ).fetchall()
        found_ids = {r[0] for r in existing}
        missing = set(DELETE_IDS) - found_ids

        print(f"Questões a excluir: {len(found_ids)} (esperado {len(DELETE_IDS)})")
        if missing:
            print(f"  Aviso: {len(missing)} ids já não existem: {sorted(missing)}")

        if not dry_run and found_ids:
            conn.execute(
                text("DELETE FROM questions WHERE id = ANY(:ids)"),
                {"ids": list(found_ids)},
            )

        # ── 2. Vincular imagens ───────────────────────────────────────────
        linked = 0
        for qid, column, filename in IMAGE_LINKS:
            row = conn.execute(
                text("SELECT id FROM questions WHERE id = :id"), {"id": qid}
            ).fetchone()
            if not row:
                print(f"  Aviso: questão id={qid} não encontrada, pulando link de imagem.")
                continue
            if not dry_run:
                conn.execute(
                    text(f"UPDATE questions SET {column} = :fn WHERE id = :id"),
                    {"fn": filename, "id": qid},
                )
            linked += 1

        print(f"Imagens vinculadas: {linked} (esperado {len(IMAGE_LINKS)})")

        prefix = "[DRY-RUN] " if dry_run else ""
        print(f"\n{prefix}Concluído.")
        if dry_run:
            print("Nenhuma alteração aplicada (--dry-run). Remova a flag para executar.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true",
                        help="Mostra o que seria alterado sem modificar o banco")
    args = parser.parse_args()
    run(dry_run=args.dry_run)
