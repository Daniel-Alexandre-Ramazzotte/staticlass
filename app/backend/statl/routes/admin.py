"""
Rotas exclusivas para o painel admin.
Inclui: visualizador de questões filtrado e SQL viewer read-only.
"""
import re
from flask import Blueprint, jsonify, request
from sqlalchemy import text
from statl.utils.auth_middleware import require_role
from .. import db

bp = Blueprint('admin', __name__, url_prefix='/admin')

# ─── Visualizador de Questões ────────────────────────────────────────────────

@bp.route('/questoes', methods=['GET'])
@require_role('admin')
def visualizar_questoes():
    """Retorna questões com suporte a filtros de layout e conteúdo.

    Query params:
        layout      — 'enem' | 'vestibular' | 'avulsa' (padrão: 'avulsa')
        chapter_id  — filtra por capítulo
        topic_id    — filtra por tópico
        difficulty  — 1, 2 ou 3
        page        — número da página (padrão: 1)
        per_page    — itens por página (padrão: 20, máx: 100)
    """
    layout     = request.args.get('layout', 'avulsa')
    chapter_id = request.args.get('chapter_id', type=int)
    topic_id   = request.args.get('topic_id', type=int)
    difficulty = request.args.get('difficulty', type=int)
    page       = max(1, request.args.get('page', 1, type=int))
    per_page   = min(100, request.args.get('per_page', 20, type=int))
    offset     = (page - 1) * per_page

    # Monta cláusula WHERE dinamicamente
    filtros = []
    params: dict = {}

    if chapter_id:
        filtros.append("q.chapter_id = :chapter_id")
        params["chapter_id"] = chapter_id
    if topic_id:
        filtros.append("q.topic_id = :topic_id")
        params["topic_id"] = topic_id
    if difficulty:
        filtros.append("q.difficulty = :difficulty")
        params["difficulty"] = difficulty

    where = ("WHERE " + " AND ".join(filtros)) if filtros else ""
    params["limit"]  = per_page
    params["offset"] = offset

    sql = text(f"""
        SELECT
            q.id,
            q.issue,
            q.correct_answer,
            q.solution,
            q.difficulty,
            q.section,
            q.image_q,
            q.image_s,
            c.name  AS capitulo,
            c.number AS capitulo_numero,
            t.name  AS topico
        FROM questions q
        LEFT JOIN chapters c ON c.id = q.chapter_id
        LEFT JOIN topics   t ON t.id = q.topic_id
        {where}
        ORDER BY c.number ASC, q.id ASC
        LIMIT :limit OFFSET :offset
    """)

    linhas = db.session.execute(sql, params).mappings().all()

    # Total sem paginação (para o frontend saber quantas páginas tem)
    sql_count = text(f"SELECT COUNT(*) AS total FROM questions q {where}")
    total = db.session.execute(sql_count, {k: v for k, v in params.items() if k not in ('limit', 'offset')}).scalar()

    questoes = []
    for q in linhas:
        # Busca alternativas
        alts = db.session.execute(
            text("SELECT letter, text, is_correct FROM alternatives WHERE question_id = :qid ORDER BY letter"),
            {"qid": q["id"]},
        ).mappings().all()

        questoes.append({
            "id":               q["id"],
            "enunciado":        q["issue"],
            "resposta_correta": q["correct_answer"],
            "solucao":          q["solution"],
            "dificuldade":      q["difficulty"],
            "secao":            q["section"],
            "imagem_q":         q["image_q"],
            "imagem_s":         q["image_s"],
            "capitulo":         q["capitulo"],
            "capitulo_numero":  q["capitulo_numero"],
            "topico":           q["topico"],
            "alternativas":     [dict(a) for a in alts],
            "layout":           layout,
        })

    return jsonify({
        "questoes":  questoes,
        "total":     total,
        "page":      page,
        "per_page":  per_page,
        "pages":     (total + per_page - 1) // per_page,
    }), 200


# ─── SQL Viewer (somente leitura) ────────────────────────────────────────────

# Apenas essas palavras-chave são permitidas no início do SQL
_REGEX_SELECT = re.compile(r'^\s*(SELECT|SHOW|DESCRIBE|EXPLAIN|DESC)\b', re.IGNORECASE)
# Palavras proibidas em qualquer parte da query
_PALAVRAS_PROIBIDAS = re.compile(
    r'\b(INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE|GRANT|REVOKE|EXEC|EXECUTE|CALL)\b',
    re.IGNORECASE,
)

@bp.route('/sql', methods=['POST'])
@require_role('admin')
def sql_viewer():
    """Executa uma query SQL de leitura e retorna os resultados.

    Corpo esperado (JSON):
        sql (str) — query SELECT/SHOW/DESCRIBE

    Restrições de segurança:
        - A query deve começar com SELECT, SHOW, DESCRIBE ou EXPLAIN
        - Palavras-chave de escrita (INSERT, UPDATE, DELETE, DROP...) são bloqueadas
        - Máximo de 500 linhas por execução
    """
    dados = request.get_json() or {}
    query = (dados.get('sql') or '').strip()

    if not query:
        return jsonify({"error": "campo 'sql' é obrigatório"}), 400

    # Validação: deve começar com SELECT/SHOW/DESCRIBE/EXPLAIN
    if not _REGEX_SELECT.match(query):
        return jsonify({"error": "apenas queries SELECT, SHOW, DESCRIBE e EXPLAIN são permitidas"}), 403

    # Validação: não pode conter palavras proibidas
    if _PALAVRAS_PROIBIDAS.search(query):
        return jsonify({"error": "query contém operações de escrita — não permitido"}), 403

    try:
        resultado = db.session.execute(text(query)).mappings().fetchmany(500)
        colunas   = list(resultado[0].keys()) if resultado else []
        linhas    = [dict(r) for r in resultado]

        return jsonify({
            "colunas":      colunas,
            "linhas":       linhas,
            "total_linhas": len(linhas),
            "limitado":     len(linhas) == 500,
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"erro na query: {str(e)}"}), 400
