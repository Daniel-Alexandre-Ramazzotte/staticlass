from datetime import date, datetime

from sqlalchemy import text

from .. import db
from ..repositories.answer_history_repository import create_answer_history_rows
from ..repositories.gamification_repository import (
    buscar_gamification_data,
    get_own_rank,
    get_ranking_page,
)
from ..repositories.resultado_repository import salvar_resultado

XP_PER_CORRECT = 10
SESSION_BONUS = 20
PAGE_SIZE = 20
MAX_PAGE = 5


def _normalizar_data(valor):
    if valor is None or isinstance(valor, date):
        return valor
    if isinstance(valor, str):
        return date.fromisoformat(valor[:10])
    return valor


def _normalizar_datetime(valor):
    if valor is None or isinstance(valor, datetime):
        return valor
    if isinstance(valor, str):
        normalizado = valor.replace("Z", "+00:00").replace(" ", "T")
        parsed = datetime.fromisoformat(normalizado)
        if parsed.tzinfo is not None:
            parsed = parsed.astimezone().replace(tzinfo=None)
        return parsed
    return valor


def calcular_nova_streak(streak_atual, last_practice_date, hoje=None):
    """Avanca, mantem ou reinicia a streak com base no dia calendario."""
    hoje = hoje or date.today()
    streak_atual = int(streak_atual or 0)
    last_practice_date = _normalizar_data(last_practice_date)

    if last_practice_date is None:
        return 1

    delta = (hoje - last_practice_date).days
    if delta <= 0:
        return max(streak_atual, 1)
    if delta == 1:
        return max(streak_atual, 0) + 1
    return 1


def calcular_xp(acertos, streak):
    """Calcula XP total da sessao e o multiplicador aplicado."""
    base = (acertos * XP_PER_CORRECT) + SESSION_BONUS
    if streak >= 7:
        multiplicador = 1.5
    elif streak >= 3:
        multiplicador = 1.25
    else:
        multiplicador = 1.0
    return int(base * multiplicador), multiplicador


def record_session_service(usuario_id, dados):
    """Registra a sessao de quiz, atualiza XP/streak e retorna o resumo."""
    acertos = dados.get("acertos")
    total = dados.get("total")
    capitulo_id = dados.get("capitulo_id")
    dificuldade = dados.get("dificuldade")
    source = dados.get("source") or "free_practice"
    answers = dados.get("answers")

    if acertos is None or total is None:
        return {"error": "campos 'acertos' e 'total' são obrigatórios"}, 400

    try:
        acertos = int(acertos)
        total = int(total)
    except (TypeError, ValueError):
        return {"error": "campos 'acertos' e 'total' devem ser numéricos"}, 400

    if total <= 0:
        return {"error": "'total' deve ser maior que zero"}, 400
    if acertos < 0 or acertos > total:
        return {"error": "'acertos' deve estar entre 0 e 'total'"}, 400
    if not isinstance(source, str):
        return {"error": "source inválida"}, 400
    source = source.strip().lower()
    if source not in {"free_practice", "list"}:
        return {"error": "source inválida"}, 400

    try:
        usuario_id_int = int(usuario_id)
    except (TypeError, ValueError):
        return {"error": "usuário inválido"}, 400

    try:
        usuario = buscar_gamification_data(usuario_id_int)
        if not usuario:
            return {"error": "usuário não encontrado"}, 404
        if usuario["role"] != "aluno":
            return {"error": "acesso negado — requer: aluno"}, 403

        respostas_validas = []
        if source == "free_practice":
            if not isinstance(answers, list):
                return {"error": "answers é obrigatório para sessões de prática"}, 400
            if len(answers) != total:
                return {"error": "answers deve conter exatamente total itens"}, 400

            vistos: set[int] = set()
            for resposta in answers:
                if not isinstance(resposta, dict):
                    return {"error": "cada answer deve ser um objeto"}, 400

                question_id = resposta.get("question_id")
                if not isinstance(question_id, int) or isinstance(question_id, bool):
                    return {"error": "question_id deve ser numérico"}, 400
                if question_id in vistos:
                    return {"error": "question_id duplicado em answers"}, 400
                vistos.add(question_id)

                selected_answer = resposta.get("selected_answer")
                if selected_answer is not None and not isinstance(selected_answer, str):
                    return {"error": "selected_answer deve ser texto ou null"}, 400

                is_correct = resposta.get("is_correct")
                if not isinstance(is_correct, bool):
                    return {"error": "is_correct deve ser booleano"}, 400

                respostas_validas.append(
                    {
                        "question_id": question_id,
                        "selected_answer": (
                            selected_answer.strip().upper()
                            if selected_answer is not None and selected_answer.strip()
                            else None
                        ),
                        "is_correct": is_correct,
                    }
                )

        hoje = date.today()
        nova_streak = calcular_nova_streak(usuario["streak"], usuario["last_practice_date"], hoje)
        xp_ganho, multiplicador = calcular_xp(acertos, nova_streak)

        resultado_id = salvar_resultado(usuario_id_int, acertos, total, capitulo_id, dificuldade)
        resultado_row = db.session.execute(
            text("SELECT criado_em FROM quiz_resultados WHERE id = :resultado_id"),
            {"resultado_id": resultado_id},
        ).mappings().one()
        if source == "free_practice":
            create_answer_history_rows(
                usuario_id_int,
                "free_practice",
                resultado_id,
                None,
                _normalizar_datetime(resultado_row["criado_em"]),
                respostas_validas,
            )
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
                "usuario_id": usuario_id_int,
                "xp_ganho": xp_ganho,
                "streak": nova_streak,
                "last_practice_date": hoje,
            },
        )
        db.session.commit()

        return {
            "message": "sessao registrada",
            "xp_ganho": xp_ganho,
            "streak": nova_streak,
            "multiplier": multiplicador,
        }, 201
    except Exception as e:
        db.session.rollback()
        return {"error": f"erro ao registrar sessão: {e}"}, 500


def ranking_service(usuario_id, role, page=1):
    """Retorna pagina do ranking + entrada propria do usuario autenticado."""
    try:
        page = int(page)
    except (TypeError, ValueError):
        page = 1

    page = max(1, min(page, MAX_PAGE))
    offset = (page - 1) * PAGE_SIZE

    try:
        ranking_rows = get_ranking_page(PAGE_SIZE, offset)
        ranking = [
            {
                "posicao": int(row["posicao"]),
                "id": int(row["id"]),
                "nome": row["name"],
                "xp": int(row["xp"]),
            }
            for row in ranking_rows
        ]

        own_entry = None
        if role == "aluno":
            propria = get_own_rank(int(usuario_id))
            if propria:
                own_entry = {
                    "posicao": int(propria["posicao"]),
                    "id": int(propria["id"]),
                    "nome": propria["name"],
                    "xp": int(propria["xp"]),
                }

        return {
            "ranking": ranking,
            "own_entry": own_entry,
            "page": page,
            "page_size": PAGE_SIZE,
            "has_more": len(ranking_rows) == PAGE_SIZE and page < MAX_PAGE,
        }, 200
    except Exception as e:
        return {"error": f"erro ao buscar ranking: {e}"}, 500
