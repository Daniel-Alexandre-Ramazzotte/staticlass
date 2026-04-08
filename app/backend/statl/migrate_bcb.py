#!/usr/bin/env python3
"""
migrate_bcb.py — Importa questões BCB/BACEN/CVM de estatística para o PostgreSQL.

As questões são do tipo Cebraspe (Certo/Errado), sem alternativas A-E.
Questões sem gabarito são importadas com correct_answer='?' e needs_fix=True.

Uso:
    cd app/backend
    python -m statl.migrate_bcb [--json-path CAMINHO]
"""

import argparse
import json
from pathlib import Path
from dotenv import load_dotenv

_SCRIPT_DIR = Path(__file__).resolve().parent
load_dotenv(_SCRIPT_DIR.parent / ".env")

_DEFAULT_JSON = _SCRIPT_DIR.parent.parent.parent / "banco_questoes" / "bcb" / "questoes_estatistica.json"

# Mapeamento subtema BCB → (chapter_name, topic_name)
# Capítulos existentes: 1-Descritiva, 2-Probabilidade, 3-Inferência, 4-Regressão
# Capítulo novo:        5-Séries Temporais
SUBTEMA_MAP: dict[str, tuple[str, str]] = {
    "Estatística Descritiva":       ("Estatística Descritiva",          "Conceitos Básicos"),
    "Distribuições de Probabilidade":("Probabilidade",                  "Distribuições Contínuas"),
    "Inferência Estatística":        ("Inferência Estatística",          "Testes de Hipóteses"),
    "Regressão":                     ("Regressão Linear Simples",        "Modelo Linear"),
    "Processos Estocásticos":        ("Séries Temporais",                "Processos Estocásticos"),
    "Séries Temporais":              ("Séries Temporais",                "Séries Temporais"),
}

# Capítulos/tópicos novos a criar se não existirem
NEW_CHAPTERS = [
    {"name": "Séries Temporais", "number": 5, "topics": [
        "Séries Temporais",
        "Processos Estocásticos",
    ]},
]


def _ensure_chapters_topics(conn, text):
    """Cria capítulos e tópicos novos se ainda não existirem. Retorna mapa nome→id."""
    chapter_ids: dict[str, int] = {}
    topic_ids: dict[str, int] = {}

    # Carregar existentes
    for row in conn.execute(text("SELECT id, name FROM chapters")).fetchall():
        chapter_ids[row[1]] = row[0]
    for row in conn.execute(text("SELECT id, name FROM topics")).fetchall():
        topic_ids[row[1]] = row[0]

    # Resincronizar sequences após inserts com ID explícito (migrate_questoes)
    conn.execute(text("SELECT setval('chapters_id_seq', (SELECT MAX(id) FROM chapters))"))
    conn.execute(text("SELECT setval('topics_id_seq', (SELECT MAX(id) FROM topics))"))

    for ch in NEW_CHAPTERS:
        if ch["name"] not in chapter_ids:
            result = conn.execute(
                text("INSERT INTO chapters (name, number) VALUES (:name, :number) RETURNING id"),
                {"name": ch["name"], "number": ch["number"]},
            )
            chapter_ids[ch["name"]] = result.scalar()
            print(f"  Capítulo criado: {ch['name']} (id={chapter_ids[ch['name']]})")

        for topic_name in ch["topics"]:
            if topic_name not in topic_ids:
                result = conn.execute(
                    text("INSERT INTO topics (name, chapter_id) VALUES (:name, :cid) RETURNING id"),
                    {"name": topic_name, "cid": chapter_ids[ch["name"]]},
                )
                topic_ids[topic_name] = result.scalar()
                print(f"    Tópico criado: {topic_name} (id={topic_ids[topic_name]})")

    return chapter_ids, topic_ids


def run_migration(json_path: Path) -> None:
    import sqlalchemy as sa
    from sqlalchemy import text
    import os

    db_url = os.getenv("DATABASE_URL", "")
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
    if not db_url:
        raise SystemExit("DATABASE_URL não definida.")

    with open(json_path, encoding="utf-8") as f:
        data = json.load(f)

    questoes = data["questoes"]
    print(f"Fonte: {json_path}")
    print(f"Total no arquivo: {len(questoes)} questões")

    engine = sa.create_engine(db_url)

    with engine.begin() as conn:
        print("\nVerificando capítulos e tópicos...")
        chapter_ids, topic_ids = _ensure_chapters_topics(conn, text)

        imported = skipped_dup = skipped_empty = 0

        for q in questoes:
            original_id = q["id"]

            # Pular se já existe
            exists = conn.execute(
                text("SELECT id FROM questions WHERE original_id = :oid"),
                {"oid": original_id},
            ).fetchone()
            if exists:
                skipped_dup += 1
                continue

            # Pular se sem enunciado
            enunciado = (q.get("enunciado") or "").strip()
            if not enunciado:
                skipped_empty += 1
                continue

            # Mapear subtema → chapter/topic
            subtema = q.get("subtema", "")
            mapping = SUBTEMA_MAP.get(subtema)
            chapter_id = chapter_ids.get(mapping[0]) if mapping else None
            topic_id = topic_ids.get(mapping[1]) if mapping else None

            # Gabarito: 'C'=Certo, 'E'=Errado, None=desconhecido
            gabarito = q.get("gabarito")
            if gabarito:
                correct_answer = gabarito.upper()
                needs_fix = False
            else:
                correct_answer = "?"
                needs_fix = True

            # section derivada do capítulo
            section_map = {
                "Estatística Descritiva": "estatistica_basica",
                "Probabilidade":          "probabilidade",
                "Inferência Estatística": "inferencia",
                "Regressão Linear Simples": "regressao",
                "Séries Temporais":       "series_temporais",
            }
            section = section_map.get(mapping[0], "") if mapping else ""

            # fonte como parte da solução/observação
            fonte_info = f"Fonte: {q.get('fonte', '')} | Prova: {q.get('prova', '')} | Banca: {q.get('banca', '')}"
            observacao = q.get("observacao", "")
            solution = f"{fonte_info}\n{observacao}".strip()

            conn.execute(
                text("""
                    INSERT INTO questions
                        (issue, correct_answer, solution, original_id, section,
                         needs_fix, chapter_id, topic_id)
                    VALUES
                        (:issue, :correct_answer, :solution, :original_id, :section,
                         :needs_fix, :chapter_id, :topic_id)
                """),
                {
                    "issue": enunciado,
                    "correct_answer": correct_answer,
                    "solution": solution,
                    "original_id": original_id,
                    "section": section,
                    "needs_fix": needs_fix,
                    "chapter_id": chapter_id,
                    "topic_id": topic_id,
                },
            )
            imported += 1

        total_q = conn.execute(text("SELECT COUNT(*) FROM questions")).scalar()

        print(f"\n=== Migração BCB concluída ===")
        print(f"  Importadas   : {imported}")
        print(f"  Duplicadas   : {skipped_dup}")
        print(f"  Sem enunciado: {skipped_empty}")
        print(f"  Total no banco: {total_q}")
        print(f"\n  Atenção: questões com correct_answer='?' precisam de revisão manual (needs_fix=True).")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--json-path", type=Path, default=_DEFAULT_JSON)
    args = parser.parse_args()
    if not args.json_path.exists():
        raise SystemExit(f"ERRO: arquivo não encontrado: {args.json_path}")
    run_migration(args.json_path)
