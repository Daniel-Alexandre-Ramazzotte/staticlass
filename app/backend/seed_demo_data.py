"""Seed unificado de dados fictícios para admin, professores e alunos.

Cria contas demo para todos os papéis e popula histórico/gamificação para
alunos sem quizzes registrados. O script é idempotente: usuários demo são
atualizados por e-mail e alunos com histórico existente são preservados.
"""
from __future__ import annotations

from datetime import date, datetime, timedelta

from sqlalchemy import text
from werkzeug.security import generate_password_hash

from statl import create_app, db

USUARIOS_FIXOS = [
    {
        "email": "admin@staticlass.com",
        "senha": "admin123",
        "nome": "Admin Demo",
        "role": "admin",
    },
    {
        "email": "professor@staticlass.com",
        "senha": "professor123",
        "nome": "Professor Demo",
        "role": "professor",
    },
    {
        "email": "prof.ana@staticlass.com",
        "senha": "profana123",
        "nome": "Prof. Ana Ribeiro",
        "role": "professor",
    },
]

ALUNOS_DEMO = [
    {"email": "aluno@staticlass.com", "senha": "aluno123", "nome": "Aluno Demo"},
    {"email": "ana@staticlass.com", "senha": "ana123", "nome": "Ana Costa"},
    {"email": "bruno@staticlass.com", "senha": "bruno123", "nome": "Bruno Lima"},
    {"email": "carla@staticlass.com", "senha": "carla123", "nome": "Carla Souza"},
    {"email": "daniel@staticlass.com", "senha": "daniel123", "nome": "Daniel Silva"},
    {"email": "erika@staticlass.com", "senha": "erika123", "nome": "Erika Santos"},
    {"email": "felipe@staticlass.com", "senha": "felipe123", "nome": "Felipe Rocha"},
    {"email": "gabriela@staticlass.com", "senha": "gabriela123", "nome": "Gabriela Nunes"},
]

TEMPLATES_SESSOES = [
    [(14, 9, 10, 2), (7, 7, 10, 2), (3, 6, 8, 3), (2, 5, 8, 2), (1, 4, 6, 1), (0, 5, 6, 2)],
    [(21, 8, 10, 3), (14, 8, 10, 2), (7, 7, 10, 2), (2, 6, 8, 3), (0, 4, 6, 1)],
    [(9, 6, 10, 2), (8, 5, 10, 1), (4, 7, 10, 2), (1, 5, 8, 2)],
    [(28, 10, 10, 3), (20, 9, 10, 2), (13, 8, 10, 2), (6, 7, 8, 1), (3, 6, 8, 2), (0, 7, 10, 3)],
]

XP_POR_ACERTO = 10
BONUS_SESSAO = 20


def garantir_usuario(email: str, senha: str, nome: str, role: str) -> int:
    resultado = db.session.execute(
        text("""
            INSERT INTO users (
                email,
                password_hash,
                name,
                role,
                active,
                xp,
                streak,
                last_practice_date
            )
            VALUES (
                :email,
                :password_hash,
                :name,
                :role,
                TRUE,
                0,
                0,
                NULL
            )
            ON CONFLICT (email) DO UPDATE SET
                password_hash = EXCLUDED.password_hash,
                name = EXCLUDED.name,
                role = EXCLUDED.role,
                active = TRUE
            RETURNING id
        """),
        {
            "email": email,
            "password_hash": generate_password_hash(senha),
            "name": nome,
            "role": role,
        },
    )
    return int(resultado.scalar())


def carregar_capitulos() -> list[int | None]:
    capitulos = db.session.execute(
        text("SELECT id FROM chapters ORDER BY number ASC, id ASC")
    ).scalars().all()
    return list(capitulos) or [None]


def gerar_sessoes(indice: int, capitulos: list[int | None]) -> list[dict]:
    hoje = date.today()
    template = TEMPLATES_SESSOES[indice % len(TEMPLATES_SESSOES)]
    sessoes = []

    for posicao, (dias_atras, acertos, total, dificuldade) in enumerate(template):
        capitulo_id = capitulos[(indice + posicao) % len(capitulos)]
        data_sessao = hoje - timedelta(days=dias_atras)
        criado_em = datetime.combine(data_sessao, datetime.min.time()).replace(
            hour=8 + ((indice + posicao) % 8),
            minute=(indice * 7 + posicao * 11) % 60,
        )
        sessoes.append(
            {
                "acertos": acertos,
                "total": total,
                "capitulo_id": capitulo_id,
                "dificuldade": dificuldade,
                "criado_em": criado_em,
            }
        )

    return sorted(sessoes, key=lambda sessao: sessao["criado_em"])


def calcular_xp_e_streak(sessoes: list[dict]) -> tuple[int, int, date | None]:
    xp_total = 0
    streak = 0
    ultima_data = None

    for sessao in sessoes:
        data_sessao = sessao["criado_em"].date()
        if ultima_data is None:
            streak = 1
        else:
            delta = (data_sessao - ultima_data).days
            if delta <= 0:
                streak = max(streak, 1)
            elif delta == 1:
                streak = max(streak, 0) + 1
            else:
                streak = 1

        base_xp = (sessao["acertos"] * XP_POR_ACERTO) + BONUS_SESSAO
        if streak >= 7:
            multiplicador = 1.5
        elif streak >= 3:
            multiplicador = 1.25
        else:
            multiplicador = 1.0
        xp_total += int(base_xp * multiplicador)
        ultima_data = data_sessao

    return xp_total, streak, ultima_data


def aluno_tem_historico(usuario_id: int) -> bool:
    return bool(
        db.session.execute(
            text("SELECT COUNT(*) FROM quiz_resultados WHERE usuario_id = :usuario_id"),
            {"usuario_id": usuario_id},
        ).scalar()
    )


def popular_aluno(usuario_id: int, indice: int, capitulos: list[int | None]) -> dict:
    if aluno_tem_historico(usuario_id):
        return {"seeded": False, "motivo": "historico_existente"}

    sessoes = gerar_sessoes(indice, capitulos)
    xp_total, streak, ultima_data = calcular_xp_e_streak(sessoes)

    for sessao in sessoes:
        db.session.execute(
            text("""
                INSERT INTO quiz_resultados (
                    usuario_id,
                    acertos,
                    total,
                    capitulo_id,
                    dificuldade,
                    criado_em
                )
                VALUES (
                    :usuario_id,
                    :acertos,
                    :total,
                    :capitulo_id,
                    :dificuldade,
                    :criado_em
                )
            """),
            {"usuario_id": usuario_id, **sessao},
        )

    for data_sessao in {sessao["criado_em"].date() for sessao in sessoes[-3:]}:
        db.session.execute(
            text("""
                INSERT INTO questao_diaria_historico (usuario_id, data)
                VALUES (:usuario_id, :data)
                ON CONFLICT (usuario_id, data) DO NOTHING
            """),
            {"usuario_id": usuario_id, "data": data_sessao},
        )

    db.session.execute(
        text("""
            UPDATE users
            SET xp = :xp, streak = :streak, last_practice_date = :last_practice_date
            WHERE id = :usuario_id
        """),
        {
            "usuario_id": usuario_id,
            "xp": xp_total,
            "streak": streak,
            "last_practice_date": ultima_data,
        },
    )

    return {
        "seeded": True,
        "xp": xp_total,
        "streak": streak,
        "quizzes": len(sessoes),
    }


def main():
    app = create_app()
    with app.app_context():
        capitulos = carregar_capitulos()

        criados = []
        for usuario in USUARIOS_FIXOS:
            usuario_id = garantir_usuario(
                usuario["email"],
                usuario["senha"],
                usuario["nome"],
                usuario["role"],
            )
            criados.append((usuario["role"], usuario["email"], usuario_id))

        aluno_ids_demo = []
        for aluno in ALUNOS_DEMO:
            usuario_id = garantir_usuario(aluno["email"], aluno["senha"], aluno["nome"], "aluno")
            aluno_ids_demo.append((aluno["email"], usuario_id))
            criados.append(("aluno", aluno["email"], usuario_id))

        alunos_existentes = db.session.execute(
            text("SELECT id, email, name FROM users WHERE role = 'aluno' ORDER BY id ASC")
        ).mappings().all()

        for indice, aluno in enumerate(alunos_existentes):
            resumo = popular_aluno(int(aluno["id"]), indice, capitulos)
            if resumo["seeded"]:
                print(
                    f"[aluno] {aluno['email']}: {resumo['quizzes']} quizzes, "
                    f"{resumo['xp']} XP, streak {resumo['streak']}"
                )
            else:
                print(f"[aluno] {aluno['email']}: preservado ({resumo['motivo']})")

        db.session.commit()

        print("\nUsuarios demo garantidos:")
        for role, email, usuario_id in criados:
            print(f" - {role:<9} {email} (id={usuario_id})")

        print("\nCredenciais principais:")
        print(" - admin@staticlass.com / admin123")
        print(" - professor@staticlass.com / professor123")
        print(" - aluno@staticlass.com / aluno123")


if __name__ == "__main__":
    main()
