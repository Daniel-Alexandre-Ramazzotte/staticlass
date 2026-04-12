from datetime import date, datetime, time
from decimal import Decimal

from .. import db
from ..repositories.lists_repository import (
    add_change_log,
    create_list,
    get_list_question_ids,
    get_list_results,
    get_professor_list_row,
    get_published_list_row,
    get_student_list_summary,
    list_assigned_lists,
    list_change_log,
    list_professor_lists,
    list_professor_question_ids,
    mark_list_started,
    publish_list,
    record_list_submission,
    replace_list_questions,
    update_list_metadata,
)
from ..repositories.answer_history_repository import replace_list_answer_history_rows
from ..repositories.questions_repository import buscar_questoes_por_ids_ordenados


def _serialize_datetime(value):
    if value is None:
        return None
    if isinstance(value, str):
        return _coerce_datetime(value).isoformat()
    if isinstance(value, date) and not isinstance(value, datetime):
        return value.isoformat()
    return value.isoformat()


def _serialize_number(value):
    if value is None:
        return None
    if isinstance(value, Decimal):
        return float(value)
    return float(value)


def _agora() -> datetime:
    return datetime.utcnow()


def _coerce_datetime(value) -> datetime:
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        normalizado = value.replace("Z", "+00:00").replace(" ", "T")
        parsed = datetime.fromisoformat(normalizado)
        if parsed.tzinfo is not None:
            parsed = parsed.astimezone().replace(tzinfo=None)
        return parsed
    if isinstance(value, date):
        return datetime.combine(value, time.min)
    raise TypeError(f"valor de data/hora inválido: {value!r}")


def _parse_deadline(value) -> datetime:
    if value in (None, ""):
        raise ValueError("deadline é obrigatório")
    raw = str(value).strip()
    if not raw:
        raise ValueError("deadline é obrigatório")
    if "T" not in raw and len(raw) == 10:
        return datetime.combine(date.fromisoformat(raw), time(23, 59, 59))
    normalizado = raw.replace("Z", "+00:00")
    parsed = datetime.fromisoformat(normalizado)
    if parsed.tzinfo is not None:
        parsed = parsed.astimezone().replace(tzinfo=None)
    return parsed


def _list_status(published, deadline) -> str:
    deadline_dt = _coerce_datetime(deadline) if deadline is not None else None
    if not published:
        return "rascunho"
    if deadline_dt and deadline_dt < _agora():
        return "encerrada"
    return "publicada"


def _student_status(row) -> str:
    submitted_at = row.get("submitted_at")
    started_at = row.get("started_at")
    if submitted_at:
        return "entregue_fora_do_prazo" if bool(row.get("is_late")) else "entregue"
    if started_at:
        return "em_andamento"
    return "nova"


def _normalize_question_ids(question_ids, professor_id: int) -> list[int]:
    if question_ids is None:
        return []
    if not isinstance(question_ids, list):
        raise ValueError("question_ids deve ser uma lista")

    normalizados: list[int] = []
    vistos: set[int] = set()
    for raw in question_ids:
        try:
            question_id = int(raw)
        except (TypeError, ValueError) as exc:
            raise ValueError("question_ids deve conter apenas números") from exc
        if question_id in vistos:
            raise ValueError("question_ids duplicados não são permitidos")
        vistos.add(question_id)
        normalizados.append(question_id)

    validos = set(list_professor_question_ids(professor_id, normalizados))
    if len(validos) != len(normalizados):
        raise ValueError("question_ids inválidos para este professor")
    return normalizados


def _serialize_change_log(entries: list[dict]) -> list[dict]:
    return [
        {
            "id": int(entry["id"]),
            "action": entry["action"],
            "summary": entry["summary"],
            "created_at": _serialize_datetime(entry["created_at"]),
        }
        for entry in entries
    ]


def _serialize_professor_detail(row, question_ids: list[int], change_log_entries: list[dict]) -> dict:
    return {
        "id": int(row["id"]),
        "title": row["title"],
        "deadline": _serialize_datetime(row["deadline"]),
        "status": _list_status(row["published"], row["deadline"]),
        "question_ids": question_ids,
        "question_count": int(row["question_count"] or len(question_ids)),
        "turma_id": row["turma_id"] if row.get("turma_id") is not None else None,
        "change_log": _serialize_change_log(change_log_entries),
    }


def _serialize_professor_list(row) -> dict:
    return {
        "id": int(row["id"]),
        "title": row["title"],
        "deadline": _serialize_datetime(row["deadline"]),
        "status": _list_status(row["published"], row["deadline"]),
        "question_count": int(row["question_count"] or 0),
        "assigned_students": int(row["assigned_students"] or 0),
        "submitted_students": int(row["submitted_students"] or 0),
        "average_score_pct": _serialize_number(row["average_score_pct"] or 0),
        "highest_error_rate_pct": _serialize_number(row["highest_error_rate_pct"] or 0),
    }


def _serialize_assigned_list(row) -> dict:
    return {
        "id": int(row["id"]),
        "title": row["title"],
        "deadline": _serialize_datetime(row["deadline"]),
        "status": _list_status(row["published"], row["deadline"]),
        "student_status": _student_status(row),
        "question_count": int(row["question_count"] or 0),
        "submitted_at": _serialize_datetime(row["submitted_at"]),
        "score_pct": _serialize_number(row["score_pct"]) if row["score_pct"] is not None else None,
        "can_submit": bool(row["published"]),
    }


def _load_professor_list_or_404(professor_id: int, list_id: int):
    row = get_professor_list_row(list_id, professor_id)
    if not row:
        return None, ({"error": "lista não encontrada"}, 404)
    return row, None


def _load_published_list_or_404(list_id: int):
    row = get_published_list_row(list_id)
    if not row:
        return None, ({"error": "lista não encontrada"}, 404)
    return row, None


def create_list_service(professor_id, dados):
    try:
        professor_id_int = int(professor_id)
        title = (dados.get("title") or "").strip()
        if not title:
            raise ValueError("title é obrigatório")
        deadline = _parse_deadline(dados.get("deadline"))
        question_ids = _normalize_question_ids(dados.get("question_ids") or [], professor_id_int)
        list_id = create_list(professor_id_int, title, deadline)
        replace_list_questions(list_id, question_ids)
        add_change_log(
            list_id,
            professor_id_int,
            "created",
            f"Lista criada com {len(question_ids)} questão(ões).",
        )
        db.session.commit()
        return {
            "id": int(list_id),
            "status": "rascunho",
            "question_count": len(question_ids),
        }, 201
    except ValueError as exc:
        db.session.rollback()
        return {"error": str(exc)}, 400
    except Exception as exc:
        db.session.rollback()
        return {"error": f"erro ao criar lista: {exc}"}, 500


def professor_lists_service(professor_id):
    try:
        professor_id_int = int(professor_id)
        rows = list_professor_lists(professor_id_int)
        return [_serialize_professor_list(row) for row in rows], 200
    except Exception as exc:
        return {"error": f"erro ao listar listas: {exc}"}, 500


def professor_list_detail_service(professor_id, list_id):
    try:
        professor_id_int = int(professor_id)
        list_id_int = int(list_id)
        row, erro = _load_professor_list_or_404(professor_id_int, list_id_int)
        if erro:
            return erro
        question_ids = get_list_question_ids(list_id_int)
        return _serialize_professor_detail(row, question_ids, list_change_log(list_id_int)), 200
    except Exception as exc:
        return {"error": f"erro ao carregar lista: {exc}"}, 500


def update_list_service(professor_id, list_id, dados):
    try:
        professor_id_int = int(professor_id)
        list_id_int = int(list_id)
        atual, erro = _load_professor_list_or_404(professor_id_int, list_id_int)
        if erro:
            return erro

        current_question_ids = get_list_question_ids(list_id_int)
        title = (dados.get("title") if "title" in dados else atual["title"]) or ""
        title = title.strip()
        if not title:
            raise ValueError("title é obrigatório")
        deadline = _parse_deadline(dados.get("deadline") if "deadline" in dados else atual["deadline"])
        question_ids = _normalize_question_ids(
            dados.get("question_ids") if "question_ids" in dados else current_question_ids,
            professor_id_int,
        )

        turma_id_raw = dados.get("turma_id", "UNSET")
        update_turma = turma_id_raw != "UNSET"
        turma_id = int(turma_id_raw) if turma_id_raw not in ("UNSET", None) else None

        mudancas: list[str] = []
        if title != atual["title"]:
            mudancas.append(f'título alterado para "{title}"')
        if deadline != atual["deadline"]:
            mudancas.append("prazo atualizado")
        if question_ids != current_question_ids:
            mudancas.append(f"questões atualizadas ({len(question_ids)} itens)")
        if update_turma and turma_id != atual.get("turma_id"):
            mudancas.append("turma atualizada")

        update_list_metadata(list_id_int, professor_id_int, title, deadline, turma_id=turma_id, update_turma=update_turma)
        replace_list_questions(list_id_int, question_ids)
        if mudancas:
            add_change_log(
                list_id_int,
                professor_id_int,
                "updated",
                "; ".join(mudancas),
            )
        db.session.commit()

        atualizado = get_professor_list_row(list_id_int, professor_id_int)
        return _serialize_professor_detail(
            atualizado,
            question_ids,
            list_change_log(list_id_int),
        ), 200
    except ValueError as exc:
        db.session.rollback()
        return {"error": str(exc)}, 400
    except Exception as exc:
        db.session.rollback()
        return {"error": f"erro ao atualizar lista: {exc}"}, 500


def publish_list_service(professor_id, list_id):
    try:
        professor_id_int = int(professor_id)
        list_id_int = int(list_id)
        row, erro = _load_professor_list_or_404(professor_id_int, list_id_int)
        if erro:
            return erro

        if int(row["question_count"] or 0) < 1:
            return {"error": "adicione ao menos uma questão antes de publicar"}, 400

        publish_list(list_id_int, professor_id_int)
        add_change_log(list_id_int, professor_id_int, "published", "Lista publicada.")
        db.session.commit()

        publicado = get_professor_list_row(list_id_int, professor_id_int)
        return {
            "id": int(publicado["id"]),
            "status": _list_status(publicado["published"], publicado["deadline"]),
            "question_count": int(publicado["question_count"] or 0),
        }, 200
    except Exception as exc:
        db.session.rollback()
        return {"error": f"erro ao publicar lista: {exc}"}, 500


def assigned_lists_service(student_id):
    try:
        student_id_int = int(student_id)
        rows = list_assigned_lists(student_id_int)
        return [_serialize_assigned_list(row) for row in rows], 200
    except Exception as exc:
        return {"error": f"erro ao carregar listas atribuídas: {exc}"}, 500


def list_questions_service(student_id, list_id):
    try:
        int(student_id)
        list_id_int = int(list_id)
        row, erro = _load_published_list_or_404(list_id_int)
        if erro:
            return erro
        question_ids = get_list_question_ids(list_id_int)
        return buscar_questoes_por_ids_ordenados(question_ids), 200
    except Exception as exc:
        return {"error": f"erro ao carregar questões da lista: {exc}"}, 500


def start_list_service(student_id, list_id):
    try:
        student_id_int = int(student_id)
        list_id_int = int(list_id)
        _, erro = _load_published_list_or_404(list_id_int)
        if erro:
            return erro
        mark_list_started(list_id_int, student_id_int)
        db.session.commit()
        return {"message": "lista iniciada"}, 200
    except Exception as exc:
        db.session.rollback()
        return {"error": f"erro ao iniciar lista: {exc}"}, 500


def submit_list_service(student_id, list_id, dados):
    try:
        student_id_int = int(student_id)
        list_id_int = int(list_id)
        lista, erro = _load_published_list_or_404(list_id_int)
        if erro:
            return erro

        responses = dados.get("responses")
        if not isinstance(responses, list):
            raise ValueError("responses deve ser uma lista")

        try:
            correct_count = int(dados.get("correct_count"))
            total_questions = int(dados.get("total_questions"))
        except (TypeError, ValueError) as exc:
            raise ValueError("correct_count e total_questions são obrigatórios") from exc

        question_ids = get_list_question_ids(list_id_int)
        if total_questions != len(question_ids):
            raise ValueError("total_questions não confere com a lista")

        normalizadas = []
        vistos: set[int] = set()
        for response in responses:
            if not isinstance(response, dict):
                raise ValueError("cada resposta deve ser um objeto")
            question_id = int(response.get("question_id"))
            if question_id in vistos:
                raise ValueError("question_id duplicado em responses")
            vistos.add(question_id)
            normalizadas.append(
                {
                    "question_id": question_id,
                    "selected_answer": (
                        str(response.get("selected_answer")).strip().upper()
                        if response.get("selected_answer") not in (None, "")
                        else None
                    ),
                    "is_correct": bool(response.get("is_correct")),
                }
            )

        if set(question_ids) != {response["question_id"] for response in normalizadas}:
            raise ValueError("responses deve cobrir exatamente as questões da lista")
        if correct_count < 0 or correct_count > total_questions:
            raise ValueError("correct_count inválido")

        score_pct = round((correct_count * 100.0) / total_questions, 2) if total_questions else 0.0
        deadline = _coerce_datetime(lista["deadline"]) if lista["deadline"] is not None else None
        is_late = bool(deadline and _agora() > deadline)
        submission = record_list_submission(
            list_id_int,
            student_id_int,
            correct_count,
            total_questions,
            score_pct,
            is_late,
            normalizadas,
        )
        replace_list_answer_history_rows(
            student_id_int,
            int(submission["id"]),
            list_id_int,
            _coerce_datetime(submission["submitted_at"]),
            normalizadas,
        )
        db.session.commit()
        return {
            "student_status": "entregue_fora_do_prazo" if is_late else "entregue",
            "submitted_at": _serialize_datetime(submission["submitted_at"]),
            "score_pct": _serialize_number(submission["score_pct"]),
            "is_late": bool(submission["is_late"]),
        }, 200
    except ValueError as exc:
        db.session.rollback()
        return {"error": str(exc)}, 400
    except Exception as exc:
        db.session.rollback()
        return {"error": f"erro ao enviar lista: {exc}"}, 500


def student_list_summary_service(student_id, list_id):
    try:
        student_id_int = int(student_id)
        list_id_int = int(list_id)
        row = get_student_list_summary(list_id_int, student_id_int)
        if not row or not row["submitted_at"]:
            return {"error": "resultado da lista não encontrado"}, 404
        return {
            "id": int(row["id"]),
            "title": row["title"],
            "deadline": _serialize_datetime(row["deadline"]),
            "submitted_at": _serialize_datetime(row["submitted_at"]),
            "score_pct": _serialize_number(row["score_pct"] or 0),
            "student_status": _student_status(row),
            "is_late": bool(row["is_late"]),
            "correct_count": int(row["correct_count"] or 0),
            "total_questions": int(row["total_questions"] or 0),
        }, 200
    except Exception as exc:
        return {"error": f"erro ao carregar resultado da lista: {exc}"}, 500


def list_results_service(professor_id, list_id):
    try:
        professor_id_int = int(professor_id)
        list_id_int = int(list_id)
        resultado = get_list_results(list_id_int, professor_id_int)
        if not resultado:
            return {"error": "lista não encontrada"}, 404

        students = []
        for row in resultado["students"]:
            students.append(
                {
                    "student_id": int(row["student_id"]),
                    "student_name": row["student_name"],
                    "student_status": _student_status(row),
                    "submitted_at": _serialize_datetime(row["submitted_at"]),
                    "score_pct": _serialize_number(row["score_pct"]) if row["score_pct"] is not None else None,
                }
            )

        risk_students = []
        for row in resultado["risk_students"]:
            risk_students.append(
                {
                    "student_id": int(row["student_id"]),
                    "student_name": row["student_name"],
                    "student_status": _student_status(row),
                    "submitted_at": _serialize_datetime(row["submitted_at"]),
                    "score_pct": _serialize_number(row["score_pct"]) if row["score_pct"] is not None else None,
                    "risk_band": row["risk_band"],
                }
            )

        per_question = [
            {
                "question_id": int(row["question_id"]),
                "order_index": int(row["order_index"]),
                "error_rate_pct": _serialize_number(row["error_rate_pct"] or 0),
                "response_count": int(row["response_count"] or 0),
            }
            for row in resultado["per_question"]
        ]

        return {
            "summary": {
                "assigned_students": int(resultado["summary"]["assigned_students"]),
                "submitted_students": int(resultado["summary"]["submitted_students"]),
                "average_score_pct": _serialize_number(resultado["summary"]["average_score_pct"] or 0),
                "highest_error_rate_pct": float(resultado["summary"]["highest_error_rate_pct"] or 0),
                "late_students": int(resultado["summary"]["late_students"]),
                "at_risk_students": int(resultado["summary"]["at_risk_students"]),
            },
            "risk_students": risk_students,
            "score_distribution": [
                {
                    "bucket": row["bucket"],
                    "count": int(row["count"]),
                }
                for row in resultado["score_distribution"]
            ],
            "students": students,
            "per_question": per_question,
            "change_log": _serialize_change_log(resultado["change_log"]),
        }, 200
    except Exception as exc:
        return {"error": f"erro ao carregar resultados da lista: {exc}"}, 500
