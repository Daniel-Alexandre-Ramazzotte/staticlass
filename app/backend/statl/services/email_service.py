from flask_mail import Message
from .. import mail
from flask import current_app

def send_reset_email(to: str, token: str):
    ''' Envia um email de redefinição de senha para o endereço fornecido com o token dado.
    '''

    reset_link = f"http://localhost:5000/reset-password?token={token}"

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

    mail.send(msg)