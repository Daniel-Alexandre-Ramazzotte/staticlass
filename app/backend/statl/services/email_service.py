import os
from flask_mail import Message
from flask import current_app

from .. import mail


# Falta configurar o email e o servidor SMTP

def send_verification_email(to: str, token: str):
    ''' Envia um email de verificação de conta para o endereço fornecido.
    '''
    base_url = os.environ.get("APP_BASE_URL", "http://localhost:5000")
    verify_link = f"{base_url}/auth/verify-email?token={token}"

    msg = Message(
        subject="Verifique seu email — Staticlass",
        recipients=[to],
        body=f"""Olá,

Obrigado por se cadastrar no Staticlass!

Para ativar sua conta, clique no link abaixo (válido por 24 horas):
{verify_link}

Se você não criou esta conta, ignore este email.

Atenciosamente,
Equipe Staticlass
""",
    )
    with current_app.app_context():
        mail.send(msg)


def send_reset_email(to: str, token: str):
    ''' Envia um email de redefinição de senha para o endereço fornecido com o token dado.
    '''
    base_url = os.environ.get("APP_BASE_URL", "http://localhost:5000")
    reset_link = f"{base_url}/reset-password?token={token}"

    subject = "Recuperação de senha"
    body = f"""
    Olá,

    Recebemos uma solicitação para redefinir sua senha.

    Para criar uma nova senha, clique no link abaixo:
    {reset_link}

    Se você não solicitou isso, ignore este email.

    Atenciosamente,
    Equipe 
    """

    msg = Message(
        subject=subject,
        recipients=[to],
        body=body
    )
    with current_app.app_context():
        mail.send(msg)


