from flask_mail import Message
from flask import current_app

from .. import mail


# Falta configurar o email e o servidor SMTP

def send_verification_email(to: str, token: str):
    ''' Envia um email de verificação de conta para o endereço fornecido.
    '''
    verify_link = f"staticlass://verify-email?token={token}"

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


def send_otp_email(to: str, otp_code: str):
    msg = Message(
        subject="Seu código de verificação — Staticlass",
        recipients=[to],
        body=f"""Olá,

Seu código de verificação do Staticlass é:

    {otp_code}

O código expira em 15 minutos.

Se você não criou esta conta, ignore este email.

Atenciosamente,
Equipe Staticlass
""",
    )
    with current_app.app_context():
        mail.send(msg)


def send_invite_email(to: str, nome: str, turma_name: str, token: str):
    import os
    base_url = os.getenv("APP_BASE_URL", "http://localhost:5173")
    invite_link = f"{base_url}/complete-invite?token={token}"
    msg = Message(
        subject=f"Você foi convidado para a turma {turma_name} — Staticlass",
        recipients=[to],
        body=f"""Olá, {nome}!

Você foi adicionado(a) à turma "{turma_name}" no Staticlass.

Para completar seu cadastro, acesse o link abaixo (válido por 7 dias):
{invite_link}

Se você não esperava este convite, pode ignorar este email com segurança.

Atenciosamente,
Equipe Staticlass
""",
    )
    with current_app.app_context():
        mail.send(msg)


def send_reset_email(to: str, token: str):
    ''' Envia um email de redefinição de senha para o endereço fornecido com o token dado.
    '''
    reset_link = f"staticlass://reset-password?token={token}"

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


