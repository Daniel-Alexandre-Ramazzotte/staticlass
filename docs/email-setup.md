# Configuração de Email — Staticlass

O backend usa Flask-Mail para enviar emails de verificação OTP e convites de turma. Esta guia cobre as três opções de configuração.

---

## Variáveis de ambiente necessárias

Adicione ao `app/backend/.env`:

```env
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=true
MAIL_USERNAME=seu-email@gmail.com
MAIL_PASSWORD=sua-app-password-aqui

# URL base do app web (usada nos links de convite)
APP_BASE_URL=http://localhost:5173
```

Em produção, substitua `APP_BASE_URL` pela URL pública do app web.

---

## Opção 1 — Gmail com App Password (desenvolvimento)

1. Acesse [myaccount.google.com/security](https://myaccount.google.com/security)
2. Ative a **Verificação em duas etapas** (obrigatório para App Passwords)
3. Vá em **Senhas de app** → selecione "Outro (nome personalizado)" → `Staticlass`
4. Copie a senha gerada (16 caracteres sem espaços) e cole em `MAIL_PASSWORD`

```env
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=true
MAIL_USERNAME=seuemail@gmail.com
MAIL_PASSWORD=abcdabcdabcdabcd
```

**Limite:** ~500 emails/dia. Suficiente para desenvolvimento e testes.

---

## Opção 2 — SendGrid (recomendado para produção)

1. Crie conta em [sendgrid.com](https://sendgrid.com) (plano gratuito: 100 emails/dia)
2. Em **Settings → API Keys** → **Create API Key** com permissão "Mail Send"
3. Em **Settings → Sender Authentication** → verifique o domínio ou email remetente
4. Configure o `.env`:

```env
MAIL_SERVER=smtp.sendgrid.net
MAIL_PORT=587
MAIL_USE_TLS=true
MAIL_USERNAME=apikey
MAIL_PASSWORD=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

`MAIL_USERNAME` deve ser literalmente `apikey` (não seu email).

---

## Opção 3 — Mailtrap (testes locais sem envio real)

Mailtrap captura todos os emails em uma caixa de entrada virtual — nada chega ao destinatário real.

1. Crie conta em [mailtrap.io](https://mailtrap.io) → **Email Testing → Inboxes**
2. Clique na inbox → **SMTP Settings** → copie as credenciais

```env
MAIL_SERVER=sandbox.smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USE_TLS=false
MAIL_USERNAME=xxxxxxxxxxxxxxxx
MAIL_PASSWORD=xxxxxxxxxxxxxxxx
```

Os emails aparecem na aba **Inbox** do Mailtrap em vez de serem entregues.

---

## Verificação rápida

Com o backend rodando, teste via curl:

```bash
# Registrar um usuário (deve enviar OTP)
curl -X POST http://localhost:5001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Teste","email":"teste@exemplo.com","password":"abc123","confirm_password":"abc123"}'

# Verificar se o email chegou (Mailtrap) ou checar logs do backend
```

Se o email não chegar, verifique os logs do Flask — erros de SMTP aparecem como `SMTPAuthenticationError` ou `SMTPConnectError`.

---

## Troubleshooting

| Erro | Causa | Solução |
|------|-------|---------|
| `SMTPAuthenticationError` | Credenciais erradas ou App Password não gerada | Regenerar App Password; verificar `MAIL_USERNAME` e `MAIL_PASSWORD` |
| `SMTPConnectError` | Porta ou servidor errado | Conferir `MAIL_SERVER` e `MAIL_PORT` |
| `SSL: WRONG_VERSION_NUMBER` | TLS na porta 465 sem SSL=True | Usar porta 587 com TLS, ou porta 465 com `MAIL_USE_SSL=true` |
| Email não chega (Gmail) | Filtro de spam ou verificação 2FA não ativa | Checar spam; ativar 2FA antes de gerar App Password |
| `MAIL_PASSWORD not set` | Variável ausente no `.env` | Copiar `.env.example` e preencher os valores |
