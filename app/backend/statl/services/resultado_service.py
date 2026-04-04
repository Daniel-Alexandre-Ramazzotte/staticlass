from ..repositories.resultado_repository import (
    salvar_resultado, incrementar_score,
    buscar_historico, buscar_ranking, buscar_estatisticas,
    verificar_diaria, marcar_diaria,
)


# ─── Quiz Resultados ────────────────────────────────────────────────────────

def salvar_resultado_service(usuario_id, dados):
    """Salva o resultado do quiz e atualiza o score do usuário.

    Cada acerto vale 10 pontos.
    Retorna dict com confirmação ou mensagem de erro.
    """
    acertos    = dados.get("acertos")
    total      = dados.get("total")
    capitulo_id = dados.get("capitulo_id")
    dificuldade = dados.get("dificuldade")

    if acertos is None or total is None:
        return {"error": "campos 'acertos' e 'total' são obrigatórios"}, 400

    try:
        salvar_resultado(usuario_id, acertos, total, capitulo_id, dificuldade)
        pontos_ganhos = acertos * 10
        incrementar_score(usuario_id, pontos_ganhos)
        return {"message": "resultado salvo", "pontos_ganhos": pontos_ganhos}, 201
    except Exception as e:
        return {"error": f"erro ao salvar resultado: {e}"}, 500


def buscar_historico_service(usuario_id):
    """Retorna os últimos 10 resultados do usuário formatados como lista de dicts."""
    registros = buscar_historico(usuario_id)
    return [
        {
            "id":            r["id"],
            "acertos":       r["acertos"],
            "total":         r["total"],
            "dificuldade":   r["dificuldade"],
            "capitulo":      r["capitulo_nome"],
            "criado_em":     r["criado_em"].isoformat() if r["criado_em"] else None,
        }
        for r in registros
    ]


def buscar_estatisticas_service(usuario_id):
    """Retorna estatísticas agregadas do aluno."""
    r = buscar_estatisticas(usuario_id)
    if not r:
        return {
            "total_quizzes": 0,
            "total_acertos": 0,
            "total_questoes": 0,
            "media_pct": 0,
            "capitulo_favorito": None,
        }
    return {
        "total_quizzes":     int(r["total_quizzes"]),
        "total_acertos":     int(r["total_acertos"]),
        "total_questoes":    int(r["total_questoes"]),
        "media_pct":         float(r["media_pct"] or 0),
        "capitulo_favorito": r["capitulo_favorito"],
    }


def buscar_ranking_service():
    """Retorna top 10 alunos com maior pontuação."""
    registros = buscar_ranking()
    return [
        {
            "posicao": i + 1,
            "id":      r["id"],
            "nome":    r["name"],
            "pontos":  r["score"],
        }
        for i, r in enumerate(registros)
    ]


# ─── Questão Diária ─────────────────────────────────────────────────────────

def status_diaria_service(usuario_id):
    """Retorna se o usuário já fez a questão diária hoje."""
    feita = verificar_diaria(usuario_id)
    return {"feita": feita}


def marcar_diaria_service(usuario_id):
    """Registra a conclusão da questão diária para hoje."""
    marcar_diaria(usuario_id)
    return {"message": "questão diária registrada"}
