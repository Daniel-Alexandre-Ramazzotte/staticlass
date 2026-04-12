from .. import db
from sqlalchemy import text
from datetime import date


# ─── Quiz Resultados ────────────────────────────────────────────────────────

def salvar_resultado(usuario_id, acertos, total, capitulo_id=None, dificuldade=None):
    """Insere um novo resultado de quiz para o usuário."""
    row = db.session.execute(
        text("""
            INSERT INTO quiz_resultados (usuario_id, acertos, total, capitulo_id, dificuldade, criado_em)
            VALUES (:usuario_id, :acertos, :total, :capitulo_id, :dificuldade, CURRENT_TIMESTAMP)
            RETURNING id
        """),
        {
            "usuario_id":  usuario_id,
            "acertos":     acertos,
            "total":       total,
            "capitulo_id": capitulo_id,
            "dificuldade": dificuldade,
        },
    ).mappings().one()
    return int(row["id"])

def buscar_historico(usuario_id, limite=10):
    """Retorna os últimos resultados de quiz do usuário, do mais recente ao mais antigo."""
    return db.session.execute(
        text("""
            SELECT qr.id, qr.acertos, qr.total, qr.dificuldade, qr.criado_em,
                   c.name AS capitulo_nome
            FROM quiz_resultados qr
            LEFT JOIN chapters c ON c.id = qr.capitulo_id
            WHERE qr.usuario_id = :usuario_id
            ORDER BY qr.criado_em DESC
            LIMIT :limite
        """),
        {"usuario_id": usuario_id, "limite": limite},
    ).mappings().all()


def buscar_estatisticas(usuario_id):
    """Retorna estatísticas agregadas de quiz do usuário."""
    return db.session.execute(
        text("""
            SELECT
                COUNT(*)                                          AS total_quizzes,
                COALESCE(SUM(qr.acertos), 0)                     AS total_acertos,
                COALESCE(SUM(qr.total), 0)                       AS total_questoes,
                ROUND(
                    COALESCE(SUM(qr.acertos) * 100.0 / NULLIF(SUM(qr.total), 0), 0), 1
                )                                                 AS media_pct,
                (
                    SELECT c2.name
                    FROM quiz_resultados qr2
                    JOIN chapters c2 ON c2.id = qr2.capitulo_id
                    WHERE qr2.usuario_id = :uid AND qr2.capitulo_id IS NOT NULL
                    GROUP BY c2.name
                    ORDER BY COUNT(*) DESC
                    LIMIT 1
                )                                                 AS capitulo_favorito
            FROM quiz_resultados qr
            WHERE qr.usuario_id = :uid
        """),
        {"uid": usuario_id},
    ).mappings().fetchone()

# ─── Questão Diária ─────────────────────────────────────────────────────────

def verificar_diaria(usuario_id):
    """Verifica se o usuário já fez a questão diária hoje. Retorna True ou False."""
    resultado = db.session.execute(
        text("""
            SELECT id FROM questao_diaria_historico
            WHERE usuario_id = :usuario_id AND data = :hoje
        """),
        {"usuario_id": usuario_id, "hoje": date.today()},
    ).fetchone()
    return resultado is not None


def marcar_diaria(usuario_id):
    """Registra que o usuário completou a questão diária hoje.
    Se já foi marcada hoje, não faz nada (ignora duplicata)."""
    try:
        db.session.execute(
            text("""
                INSERT INTO questao_diaria_historico (usuario_id, data)
                VALUES (:usuario_id, :hoje)
                ON CONFLICT (usuario_id, data) DO NOTHING
            """),
            {"usuario_id": usuario_id, "hoje": date.today()},
        )
        db.session.commit()
    except Exception:
        db.session.rollback()
