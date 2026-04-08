from .. import db
from sqlalchemy import text
from collections import defaultdict

_TABELA = "questions"

_CAMPOS_ATUALIZAVEIS = {
    "issue", "correct_answer", "solution", "image_q", "image_s",
    "section", "source", "difficulty", "needs_fix", "chapter_id", "topic_id",
}


# ── Alternativas ────────────────────────────────────────────────────────────

def _buscar_alternativas_em_lote(ids_questoes: list[int]) -> dict[int, list[dict]]:
    """Retorna {question_id: [alternativas]} em uma única query."""
    if not ids_questoes:
        return {}
    placeholders = ", ".join(f":qid{i}" for i in range(len(ids_questoes)))
    params = {f"qid{i}": qid for i, qid in enumerate(ids_questoes)}
    linhas = db.session.execute(
        text(f"""
            SELECT question_id, letter, text, is_correct
            FROM alternatives
            WHERE question_id IN ({placeholders})
            ORDER BY question_id, letter
        """),
        params,
    ).mappings().all()
    resultado = defaultdict(list)
    for alt in linhas:
        resultado[alt["question_id"]].append(dict(alt))
    return resultado


def buscar_alternativas_por_questao(questao_id: int) -> list[dict]:
    return _buscar_alternativas_em_lote([questao_id]).get(questao_id, [])


# ── Criação ─────────────────────────────────────────────────────────────────

def adicionar_questao(dados: dict) -> int:
    params = {
        "issue":        dados.get("issue"),
        "correct_answer": dados.get("correct_answer"),
        "solution":     dados.get("solution"),
        "image_q":      dados.get("image_q"),
        "image_s":      dados.get("image_s"),
        "section":      dados.get("section"),
        "source":       dados.get("source"),
        "difficulty":   dados.get("difficulty"),
        "needs_fix":    bool(dados.get("needs_fix", False)),
        "chapter_id":   dados.get("chapter_id"),
        "topic_id":     dados.get("topic_id"),
        "professor_id": dados.get("professor_id"),
    }
    alternativas = dados.get("alternatives", [])
    try:
        novo_id = db.session.execute(
            text("""
                INSERT INTO questions
                    (issue, correct_answer, solution, image_q, image_s,
                     section, source, difficulty, needs_fix,
                     chapter_id, topic_id, professor_id)
                VALUES
                    (:issue, :correct_answer, :solution, :image_q, :image_s,
                     :section, :source, :difficulty, :needs_fix,
                     :chapter_id, :topic_id, :professor_id)
                RETURNING id
            """),
            params,
        ).scalar()
        if alternativas:
            db.session.execute(
                text("""
                    INSERT INTO alternatives (question_id, letter, text, is_correct)
                    VALUES (:qid, :letter, :text, :correta)
                """),
                [
                    {"qid": novo_id, "letter": a["letter"],
                     "text": a["text"], "correta": bool(a["is_correct"])}
                    for a in alternativas
                ],
            )
        db.session.commit()
        return novo_id
    except Exception:
        db.session.rollback()
        raise


# ── Atualização ─────────────────────────────────────────────────────────────

def atualizar_questao(dados: dict):
    questao_id = dados["id"]
    campos = {k: v for k, v in dados.items() if k in _CAMPOS_ATUALIZAVEIS}
    alternativas = dados.get("alternatives")

    if not campos and alternativas is None:
        raise ValueError("nenhum campo válido para atualizar")
    try:
        if campos:
            campos["id"] = questao_id
            atribuicoes = ", ".join(f"{k} = :{k}" for k in campos if k != "id")
            db.session.execute(
                text(f"UPDATE {_TABELA} SET {atribuicoes} WHERE id = :id"),
                campos,
            )
        if alternativas is not None:
            db.session.execute(
                text("DELETE FROM alternatives WHERE question_id = :qid"),
                {"qid": questao_id},
            )
            if alternativas:
                db.session.execute(
                    text("""
                        INSERT INTO alternatives (question_id, letter, text, is_correct)
                        VALUES (:qid, :letter, :text, :correta)
                    """),
                    [
                        {"qid": questao_id, "letter": a["letter"],
                         "text": a["text"], "correta": bool(a["is_correct"])}
                        for a in alternativas
                    ],
                )
        db.session.commit()
    except Exception:
        db.session.rollback()
        raise


# ── Exclusão ────────────────────────────────────────────────────────────────

def deletar_questao(questao_id: int):
    try:
        db.session.execute(
            text(f"DELETE FROM {_TABELA} WHERE id = :id"),
            {"id": questao_id},
        )
        db.session.commit()
    except Exception:
        db.session.rollback()
        raise


# ── Consultas ───────────────────────────────────────────────────────────────

def buscar_questoes_aleatorias(quantidade: int) -> list[dict]:
    return db.session.execute(
        text("SELECT * FROM questions ORDER BY RANDOM() LIMIT :n"),
        {"n": quantidade},
    ).mappings().all()


def buscar_questao_por_id(questao_id: int):
    return db.session.execute(
        text("SELECT * FROM questions WHERE id = :id"),
        {"id": questao_id},
    ).fetchone()


def buscar_questoes_professor(professor_id) -> list[dict]:
    return db.session.execute(
        text("SELECT * FROM questions WHERE professor_id = :pid ORDER BY id DESC"),
        {"pid": professor_id},
    ).mappings().all()


def buscar_todas_questoes(limite: int = 1000) -> list[dict]:
    return db.session.execute(
        text(f"SELECT * FROM questions LIMIT :limite"),
        {"limite": limite},
    ).mappings().all()


def buscar_detalhes_questao(questao_id: int):
    return db.session.execute(
        text("""
            SELECT
                q.*,
                c.name   AS chapter_name,
                c.number AS chapter_number,
                t.name   AS topic_name
            FROM questions q
            LEFT JOIN chapters c ON c.id = q.chapter_id
            LEFT JOIN topics   t ON t.id = q.topic_id
            WHERE q.id = :id
        """),
        {"id": questao_id},
    ).mappings().fetchone()


def buscar_questoes_filtradas(
    quantidade: int,
    chapter_id=None,
    topic_id=None,
    difficulty=None,
    source=None,
) -> list[dict]:
    condicoes = ["EXISTS (SELECT 1 FROM alternatives a WHERE a.question_id = q.id)"]
    params: dict = {"n": quantidade}

    def _adicionar_in(coluna: str, valor, prefixo: str):
        valores = valor if isinstance(valor, list) else [valor]
        placeholders = ", ".join(f":{prefixo}{i}" for i in range(len(valores)))
        params.update({f"{prefixo}{i}": v for i, v in enumerate(valores)})
        condicoes.append(f"{coluna} IN ({placeholders})")

    if chapter_id is not None:
        _adicionar_in("chapter_id", chapter_id, "cap")
    if topic_id is not None:
        _adicionar_in("topic_id", topic_id, "top")
    if difficulty is not None:
        _adicionar_in("difficulty", difficulty, "dif")
    if source is not None:
        _adicionar_in("source", source, "src")

    where = "WHERE " + " AND ".join(condicoes)
    return db.session.execute(
        text(f"""
            SELECT
                q.*,
                c.name   AS chapter_name,
                c.number AS chapter_number,
                t.name   AS topic_name
            FROM questions q
            LEFT JOIN chapters c ON c.id = q.chapter_id
            LEFT JOIN topics   t ON t.id = q.topic_id
            {where}
            ORDER BY RANDOM()
            LIMIT :n
        """),
        params,
    ).mappings().all()


def buscar_capitulos() -> list[dict]:
    return db.session.execute(
        text("SELECT * FROM chapters ORDER BY number"),
    ).mappings().all()


def buscar_topicos(chapter_id=None) -> list[dict]:
    if chapter_id:
        return db.session.execute(
            text("SELECT * FROM topics WHERE chapter_id = :cid ORDER BY id"),
            {"cid": chapter_id},
        ).mappings().all()
    return db.session.execute(
        text("SELECT * FROM topics ORDER BY chapter_id, id"),
    ).mappings().all()


# ── Aliases para compatibilidade com código existente ──────────────────────
add_question_to_db          = adicionar_questao
update_question             = atualizar_questao
delete_question             = deletar_questao
get_random_question         = buscar_questoes_aleatorias
get_question_by_id          = buscar_questao_por_id
get_professor_questions     = buscar_questoes_professor
get_all_questions           = buscar_todas_questoes
get_question_details        = buscar_detalhes_questao
get_random_question_filtered = buscar_questoes_filtradas
get_all_chapters            = buscar_capitulos
get_topics_by_chapter       = buscar_topicos
get_alternatives_by_question = buscar_alternativas_por_questao
