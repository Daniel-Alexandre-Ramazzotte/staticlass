"""Rotas exclusivas do painel admin — visualizador de questões, SQL viewer e estatísticas."""
import re
from flask import Blueprint, jsonify, request
from sqlalchemy import inspect, text
from flask_jwt_extended import get_jwt, get_jwt_identity
from statl.utils.auth_middleware import require_role
from .. import db
from ..repositories.questions_repository import _buscar_alternativas_em_lote
from ..services.admin_analytics_service import admin_dashboard_service

bp = Blueprint('admin', __name__, url_prefix='/admin')


# ── Helpers ─────────────────────────────────────────────────────────────────

def _construir_where(chapter_ids, topic_ids, difficulties, sources):
    """Monta cláusula WHERE parametrizada a partir dos filtros recebidos."""
    filtros, params = [], {}

    def _in(coluna, valores, prefixo):
        phs = ", ".join(f":{prefixo}{i}" for i in range(len(valores)))
        params.update({f"{prefixo}{i}": v for i, v in enumerate(valores)})
        filtros.append(f"q.{coluna} IN ({phs})")

    if chapter_ids:  _in("chapter_id", chapter_ids, "cap")
    if topic_ids:    _in("topic_id",   topic_ids,   "top")
    if difficulties: _in("difficulty", difficulties, "dif")
    if sources:      _in("source",     sources,      "src")
    return ("WHERE " + " AND ".join(filtros)) if filtros else "", params


def _questions_have_professor_id() -> bool:
    """Compat: old databases may not have the ownership column yet."""
    columns = inspect(db.engine).get_columns("questions")
    return any(column["name"] == "professor_id" for column in columns)


# ── Visualizador de questões ─────────────────────────────────────────────────

@bp.route('/questoes', methods=['GET'])
@require_role(['admin', 'professor'])
def visualizar_questoes():
    """Lista questões paginadas com filtros opcionais de capítulo, tópico, dificuldade e fonte."""
    chapter_ids  = request.args.getlist('chapter_id', type=int)
    topic_ids    = request.args.getlist('topic_id',   type=int)
    difficulties = request.args.getlist('difficulty', type=int)
    sources      = [s for s in request.args.getlist('source') if s]
    pagina       = max(1, request.args.get('page',     1,  type=int))
    por_pagina   = min(100, request.args.get('per_page', 20, type=int))
    deslocamento = (pagina - 1) * por_pagina

    claims = get_jwt()
    role = claims.get("role")
    usuario_id = int(get_jwt_identity())
    has_professor_id = _questions_have_professor_id()
    professor_id_select = "q.professor_id," if has_professor_id else "NULL AS professor_id,"

    where, params = _construir_where(
        chapter_ids,
        topic_ids,
        difficulties,
        sources,
    )
    params.update({"limite": por_pagina, "deslocamento": deslocamento})

    questoes_raw = db.session.execute(text(f"""
        SELECT
            q.id, q.issue, q.correct_answer, q.solution,
            q.difficulty, q.section, q.source, q.image_q, q.image_s,
            {professor_id_select}
            c.name   AS capitulo,
            c.number AS capitulo_numero,
            t.name   AS topico
        FROM questions q
        LEFT JOIN chapters c ON c.id = q.chapter_id
        LEFT JOIN topics   t ON t.id = q.topic_id
        {where}
        ORDER BY c.number ASC, q.id ASC
        LIMIT :limite OFFSET :deslocamento
    """), params).mappings().all()

    total = db.session.execute(
        text(f"SELECT COUNT(*) FROM questions q {where}"),
        {k: v for k, v in params.items() if k not in ("limite", "deslocamento")},
    ).scalar()

    # Carrega todas as alternativas em uma única query (sem N+1)
    ids_questoes = [q["id"] for q in questoes_raw]
    mapa_alternativas = _buscar_alternativas_em_lote(ids_questoes)

    questoes = [
        {
            "id":              q["id"],
            "enunciado":       q["issue"],
            "resposta_correta": q["correct_answer"],
            "solucao":         q["solution"],
            "dificuldade":     q["difficulty"],
            "secao":           q["section"],
            "source":          q["source"],
            "imagem_q":        q["image_q"],
            "imagem_s":        q["image_s"],
            "capitulo":        q["capitulo"],
            "capitulo_numero": q["capitulo_numero"],
            "topico":          q["topico"],
            "alternativas":    mapa_alternativas.get(q["id"], []),
            "layout":          q["source"] or "apostila",
            "can_manage":      role == "admin" or (
                has_professor_id and q["professor_id"] == usuario_id
            ),
        }
        for q in questoes_raw
    ]

    return jsonify({
        "questoes":  questoes,
        "total":     total,
        "page":      pagina,
        "per_page":  por_pagina,
        "pages":     max(1, (total + por_pagina - 1) // por_pagina),
    }), 200


# ── Estatísticas dos alunos ──────────────────────────────────────────────────

@bp.route('/stats/alunos', methods=['GET'])
@require_role('admin')
def stats_alunos():
    """Retorna todos os alunos com suas estatísticas de quiz agregadas."""
    linhas = db.session.execute(text("""
        SELECT
            u.id,
            u.name,
            u.email,
            COALESCE(u.xp, 0)                                            AS xp,
            COUNT(qr.id)                                                 AS total_quizzes,
            COALESCE(SUM(qr.acertos), 0)                                 AS total_acertos,
            COALESCE(SUM(qr.total), 0)                                   AS total_questoes,
            ROUND(
                COALESCE(SUM(qr.acertos) * 100.0 / NULLIF(SUM(qr.total), 0), 0), 1
            )                                                            AS media_pct
        FROM users u
        LEFT JOIN quiz_resultados qr ON qr.usuario_id = u.id
        WHERE u.role = 'aluno'
        GROUP BY u.id, u.name, u.email, u.xp
        ORDER BY xp DESC
    """)).mappings().all()
    return jsonify([dict(r) for r in linhas]), 200


@bp.route('/stats/aluno/<int:usuario_id>', methods=['GET'])
@require_role('admin')
def stats_aluno_detalhe(usuario_id):
    """Retorna o histórico de quizzes de um aluno específico (últimos 50)."""
    historico = db.session.execute(text("""
        SELECT qr.id, qr.acertos, qr.total, qr.dificuldade, qr.criado_em,
               c.name AS capitulo_nome
        FROM quiz_resultados qr
        LEFT JOIN chapters c ON c.id = qr.capitulo_id
        WHERE qr.usuario_id = :uid
        ORDER BY qr.criado_em DESC
        LIMIT 50
    """), {"uid": usuario_id}).mappings().all()
    return jsonify([dict(r) for r in historico]), 200


@bp.route('/stats/dashboard', methods=['GET'])
@require_role('admin')
def stats_dashboard():
    return admin_dashboard_service()


# ── SQL Viewer (somente leitura) ─────────────────────────────────────────────

_REGEX_SOMENTE_LEITURA = re.compile(
    r'^\s*(SELECT|SHOW|DESCRIBE|EXPLAIN|DESC)\b', re.IGNORECASE
)
_PALAVRAS_PROIBIDAS = re.compile(
    r'\b(INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE|GRANT|REVOKE|EXEC|EXECUTE|CALL)\b'
    r'|--|/\*',
    re.IGNORECASE,
)


@bp.route('/sql', methods=['POST'])
@require_role('admin')
def sql_viewer():
    """Executa query SELECT de leitura e retorna resultados (máx. 500 linhas).

    Restrições de segurança:
    - Apenas SELECT, SHOW, DESCRIBE, EXPLAIN permitidos
    - Palavras-chave de escrita bloqueadas
    - Comentários SQL (-- e /* */) bloqueados
    - Multi-statement (;) bloqueado
    - Execução em transação somente leitura
    """
    dados = request.get_json() or {}
    query = (dados.get('sql') or '').strip()

    if not query:
        return jsonify({"error": "campo 'sql' é obrigatório"}), 400
    if ';' in query:
        return jsonify({"error": "múltiplos statements não são permitidos"}), 403
    if not _REGEX_SOMENTE_LEITURA.match(query):
        return jsonify({"error": "apenas SELECT, SHOW, DESCRIBE e EXPLAIN são permitidos"}), 403
    if _PALAVRAS_PROIBIDAS.search(query):
        return jsonify({"error": "query contém operações ou padrões não permitidos"}), 403

    try:
        with db.engine.connect() as conn:
            conn.execute(text("SET TRANSACTION READ ONLY"))
            resultado = conn.execute(text(query)).mappings().fetchmany(500)

        colunas = list(resultado[0].keys()) if resultado else []
        linhas  = [dict(r) for r in resultado]
        return jsonify({
            "colunas":      colunas,
            "linhas":       linhas,
            "total_linhas": len(linhas),
            "limitado":     len(linhas) == 500,
        }), 200
    except Exception as e:
        return jsonify({"error": f"erro na query: {e}"}), 400
