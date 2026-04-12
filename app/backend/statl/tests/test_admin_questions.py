from flask_jwt_extended import create_access_token
from sqlalchemy import text

from statl import db


def _make_token(app, *, role: str, user_id: str):
    with app.app_context():
        return create_access_token(
            identity=user_id,
            additional_claims={"role": role, "email": "teste@example.com", "name": "Teste"},
        )


def _auth_headers(token: str):
    return {"Authorization": f"Bearer {token}"}


def _insert_question(app, *, question_id: int, issue: str, professor_id: int | None):
    with app.app_context():
        db.session.execute(
            text("""
                INSERT INTO questions (
                    id,
                    issue,
                    correct_answer,
                    solution,
                    source,
                    needs_fix,
                    professor_id
                )
                VALUES (
                    :id,
                    :issue,
                    'A',
                    'Solucao teste',
                    'apostila',
                    FALSE,
                    :professor_id
                )
            """),
            {"id": question_id, "issue": issue, "professor_id": professor_id},
        )
        db.session.execute(
            text("""
                INSERT INTO alternatives (question_id, letter, text, is_correct)
                VALUES
                    (:question_id, 'A', 'Alternativa correta', TRUE),
                    (:question_id, 'B', 'Alternativa errada', FALSE)
            """),
            {"question_id": question_id},
        )
        db.session.commit()


def test_professor_can_browse_shared_bank_but_only_manage_own_questions(app, client):
    _insert_question(app, question_id=101, issue="Questao importada", professor_id=None)
    _insert_question(app, question_id=102, issue="Questao do professor", professor_id=10)

    token = _make_token(app, role="professor", user_id="10")
    response = client.get("/questions/browse", headers=_auth_headers(token))

    assert response.status_code == 200
    payload = response.get_json()
    assert "questoes" in payload
    assert payload["total"] == 2
    assert payload["page"] == 1
    assert payload["per_page"] == 20
    assert payload["pages"] == 1

    por_id = {questao["id"]: questao for questao in payload["questoes"]}
    assert 101 in por_id
    assert 102 in por_id
    assert por_id[101]["can_manage"] is False
    assert por_id[102]["can_manage"] is True
    assert len(por_id[101]["alternativas"]) == 2


def test_shared_bank_still_loads_when_professor_column_is_missing(app, client, monkeypatch):
    from statl.routes import admin as admin_routes

    _insert_question(app, question_id=201, issue="Questao legada", professor_id=None)
    token = _make_token(app, role="professor", user_id="10")

    monkeypatch.setattr(admin_routes, "_questions_have_professor_id", lambda: False)

    response = client.get("/admin/questoes", headers=_auth_headers(token))

    assert response.status_code == 200
    payload = response.get_json()
    assert payload["questoes"][0]["id"] == 201
    assert payload["questoes"][0]["can_manage"] is False


def test_browse_shared_bank_still_loads_when_professor_column_is_missing(app, client, monkeypatch):
    from statl.routes import questions as questions_routes

    _insert_question(app, question_id=202, issue="Questao browse legada", professor_id=None)
    token = _make_token(app, role="professor", user_id="10")

    monkeypatch.setattr(questions_routes, "_questions_have_professor_id", lambda: False)

    response = client.get("/questions/browse", headers=_auth_headers(token))

    assert response.status_code == 200
    payload = response.get_json()
    assert payload["questoes"][0]["id"] == 202
    assert payload["questoes"][0]["can_manage"] is False


def test_admin_sql_still_rejects_professor_access(app, client):
    token = _make_token(app, role="professor", user_id="10")

    response = client.post(
        "/admin/sql",
        json={"sql": "SELECT 1"},
        headers=_auth_headers(token),
    )

    assert response.status_code == 403


def test_admin_dashboard_returns_operational_payload(app, client):
    token = _make_token(app, role="admin", user_id="1")

    response = client.get("/admin/stats/dashboard", headers=_auth_headers(token))

    assert response.status_code == 200
    payload = response.get_json()
    assert payload["kpis"]["active_users_7d"] == 0
    assert payload["kpis"]["total_answers"] == 0
    assert payload["accuracy_by_topic"] == []
    assert payload["role_activity"] == [
        {"role": "aluno", "count_7d": 0},
        {"role": "professor", "count_7d": 0},
    ]
