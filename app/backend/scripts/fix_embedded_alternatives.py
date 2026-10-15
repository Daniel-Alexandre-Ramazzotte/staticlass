#!/usr/bin/env python3
"""
fix_embedded_alternatives.py — Extrai alternativas embutidas no campo `issue`.

Alguns registros foram importados com as alternativas dentro do texto da questão
(ex: "a) 0,154\nb) 0,986\n...") em vez de linhas separadas na tabela `alternatives`.
Este script detecta esses casos, extrai as alternativas, popula a tabela `alternatives`
e limpa o campo `issue`.

Uso:
    cd app/backend
    python -m statl.fix_embedded_alternatives [--dry-run]
"""

import argparse
import os
import re
from pathlib import Path
from dotenv import load_dotenv

_SCRIPT_DIR = Path(__file__).resolve().parent
load_dotenv(_SCRIPT_DIR.parent / ".env")

# Detecta blocos de alternativas no final do texto:
# Ex: "\na) texto\nb) texto\nc) texto"
# Captura letra (A-E) e texto da alternativa
_ALT_LINE = re.compile(
    r'(?:^|\n)\s*([A-Ea-e])\)\s*(.+?)(?=\n\s*[A-Ea-e]\)|\Z)',
    re.DOTALL,
)

# Detecta início do bloco de alternativas para separar do enunciado
_ALT_BLOCK_START = re.compile(
    r'\n\s*[A-Ea-e]\)\s*.+',
    re.DOTALL,
)


def _parse_alternatives(text: str) -> tuple[str, list[dict]]:
    """
    Retorna (issue_sem_alternativas, lista_de_alternativas).
    Cada alternativa é {'letter': 'A', 'text': '...'}.
    Se não encontrar padrão de alternativas, retorna (text, []).
    """
    match = _ALT_BLOCK_START.search(text)
    if not match:
        return text, []

    # Texto antes das alternativas = enunciado limpo
    issue_clean = text[:match.start()].strip()
    alt_block = text[match.start():]

    alternatives = []
    for m in _ALT_LINE.finditer(alt_block):
        letter = m.group(1).upper()
        alt_text = m.group(2).strip()
        if alt_text:
            alternatives.append({"letter": letter, "text": alt_text})

    # Precisa ter pelo menos 2 alternativas para ser válido
    if len(alternatives) < 2:
        return text, []

    return issue_clean, alternatives


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
        # Questões sem alternativas na tabela alternatives
        rows = conn.execute(text("""
            SELECT q.id, q.issue, q.correct_answer
            FROM questions q
            WHERE NOT EXISTS (
                SELECT 1 FROM alternatives a WHERE a.question_id = q.id
            )
            ORDER BY q.id
        """)).fetchall()

        fixed = 0
        skipped = 0

        for row in rows:
            qid, issue, correct_answer = row[0], row[1], row[2]
            new_issue, alts = _parse_alternatives(issue or "")

            if len(alts) < 2:
                skipped += 1
                continue

            # Verifica se a resposta correta existe entre as alternativas
            letters = {a["letter"] for a in alts}
            ca = (correct_answer or "").upper()
            if ca not in letters:
                print(f"  [WARN] Q{qid}: resposta correta '{ca}' não encontrada entre {letters} — pulando")
                skipped += 1
                continue

            print(f"  Q{qid}: '{issue[:60].strip()}...' → {len(alts)} alternativas extraídas")

            if not dry_run:
                # Atualiza issue
                conn.execute(
                    text("UPDATE questions SET issue = :issue WHERE id = :id"),
                    {"issue": new_issue, "id": qid},
                )
                # Insere alternativas
                for alt in alts:
                    conn.execute(
                        text("""
                            INSERT INTO alternatives (question_id, letter, text, is_correct)
                            VALUES (:qid, :letter, :text, :is_correct)
                        """),
                        {
                            "qid": qid,
                            "letter": alt["letter"],
                            "text": alt["text"],
                            "is_correct": alt["letter"] == ca,
                        },
                    )
            fixed += 1

        prefix = "[DRY-RUN] " if dry_run else ""
        print(f"\n{prefix}Questões corrigidas : {fixed}")
        print(f"{prefix}Questões puladas    : {skipped}")
        if dry_run:
            print("Nenhuma alteração aplicada (--dry-run). Remova a flag para executar.")
        else:
            print("Correção concluída.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true",
                        help="Mostra o que seria alterado sem modificar o banco")
    args = parser.parse_args()
    run(dry_run=args.dry_run)
