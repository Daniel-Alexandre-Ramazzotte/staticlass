from datetime import date, datetime

import pytest
from flask_jwt_extended import create_access_token
from sqlalchemy import text

from statl import db


def _make_token(app, role="aluno", user_id="1", email="aluno@example.com", name="Aluno"):
    with app.app_context():
        return create_access_token(
            identity=str(user_id),
            additional_claims={"role": role, "email": email, "name": name},
        )


def _auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


def _insert_user(app, *, user_id, email, name, role="aluno"):
    with app.app_context():
        db.session.execute(
            text("""
                INSERT INTO users (id, email, password_hash, name, role, xp, streak, active)
                VALUES (:id, :email, :password_hash, :name, :role, 0, 0, 1)
            """),
            {"id": user_id, "email": email, "password_hash": "hash", "name": name, "role": role},
        )
        db.session.commit()


def _insert_question(app, question_id=1):
    with app.app_context():
        db.session.execute(
            text("""
                INSERT OR IGNORE INTO questions (id, issue, correct_answer, source)
                VALUES (:id, 'Q', 'A', 'propet')
            """),
            {"id": question_id},
        )
        db.session.commit()


def _insert_answer_history(app, *, student_id, question_id, answered_at):
    """Insert an answer_history row for the given student on the given datetime."""
    with app.app_context():
        db.session.execute(
            text("""
                INSERT INTO answer_history
                    (student_id, question_id, answered_at, is_correct, source, source_id)
                VALUES
                    (:student_id, :question_id, :answered_at, 1, 'free_practice', :source_id)
            """),
            {
                "student_id": student_id,
                "question_id": question_id,
                "answered_at": answered_at,
                "source_id": question_id,
            },
        )
        db.session.commit()


# ── Auth ────────────────────────────────────────────────────────────────────

def test_calendar_requires_auth(client):
    today = date.today()
    response = client.get(f"/users/analytics/calendar?year={today.year}&month={today.month}")
    assert response.status_code == 401


# ── Missing / invalid params ─────────────────────────────────────────────────

def test_calendar_missing_year(app, client):
    _insert_user(app, user_id=1, email="a@example.com", name="A")
    token = _make_token(app, user_id="1", email="a@example.com")
    resp = client.get("/users/analytics/calendar?month=4", headers=_auth_headers(token))
    assert resp.status_code == 400
    assert "year e month são obrigatórios" in resp.get_json()["error"]


def test_calendar_missing_month(app, client):
    _insert_user(app, user_id=1, email="a@example.com", name="A")
    token = _make_token(app, user_id="1", email="a@example.com")
    today = date.today()
    resp = client.get(f"/users/analytics/calendar?year={today.year}", headers=_auth_headers(token))
    assert resp.status_code == 400
    assert "year e month são obrigatórios" in resp.get_json()["error"]


def test_calendar_wrong_year(app, client):
    _insert_user(app, user_id=1, email="a@example.com", name="A")
    token = _make_token(app, user_id="1", email="a@example.com")
    wrong_year = date.today().year - 1
    resp = client.get(
        f"/users/analytics/calendar?year={wrong_year}&month=4",
        headers=_auth_headers(token),
    )
    assert resp.status_code == 400
    assert "ano atual" in resp.get_json()["error"]


def test_calendar_invalid_month_zero(app, client):
    _insert_user(app, user_id=1, email="a@example.com", name="A")
    token = _make_token(app, user_id="1", email="a@example.com")
    resp = client.get(
        f"/users/analytics/calendar?year={date.today().year}&month=0",
        headers=_auth_headers(token),
    )
    assert resp.status_code == 400
    assert "Mês inválido" in resp.get_json()["error"]


def test_calendar_invalid_month_thirteen(app, client):
    _insert_user(app, user_id=1, email="a@example.com", name="A")
    token = _make_token(app, user_id="1", email="a@example.com")
    resp = client.get(
        f"/users/analytics/calendar?year={date.today().year}&month=13",
        headers=_auth_headers(token),
    )
    assert resp.status_code == 400
    assert "Mês inválido" in resp.get_json()["error"]


# ── Happy path ───────────────────────────────────────────────────────────────

def test_calendar_returns_practiced_days(app, client):
    today = date.today()
    _insert_user(app, user_id=1, email="a@example.com", name="A")
    _insert_question(app, question_id=1)
    _insert_question(app, question_id=2)
    # Insert two distinct days in current month
    _insert_answer_history(
        app,
        student_id=1,
        question_id=1,
        answered_at=datetime(today.year, today.month, 1, 10, 0, 0),
    )
    _insert_answer_history(
        app,
        student_id=1,
        question_id=2,
        answered_at=datetime(today.year, today.month, 3, 10, 0, 0),
    )

    token = _make_token(app, user_id="1", email="a@example.com")
    resp = client.get(
        f"/users/analytics/calendar?year={today.year}&month={today.month}",
        headers=_auth_headers(token),
    )
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["year"] == today.year
    assert data["month"] == today.month
    assert 1 in data["practiced_days"]
    assert 3 in data["practiced_days"]


def test_calendar_future_month_returns_empty(app, client):
    today = date.today()
    # Only test this if we're not in December (to avoid year rollover issue)
    if today.month == 12:
        pytest.skip("Skipping: current month is December, no future month in year")
    future_month = today.month + 1
    _insert_user(app, user_id=1, email="a@example.com", name="A")
    token = _make_token(app, user_id="1", email="a@example.com")
    resp = client.get(
        f"/users/analytics/calendar?year={today.year}&month={future_month}",
        headers=_auth_headers(token),
    )
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["practiced_days"] == []


def test_calendar_only_returns_own_data(app, client):
    today = date.today()
    _insert_user(app, user_id=1, email="a@example.com", name="A")
    _insert_user(app, user_id=2, email="b@example.com", name="B")
    _insert_question(app, question_id=1)
    # Insert data for user 2 only
    _insert_answer_history(
        app,
        student_id=2,
        question_id=1,
        answered_at=datetime(today.year, today.month, 5, 10, 0, 0),
    )

    token = _make_token(app, user_id="1", email="a@example.com")
    resp = client.get(
        f"/users/analytics/calendar?year={today.year}&month={today.month}",
        headers=_auth_headers(token),
    )
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["practiced_days"] == []


def test_calendar_deduplicates_same_day_multiple_answers(app, client):
    today = date.today()
    _insert_user(app, user_id=1, email="a@example.com", name="A")
    _insert_question(app, question_id=1)
    _insert_question(app, question_id=2)
    # Two answers on the same day
    _insert_answer_history(
        app,
        student_id=1,
        question_id=1,
        answered_at=datetime(today.year, today.month, 7, 9, 0, 0),
    )
    _insert_answer_history(
        app,
        student_id=1,
        question_id=2,
        answered_at=datetime(today.year, today.month, 7, 11, 0, 0),
    )

    token = _make_token(app, user_id="1", email="a@example.com")
    resp = client.get(
        f"/users/analytics/calendar?year={today.year}&month={today.month}",
        headers=_auth_headers(token),
    )
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["practiced_days"].count(7) == 1
