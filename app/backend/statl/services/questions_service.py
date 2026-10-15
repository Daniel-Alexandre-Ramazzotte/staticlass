import json
import os

from flask import current_app, jsonify
from werkzeug.utils import secure_filename

from ..utils.normalize import normalize_numbering
from ..repositories.questions_repository import (
    adicionar_questao,
    atualizar_questao,
    deletar_questao,
    buscar_capitulos,
    buscar_detalhes_questao,
    buscar_questao_por_id,
    buscar_questoes_aleatorias,
    buscar_questoes_filtradas,
    buscar_questoes_professor,
    buscar_secoes_unicas,
    buscar_todas_questoes,
    buscar_topicos,
    buscar_alternativas_por_questao,
    _buscar_alternativas_em_lote,
    criar_proposta,
    listar_propostas,
    buscar_proposta_por_id,
    atualizar_status_proposta,
)

NUM_QUESTOES_PADRAO = 5
_FONTES_VALIDAS = {"vestibular", "ENEM", "lista", "concurso", "olimpíada", "apostila", "outro"}
_FONTE_PADRAO_PROFESSOR = "lista"


# ── Helpers de normalização ─────────────────────────────────────────────────

def _normalizar_fonte(valor, default=None):
    if valor in (None, "", "null"):
        return default
    v = str(valor).strip()
    # Case-normalize: enem → ENEM (backward compatibility + D-02)
    if v.lower() == "enem":
        v = "ENEM"
    if v not in _FONTES_VALIDAS:
        raise ValueError(
            f"fonte inválida — valores aceitos: {sorted(_FONTES_VALIDAS)}"
        )
    return v


def _normalizar_alternativas(alternativas, resposta_correta, question_type="multiple_choice"):
    if question_type == "open_answer":
        return []

    if not isinstance(alternativas, list):
        raise ValueError("alternativas inválidas")

    if question_type == "true_false":
        if len(alternativas) < 1:
            raise ValueError("questão V/F precisa de pelo menos uma afirmação")
        normalizadas = []
        letras_vistas = set()
        for alt in alternativas:
            if not isinstance(alt, dict):
                raise ValueError("alternativas inválidas")
            letra = (alt.get("letter") or "").strip().upper()
            texto = normalize_numbering((alt.get("text") or "").strip())
            if not letra or not texto:
                raise ValueError("cada afirmação precisa de letra e texto")
            if letra in letras_vistas:
                raise ValueError("letras duplicadas nas afirmações")
            letras_vistas.add(letra)
            is_correct = bool(alt.get("is_correct", False))
            normalizadas.append({"letter": letra, "text": texto, "is_correct": is_correct})
        return normalizadas

    # multiple_choice
    if len(alternativas) < 2:
        raise ValueError("informe pelo menos duas alternativas")
    if len(alternativas) > 5:
        raise ValueError("máximo de 5 alternativas")

    letra_correta = (resposta_correta or "").upper()
    letras_vistas = set()
    normalizadas = []

    for alt in alternativas:
        if not isinstance(alt, dict):
            raise ValueError("alternativas inválidas")
        letra = (alt.get("letter") or "").strip().upper()
        texto = normalize_numbering((alt.get("text") or "").strip())
        if not letra or not texto:
            raise ValueError("cada alternativa precisa de letra e texto")
        if letra in letras_vistas:
            raise ValueError("letras duplicadas nas alternativas")
        letras_vistas.add(letra)
        normalizadas.append({"letter": letra, "text": texto, "is_correct": letra == letra_correta})

    if letra_correta not in letras_vistas:
        raise ValueError("a resposta correta deve estar entre as alternativas")
    return normalizadas


def _para_int_opcional(valor):
    return None if valor in (None, "", "null") else int(valor)


def _para_bool_opcional(valor):
    if isinstance(valor, bool):
        return valor
    if valor in (None, "", "null"):
        return False
    if isinstance(valor, str):
        return valor.strip().lower() in {"1", "true", "t", "yes", "sim"}
    return bool(valor)


_TIPOS_VALIDOS = {"multiple_choice", "true_false", "open_answer"}

_POSICOES_IMAGEM_VALIDAS = {"antes", "depois", "meio"}


def _normalizar_posicao_imagem(valor):
    """Onde a imagem da questão (image_q) aparece em relação ao enunciado.
    'meio' significa que a imagem é referenciada inline no texto via [img:...]
    (MathText) e não deve ser renderizada como bloco separado."""
    if valor in (None, "", "null"):
        return "depois"
    valor = str(valor).strip().lower()
    if valor not in _POSICOES_IMAGEM_VALIDAS:
        raise ValueError(f"image_q_position inválido — valores aceitos: {sorted(_POSICOES_IMAGEM_VALIDAS)}")
    return valor


def _normalizar_payload(dados, professor_id=None):
    if not dados:
        raise ValueError("dados inválidos")

    enunciado = (dados.get("issue") or "").strip()
    if not enunciado:
        raise ValueError("enunciado é obrigatório")

    question_type = (dados.get("question_type") or "multiple_choice").strip()
    if question_type not in _TIPOS_VALIDOS:
        raise ValueError(f"question_type inválido — valores aceitos: {sorted(_TIPOS_VALIDOS)}")

    resposta_correta_raw = (dados.get("correct_answer") or "").strip().upper() or None
    if question_type == "multiple_choice" and not resposta_correta_raw:
        raise ValueError("resposta correta é obrigatória para questões de múltipla escolha")

    alternativas_raw = dados.get("alternatives")
    if isinstance(alternativas_raw, str):
        alternativas_raw = json.loads(alternativas_raw)
    if alternativas_raw is None:
        alternativas_raw = []

    return {
        "issue":          normalize_numbering(enunciado),
        "question_type":  question_type,
        "correct_answer": resposta_correta_raw,
        "solution":       normalize_numbering((dados.get("solution") or "").strip()) or None,
        "image_q":        dados.get("image_q"),
        "image_s":        dados.get("image_s"),
        "image_q_position": _normalizar_posicao_imagem(dados.get("image_q_position")),
        "section":        (dados.get("section") or "").strip() or None,
        "source":         _normalizar_fonte(
            dados.get("source"),
            default=_FONTE_PADRAO_PROFESSOR if professor_id is not None else None
        ),
        "difficulty":     _para_int_opcional(dados.get("difficulty")),
        "needs_fix":      _para_bool_opcional(dados.get("needs_fix")),
        "chapter_id":     _para_int_opcional(dados.get("chapter_id")),
        "topic_id":       _para_int_opcional(dados.get("topic_id")),
        "professor_id":   professor_id,
        "alternatives":   _normalizar_alternativas(alternativas_raw, resposta_correta_raw, question_type),
    }


def _embutir_alternativas(questoes: list[dict]) -> list[dict]:
    """Adiciona 'alternatives' a cada questão com uma única query."""
    mapa = _buscar_alternativas_em_lote([q["id"] for q in questoes])
    for q in questoes:
        q["alternatives"] = mapa.get(q["id"], [])
    return questoes


# ── Serviços públicos ───────────────────────────────────────────────────────

def random_question(num=NUM_QUESTOES_PADRAO):
    questoes = [dict(q) for q in buscar_questoes_aleatorias(num)]
    return jsonify(_embutir_alternativas(questoes))


def check_answer(dados):
    if not dados:
        return jsonify({"error": "dados inválidos"}), 400

    questao_id = dados.get("question_id")
    resposta   = (dados.get("answer") or "").upper()
    if not questao_id or not resposta:
        return jsonify({"error": "question_id e answer são obrigatórios"}), 400

    questao = buscar_questao_por_id(questao_id)
    if not questao:
        return jsonify({"error": "questão não encontrada"}), 404

    if resposta == questao.correct_answer:
        return jsonify({"message": "correct"})
    return jsonify({"message": "incorrect", "correct_answer": questao.correct_answer})


def add_question_service(dados, professor_id=None):
    try:
        payload = _normalizar_payload(dados, professor_id=professor_id)
    except (ValueError, TypeError, json.JSONDecodeError) as e:
        return jsonify({"error": str(e)}), 400
    try:
        novo_id = adicionar_questao(payload)
        return jsonify({"message": "questão adicionada", "id": novo_id}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


def update_question_service(dados):
    if not dados or "id" not in dados:
        return jsonify({"error": "id ausente"}), 400
    try:
        atual = buscar_questao_por_id(int(dados["id"]))
        if not atual:
            return jsonify({"error": "questão não encontrada"}), 404

        atual_qt = getattr(atual, "question_type", None) or "multiple_choice"
        merged = {
            "issue":          dados.get("issue",          atual.issue),
            "question_type":  dados.get("question_type",  atual_qt),
            "correct_answer": dados.get("correct_answer", atual.correct_answer),
            "solution":       dados.get("solution",       atual.solution),
            "image_q":        dados.get("image_q",        atual.image_q),
            "image_s":        dados.get("image_s",        atual.image_s),
            "image_q_position": dados.get("image_q_position", getattr(atual, "image_q_position", None)),
            "section":        dados.get("section",        atual.section),
            "source":         dados.get("source",         atual.source),
            "difficulty":     dados.get("difficulty",     atual.difficulty),
            "needs_fix":      dados.get("needs_fix",      atual.needs_fix),
            "chapter_id":     dados.get("chapter_id",     atual.chapter_id),
            "topic_id":       dados.get("topic_id",       atual.topic_id),
            "professor_id":   dados.get("professor_id",   atual.professor_id),
            "alternatives":   dados.get("alternatives")
                              or [dict(a) for a in buscar_alternativas_por_questao(int(dados["id"]))],
        }
        payload = _normalizar_payload(merged, professor_id=merged["professor_id"])
        payload["id"] = int(dados["id"])
        atualizar_questao(payload)
        return jsonify({"message": "questão atualizada"})
    except (ValueError, TypeError, json.JSONDecodeError) as e:
        return jsonify({"error": str(e)}), 400


def process_upload(arquivo):
    if not arquivo or arquivo.filename == "":
        return None
    nome = secure_filename(arquivo.filename)
    caminho = os.path.join(current_app.config["UPLOAD_FOLDER"], nome)
    try:
        arquivo.save(caminho)
        return nome
    except Exception as e:
        current_app.logger.error(f"Erro ao salvar imagem: {e}")
        return None


def get_images():
    return os.listdir(current_app.config["UPLOAD_FOLDER"])


def get_professor_questions_service(professor_id):
    return buscar_questoes_professor(professor_id)


def get_all_questions_service():
    return buscar_todas_questoes()


def get_question_detail_service(questao_id: int):
    questao = buscar_detalhes_questao(questao_id)
    if not questao:
        return None
    payload = dict(questao)
    payload["question_type"] = payload.get("question_type") or "multiple_choice"
    payload["alternatives"] = buscar_alternativas_por_questao(questao_id)
    return payload


def delete_question_service(questao_id: int):
    try:
        deletar_questao(questao_id)
        return jsonify({"message": "questão removida"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


def random_question_filtered(num, chapter_id=None, topic_id=None, difficulty=None, source=None):
    questoes = [dict(q) for q in buscar_questoes_filtradas(
        num, chapter_id=chapter_id, topic_id=topic_id,
        difficulty=difficulty, source=source,
    )]
    return _embutir_alternativas(questoes)


def get_chapters_service():
    return [dict(c) for c in buscar_capitulos()]


def get_topics_service(chapter_id=None):
    return [dict(t) for t in buscar_topicos(chapter_id)]


def upload_image_service(arquivo):
    if not arquivo or arquivo.filename == "":
        return jsonify({"error": "nenhum arquivo enviado"}), 400
    nome = process_upload(arquivo)
    if not nome:
        return jsonify({"error": "falha ao salvar imagem"}), 500
    return jsonify({"filename": nome}), 201


def get_sections_service(professor_id=None, role: str = "professor"):
    return buscar_secoes_unicas(professor_id=professor_id, role=role)


def criar_proposta_service(question_id: int, proposer_id: int, dados: dict):
    questao = buscar_questao_por_id(question_id)
    if not questao:
        return jsonify({"error": "questão não encontrada"}), 404
    changes = dados.get("changes")
    if not changes or not isinstance(changes, dict):
        return jsonify({"error": "changes é obrigatório"}), 400
    reason = dados.get("reason")
    try:
        proposal_id = criar_proposta(question_id, proposer_id, changes, reason)
        return jsonify({"message": "proposta criada", "id": proposal_id}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


def listar_propostas_service(status: str = None) -> list[dict]:
    return listar_propostas(status)


def buscar_proposta_service(proposal_id: int) -> dict | None:
    return buscar_proposta_por_id(proposal_id)


def revisar_proposta_service(proposal_id: int, reviewer_id: int, action: str, admin_note: str = None):
    proposta = buscar_proposta_por_id(proposal_id)
    if not proposta:
        return jsonify({"error": "proposta não encontrada"}), 404
    if proposta["status"] != "pending":
        return jsonify({"error": "proposta já foi avaliada"}), 409
    status_map = {
        "approve": "approved",
        "approve_modified": "approved_modified",
        "reject": "rejected",
    }
    if action not in status_map:
        return jsonify({"error": "ação inválida — use approve, approve_modified ou reject"}), 400
    if action == "approve":
        changes = dict(proposta["changes"])
        changes["id"] = proposta["question_id"]
        update_result = update_question_service(changes)
        if isinstance(update_result, tuple) and len(update_result) == 2 and update_result[1] >= 400:
            return update_result
    try:
        atualizar_status_proposta(proposal_id, status_map[action], reviewer_id, admin_note)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    return jsonify({"message": "proposta avaliada"}), 200
