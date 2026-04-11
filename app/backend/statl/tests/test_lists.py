from datetime import datetime, timedelta

from flask_jwt_extended import create_access_token
from sqlalchemy import text

from statl import db


def _make_token(app, *, role, user_id, email, name):
    with app.app_context():
        return create_access_token(
            identity=str(user_id),
            additional_claims={"role": role, "email": email, "name": name},
        )


def _auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


def _insert_user(app, *, user_id, email, name, role, active=True):
    with app.app_context():
        db.session.execute(
            text("""
                INSERT INTO users (
                    id, email, password_hash, name, role, xp, streak, active
                )
                VALUES (
                    :id, :email, :password_hash, :name, :role, 0, 0, :active
                )
            """),
            {
                "id": user_id,
                "email": email,
                "password_hash": "hash",
                "name": name,
                "role": role,
                "active": active,
            },
        )
        db.session.commit()


def _insert_question_graph(app, *, professor_id: int, question_id: int, chapter_id: int, topic_id: int):
    with app.app_context():
        db.session.execute(
            text("""
                INSERT INTO chapters (id, number, name)
                VALUES (:id, :number, :name)
                ON CONFLICT(id) DO NOTHING
            """),
            {"id": chapter_id, "number": chapter_id, "name": f"Capítulo {chapter_id}"},
        )
        db.session.execute(
            text("""
                INSERT INTO topics (id, chapter_id, name)
                VALUES (:id, :chapter_id, :name)
                ON CONFLICT(id) DO NOTHING
            """),
            {"id": topic_id, "chapter_id": chapter_id, "name": f"Tópico {topic_id}"},
        )
        db.session.execute(
            text("""
                INSERT INTO questions (
                    id,
                    issue,
                    correct_answer,
                    solution,
                    source,
                    difficulty,
                    needs_fix,
                    chapter_id,
                    topic_id,
                    professor_id
                )
                VALUES (
                    :id,
                    :issue,
                    'A',
                    :solution,
                    'lista',
                    1,
                    FALSE,
                    :chapter_id,
                    :topic_id,
                    :professor_id
                )
            """),
            {
                "id": question_id,
                "issue": f"Questão {question_id}",
                "solution": f"Solução {question_id}",
                "chapter_id": chapter_id,
                "topic_id": topic_id,
                "professor_id": professor_id,
            },
        )
        db.session.execute(
            text("""
                INSERT INTO alternatives (question_id, letter, text, is_correct)
                VALUES
                    (:question_id, 'A', 'Alternativa A', TRUE),
                    (:question_id, 'B', 'Alternativa B', FALSE)
            """),
            {"question_id": question_id},
        )
        db.session.commit()


def test_professor_can_create_and_publish_list(app, client):
    _insert_user(app, user_id=10, email="prof@example.com", name="Prof", role="professor")
    _insert_user(app, user_id=21, email="aluno@example.com", name="Aluno", role="aluno")
    _insert_question_graph(app, professor_id=10, question_id=101, chapter_id=1, topic_id=11)
    _insert_question_graph(app, professor_id=10, question_id=102, chapter_id=1, topic_id=12)

    professor_token = _make_token(
        app,
        role="professor",
        user_id=10,
        email="prof@example.com",
        name="Prof",
    )
    aluno_token = _make_token(
        app,
        role="aluno",
        user_id=21,
        email="aluno@example.com",
        name="Aluno",
    )

    create_response = client.post(
        "/lists",
        json={
            "title": "Lista 1",
            "deadline": (datetime.utcnow() + timedelta(days=7)).isoformat(),
            "question_ids": [101, 102],
        },
        headers=_auth_headers(professor_token),
    )
    assert create_response.status_code == 201
    payload = create_response.get_json()
    assert payload == {"id": 1, "status": "rascunho", "question_count": 2}

    publish_response = client.post(
        "/lists/1/publish",
        headers=_auth_headers(professor_token),
    )
    assert publish_response.status_code == 200
    assert publish_response.get_json()["status"] == "publicada"

    detail_response = client.get("/lists/1", headers=_auth_headers(professor_token))
    assert detail_response.status_code == 200
    detail = detail_response.get_json()
    assert detail["question_ids"] == [101, 102]
    assert detail["question_count"] == 2
    assert detail["change_log"][0]["action"] == "published"

    assigned_response = client.get("/lists/assigned", headers=_auth_headers(aluno_token))
    assert assigned_response.status_code == 200
    assigned = assigned_response.get_json()
    assert assigned[0]["id"] == 1
    assert assigned[0]["status"] == "publicada"
    assert assigned[0]["student_status"] == "nova"
    assert assigned[0]["can_submit"] is True


def test_assigned_list_with_past_deadline_is_encerrada_and_can_submit(app, client):
    _insert_user(app, user_id=10, email="prof@example.com", name="Prof", role="professor")
    _insert_user(app, user_id=21, email="aluno@example.com", name="Aluno", role="aluno")
    _insert_question_graph(app, professor_id=10, question_id=201, chapter_id=2, topic_id=21)

    professor_token = _make_token(
        app,
        role="professor",
        user_id=10,
        email="prof@example.com",
        name="Prof",
    )
    aluno_token = _make_token(
        app,
        role="aluno",
        user_id=21,
        email="aluno@example.com",
        name="Aluno",
    )

    client.post(
        "/lists",
        json={
            "title": "Lista encerrada",
            "deadline": (datetime.utcnow() - timedelta(days=1)).isoformat(),
            "question_ids": [201],
        },
        headers=_auth_headers(professor_token),
    )
    client.post("/lists/1/publish", headers=_auth_headers(professor_token))

    assigned_response = client.get("/lists/assigned", headers=_auth_headers(aluno_token))
    assert assigned_response.status_code == 200
    assigned = assigned_response.get_json()
    assert assigned[0]["status"] == "encerrada"
    assert assigned[0]["can_submit"] is True


def test_student_can_submit_late_and_professor_results_include_analytics(app, client):
    _insert_user(app, user_id=10, email="prof@example.com", name="Prof", role="professor")
    _insert_user(app, user_id=21, email="ana@example.com", name="Ana", role="aluno")
    _insert_user(app, user_id=22, email="bia@example.com", name="Bia", role="aluno")
    _insert_question_graph(app, professor_id=10, question_id=301, chapter_id=3, topic_id=31)
    _insert_question_graph(app, professor_id=10, question_id=302, chapter_id=3, topic_id=32)

    professor_token = _make_token(
        app,
        role="professor",
        user_id=10,
        email="prof@example.com",
        name="Prof",
    )
    aluno_token = _make_token(
        app,
        role="aluno",
        user_id=21,
        email="ana@example.com",
        name="Ana",
    )

    create_response = client.post(
        "/lists",
        json={
            "title": "Lista atrasada",
            "deadline": (datetime.utcnow() - timedelta(hours=2)).isoformat(),
            "question_ids": [301, 302],
        },
        headers=_auth_headers(professor_token),
    )
    assert create_response.status_code == 201

    publish_response = client.post("/lists/1/publish", headers=_auth_headers(professor_token))
    assert publish_response.status_code == 200

    update_response = client.put(
        "/lists/1",
        json={
            "title": "Lista atrasada revisada",
            "deadline": (datetime.utcnow() - timedelta(hours=2)).isoformat(),
            "question_ids": [301, 302],
        },
        headers=_auth_headers(professor_token),
    )
    assert update_response.status_code == 200

    start_response = client.post("/lists/1/start", headers=_auth_headers(aluno_token))
    assert start_response.status_code == 200

    submit_response = client.post(
        "/lists/1/submit",
        json={
            "responses": [
                {"question_id": 301, "selected_answer": "A", "is_correct": True},
                {"question_id": 302, "selected_answer": "B", "is_correct": False},
            ],
            "correct_count": 1,
            "total_questions": 2,
        },
        headers=_auth_headers(aluno_token),
    )
    assert submit_response.status_code == 200
    submit_payload = submit_response.get_json()
    assert submit_payload["student_status"] == "entregue_fora_do_prazo"
    assert submit_payload["is_late"] is True
    assert submit_payload["score_pct"] == 50.0

    me_response = client.get("/lists/1/me", headers=_auth_headers(aluno_token))
    assert me_response.status_code == 200
    me_payload = me_response.get_json()
    assert me_payload["student_status"] == "entregue_fora_do_prazo"
    assert me_payload["correct_count"] == 1
    assert me_payload["total_questions"] == 2

    results_response = client.get("/lists/1/results", headers=_auth_headers(professor_token))
    assert results_response.status_code == 200
    results = results_response.get_json()
    assert results["summary"]["assigned_students"] == 2
    assert results["summary"]["submitted_students"] == 1
    assert results["summary"]["average_score_pct"] == 50.0
    assert results["summary"]["highest_error_rate_pct"] == 100.0
    assert results["students"][0]["student_status"] in {"entregue_fora_do_prazo", "nova"}
    assert any(item["student_status"] == "entregue_fora_do_prazo" for item in results["students"])
    assert results["per_question"][0]["order_index"] == 1
    assert results["per_question"][1]["error_rate_pct"] == 100.0
    assert results["change_log"][0]["action"] == "updated"
