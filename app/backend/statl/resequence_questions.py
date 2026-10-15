"""
Renumera os IDs da tabela questions de forma contínua, começando em 1.

Uso:
    python -m statl.resequence_questions [--dry-run]

O script:
  1. Dropa as FK das tabelas filhas
  2. Atribui novos IDs sequenciais (ordenados pelo ID atual)
  3. Atualiza todas as tabelas filhas
  4. Atualiza questions.id
  5. Reseta a sequence do PostgreSQL
  6. Recria as FK
"""

import argparse
from statl import create_app, db


CHILD_FKS = [
    # (tabela, coluna, nome_da_constraint)
    ("alternatives",             "question_id", "alternatives_question_id_fkey"),
    ("answer_history",           "question_id", "answer_history_question_id_fkey"),
    ("list_questions",           "question_id", "list_questions_question_id_fkey"),
    ("list_submission_answers",  "question_id", "list_submission_answers_question_id_fkey"),
]


def resequence(dry_run: bool = False):
    conn = db.session.connection()

    # 1. Buscar mapeamento old_id → new_id
    rows = conn.execute(
        db.text("SELECT id FROM questions ORDER BY id")
    ).fetchall()

    if not rows:
        print("Nenhuma questão encontrada.")
        return

    mapping = {row[0]: new_id for new_id, row in enumerate(rows, start=1)}
    print(f"Total de questões: {len(mapping)}")
    print(f"  Antes → depois:  {min(mapping)} ... {max(mapping)}  →  1 ... {len(mapping)}")

    if dry_run:
        print("[dry-run] Nenhuma alteração aplicada.")
        return

    # 2. Dropar FK das tabelas filhas
    for table, col, constraint in CHILD_FKS:
        conn.execute(db.text(f"ALTER TABLE {table} DROP CONSTRAINT IF EXISTS {constraint}"))
        print(f"FK dropada: {constraint}")

    # 3. Atualizar tabelas filhas usando o mapeamento
    for table, col, _ in CHILD_FKS:
        for old_id, new_id in mapping.items():
            conn.execute(
                db.text(f"UPDATE {table} SET {col} = :new WHERE {col} = :old"),
                {"new": new_id, "old": old_id}
            )
        print(f"Atualizada: {table}.{col}")

    # 4. Atualizar questions.id em dois passes para evitar conflito de PK
    #    Passo 4a: deslocar todos para IDs negativos temporários
    for old_id in mapping:
        conn.execute(
            db.text("UPDATE questions SET id = :neg WHERE id = :old"),
            {"neg": -old_id, "old": old_id}
        )

    #    Passo 4b: atribuir os IDs finais
    for old_id, new_id in mapping.items():
        conn.execute(
            db.text("UPDATE questions SET id = :new WHERE id = :neg"),
            {"new": new_id, "neg": -old_id}
        )
    print(f"questions.id renumerados: 1 … {len(mapping)}")

    # 5. Resetar a sequence para o próximo INSERT não colidir
    conn.execute(
        db.text(f"SELECT setval(pg_get_serial_sequence('questions','id'), {len(mapping)}, true)")
    )
    print(f"Sequence resetada para {len(mapping)}")

    # 6. Recriar FK das tabelas filhas
    fk_defs = {
        "alternatives":             "ALTER TABLE alternatives ADD CONSTRAINT alternatives_question_id_fkey "
                                    "FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE",
        "answer_history":           "ALTER TABLE answer_history ADD CONSTRAINT answer_history_question_id_fkey "
                                    "FOREIGN KEY (question_id) REFERENCES questions(id)",
        "list_questions":           "ALTER TABLE list_questions ADD CONSTRAINT list_questions_question_id_fkey "
                                    "FOREIGN KEY (question_id) REFERENCES questions(id)",
        "list_submission_answers":  "ALTER TABLE list_submission_answers ADD CONSTRAINT list_submission_answers_question_id_fkey "
                                    "FOREIGN KEY (question_id) REFERENCES questions(id)",
    }
    for table, ddl in fk_defs.items():
        conn.execute(db.text(ddl))
        print(f"FK recriada: {table}")

    db.session.commit()
    print("Concluído. Commit realizado.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Renumera IDs das questões a partir de 1.")
    parser.add_argument("--dry-run", action="store_true", help="Apenas mostra o que seria feito")
    args = parser.parse_args()

    app = create_app()
    with app.app_context():
        resequence(dry_run=args.dry_run)
