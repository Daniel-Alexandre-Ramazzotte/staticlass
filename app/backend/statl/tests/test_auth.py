import pytest
from sqlalchemy import text
from statl import db


def _register(client, email="test@example.com", password="senha123", name="Teste"):
    return client.post("/auth/register", json={
        "email": email,
        "password": password,
        "confirm_password": password,
        "name": name,
    })


def _login(client, email="test@example.com", password="senha123"):
    return client.post("/auth/login", json={"email": email, "password": password})


def _verify_user(app, email):
    with app.app_context():
        db.session.execute(
            text("UPDATE users SET email_verified = TRUE WHERE email = :email"),
            {"email": email},
        )
        db.session.commit()


def _deactivate_user(app, email):
    with app.app_context():
        db.session.execute(
            text("UPDATE users SET active = FALSE WHERE email = :email"),
            {"email": email},
        )
        db.session.commit()


# ── Active user tests ───────────────────────────────────────────────────────

def test_active_user_can_login(app, client):
    _register(client)
    _verify_user(app, "test@example.com")
    response = _login(client)
    assert response.status_code == 200
    data = response.get_json()
    assert "access_token" in data


def test_unverified_user_cannot_login(client):
    _register(client, email="unverified@example.com")
    response = _login(client, email="unverified@example.com")
    assert response.status_code == 403
    data = response.get_json()
    assert "email" in data["error"].lower()


def test_wrong_password_still_400(app, client):
    _register(client)
    _verify_user(app, "test@example.com")
    response = _login(client, password="senhaerrada")
    assert response.status_code == 400


# ── Inactive user tests ──────────────────────────────────────────────────────

def test_inactive_user_cannot_login(app, client):
    email = "inactive@example.com"
    _register(client, email=email)
    _verify_user(app, email)
    _deactivate_user(app, email)
    response = _login(client, email=email)
    assert response.status_code == 403


def test_inactive_user_error_message(app, client):
    email = "inactive2@example.com"
    _register(client, email=email)
    _verify_user(app, email)
    _deactivate_user(app, email)
    response = _login(client, email=email)
    data = response.get_json()
    assert "error" in data
    error_msg = data["error"].lower()
    assert "desativada" in error_msg or "administrador" in error_msg
