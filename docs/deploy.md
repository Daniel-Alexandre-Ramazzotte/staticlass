# Guia de Deploy — Staticlass

## Pré-requisitos

| Ferramenta | Versão mínima | Para quê |
|-----------|---------------|----------|
| Docker + Compose | 24+ | Backend + banco |
| Node.js | 18+ | Frontend web e Android |
| Python | 3.10+ | Desenvolvimento local do backend |
| Expo CLI | último | Build e export |
| EAS CLI | 16+ | Build Android na nuvem |

```bash
npm install -g expo-cli eas-cli
```

---

## 1. Configuração de Ambiente

### Backend — `app/backend/.env`

```env
DB_HOST=db              # "db" dentro do Docker; "localhost" para dev local
DB_USER=flask_user
DB_PASS=staticlass123
DB_NAME=staticlass
SECRET_KEY=troque-por-uma-chave-longa-e-aleatoria

# Configuração de e-mail (recuperação de senha)
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=seu@email.com
MAIL_PASSWORD=senha-de-app-gmail
```

### Frontend — `app/frontend/.env`

```env
EXPO_PUBLIC_API_URL=https://api.staticlass.com.br/
```

> Em desenvolvimento local, esta variável não é necessária — a URL é detectada automaticamente pela plataforma.

---

## 2. Deploy do Backend (Docker)

### Opção A — Apenas o banco (desenvolvimento)

```bash
docker compose up -d db
cd app/backend
flask --app statl run
```

### Opção B — Backend + banco completo (produção)

```bash
# 1. Certifique-se que app/backend/.env está preenchido
# 2. Suba todos os serviços
docker compose up -d db backend

# Verificar logs
docker compose logs -f backend

# Importar banco de questões (só na primeira vez)
docker compose exec backend python -m statl.migrate_questoes
```

O Flask cria todas as tabelas automaticamente (`db.create_all()`) na inicialização.

---

## 3. Deploy Web

### Passo 1 — Criar o arquivo .env do frontend

```bash
cp app/frontend/.env.example app/frontend/.env
# edite EXPO_PUBLIC_API_URL com a URL real do backend
```

### Passo 2 — Exportar o app como site estático

```bash
cd app/frontend
npm install
npx expo export --platform web
# Output gerado em: app/frontend/dist/
```

### Passo 3 — Servir com Docker (nginx)

```bash
# Na raiz do projeto
docker compose up -d web
# Acesse: http://localhost (porta 80)
```

### Alternativas de hospedagem gratuita

#### Vercel
```bash
cd app/frontend
npx vercel --prod
# Configure a env var EXPO_PUBLIC_API_URL no painel da Vercel
```

#### Netlify
```bash
cd app/frontend
npx netlify deploy --prod --dir dist
```

#### GitHub Pages
```bash
cd app/frontend
npx expo export --platform web
# Faça push da pasta dist/ para a branch gh-pages
```

---

## 4. Deploy Android (APK / App Bundle)

### Opção A — APK local (mais simples, sem conta EAS)

```bash
cd app/frontend

# Certifique-se de ter o Android SDK instalado
npx expo run:android --variant release
# APK gerado em: android/app/build/outputs/apk/release/app-release.apk
```

### Opção B — EAS Build (nuvem, recomendado)

```bash
cd app/frontend

# 1. Login na conta Expo
eas login

# 2. Configurar o projeto (só na primeira vez)
eas build:configure

# 3. Build de preview (APK para testes internos)
eas build --platform android --profile preview

# 4. Build de produção (AAB para Google Play)
eas build --platform android --profile production
```

O link para download do APK é exibido ao final do build e também aparece em https://expo.dev.

### Instalar APK no dispositivo

```bash
# Via ADB (cabo USB ou Wi-Fi)
adb install app-release.apk

# Ou compartilhe o link do EAS Build diretamente
```

---

## 5. Checklist de Produção

- [ ] `SECRET_KEY` no `.env` é uma string longa e aleatória (nunca a padrão)
- [ ] `EXPO_PUBLIC_API_URL` aponta para o backend público (HTTPS)
- [ ] CORS no Flask configurado para aceitar apenas o domínio do frontend
- [ ] Banco com senha não-padrão em produção
- [ ] HTTPS habilitado (use Nginx + Certbot ou Cloudflare Tunnel)
- [ ] `package` no `app.json` é único (`com.propet.staticlass`)
- [ ] Importação das questões executada: `python -m statl.migrate_questoes`

---

## 6. Estrutura dos Containers

```
┌──────────────┐     ┌─────────────────┐     ┌──────────────┐
│  nginx :80   │────▶│  Flask :5000    │────▶│  MySQL :3306 │
│  (web)       │     │  (backend)      │     │  (db)        │
└──────────────┘     └─────────────────┘     └──────────────┘
       ▲
  browser / APK
```

---

## 7. Comandos Úteis

```bash
# Ver status dos containers
docker compose ps

# Logs em tempo real
docker compose logs -f backend

# Reiniciar só o backend (após atualizar código)
docker compose restart backend

# Acessar o banco via CLI
docker compose exec db mysql -u flask_user -pstaticlass123 staticlass

# Parar tudo
docker compose down

# Parar e apagar volumes (CUIDADO — apaga o banco)
docker compose down -v
```
