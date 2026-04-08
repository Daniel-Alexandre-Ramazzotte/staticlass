"""
Cria 6 alunos fictícios com histórico de quiz para popular ranking e estatísticas.
Idempotente: usa ON CONFLICT DO NOTHING nos usuários e verifica duplicatas nos resultados.
"""
from statl import create_app, db
from werkzeug.security import generate_password_hash
from sqlalchemy import text

ALUNOS = [
    {"nome": "Ana",       "email": "ana@staticlass.com",       "senha": "ana123"},
    {"nome": "Daniel",    "email": "daniel@staticlass.com",    "senha": "daniel123"},
    {"nome": "Raqueline", "email": "raqueline@staticlass.com", "senha": "raqueline123"},
    {"nome": "Vinicius",  "email": "vinicius@staticlass.com",  "senha": "vinicius123"},
    {"nome": "Thais",     "email": "thais@staticlass.com",     "senha": "thais123"},
    {"nome": "Diego",     "email": "diego@staticlass.com",     "senha": "diego123"},
]

# Resultados fictícios por aluno: (acertos, total, capitulo_id, dificuldade, dias_atras)
# capítulos: 1=Descritiva, 2=Probabilidade, 3=Inferência, 4=Regressão
# dificuldade: 1=Fácil, 2=Médio, 3=Difícil
RESULTADOS = {
    "ana@staticlass.com": [
        (9, 10, 1, 2, 30),
        (8, 10, 2, 2, 25),
        (10, 10, 1, 1, 20),
        (8, 10, 3, 3, 15),
        (9, 10, 4, 2, 10),
        (7, 10, 2, 3, 5),
    ],
    "daniel@staticlass.com": [
        (8, 10, 1, 2, 28),
        (9, 10, 2, 3, 20),
        (7, 10, 3, 2, 14),
        (8, 10, 1, 1, 7),
        (6, 10, 4, 3, 2),
    ],
    "raqueline@staticlass.com": [
        (7, 10, 2, 2, 35),
        (8, 10, 1, 1, 27),
        (6, 10, 3, 2, 18),
        (7, 10, 4, 3, 9),
        (5, 10, 2, 2, 3),
    ],
    "vinicius@staticlass.com": [
        (6, 10, 1, 1, 40),
        (5, 10, 2, 2, 30),
        (7, 10, 1, 2, 20),
        (4, 10, 3, 3, 10),
        (5, 10, 4, 1, 4),
    ],
    "thais@staticlass.com": [
        (5, 10, 1, 2, 22),
        (6, 10, 2, 1, 15),
        (4, 10, 3, 3, 8),
        (5, 10, 1, 2, 2),
    ],
    "diego@staticlass.com": [
        (4, 10, 2, 2, 18),
        (3, 10, 1, 3, 10),
        (4, 10, 3, 1, 4),
    ],
}

app = create_app()

with app.app_context():
    # 1. Criar usuários
    for aluno in ALUNOS:
        db.session.execute(
            text("""
                INSERT INTO users (email, password_hash, name, role, score)
                VALUES (:email, :hash, :name, 'aluno', 0)
                ON CONFLICT (email) DO NOTHING
            """),
            {
                "email": aluno["email"],
                "hash": generate_password_hash(aluno["senha"]),
                "name": aluno["nome"],
            },
        )
    db.session.commit()
    print("Usuários criados/verificados.")

    # 2. Para cada aluno, inserir resultados e calcular score
    for aluno in ALUNOS:
        email = aluno["email"]

        row = db.session.execute(
            text("SELECT id, score FROM users WHERE email = :email"),
            {"email": email},
        ).fetchone()
        if not row:
            print(f"  ERRO: usuário {email} não encontrado.")
            continue

        usuario_id = row[0]
        score_atual = row[1] or 0

        # Só insere resultados se o usuário ainda não tem nenhum (idempotência)
        total_existente = db.session.execute(
            text("SELECT COUNT(*) FROM quiz_resultados WHERE usuario_id = :uid"),
            {"uid": usuario_id},
        ).scalar()

        if total_existente > 0:
            print(f"  {aluno['nome']}: já tem {total_existente} resultados, pulando.")
            continue

        total_acertos = 0
        for acertos, total, cap_id, dific, dias_atras in RESULTADOS[email]:
            from datetime import datetime, timedelta
            criado_em = datetime.utcnow() - timedelta(days=dias_atras)
            db.session.execute(
                text("""
                    INSERT INTO quiz_resultados (usuario_id, acertos, total, capitulo_id, dificuldade, criado_em)
                    VALUES (:uid, :acertos, :total, :cap, :dif, :criado_em)
                """),
                {
                    "uid": usuario_id,
                    "acertos": acertos,
                    "total": total,
                    "cap": cap_id,
                    "dif": dific,
                    "criado_em": criado_em,
                },
            )
            total_acertos += acertos

        pontos = total_acertos * 10
        db.session.execute(
            text("UPDATE users SET score = :pontos WHERE id = :uid"),
            {"pontos": pontos, "uid": usuario_id},
        )
        db.session.commit()
        print(f"  {aluno['nome']}: {total_acertos} acertos → {pontos} pontos")

    print("\nResumo do ranking:")
    rows = db.session.execute(
        text("SELECT name, score FROM users WHERE role = 'aluno' ORDER BY score DESC LIMIT 10")
    ).fetchall()
    for i, (nome, pts) in enumerate(rows, 1):
        print(f"  {i}º {nome}: {pts} pts")
