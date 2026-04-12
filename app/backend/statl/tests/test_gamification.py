from datetime import date, timedelta

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


def _answers_for_session(total, correct_count):
    return [
        {
            "question_id": 1000 + idx,
            "selected_answer": chr(65 + idx),
            "is_correct": idx < correct_count,
        }
        for idx in range(total)
    ]


def _insert_user(
    app,
    *,
    user_id,
    email,
    name,
    role="aluno",
    xp=0,
    streak=0,
    last_practice_date=None,
    active=True,
):
    with app.app_context():
        db.session.execute(
            text("""
                INSERT INTO users (
                    id,
                    email,
                    password_hash,
                    name,
                    role,
                    xp,
                    streak,
                    last_practice_date,
                    active
                )
                VALUES (
                    :id,
                    :email,
                    :password_hash,
                    :name,
                    :role,
                    :xp,
                    :streak,
                    :last_practice_date,
                    :active
                )
            """),
            {
                "id": user_id,
                "email": email,
                "password_hash": "hash",
                "name": name,
                "role": role,
                "xp": xp,
                "streak": streak,
                "last_practice_date": last_practice_date,
                "active": active,
            },
        )
        db.session.commit()


def test_record_session_requires_auth(client):
    response = client.post("/gamification/record-session", json={"acertos": 2, "total": 5})
    assert response.status_code == 401


def test_record_session_applies_bonus_multiplier_and_updates_streak(app, client):
    ontem = date.today() - timedelta(days=1)
    _insert_user(
        app,
        user_id=1,
        email="ana@example.com",
        name="Ana",
        xp=100,
        streak=6,
        last_practice_date=ontem,
    )
    token = _make_token(app, user_id="1", email="ana@example.com", name="Ana")

    response = client.post(
        "/gamification/record-session",
        json={
            "acertos": 3,
            "total": 5,
            "capitulo_id": 2,
            "dificuldade": 1,
            "answers": _answers_for_session(5, 3),
        },
        headers=_auth_headers(token),
    )

    assert response.status_code == 201
    data = response.get_json()
    assert data["xp_ganho"] == 75
    assert data["streak"] == 7
    assert data["multiplier"] == 1.5

    with app.app_context():
        user = db.session.execute(
            text("SELECT xp, streak, last_practice_date FROM users WHERE id = 1")
        ).mappings().fetchone()
        assert user["xp"] == 175
        assert user["streak"] == 7
        assert str(user["last_practice_date"])[:10] == date.today().isoformat()

        quiz_count = db.session.execute(
            text("SELECT COUNT(*) FROM quiz_resultados WHERE usuario_id = 1")
        ).scalar()
        assert quiz_count == 1
        answer_count = db.session.execute(
            text("SELECT COUNT(*) FROM answer_history WHERE source = 'free_practice'")
        ).scalar()
        assert answer_count == 5


def test_record_session_same_day_keeps_streak(app, client):
    hoje = date.today()
    _insert_user(
        app,
        user_id=2,
        email="bia@example.com",
        name="Bia",
        xp=40,
        streak=3,
        last_practice_date=hoje,
    )
    token = _make_token(app, user_id="2", email="bia@example.com", name="Bia")

    response = client.post(
        "/gamification/record-session",
        json={
            "acertos": 2,
            "total": 4,
            "answers": _answers_for_session(4, 2),
        },
        headers=_auth_headers(token),
    )

    assert response.status_code == 201
    data = response.get_json()
    assert data["streak"] == 3
    assert data["multiplier"] == 1.25
    assert data["xp_ganho"] == 50


def test_record_session_rejects_invalid_answers_payload(app, client):
    _insert_user(
        app,
        user_id=3,
        email="carla@example.com",
        name="Carla",
        xp=0,
        streak=0,
    )
    token = _make_token(app, user_id="3", email="carla@example.com", name="Carla")

    for payload in (
        {"acertos": 1, "total": 2},
        {
            "acertos": 1,
            "total": 2,
            "answers": [{"question_id": 1, "selected_answer": "A", "is_correct": True}],
        },
    ):
        response = client.post(
            "/gamification/record-session",
            json=payload,
            headers=_auth_headers(token),
        )
        assert response.status_code == 400

    with app.app_context():
        quiz_count = db.session.execute(
            text("SELECT COUNT(*) FROM quiz_resultados WHERE usuario_id = 3")
        ).scalar()
        answer_count = db.session.execute(
            text("SELECT COUNT(*) FROM answer_history WHERE student_id = 3")
        ).scalar()
        assert quiz_count == 0
        assert answer_count == 0


def test_ranking_returns_pagination_and_own_entry(app, client):
    for idx in range(1, 23):
        _insert_user(
            app,
            user_id=idx,
            email=f"aluno{idx}@example.com",
            name=f"Aluno {idx:02d}",
            xp=230 - (idx * 10),
            streak=idx % 4,
        )

    _insert_user(
        app,
        user_id=100,
        email="inativo@example.com",
        name="Inativo",
        xp=9999,
        active=False,
    )
    _insert_user(
        app,
        user_id=101,
        email="prof@example.com",
        name="Professor",
        role="professor",
        xp=5000,
    )

    token = _make_token(
        app,
        user_id="22",
        email="aluno22@example.com",
        name="Aluno 22",
    )

    response = client.get(
        "/gamification/ranking?page=1",
        headers=_auth_headers(token),
    )

    assert response.status_code == 200
    data = response.get_json()
    assert len(data["ranking"]) == 20
    assert data["page"] == 1
    assert data["page_size"] == 20
    assert data["has_more"] is True
    assert data["ranking"][0]["nome"] == "Aluno 01"
    assert data["ranking"][0]["xp"] == 220
    assert all(item["id"] != 100 for item in data["ranking"])
    assert data["own_entry"] == {
        "posicao": 22,
        "id": 22,
        "nome": "Aluno 22",
        "xp": 10,
    }


def test_profile_returns_xp_streak_and_last_practice_date(app, client):
    hoje = date.today()
    _insert_user(
        app,
        user_id=7,
        email="perfil@example.com",
        name="Perfil",
        xp=345,
        streak=4,
        last_practice_date=hoje,
    )
    token = _make_token(
        app,
        user_id="7",
        email="perfil@example.com",
        name="Perfil",
    )

    response = client.get(
        "/users/profile/perfil@example.com",
        headers=_auth_headers(token),
    )

    assert response.status_code == 200
    data = response.get_json()
    assert data["xp"] == 345
    assert data["streak"] == 4
    assert data["last_practice_date"] == hoje.isoformat()
