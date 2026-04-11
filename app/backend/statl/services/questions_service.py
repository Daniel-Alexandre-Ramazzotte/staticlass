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
    buscar_todas_questoes,
    buscar_topicos,
    buscar_alternativas_por_questao,
    _buscar_alternativas_em_lote,
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


def _normalizar_alternativas(alternativas, resposta_correta):
    if not isinstance(alternativas, list) or len(alternativas) < 2:
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


def _normalizar_payload(dados, professor_id=None):
    if not dados:
        raise ValueError("dados inválidos")

    enunciado       = (dados.get("issue") or "").strip()
    resposta_correta = (dados.get("correct_answer") or "").strip().upper()
    if not enunciado or not resposta_correta:
        raise ValueError("enunciado e resposta correta são obrigatórios")

    alternativas_raw = dados.get("alternatives")
    if isinstance(alternativas_raw, str):
        alternativas_raw = json.loads(alternativas_raw)

    return {
        "issue":          normalize_numbering(enunciado),
        "correct_answer": resposta_correta,
        "solution":       normalize_numbering((dados.get("solution") or "").strip()) or None,
        "image_q":        dados.get("image_q"),
        "image_s":        dados.get("image_s"),
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
        "alternatives":   _normalizar_alternativas(alternativas_raw, resposta_correta),
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

        # Mescla valores enviados com os atuais (sem sobrescrever com None)
        merged = {
            "issue":          dados.get("issue",          atual.issue),
            "correct_answer": dados.get("correct_answer", atual.correct_answer),
            "solution":       dados.get("solution",       atual.solution),
            "image_q":        dados.get("image_q",        atual.image_q),
            "image_s":        dados.get("image_s",        atual.image_s),
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
