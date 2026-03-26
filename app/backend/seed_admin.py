"""Script para criar o usuário admin inicial. Rodar uma vez após o deploy."""
from statl import create_app, db
from werkzeug.security import generate_password_hash
from sqlalchemy import text

app = create_app()
with app.app_context():
    db.session.execute(
        text("""
            INSERT INTO users (email, password_hash, name, role)
            VALUES (:e, :p, :n, :r)
            ON CONFLICT (email) DO NOTHING
        """),
        {
            "e": "admin@staticlass.com",
            "p": generate_password_hash("admin123"),
            "n": "Admin",
            "r": "admin",
        },
    )
    db.session.commit()
    print("Admin criado: admin@staticlass.com / admin123")
