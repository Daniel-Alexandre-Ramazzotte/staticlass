# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Pendências

- **Fase ativa**: Phase 06 — Polish & Release (todas as fases anteriores concluídas).
- **Lint global do frontend**: ainda há avisos preexistentes fora dos arquivos tocados; validar e limpar isso antes do release.

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
DATABASE_URL=postgresql://staticlass:staticlass123@localhost:5432/staticlass
SECRET_KEY=
```

The app uses **PostgreSQL** (via Docker) and falls back to **SQLite in-memory** when `create_app(testing=True)` is called.

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
| users | `/users` | `PUT /update-me`, `DELETE /delete-me`, `GET /profile/<email>`, `GET /estatisticas`, `GET /historico`, admin routes for professor/aluno management |
| gamification | `/gamification` | `POST /record-session`, `GET /ranking` |
| admin | `/admin` | `GET /questoes`, `GET /stats/alunos`, `GET /stats/aluno/<id>`, `POST /sql` |

### Role-based Access

Use `@require_role('admin')` or `@require_role(['admin', 'professor'])` on route functions. It validates the JWT and checks the `role` claim.
For student-only gamification flows, use `@require_role(['aluno'])`.

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

For Android emulator, the backend API base URL is `http://10.0.2.2:5001/` (emulator loopback to host). Change `app/services/api.tsx` when testing on a physical device.

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
- `app/(tabs)/ranking.tsx` — leaderboard screen backed by `/gamification/ranking`
- `app/(tabs)/profile.tsx` — student profile hydrated from `/users/profile`, `/users/historico`, and `/gamification/ranking`

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

## Livro Interativo — Estatística Básica

O livro-texto do projeto Estatística Básica (`Desktop/Estatistica-Basica/livro/`, repositório separado) é portado para dentro do web app como um leitor interativo, com um console R/Python embutido rodando 100% no navegador via WebAssembly (Pyodide + webR) — sem endpoint de backend, sem execução de código no servidor.

**Escopo:** livro completo — Prefácio, os 5 capítulos numerados (`01-descritiva` a `05-problemas-pesquisa-aplicados`) e os 5 apêndices (`A-intro-r` a `E-creditos`), agrupados no índice em Prefácio / Capítulos / Apêndices via o campo `group` no manifest. Só os apêndices A/B e os capítulos 01–05 têm código executável (R, exceto B que é Python) — os demais são só leitura.

**Rotas:** `/livro` é uma **biblioteca de livros** (`LivroLibraryPage.jsx`, metadata em `content/livro/books.js`) — hoje lista "Estatística Básica" (disponível) e "Análise de Dados Categóricos" (`available: false`, card desabilitado "Em breve", sem conteúdo). `/livro/:bookSlug` é o índice de capítulos de um livro (`LivroIndexPage.jsx`) e `/livro/:bookSlug/:slug` é o leitor de capítulo (`LivroCapituloPage.jsx`). Para adicionar um livro novo de verdade: portar o conteúdo (novo `SOURCES` em `convert.mjs` ou pipeline próprio) e marcar `available: true` em `books.js`.

### Pipeline de conteúdo

```bash
cd app/web
node scripts/livro/convert.mjs
# ou apontando para outro caminho do repo Estatistica-Basica:
node scripts/livro/convert.mjs --src /caminho/para/Estatistica-Basica/livro
```

Script manual, idempotente, **não faz parte do build/CI** — mesmo padrão de `app/backend/statl/migrate_questoes.py`. Converte os `.qmd` em JSON estático committado em `app/web/src/content/livro/` (um `<slug>.json` por capítulo + `manifest.json`), com blocos `prose` / `callout` / `code` e um `toc` (usado pela barra lateral de índice). O parser (`app/web/scripts/livro/parseQmd.mjs`) entende: callouts `tip`/`note`/`warning`/`important` (título via `## Heading` ou via atributo `title="..."`), divs Pandoc genéricos não-callout (ex. `{.text-center}`, apenas "desembrulhados"), imagens Markdown (`imagens/x.png` → `/livro/x.png`, atributos Quarto tipo `{fig-align=...}` descartados), LaTeX inline `$..$` e em bloco `$$..$$` (preservado como texto — renderizado com KaTeX em `ProseBlock.jsx`, não no parser). Não é um parser genérico de Quarto/Pandoc, só cobre os padrões encontrados neste livro.

Os capítulos 01/03/04 fazem `read.csv("dados/pesquisa_exemplo.csv")` — o CSV real está em `app/web/public/livro/pesquisa_exemplo.csv` e é pré-carregado no sistema de arquivos virtual do webR (`webrRuntime.js`, função `preloadDatasets`) antes de cada sessão R, para que o código do livro rode sem alteração.

### Conteúdo editorial (narrativas + imagens)

Além do conteúdo fiel ao livro-fonte, cada capítulo tem um arquivo `app/web/src/content/livro/<slug>.enrichment.json` com blocos `story` (narrativa curta contextualizando cada tópico — "por que isso existe, quando um analista de dados usa isso") e, quando existe um diagrama correspondente no livro-fonte (`if.png`, `ifelse.png`, `ifelseif.png` em `app/web/public/livro/`), uma imagem embutida.

Esses arquivos de enriquecimento são **hand-authored** e ficam separados do JSON gerado pelo `convert.mjs` de propósito: rodar o script de conversão de novo (se o `.qmd`-fonte mudar) nunca apaga esse conteúdo. O merge acontece em runtime, em `LivroCapituloPage.jsx` (função `mergeEnrichment`), que insere cada bloco `story` logo após o `afterBlockId` indicado.

### Runtime de execução (client-side)

- `app/web/src/runtime/pyodideRuntime.js` — Pyodide carregado sob demanda via CDN (jsdelivr), um dict de `globals` Python por sessão de capítulo (permite que uma célula reuse variáveis de uma célula anterior, ex.: um DataFrame `dados`).
- `app/web/src/runtime/webrRuntime.js` — webR carregado sob demanda via CDN (webr.r-wasm.org), um ambiente R (`new.env()`) por sessão de capítulo, com `dplyr`/`ggplot2` pré-instalados.
- `app/web/src/hooks/useCellSession.js` — hook por capítulo que gerencia a sessão (Python ou R), execução de células e "reiniciar sessão".

Ambos os runtimes só carregam no primeiro clique em "Rodar" (nunca no carregamento da página) — o primeiro carregamento pode levar ~15–20s.

## Infraestrutura

### PostgreSQL via Docker

```bash
# Subir o banco (e o backend + nginx)
docker compose up -d

# Credenciais (também em app/backend/.env)
DATABASE_URL=postgresql://staticlass:staticlass123@localhost:5432/staticlass
```

O `docker-compose.yml` está na raiz do repositório. O schema é criado automaticamente pelo `db.create_all()` no startup do Flask.

### Seed de dados fictícios

```bash
cd app/backend
python seed_demo_data.py
```

O script cria/atualiza contas demo para `admin`, `professor` e `aluno`, e popula histórico/XP/streak para alunos que ainda não têm quizzes registrados.

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

## Feature Matrix — Mobile ↔ Web ↔ Backend

Toda feature nova deve ter uma linha nesta tabela. Quando mudar um endpoint, atualize as três colunas.

### Auth & Usuário

| Feature | Endpoint(s) | Mobile screen | Web page | Roles |
|---------|-------------|---------------|----------|-------|
| Login | `POST /auth/login` | `(public)/login.tsx` | `pages/Login.jsx` | público |
| Cadastro | `POST /auth/register` | `(public)/register.tsx` | — (admin cria via painel) | público |
| Recuperar senha | `POST /auth/password-reset` | `(public)/RecoverPassword.tsx` | — | público |
| Reset de senha | `POST /auth/password-reset/confirm` | `(public)/reset-password.tsx` | — | público |
| Verificar email | `POST /auth/verify-email-token` | `(public)/verify-email.tsx` | — | público |
| Atualizar perfil | `PUT /users/update-me` | `(app)/Settings.tsx` | — | todos |
| Deletar conta | `DELETE /users/delete-me` | `(app)/Settings.tsx` | — | todos |
| Ver perfil | `GET /users/profile/:email` | `(tabs)/profile.tsx` | `pages/aluno/PerfilPage.jsx` | todos |

### Admin

| Feature | Endpoint(s) | Mobile screen | Web page | Roles |
|---------|-------------|---------------|----------|-------|
| Dashboard KPIs | `GET /admin/stats/dashboard` | `(tabs)/stats.tsx` | `pages/admin/DashboardPage.jsx` | admin |
| Stats detalhado | `GET /admin/stats/alunos`, `GET /admin/stats/aluno/:id` | `(admin)/EstatisticasAdmin.tsx` | DashboardPage (parcial) | admin |
| Listar professores | `GET /users/admin/professors` | `(admin)/ProfessorManager.tsx` | `pages/admin/ProfessoresPage.jsx` | admin |
| Criar professor | `POST /users/admin/professors` | `(admin)/AddProfessor.tsx` | ProfessoresPage (painel lateral) | admin |
| Editar professor | `PUT /users/admin/professors/:id` | `(admin)/AddProfessor.tsx` | — | admin |
| Deletar professor | `DELETE /users/admin/professors/:id` | ProfessorManager | ProfessoresPage | admin |
| Listar alunos | `GET /users/admin/alunos` | `(admin)/AlunoManager.tsx` | `pages/admin/AlunosPage.jsx` | admin |
| Criar aluno | `POST /users/admin/alunos` | `(admin)/AddAluno.tsx` | AlunosPage (painel lateral) | admin |
| Deletar aluno | `DELETE /users/admin/alunos/:id` | AlunoManager | AlunosPage | admin |
| SQL viewer | `POST /admin/sql` | `(admin)/QuestaoViewer.tsx` | — | admin |

### Questões

| Feature | Endpoint(s) | Mobile screen | Web page | Roles |
|---------|-------------|---------------|----------|-------|
| Visualizar questão | `GET /questions/admin/:id` | SharedQuestionViewer | `pages/TelaQuestao.jsx` | admin, professor |
| Criar questão | `POST /questions/add` | `(professor)/AddNewQuestion.tsx` | `pages/AdicionarQuestao.jsx` | admin, professor |
| Editar questão | `PUT /questions/update` | AddNewQuestion | AdicionarQuestao (param `?edit=id`) | admin, professor |
| Listar capítulos | `GET /questions/chapters` | questions.tsx, AddNewQuestion | AdicionarQuestao, NovaListaPage | todos |
| Listar tópicos | `GET /questions/topics?chapter_id=` | AddNewQuestion | AdicionarQuestao | todos |
| Quiz filtrado | `GET /questions/filtered` | `(app)/QuizInProgressScreen.tsx` | — (mobile only) | todos |
| Questão diária | `GET /questions/diaria/status` | `(tabs)/daily.tsx` | — | aluno |

### Livro

| Feature | Endpoint(s) | Mobile screen | Web page | Roles |
|---------|-------------|---------------|----------|-------|
| Ler capítulo interativo (prosa, callouts, TOC, narrativas) | — (conteúdo estático + client-side WASM, sem endpoint) | — | `pages/LivroLibraryPage.jsx`, `pages/LivroIndexPage.jsx`, `pages/LivroCapituloPage.jsx` | todos |
| Editar e rodar células de código (R/Python) | — (Pyodide/webR no navegador) | — | `components/livro/CodeCell.jsx` | todos |

### Listas (Professor)

| Feature | Endpoint(s) | Mobile screen | Web page | Roles |
|---------|-------------|---------------|----------|-------|
| Ver minhas listas | `GET /lists` | `(professor)/ListManager.tsx` | `pages/professor/ListasPage.jsx` | professor |
| Criar lista | `POST /lists` | `(professor)/CreateNewList.tsx` | `pages/professor/NovaListaPage.jsx` | professor |
| Editar lista | `PUT /lists/:id` | CreateNewList | NovaListaPage (param `:id`) | professor |
| Publicar lista | `POST /lists/:id/publish` | CreateNewList | NovaListaPage (via status select) | professor |
| Ver resultados | `GET /lists/:id/results` | ListManager (analytics) | — | professor |

### Turmas (Professor)

| Feature | Endpoint(s) | Mobile screen | Web page | Roles |
|---------|-------------|---------------|----------|-------|
| Listar turmas | `GET /turmas` | `(professor)/TurmaManager.tsx` | `pages/professor/TurmasPage.jsx` | professor |
| Criar turma | `POST /turmas` | TurmaManager | TurmasPage | professor |
| Editar matrícula | `GET /turmas/:id`, `PUT /turmas/:id` | `(professor)/TurmaEditor.tsx` | TurmasPage (painel lateral) | professor |
| Deletar turma | `DELETE /turmas/:id` | TurmaManager | TurmasPage | professor |
| Listar alunos disponíveis | `GET /users/alunos` | TurmaEditor | TurmasPage | professor |

### Aluno

| Feature | Endpoint(s) | Mobile screen | Web page | Roles |
|---------|-------------|---------------|----------|-------|
| Minhas listas | `GET /lists/assigned` | `(tabs)/home.tsx` | `pages/aluno/MinhasListasPage.jsx` | aluno |
| Fazer quiz (lista) | `GET /lists/:id/questions`, `POST /lists/:id/start` | `(app)/QuizInProgressScreen.tsx` | — (mobile only) | aluno |
| Submeter quiz | `POST /lists/:id/submit` | `(app)/ResultScreen.tsx` | — | aluno |
| Ver resultado | `GET /lists/:id/me` | ResultScreen | MinhasListasPage (score) | aluno |
| Ranking | `GET /gamification/ranking` | `(tabs)/ranking.tsx` | `pages/aluno/RankingPage.jsx` | todos |
| Estatísticas pessoais | `GET /users/analytics/dashboard` | `(app)/Statistics.tsx` | PerfilPage (parcial) | aluno |
| Gamification | `POST /gamification/record-session` | ResultScreen | — | aluno |

### Legenda
- `—` = feature ainda não implementada nessa plataforma
- `(parcial)` = implementada parcialmente (subconjunto dos dados)

## Web App — app/web

### Setup & Run

```bash
cd app/web
npm install
npm run dev        # http://localhost:5173
npm run build      # verifica erros de build
npm test           # testes unitários (Vitest + Testing Library + MSW)
npm run test:watch # modo watch para desenvolvimento
```

### Arquitectura

React + Vite. Roteamento via React Router v6. Sem estado global além do `AuthContext`.

```
app/web/src/
  context/AuthContext.jsx    # JWT state + signIn/signOut (localStorage)
  services/api.js            # axios com Bearer token interceptor → /api (proxy para Flask :5001)
  components/
    Sidebar.jsx              # nav dinâmica por role + botão logout
    Topbar.jsx               # breadcrumbs + theme toggle
    ProtectedRoute.jsx       # guarda de rota: redireciona /login ou / se role inválido
  pages/
    Login.jsx                # layout público (sem sidebar)
    admin/DashboardPage.jsx  # KPIs + acerto por tópico
    admin/ProfessoresPage.jsx
    admin/AlunosPage.jsx
    professor/ListasPage.jsx
    professor/NovaListaPage.jsx
    professor/TurmasPage.jsx
    aluno/MinhasListasPage.jsx
    aluno/RankingPage.jsx
    aluno/PerfilPage.jsx
    TelaQuestao.jsx          # viewer de questão conectado à API real
    AdicionarQuestao.jsx     # form de criação/edição conectado à API real
    LivroLibraryPage.jsx     # biblioteca de livros (/livro)
    LivroIndexPage.jsx       # índice de capítulos de um livro (/livro/:bookSlug)
    LivroCapituloPage.jsx    # leitor de capítulo (/livro/:bookSlug/:slug)
  components/livro/
    ProseBlock.jsx           # markdown (marked) → HTML
    CalloutBox.jsx           # tip/note/warning/important
    StoryBlock.jsx           # narrativa hand-authored, com imagem opcional
    ChapterToc.jsx           # índice lateral, scroll-to-block
    CodeCell.jsx             # editor CodeMirror + Run + output (stdout/erro/imagens)
  runtime/
    pyodideRuntime.js        # execução Python client-side (Pyodide via CDN)
    webrRuntime.js            # execução R client-side (webR via CDN)
  hooks/useCellSession.js    # sessão de execução por capítulo (Python ou R)
  content/livro/              # JSON gerado (scripts/livro/convert.mjs) + *.enrichment.json (hand-authored)
  __tests__/                 # testes Vitest
    mocks/handlers.js        # MSW handlers com tokens JWT fake
    mocks/server.js          # MSW server
    setup.js                 # localStorage mock + MSW lifecycle
```

### Auth flow (web)

1. Token JWT em `localStorage('auth_token')`, decodificado com `jwt-decode`
2. `AuthContext` valida expiração no mount; token expirado → limpa e redireciona
3. Interceptor do axios injeta `Authorization: Bearer <token>` em todo request
4. 401 do backend → `window.location.href = '/login'` automático
5. `ProtectedRoute` verifica token + role antes de renderizar qualquer página

### Design system

CSS custom properties em `src/styles/tokens.css` (light + dark via `data-theme` no `<html>`).
Componentes: `.card`, `.btn--*`, `.chip--*`, `.alt`, `.table`, `.panel`, `.empty-state`, `.loader`, `.book-prose`, `.callout--*`, `.story`, `.code-cell`.
Tipografia: Chau Philomene One (display) + Carlito (body). Sem caixa-alta, sem pill em botões.

## Shared — app/shared

Código compartilhado entre web e mobile (puro JS, sem dependências de UI):

| Arquivo | Conteúdo |
|---------|----------|
| `types.js` | JSDoc typedefs de todos os shapes da API (Question, Lista, User, etc.) |
| `constants.js` | `ROLE_HOME`, `ROLE_LABEL`, `STATUS_LABEL`, `DIFFICULTY_LABEL`, `PALETTE` |
| `utils.js` | `initials()`, `formatDateBR()`, `formatPercent()`, `randomPassword()` |

Para usar no web: `import { ROLE_HOME } from '../../shared/constants.js'`
Para usar no mobile: mesmo path relativo ou configurar alias no babel/metro.

## Estado Atual do Produto

- Phase 01 concluída: hardening de auth e proteção dos endpoints críticos
- Phase 02 concluída: filtro por `source` no banco de questões e nas telas de professor/aluno
- Phase 03 concluída: XP, streak, ranking global, feedback de resultado com backend e perfil gamificado
- Phase 04 concluída: listas de exercícios — criação/publicação pelo professor, submissão pelo aluno, analytics por lista
- Phase 05 concluída: `answer_history` canônico, dashboard de estatísticas do aluno, analytics de risco do professor, KPIs do admin, e neutralização do viewer compartilhado de questões
- Próximo foco: Phase 06 — polish & release (validação E2E, ambiente de produção, UX tightening)
