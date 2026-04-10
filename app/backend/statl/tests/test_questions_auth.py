"""
Regression tests for QA-04: Question endpoints must require authentication.

Verifies:
- /questions/filtered, /rand/<n>, /chapters, /topics, /check all return 401 without token
- /questions/filtered returns 200 with a valid JWT for any role
- correct_answer is not exposed to unauthenticated callers
"""
import json
import pytest
from flask_jwt_extended import create_access_token
from statl import db
from sqlalchemy import text


# ── Helpers ─────────────────────────────────────────────────────────────────

def _make_token(app, role="aluno", user_id="1"):
    """Create a test JWT inside the app context."""
    with app.app_context():
        return create_access_token(
            identity=user_id,
            additional_claims={"role": role, "email": "test@example.com", "name": "Teste"},
        )


def _auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


# ── Unauthenticated access tests (all must return 401) ─────────────────────

def test_filtered_requires_auth(client):
    """GET /questions/filtered without token returns 401."""
    response = client.get("/questions/filtered")
    assert response.status_code == 401
    data = response.get_json()
    assert "error" in data


def test_rand_requires_auth(client):
    """GET /questions/rand/5 without token returns 401."""
    response = client.get("/questions/rand/5")
    assert response.status_code == 401
    data = response.get_json()
    assert "error" in data


def test_chapters_requires_auth(client):
    """GET /questions/chapters without token returns 401."""
    response = client.get("/questions/chapters")
    assert response.status_code == 401
    data = response.get_json()
    assert "error" in data


def test_topics_requires_auth(client):
    """GET /questions/topics without token returns 401."""
    response = client.get("/questions/topics")
    assert response.status_code == 401
    data = response.get_json()
    assert "error" in data


def test_check_requires_auth(client):
    """POST /questions/check without token returns 401."""
    response = client.post(
        "/questions/check",
        data=json.dumps({"question_id": 1, "answer": "A"}),
        content_type="application/json",
    )
    assert response.status_code == 401
    data = response.get_json()
    assert "error" in data


# ── Authenticated access tests (must return 200, not 401/403) ──────────────

def test_filtered_works_with_aluno_token(app, client):
    """GET /questions/filtered with valid aluno JWT returns 200 (not 401/403)."""
    token = _make_token(app, role="aluno")
    response = client.get("/questions/filtered", headers=_auth_headers(token))
    # 200 is success; 404/empty is also acceptable (no questions in test DB)
    # What must NOT happen: 401 or 403
    assert response.status_code not in (401, 403)


def test_chapters_works_with_professor_token(app, client):
    """GET /questions/chapters with valid professor JWT returns 200 or empty list."""
    token = _make_token(app, role="professor")
    response = client.get("/questions/chapters", headers=_auth_headers(token))
    assert response.status_code not in (401, 403)


def test_topics_works_with_admin_token(app, client):
    """GET /questions/topics with valid admin JWT returns 200 or empty list."""
    token = _make_token(app, role="admin")
    response = client.get("/questions/topics", headers=_auth_headers(token))
    assert response.status_code not in (401, 403)


# ── Correct answer not exposed without auth ─────────────────────────────────

def test_filtered_response_not_returned_without_auth(client):
    """Unauthenticated /questions/filtered does not leak correct_answer in body."""
    response = client.get("/questions/filtered")
    assert response.status_code == 401
    # Body must be an error object, not a list of questions
    data = response.get_json()
    # If it's a list, questions leaked — fail loudly
    assert not isinstance(data, list), "Question data leaked to unauthenticated caller"
    # correct_answer must not appear anywhere in the response body
    assert "correct_answer" not in response.get_data(as_text=True)
