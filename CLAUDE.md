# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Pendências

- **Tela de Registro**: fluxo de cadastro apresenta erros intermitentes (mensagem genérica "Tente novamente"). O `RegisterNewUserService` já foi corrigido para retornar `error.response`, mas o fluxo completo ainda precisa ser validado/testado.

## Project Overview

Staticlass is a quiz/question-answering app for students and professors. It has three user roles: `aluno` (student), `professor`, and `admin`.

## Repository Structure

```
staticlass/
  app/
    backend/   # Flask (Python) API
    frontend/  # React Native (Expo) mobile app
  uploads/     # Image files uploaded for questions
```

## Backend

### Setup & Run

```bash
cd app/backend
pip install -r requirements.txt
flask --app statl run
```

Requires a `.env` file in `app/backend/` with:
```
DB_HOST=
DB_USER=
DB_PASS=
DB_NAME=
SECRET_KEY=
```

The app uses **MySQL** in production and falls back to **SQLite in-memory** when `create_app(testing=True)` is called.

### Architecture

Strictly layered: **Routes → Services → Repositories**

- `statl/__init__.py` — app factory (`create_app()`), registers blueprints, initializes extensions
- `statl/routes/` — Flask Blueprints (`auth`, `questions`, `users`), handle HTTP only
- `statl/services/` — business logic; routes call service functions
- `statl/repositories/` — all database access via SQLAlchemy
- `statl/models/` — SQLAlchemy ORM models (`Question`, `Alternative`, `Chapter`, `Topic`)
- `statl/security/` — password hashing (`password.py`), JWT reset tokens (`tokens.py`)
- `statl/utils/auth_middleware.py` — `@require_role(role)` decorator for role-based route protection
- `statl/config.py` — Flask-Mail configuration

### API Endpoints

| Blueprint | Prefix | Key routes |
|-----------|--------|------------|
| auth | `/auth` | `POST /register`, `POST /login`, `POST /password-reset`, `POST /password-reset/confirm` |
| questions | `/questions` | `GET /rand/<num>`, `GET /filtered`, `GET /chapters`, `GET /topics`, `POST /add`, `PUT /update`, `POST /check`, `GET /professor/<id>`, `GET /admin/<id>` |
| users | `/users` | `PUT /update-me`, `DELETE /delete-me`, `GET /profile/<email>`, admin routes |

### Role-based Access

Use `@require_role('admin')` or `@require_role(['admin', 'professor'])` on route functions. It validates the JWT and checks the `role` claim.

### Tests

```bash
cd app/backend
pytest
```

Test config uses `create_app(testing=True)` which sets `SQLALCHEMY_DATABASE_URI` to `sqlite:///:memory:`.

## Frontend

### Setup & Run

```bash
cd app/frontend
npm install
npx expo start        # starts Metro bundler
npx expo run:android  # build and run on Android
```

For Android emulator, the backend API base URL is `http://10.0.2.2:5000/` (emulator loopback to host). Change `app/services/api.tsx` when testing on a physical device.

### Lint

```bash
cd app/frontend
npm run lint
```

### Architecture

Uses **Expo Router** (file-based routing). Route groups in `app/frontend/app/`:

- `(public)/` — unauthenticated screens: Login, Register, RecoverPassword
- `(tabs)/` — main tab bar (Home, Questions/Questoes, Profile); available to all authenticated users
- `(app)/` — quiz flow screens: QuizInProgressScreen, ResultScreen, SolutionScreen, Ranking, Statistics, Settings
- `(professor)/` — professor-only: ProfessorMenu, AddNewQuestion, ListManager, CreateNewList
- `(admin)/` — admin-only: AdminMenu, AddProfessor, ProfessorManager, AlunoManager, QuestaoViewer

**Auth flow** (`app/_layout.tsx`):
- `AuthProvider` wraps the entire app
- On mount, reads JWT from `AsyncStorage` key `@auth_session`, decodes it (with `jwt-decode`), checks expiry
- Root layout redirects: no session → `(public)/Login`; has session → `(tabs)/Home`

**Key files:**
- `app/context/AuthContext.tsx` — JWT auth context; exposes `session`, `role`, `email`, `name`, `userId`, `signIn`, `signOut`
- `app/services/api.tsx` — Axios instance; automatically attaches `Bearer <token>` header from AsyncStorage on every request
- `app/constants/style.tsx` — global `palette` color object and shared `StyleSheet` styles
- `app/constants/names.tsx` — shared string constants
- `app/components/` — reusable components: `AppButton`, `CustomAccordion`

**UI libraries:** Tamagui (components + theming), react-native-paper, @tamagui/lucide-icons

## Integração com Estatistica-Basica

O banco de questões do projeto [Estatistica-Basica](https://github.com/Daniel-Alexandre-Ramazzotte/Estatistica-Basica) alimenta o Staticlass com 356 questões categorizadas por capítulo, tópico e dificuldade.

### Schema adicional (banco PROPET)

Além da tabela `questions` original, o app agora gerencia:

| Tabela | Descrição |
|--------|-----------|
| `chapters` | 4 capítulos do livro (Descritiva, Probabilidade, Inferência, Regressão) |
| `topics` | 17 tópicos organizados por capítulo |
| `alternatives` | Alternativas normalizadas (A–E) das questões importadas |

Novos campos em `questions`: `chapter_id`, `topic_id`, `difficulty` (1–3), `section`, `needs_fix`, `original_id`.

### Importar o banco de questões

```bash
cd app/backend
# Certifique-se que questoes.db está em Desktop/Estatistica-Basica/banco_questoes/
python -m statl.migrate_questoes

# Ou especificando o caminho:
python -m statl.migrate_questoes --db-path /caminho/para/questoes.db
```

O script é idempotente: pula questões já importadas (detecta pelo `original_id`).

### Rotas filtradas (banco PROPET)

```
GET /questions/chapters               → lista capítulos
GET /questions/topics?chapter_id=1    → lista tópicos (filtro opcional)
GET /questions/filtered?num=5&chapter_id=1&difficulty=2  → quiz filtrado
```

As questões em `/filtered` retornam com o array `alternatives` embutido no JSON.

**Nota:** 230 questões únicas importadas (356 no SQLite, mas 126 têm `original_id` duplicado na fonte). O banco de origem tem questões sem alternativas — nesses casos `alternatives: []`.

## Infraestrutura

### MySQL via Docker

```bash
# Subir o banco
docker compose up -d

# Credenciais (também em app/backend/.env)
DB_HOST=localhost
DB_USER=flask_user
DB_PASS=staticlass123
DB_NAME=staticlass
```

O `docker-compose.yml` está na raiz do repositório. O schema é criado automaticamente pelo `db.create_all()` no startup do Flask.

## Quiz — Fluxo de Dados

O quiz usa exclusivamente `/questions/filtered` (não mais `/rand/<num>`). Cada questão retorna:

```json
{
  "id": 397,
  "issue": "...",
  "correct_answer": "C",
  "solution": "...",
  "image_q": null,
  "image_s": null,
  "alternatives": [
    { "letter": "A", "text": "...", "is_correct": false },
    { "letter": "C", "text": "...", "is_correct": true }
  ]
}
```

A checagem de resposta é feita **no cliente** — o frontend compara `userAnswer === current.correct_answer` sem chamar o backend. O endpoint `POST /questions/check` existe mas não é usado pelo quiz.

### Filtros disponíveis no quiz

`GET /questions/filtered?num=5&chapter_id=1&difficulty=2`

- `num` — quantidade de questões (padrão: 5)
- `chapter_id` — filtra por capítulo (1–4)
- `difficulty` — filtra por dificuldade (1=Fácil, 2=Médio, 3=Difícil)

A tela `(tabs)/questions.tsx` busca os capítulos de `/questions/chapters` no mount e passa os filtros para `QuizInProgressScreen` via router params.
