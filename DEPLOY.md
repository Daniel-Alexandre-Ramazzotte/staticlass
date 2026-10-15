# Deploy Local — Staticlass

Stack completa via Docker Compose: PostgreSQL + backend Flask (gunicorn) + frontend web (nginx).

## Pré-requisitos

| Ferramenta | Versão mínima |
|------------|---------------|
| Docker + Docker Compose | qualquer atual |
| Node.js | 18+ |

---

## Terminal 1 — Banco + Backend

```bash
# 1. Configure o ambiente
cp app/backend/.env.example app/backend/.env

# 2. Suba banco e backend
docker compose up -d db backend

# 3. Importe o banco de questões (primeira vez)
docker compose exec backend python -m statl.migrate_questoes

# 4. Popule dados de demo
docker compose exec backend python seed_demo_data.py

# 5. Acompanhe os logs
docker compose logs -f backend
```

API disponível em `http://localhost:5000`.

---

## Terminal 2 — Frontend

```bash
# 1. Instale dependências e gere o build estático
cd app/frontend
npm install
npm run build

# 2. Suba o nginx
cd ../..
docker compose up -d web
```

App disponível em `http://localhost`.

---

## Usuários de teste

| Role | E-mail | Senha |
|------|--------|-------|
| admin | admin@staticlass.com | admin123 |
| professor | professor@staticlass.com | professor123 |
| professor | prof.ana@staticlass.com | profana123 |
| aluno | aluno@staticlass.com | aluno123 |
| aluno | ana@staticlass.com | ana123 |
| aluno | bruno@staticlass.com | bruno123 |
| aluno | carla@staticlass.com | carla123 |
| aluno | daniel@staticlass.com | daniel123 |
| aluno | erika@staticlass.com | erika123 |
| aluno | felipe@staticlass.com | felipe123 |
| aluno | gabriela@staticlass.com | gabriela123 |

---

## Rebuild após mudanças

```bash
# Backend
docker compose up -d --build backend

# Frontend
cd app/frontend && npm run build && cd ../.. && docker compose restart web
```

## Outros comandos úteis

```bash
docker compose logs -f backend   # logs em tempo real
docker compose down              # para todos os containers
docker compose down -v           # para e apaga o volume do banco
```
