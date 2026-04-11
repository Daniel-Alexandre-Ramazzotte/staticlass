from sqlalchemy import text

from .. import db


def buscar_gamification_data(usuario_id):
    """Retorna XP, streak e a ultima data de pratica do usuario."""
    return db.session.execute(
        text("""
            SELECT
                id,
                role,
                active,
                name,
                COALESCE(xp, 0) AS xp,
                COALESCE(streak, 0) AS streak,
                last_practice_date
            FROM users
            WHERE id = :usuario_id
        """),
        {"usuario_id": usuario_id},
    ).mappings().fetchone()


def update_xp_and_streak(usuario_id, xp_ganho, streak, last_practice_date):
    """Atualiza XP acumulado e estado da streak do usuario."""
    db.session.execute(
        text("""
            UPDATE users
            SET
                xp = COALESCE(xp, 0) + :xp_ganho,
                streak = :streak,
                last_practice_date = :last_practice_date
            WHERE id = :usuario_id
        """),
        {
            "usuario_id": usuario_id,
            "xp_ganho": xp_ganho,
            "streak": streak,
            "last_practice_date": last_practice_date,
        },
    )
    db.session.commit()


def get_ranking_page(limite, offset):
    """Retorna uma pagina do ranking global dos alunos ativos."""
    return db.session.execute(
        text("""
            SELECT id, name, xp, posicao
            FROM (
                SELECT
                    id,
                    name,
                    COALESCE(xp, 0) AS xp,
                    ROW_NUMBER() OVER (
                        ORDER BY COALESCE(xp, 0) DESC, name ASC, id ASC
                    ) AS posicao
                FROM users
                WHERE role = 'aluno' AND active = TRUE
            ) ranking
            ORDER BY posicao
            LIMIT :limite OFFSET :offset
        """),
        {"limite": limite, "offset": offset},
    ).mappings().all()


def get_own_rank(usuario_id):
    """Retorna a posicao global do aluno autenticado no ranking."""
    return db.session.execute(
        text("""
            SELECT id, name, xp, posicao
            FROM (
                SELECT
                    id,
                    name,
                    COALESCE(xp, 0) AS xp,
                    ROW_NUMBER() OVER (
                        ORDER BY COALESCE(xp, 0) DESC, name ASC, id ASC
                    ) AS posicao
                FROM users
                WHERE role = 'aluno' AND active = TRUE
            ) ranking
            WHERE id = :usuario_id
        """),
        {"usuario_id": usuario_id},
    ).mappings().fetchone()
