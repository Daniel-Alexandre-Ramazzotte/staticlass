"""Tests for the Sistema de Turmas backend (plan 06-04)."""
import pytest
from flask_jwt_extended import create_access_token
from sqlalchemy import text

from statl import create_app, db


# ── Fixtures ──────────────────────────────────────────────────────────────────

@pytest.fixture(scope="module")
def app():
    app = create_app(testing=True)
    yield app


@pytest.fixture(scope="module")
def client(app):
    return app.test_client()


# ── Helpers ───────────────────────────────────────────────────────────────────

def _make_token(app, *, role, user_id, email="test@test.com", name="Test"):
    with app.app_context():
        return create_access_token(
            identity=str(user_id),
            additional_claims={"role": role, "email": email, "name": name},
        )


def _auth(token):
    return {"Authorization": f"Bearer {token}"}


def _insert_user(app, *, user_id, email, name, role):
    with app.app_context():
        db.session.execute(
            text("""
                INSERT INTO users (id, email, password_hash, name, role, xp, streak, active)
                VALUES (:id, :email, 'hash', :name, :role, 0, 0, 1)
            """),
            {"id": user_id, "email": email, "name": name, "role": role},
        )
        db.session.commit()


# ── Setup: seed users ─────────────────────────────────────────────────────────

PROF1_ID  = 901
PROF2_ID  = 902
ALUNO1_ID = 903
ALUNO2_ID = 904
ALUNO3_ID = 905


def _seed_users(app):
    _insert_user(app, user_id=PROF1_ID,  email="prof1@t.com",  name="Prof One",   role="professor")
    _insert_user(app, user_id=PROF2_ID,  email="prof2@t.com",  name="Prof Two",   role="professor")
    _insert_user(app, user_id=ALUNO1_ID, email="aluno1@t.com", name="Aluno One",  role="aluno")
    _insert_user(app, user_id=ALUNO2_ID, email="aluno2@t.com", name="Aluno Two",  role="aluno")
    _insert_user(app, user_id=ALUNO3_ID, email="aluno3@t.com", name="Aluno Three", role="aluno")


# ── POST /turmas ───────────────────────────────────────────────────────────────

def test_create_turma_success(app, client):
    _seed_users(app)
    token = _make_token(app, role="professor", user_id=PROF1_ID, email="prof1@t.com", name="Prof One")
    resp = client.post("/turmas", json={"name": "Turma A"}, headers=_auth(token))
    assert resp.status_code == 201
    data = resp.get_json()
    assert data["name"] == "Turma A"
    assert int(data["professor_id"]) == PROF1_ID
    assert "id" in data
    assert "created_at" in data


def test_create_turma_missing_name(app, client):
    token = _make_token(app, role="professor", user_id=PROF1_ID, email="prof1@t.com", name="Prof One")
    resp = client.post("/turmas", json={}, headers=_auth(token))
    assert resp.status_code == 400
    assert "error" in resp.get_json()


def test_create_turma_empty_name(app, client):
    token = _make_token(app, role="professor", user_id=PROF1_ID, email="prof1@t.com", name="Prof One")
    resp = client.post("/turmas", json={"name": "   "}, headers=_auth(token))
    assert resp.status_code == 400


def test_create_turma_no_auth(client):
    resp = client.post("/turmas", json={"name": "Turma B"})
    assert resp.status_code in (401, 403)


def test_create_turma_aluno_forbidden(app, client):
    token = _make_token(app, role="aluno", user_id=ALUNO1_ID, email="aluno1@t.com", name="Aluno One")
    resp = client.post("/turmas", json={"name": "Turma X"}, headers=_auth(token))
    assert resp.status_code == 403


# ── GET /turmas ────────────────────────────────────────────────────────────────

def test_list_turmas_own_only(app, client):
    # Each professor should see their own turmas (check professor_id isolation)
    token1 = _make_token(app, role="professor", user_id=PROF1_ID, email="prof1@t.com", name="Prof One")
    token2 = _make_token(app, role="professor", user_id=PROF2_ID, email="prof2@t.com", name="Prof Two")

    unique1 = "UNIQUE_PROF1_XYZ"
    unique2 = "UNIQUE_PROF2_XYZ"
    client.post("/turmas", json={"name": unique1}, headers=_auth(token1))
    client.post("/turmas", json={"name": unique2}, headers=_auth(token2))

    resp1 = client.get("/turmas", headers=_auth(token1))
    resp2 = client.get("/turmas", headers=_auth(token2))

    assert resp1.status_code == 200
    assert resp2.status_code == 200

    names1 = [t["name"] for t in resp1.get_json()]
    names2 = [t["name"] for t in resp2.get_json()]

    # Prof1 should see their unique turma but NOT prof2's
    assert unique1 in names1
    assert unique2 not in names1

    # Prof2 should see their unique turma but NOT prof1's
    assert unique2 in names2
    assert unique1 not in names2


def test_list_turmas_has_student_count(app, client):
    token = _make_token(app, role="professor", user_id=PROF1_ID, email="prof1@t.com", name="Prof One")
    resp = client.get("/turmas", headers=_auth(token))
    assert resp.status_code == 200
    for turma in resp.get_json():
        assert "student_count" in turma


# ── GET /turmas/<id> ──────────────────────────────────────────────────────────

def test_get_turma_own(app, client):
    token = _make_token(app, role="professor", user_id=PROF1_ID, email="prof1@t.com", name="Prof One")
    create_resp = client.post("/turmas", json={"name": "Turma Detail"}, headers=_auth(token))
    turma_id = create_resp.get_json()["id"]

    resp = client.get(f"/turmas/{turma_id}", headers=_auth(token))
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["name"] == "Turma Detail"
    assert "students" in data
    assert isinstance(data["students"], list)


def test_get_turma_other_professor_forbidden(app, client):
    token1 = _make_token(app, role="professor", user_id=PROF1_ID, email="prof1@t.com", name="Prof One")
    token2 = _make_token(app, role="professor", user_id=PROF2_ID, email="prof2@t.com", name="Prof Two")

    create_resp = client.post("/turmas", json={"name": "Turma Privada"}, headers=_auth(token1))
    turma_id = create_resp.get_json()["id"]

    resp = client.get(f"/turmas/{turma_id}", headers=_auth(token2))
    assert resp.status_code == 403


def test_get_turma_not_found(app, client):
    token = _make_token(app, role="professor", user_id=PROF1_ID, email="prof1@t.com", name="Prof One")
    resp = client.get("/turmas/99999", headers=_auth(token))
    assert resp.status_code == 404


# ── PUT /turmas/<id> ──────────────────────────────────────────────────────────

def test_update_turma_name(app, client):
    token = _make_token(app, role="professor", user_id=PROF1_ID, email="prof1@t.com", name="Prof One")
    create_resp = client.post("/turmas", json={"name": "Old Name"}, headers=_auth(token))
    turma_id = create_resp.get_json()["id"]

    resp = client.put(f"/turmas/{turma_id}", json={"name": "New Name"}, headers=_auth(token))
    assert resp.status_code == 200
    assert resp.get_json()["name"] == "New Name"


def test_update_turma_wrong_professor(app, client):
    token1 = _make_token(app, role="professor", user_id=PROF1_ID, email="prof1@t.com", name="Prof One")
    token2 = _make_token(app, role="professor", user_id=PROF2_ID, email="prof2@t.com", name="Prof Two")

    create_resp = client.post("/turmas", json={"name": "Turma Rename"}, headers=_auth(token1))
    turma_id = create_resp.get_json()["id"]

    resp = client.put(f"/turmas/{turma_id}", json={"name": "Hijacked"}, headers=_auth(token2))
    assert resp.status_code == 403


# ── DELETE /turmas/<id> ───────────────────────────────────────────────────────

def test_delete_turma(app, client):
    token = _make_token(app, role="professor", user_id=PROF1_ID, email="prof1@t.com", name="Prof One")
    create_resp = client.post("/turmas", json={"name": "To Delete"}, headers=_auth(token))
    turma_id = create_resp.get_json()["id"]

    resp = client.delete(f"/turmas/{turma_id}", headers=_auth(token))
    assert resp.status_code == 204

    # Should be gone
    get_resp = client.get(f"/turmas/{turma_id}", headers=_auth(token))
    assert get_resp.status_code == 404


def test_delete_turma_wrong_professor(app, client):
    token1 = _make_token(app, role="professor", user_id=PROF1_ID, email="prof1@t.com", name="Prof One")
    token2 = _make_token(app, role="professor", user_id=PROF2_ID, email="prof2@t.com", name="Prof Two")

    create_resp = client.post("/turmas", json={"name": "Turma Delete Guard"}, headers=_auth(token1))
    turma_id = create_resp.get_json()["id"]

    resp = client.delete(f"/turmas/{turma_id}", headers=_auth(token2))
    assert resp.status_code == 403


# ── POST /turmas/<id>/students ────────────────────────────────────────────────

def test_set_turma_students_success(app, client):
    token = _make_token(app, role="professor", user_id=PROF1_ID, email="prof1@t.com", name="Prof One")
    create_resp = client.post("/turmas", json={"name": "Turma Enroll"}, headers=_auth(token))
    turma_id = create_resp.get_json()["id"]

    resp = client.post(
        f"/turmas/{turma_id}/students",
        json={"student_ids": [ALUNO1_ID, ALUNO2_ID]},
        headers=_auth(token),
    )
    assert resp.status_code == 200
    assert resp.get_json()["enrolled"] == 2


def test_set_turma_students_replaces(app, client):
    """Re-posting with different list replaces existing enrollment."""
    token = _make_token(app, role="professor", user_id=PROF1_ID, email="prof1@t.com", name="Prof One")
    create_resp = client.post("/turmas", json={"name": "Turma Replace"}, headers=_auth(token))
    turma_id = create_resp.get_json()["id"]

    client.post(
        f"/turmas/{turma_id}/students",
        json={"student_ids": [ALUNO1_ID, ALUNO2_ID]},
        headers=_auth(token),
    )
    resp2 = client.post(
        f"/turmas/{turma_id}/students",
        json={"student_ids": [ALUNO3_ID]},
        headers=_auth(token),
    )
    assert resp2.status_code == 200
    assert resp2.get_json()["enrolled"] == 1

    students_resp = client.get(f"/turmas/{turma_id}/students", headers=_auth(token))
    student_ids = [s["id"] for s in students_resp.get_json()]
    assert ALUNO3_ID in student_ids
    assert ALUNO1_ID not in student_ids


def test_set_turma_students_invalid_ids(app, client):
    """Non-aluno IDs (professor IDs) should be rejected."""
    token = _make_token(app, role="professor", user_id=PROF1_ID, email="prof1@t.com", name="Prof One")
    create_resp = client.post("/turmas", json={"name": "Turma Invalid"}, headers=_auth(token))
    turma_id = create_resp.get_json()["id"]

    resp = client.post(
        f"/turmas/{turma_id}/students",
        json={"student_ids": [PROF2_ID]},  # professor, not aluno
        headers=_auth(token),
    )
    assert resp.status_code == 400
    assert "inválidos" in resp.get_json().get("error", "").lower()


def test_set_turma_students_empty_list(app, client):
    """Empty list clears enrollment."""
    token = _make_token(app, role="professor", user_id=PROF1_ID, email="prof1@t.com", name="Prof One")
    create_resp = client.post("/turmas", json={"name": "Turma Clear"}, headers=_auth(token))
    turma_id = create_resp.get_json()["id"]

    client.post(
        f"/turmas/{turma_id}/students",
        json={"student_ids": [ALUNO1_ID]},
        headers=_auth(token),
    )
    resp = client.post(
        f"/turmas/{turma_id}/students",
        json={"student_ids": []},
        headers=_auth(token),
    )
    assert resp.status_code == 200
    assert resp.get_json()["enrolled"] == 0


def test_set_turma_students_wrong_professor(app, client):
    token1 = _make_token(app, role="professor", user_id=PROF1_ID, email="prof1@t.com", name="Prof One")
    token2 = _make_token(app, role="professor", user_id=PROF2_ID, email="prof2@t.com", name="Prof Two")

    create_resp = client.post("/turmas", json={"name": "Turma Guard2"}, headers=_auth(token1))
    turma_id = create_resp.get_json()["id"]

    resp = client.post(
        f"/turmas/{turma_id}/students",
        json={"student_ids": [ALUNO1_ID]},
        headers=_auth(token2),
    )
    assert resp.status_code == 403


# ── GET /turmas/<id>/students ─────────────────────────────────────────────────

def test_get_turma_students(app, client):
    token = _make_token(app, role="professor", user_id=PROF1_ID, email="prof1@t.com", name="Prof One")
    create_resp = client.post("/turmas", json={"name": "Turma Students List"}, headers=_auth(token))
    turma_id = create_resp.get_json()["id"]

    client.post(
        f"/turmas/{turma_id}/students",
        json={"student_ids": [ALUNO1_ID, ALUNO2_ID]},
        headers=_auth(token),
    )
    resp = client.get(f"/turmas/{turma_id}/students", headers=_auth(token))
    assert resp.status_code == 200
    students = resp.get_json()
    assert isinstance(students, list)
    assert len(students) == 2
    for s in students:
        assert "id" in s
        assert "name" in s
        assert "email" in s


# ── Student can be in multiple turmas (D-02) ──────────────────────────────────

def test_student_in_multiple_turmas(app, client):
    token = _make_token(app, role="professor", user_id=PROF1_ID, email="prof1@t.com", name="Prof One")
    r1 = client.post("/turmas", json={"name": "Multi Turma 1"}, headers=_auth(token))
    r2 = client.post("/turmas", json={"name": "Multi Turma 2"}, headers=_auth(token))
    turma1_id = r1.get_json()["id"]
    turma2_id = r2.get_json()["id"]

    resp1 = client.post(
        f"/turmas/{turma1_id}/students",
        json={"student_ids": [ALUNO1_ID]},
        headers=_auth(token),
    )
    resp2 = client.post(
        f"/turmas/{turma2_id}/students",
        json={"student_ids": [ALUNO1_ID]},
        headers=_auth(token),
    )
    assert resp1.status_code == 200
    assert resp2.status_code == 200


# ── App startup ───────────────────────────────────────────────────────────────

def test_app_starts_with_testing(app):
    assert app is not None
