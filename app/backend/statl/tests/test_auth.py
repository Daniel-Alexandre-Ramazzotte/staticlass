import json
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


def test_unverified_user_error_message(client):
    _register(client, email="unverified2@example.com")
    response = _login(client, email="unverified2@example.com")
    data = response.get_json()
    assert "error" in data
    assert "verificado" in data["error"].lower() or "verifique" in data["error"].lower()


def test_admin_created_user_is_verified_by_default(app, client):
    """Contas criadas por admin/professor usam o server_default (email_verified=TRUE)
    e por isso não são bloqueadas pelo gate de verificação — só o autocadastro
    público (`criar_usuario`) começa não-verificado."""
    with app.app_context():
        from statl.repositories.user_repository import criar_usuario_com_papel
        from werkzeug.security import generate_password_hash
        criar_usuario_com_papel(
            "admin.criado@example.com", generate_password_hash("senha123"), "Criado por Admin", "aluno",
        )
    response = _login(client, email="admin.criado@example.com", password="senha123")
    assert response.status_code == 200


def test_login_jwt_has_email_verified_true_after_verify(app, client):
    email = "verified@example.com"
    _register(client, email=email)
    _verify_user(app, email)
    response = _login(client, email=email)
    assert response.status_code == 200
    token = response.get_json()["access_token"]
    payload_b64 = token.split(".")[1]
    payload_b64 += "=" * (-len(payload_b64) % 4)
    import base64
    payload = json.loads(base64.b64decode(payload_b64))
    assert payload.get("email_verified") is True


def test_verify_otp_success(app, client):
    email = "otp@example.com"
    _register(client, email=email)
    with app.app_context():
        row = db.session.execute(
            text("SELECT otp_code FROM users WHERE email = :e"), {"e": email}
        ).fetchone()
        code = row[0]
    response = client.post("/auth/verify-code", json={"email": email, "code": code})
    assert response.status_code == 200
    assert "verificado" in response.get_json()["message"].lower()


def test_verify_otp_invalid_code(client):
    email = "otp2@example.com"
    _register(client, email=email)
    response = client.post("/auth/verify-code", json={"email": email, "code": "000000"})
    assert response.status_code == 400
    assert "inválido" in response.get_json()["error"].lower()


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
