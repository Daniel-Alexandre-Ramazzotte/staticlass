import re
from pathlib import Path

import pytest
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError

from statl import db
from statl.migrate_questoes import _build_import_original_id
from statl.utils.migration_utils import content_hash


def test_question_original_id_must_be_unique(app):
    with app.app_context():
        db.session.execute(
            text("""
                INSERT INTO questions (issue, correct_answer, original_id, needs_fix)
                VALUES ('Questao 1', 'A', 'orig-1', FALSE)
            """)
        )
        db.session.commit()

        with pytest.raises(IntegrityError):
            db.session.execute(
                text("""
                    INSERT INTO questions (issue, correct_answer, original_id, needs_fix)
                    VALUES ('Questao 2', 'B', 'orig-1', FALSE)
                """)
            )
            db.session.commit()

        db.session.rollback()


def test_alternative_letter_must_be_unique_per_question(app):
    with app.app_context():
        question_id = db.session.execute(
            text("""
                INSERT INTO questions (issue, correct_answer, needs_fix)
                VALUES ('Questao com alternativas', 'A', FALSE)
                RETURNING id
            """)
        ).scalar()
        db.session.execute(
            text("""
                INSERT INTO alternatives (question_id, letter, text, is_correct)
                VALUES (:question_id, 'A', 'Primeira', TRUE)
            """),
            {"question_id": question_id},
        )
        db.session.commit()

        with pytest.raises(IntegrityError):
            db.session.execute(
                text("""
                    INSERT INTO alternatives (question_id, letter, text, is_correct)
                    VALUES (:question_id, 'A', 'Duplicada', FALSE)
                """),
                {"question_id": question_id},
            )
            db.session.commit()

        db.session.rollback()


def test_migrate_questoes_disambiguates_duplicate_source_original_ids():
    duplicated_original_ids = {"03", "NOVA"}

    assert (
        _build_import_original_id({"id": 46, "original_id": "03"}, duplicated_original_ids)
        == "03__sqlite_46"
    )
    assert (
        _build_import_original_id({"id": 10, "original_id": "55"}, duplicated_original_ids)
        == "55"
    )
    assert (
        _build_import_original_id({"id": 99, "original_id": None}, duplicated_original_ids)
        == "sqlite__99"
    )


def test_content_hash_is_deterministic():
    a = content_hash("Qual a média?", "A", prefix="apostila__")
    b = content_hash("Qual a média?", "A", prefix="apostila__")
    assert a == b
    assert a.startswith("apostila__")
    assert len(a) <= 50  # cabe em questions.original_id


def test_content_hash_differs_by_issue_or_answer():
    base = content_hash("Qual a média?", "A", prefix="apostila__")
    diff_issue = content_hash("Qual a mediana?", "A", prefix="apostila__")
    diff_answer = content_hash("Qual a média?", "B", prefix="apostila__")
    assert base != diff_issue
    assert base != diff_answer


def test_migrate_apostila_has_no_issue_like_dedup():
    """A dedup por trecho de enunciado (issue LIKE) foi substituída por
    original_id determinístico — não deve mais existir no código."""
    source = Path(__file__).resolve().parent.parent.joinpath("migrate_apostila.py").read_text(encoding="utf-8")
    assert not re.search(r"issue\s+LIKE", source, re.IGNORECASE)
    assert "original_id" in source
    assert "content_hash" in source


def test_migrate_bcb_and_undo_bcb_do_not_exist():
    statl_dir = Path(__file__).resolve().parent.parent
    assert not statl_dir.joinpath("migrate_bcb.py").exists()
    assert not statl_dir.joinpath("undo_bcb.py").exists()
