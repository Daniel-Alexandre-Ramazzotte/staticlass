# API Endpoints

> Use este arquivo quando trabalhar em rotas, blueprints ou integrações frontend→backend.

## Blueprints registrados

| Blueprint | Prefixo | Arquivo de rotas |
|-----------|---------|-----------------|
| auth | `/auth` | `statl/routes/auth.py` |
| questions | `/questions` | `statl/routes/questions.py` |
| users | `/users` | `statl/routes/users.py` |
| gamification | `/gamification` | `statl/routes/gamification.py` |
| lists | `/lists` | `statl/routes/lists.py` |
| admin | `/admin` | `statl/routes/admin.py` |

## Rotas por blueprint

### `/auth`
- `POST /register`
- `POST /login`
- `POST /password-reset`
- `POST /password-reset/confirm`

### `/questions`
- `GET /rand/<num>` — **deprecated**: não usado pelo quiz atual
- `GET /filtered?num=5&chapter_id=1&difficulty=2&source=ENEM` — quiz principal
- `GET /chapters` — lista capítulos (busca no mount de `questions.tsx`)
- `GET /topics?chapter_id=1` — lista tópicos (filtro opcional)
- `POST /add` — professor adiciona questão
- `PUT /update` — professor edita questão
- `POST /check` — **não usado**: checagem de resposta é feita no cliente
- `GET /professor/<id>` — questões do professor
- `GET /admin/<id>` — questões para admin

### `/users`
- `PUT /update-me`
- `DELETE /delete-me`
- `GET /profile/<email>`
- `GET /estatisticas`
- `GET /historico`
- Admin: gerenciamento de professores e alunos (ver arquivo de rotas)

### `/gamification`
- `POST /record-session` — chamado ao fim de cada quiz; requer role `aluno`
- `GET /ranking` — top-100 alunos por XP

### `/lists`
- CRUD de listas pelo professor
- Submissão de lista pelo aluno
- Analytics por lista (ver `statl/routes/lists.py` para detalhes completos)

### `/admin`
- `GET /questoes`
- `GET /stats/alunos`
- `GET /stats/aluno/<id>`
- `POST /sql` — execução de SQL arbitrário (protegida por role admin)

## Nota de depreciação
`/rand/<num>` ainda existe no código mas não é chamado pelo frontend. Qualquer refatoração pode removê-lo com segurança após verificar que nenhum cliente externo o usa.
