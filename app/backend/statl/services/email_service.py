import os
from flask_mail import Message
from .. import mail
from flask import current_app


# Falta configurar o email e o servidor SMTP

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
    print(current_app.config["MAIL_SERVER"])
    print(current_app.config["MAIL_PORT"])
    with current_app.app_context():
        mail.send(msg)


