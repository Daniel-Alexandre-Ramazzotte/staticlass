from ..repositories.resultado_repository import (
    buscar_historico, buscar_estatisticas,
    verificar_diaria, marcar_diaria,
)


# ─── Quiz Resultados ────────────────────────────────────────────────────────

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

# ─── Questão Diária ─────────────────────────────────────────────────────────

def status_diaria_service(usuario_id):
    """Retorna se o usuário já fez a questão diária hoje."""
    feita = verificar_diaria(usuario_id)
    return {"feita": feita}


def marcar_diaria_service(usuario_id):
    """Registra a conclusão da questão diária para hoje."""
    marcar_diaria(usuario_id)
    return {"message": "questão diária registrada"}
