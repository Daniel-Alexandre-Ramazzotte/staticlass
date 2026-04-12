"""
Tests for email verification deep link flow:
- POST /auth/verify-email-token (JSON endpoint)
- POST /auth/resend-verification
- send_verification_email uses staticlass:// deep link scheme
"""

import pytest
from unittest.mock import patch, MagicMock
from sqlalchemy import text
from statl import db


# ── Helpers ──────────────────────────────────────────────────────────────────

def _register(client, email="verify@example.com", password="senha123", name="Verificar"):
    return client.post("/auth/register", json={
        "email": email,
        "password": password,
        "confirm_password": password,
        "name": name,
    })


def _get_user(app, email):
    with app.app_context():
        result = db.session.execute(
            text("SELECT * FROM users WHERE email = :email"),
            {"email": email},
        )
        return result.fetchone()


def _mark_verified(app, email):
    with app.app_context():
        db.session.execute(
            text("UPDATE users SET email_verified = TRUE WHERE email = :email"),
            {"email": email},
        )
        db.session.commit()


# ── POST /auth/verify-email-token ────────────────────────────────────────────

class TestVerifyEmailTokenEndpoint:

    def test_valid_token_returns_200(self, app, client):
        """Valid token verifies email and returns 200 with success message."""
        with patch("statl.services.email_service.mail"):
            _register(client, email="tokenvalid@example.com")

        # Generate a real token for the registered user
        user = _get_user(app, "tokenvalid@example.com")
        with app.app_context():
            from statl.security.tokens import generate_verification_token
            token = generate_verification_token(user.id)

        response = client.post("/auth/verify-email-token", json={"token": token})
        assert response.status_code == 200
        data = response.get_json()
        assert "message" in data
        assert "verificado" in data["message"].lower()

    def test_invalid_token_returns_400(self, app, client):
        """Invalid token returns 400 with error message."""
        response = client.post("/auth/verify-email-token", json={"token": "invalid-garbage-token"})
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data
        assert "inválido" in data["error"].lower() or "expirado" in data["error"].lower()

    def test_missing_token_field_returns_400(self, app, client):
        """Missing token field returns 400 with descriptive error."""
        response = client.post("/auth/verify-email-token", json={})
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data
        assert "obrigatório" in data["error"].lower() or "token" in data["error"].lower()

    def test_empty_token_returns_400(self, app, client):
        """Empty string token returns 400."""
        response = client.post("/auth/verify-email-token", json={"token": ""})
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data

    def test_valid_token_marks_email_verified(self, app, client):
        """After successful verification, user's email_verified is TRUE."""
        with patch("statl.services.email_service.mail"):
            _register(client, email="markverified@example.com")

        user = _get_user(app, "markverified@example.com")
        assert not user.email_verified

        with app.app_context():
            from statl.security.tokens import generate_verification_token
            token = generate_verification_token(user.id)

        client.post("/auth/verify-email-token", json={"token": token})

        user_after = _get_user(app, "markverified@example.com")
        assert user_after.email_verified


# ── POST /auth/resend-verification ───────────────────────────────────────────

class TestResendVerificationEndpoint:

    def test_unverified_user_gets_200(self, app, client):
        """Resend for unverified user returns 200."""
        with patch("statl.services.email_service.mail"):
            _register(client, email="resend@example.com")

        response = client.post("/auth/resend-verification", json={"email": "resend@example.com"})
        assert response.status_code == 200
        data = response.get_json()
        assert "message" in data

    def test_already_verified_user_returns_200_no_email_sent(self, app, client):
        """Resend for already-verified user returns 200 but does not send email (no enumeration)."""
        with patch("statl.services.email_service.mail"):
            _register(client, email="alreadyverified@example.com")
        _mark_verified(app, "alreadyverified@example.com")

        with patch("statl.services.email_service.mail") as mock_mail:
            mock_mail.send = MagicMock()
            response = client.post(
                "/auth/resend-verification",
                json={"email": "alreadyverified@example.com"},
            )
            # Should not send email
            mock_mail.send.assert_not_called()

        assert response.status_code == 200

    def test_unknown_email_returns_200(self, app, client):
        """Resend for unknown email returns 200 to avoid enumeration."""
        response = client.post(
            "/auth/resend-verification",
            json={"email": "nobody@nowhere.com"},
        )
        assert response.status_code == 200
        data = response.get_json()
        assert "message" in data

    def test_missing_email_returns_200(self, app, client):
        """Missing email field still returns 200 (no error revelation)."""
        response = client.post("/auth/resend-verification", json={})
        assert response.status_code == 200

    def test_resend_sends_email_to_unverified_user(self, app, client):
        """Resend sends a new email when user exists and is not verified."""
        with patch("statl.services.email_service.mail"):
            _register(client, email="resend2@example.com")

        with patch("statl.services.auth_service.send_verification_email") as mock_send:
            client.post("/auth/resend-verification", json={"email": "resend2@example.com"})
            mock_send.assert_called_once()


# ── send_verification_email uses staticlass:// ───────────────────────────────

class TestEmailServiceDeepLink:

    def test_send_verification_email_uses_deep_link_scheme(self, app):
        """send_verification_email constructs URL as staticlass://verify-email?token=..."""
        sent_messages = []

        class MockMail:
            def send(self, msg):
                sent_messages.append(msg)

        with app.app_context():
            from statl.services.email_service import send_verification_email
            import statl.services.email_service as email_mod
            original_mail = email_mod.mail
            email_mod.mail = MockMail()
            try:
                send_verification_email(to="test@example.com", token="testtoken123")
            finally:
                email_mod.mail = original_mail

        assert len(sent_messages) == 1
        msg = sent_messages[0]
        assert "staticlass://verify-email?token=testtoken123" in msg.body
        # Must NOT use http URL for verification
        assert "http" not in msg.body or "staticlass://" in msg.body

    def test_send_verification_email_does_not_use_base_url(self, app):
        """send_verification_email no longer references APP_BASE_URL."""
        import statl.services.email_service as email_mod
        import inspect
        source = inspect.getsource(email_mod.send_verification_email)
        assert "base_url" not in source
        assert "staticlass://" in source
