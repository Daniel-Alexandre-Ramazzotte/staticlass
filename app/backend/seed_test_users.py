"""Script para criar usuários de teste (aluno e professor)."""
from statl import create_app, db
from werkzeug.security import generate_password_hash
from sqlalchemy import text

app = create_app()
with app.app_context():
    users = [
        {
            "e": "aluno@staticlass.com",
            "p": generate_password_hash("aluno123"),
            "n": "Aluno Teste",
            "r": "aluno",
        },
        {
            "e": "professor@staticlass.com",
            "p": generate_password_hash("professor123"),
            "n": "Professor Teste",
            "r": "professor",
        },
    ]
    for u in users:
        db.session.execute(
            text("""
                INSERT INTO users (email, password_hash, name, role)
                VALUES (:e, :p, :n, :r)
                ON CONFLICT (email) DO NOTHING
            """),
            u,
        )
    db.session.commit()
    print("Usuários criados:")
    print("  aluno@staticlass.com / aluno123")
    print("  professor@staticlass.com / professor123")
