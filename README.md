# Staticlass

App mobile de quizzes interativos de Estatística Básica, desenvolvido como parte do **PROPET DataSci — Ação 11: Apostila de Estatística Básica** (UEM).

O banco de questões é alimentado pela [Apostila Interativa de Estatística Básica](https://daniel-alexandre-ramazzotte.github.io/Estatistica-Basica/) — 356 questões categorizadas por capítulo, tópico e dificuldade. O app permite que alunos pratiquem com quizzes filtrados, acompanhem seu desempenho e vejam soluções detalhadas; professores gerenciem listas; e administradores controlem usuários.

**Autores:** Daniel Alexandre Ramazzotte, Ana, Vinicius Okada, Thaís N. Resende, Eduarda Barragan, Larissa, Cláudio Homem
**Programa:** PROPET DataSci — Ação 11 | Departamento de Estatística — UEM
**Documentação do projeto:** [Notion](https://www.notion.so/PROPET-DataSci-Acao-11-Apostila-Estat-stica-B-sica-3280009068a9816f82c6c48065ebe429)

---

## Stack

| Camada   | Tecnologia                        |
|----------|-----------------------------------|
| Frontend | React Native (Expo) + TypeScript  |
| UI       | Tamagui + react-native-paper      |
| Backend  | Python + Flask                    |
| Banco    | MySQL (Docker) / SQLite (testes)  |
| Auth     | JWT (Flask-JWT-Extended)          |
| Email    | Flask-Mail                        |

---

## Estrutura do Repositório

```
staticlass/
├── app/
│   ├── backend/
│   │   └── statl/
│   │       ├── models/          # Modelos SQLAlchemy (Question, Alternative, Chapter, Topic)
│   │       ├── repositories/    # Acesso ao banco via SQLAlchemy
│   │       ├── routes/          # Blueprints Flask: auth, questions, users
│   │       ├── services/        # Regras de negócio
│   │       ├── security/        # Hash de senha e tokens JWT de reset
│   │       └── utils/           # Middleware de roles (@require_role)
│   └── frontend/
│       ├── app/
│       │   ├── (public)/        # Login, Registro, Recuperação de senha
│       │   ├── (tabs)/          # Abas principais (Home, Questões, Daily, Ranking, Perfil)
│       │   ├── (app)/           # Fluxo do quiz (Quiz, Resultado, Solução, Estatísticas)
│       │   ├── (professor)/     # Gestão de questões e listas
│       │   └── (admin)/         # Gestão de professores e alunos
│       └── src/
│           ├── context/         # AuthContext (JWT + AsyncStorage)
│           ├── services/        # Axios (api.tsx) + serviços de autenticação
│           ├── components/      # AppButton, CustomAccordion
│           └── constants/       # Paleta de cores, strings compartilhadas
├── docs/
├── docker-compose.yml           # MySQL local
└── propet.sql                   # Schema inicial
```

---

## Papéis de Usuário

| Papel       | Acesso                                                                 |
|-------------|------------------------------------------------------------------------|
| `aluno`     | Quizzes filtrados, questão diária, ranking, estatísticas, perfil       |
| `professor` | Gerenciar questões próprias, criar e gerenciar listas                  |
| `admin`     | Gerenciar professores e alunos, painel administrativo                  |

---

## Rodando Localmente

### Pré-requisitos

- Python 3.10+
- Node.js 18+ e npm
- Docker e Docker Compose
- Expo CLI (`npm install -g expo-cli`)

---

### 1. Banco de Dados (MySQL via Docker)

```bash
# Na raiz do repositório
docker compose up -d
```

Credenciais (já configuradas no `docker-compose.yml`):

```
DB_HOST=localhost
DB_USER=flask_user
DB_PASS=staticlass123
DB_NAME=staticlass
```

---

### 2. Backend (Flask)

```bash
cd app/backend
```

Crie o arquivo `.env`:

```env
DB_HOST=localhost
DB_USER=flask_user
DB_PASS=staticlass123
DB_NAME=staticlass
SECRET_KEY=uma-chave-secreta-qualquer
```

Instale as dependências e rode:

```bash
pip install -r requirements.txt
flask --app statl run --host=0.0.0.0
```

O `--host=0.0.0.0` é necessário para o emulador Android e dispositivos físicos conseguirem se conectar.

O schema do banco é criado automaticamente pelo `db.create_all()` na inicialização.

---

### 3. Importar o Banco de Questões

As 356 questões da apostila estão em `questoes.db` (repositório [Estatistica-Basica](https://github.com/Daniel-Alexandre-Ramazzotte/Estatistica-Basica)):

```bash
cd app/backend

# O script assume que questoes.db está em ~/Desktop/Estatistica-Basica/banco_questoes/
python -m statl.migrate_questoes

# Ou passando o caminho explicitamente:
python -m statl.migrate_questoes --db-path /caminho/para/questoes.db
```

O script é idempotente — pula questões já importadas via `original_id`.

---

### 4. Frontend (Expo)

```bash
cd app/frontend
npm install
```

**No navegador (web):**
```bash
npx expo start --web
```

**No emulador Android:**
```bash
npx expo run:android
```

**No dispositivo físico:** altere `BASE_URL` em `src/services/api.tsx` para o IP da sua máquina na rede local.

> A URL da API é detectada automaticamente por plataforma:
> - Web (navegador): `localhost:5000`
> - Emulador Android: `10.0.2.2:5000`
> - Dispositivo físico: IP da rede (ex: `192.168.x.x:5000`)

---

### 5. Testes do Backend

```bash
cd app/backend
pytest
```

Os testes usam `create_app(testing=True)` com SQLite em memória — sem necessidade do Docker.

---

## API — Principais Rotas

### Auth `/auth`

| Método | Rota                          | Descrição                         |
|--------|-------------------------------|-----------------------------------|
| POST   | `/auth/register`              | Registra novo aluno               |
| POST   | `/auth/login`                 | Autentica e retorna token JWT     |
| POST   | `/auth/password-reset`        | Solicita redefinição de senha     |
| POST   | `/auth/password-reset/confirm`| Confirma nova senha com token     |

### Questões `/questions`

| Método | Rota                          | Descrição                                        |
|--------|-------------------------------|--------------------------------------------------|
| GET    | `/questions/chapters`         | Lista os 4 capítulos                             |
| GET    | `/questions/topics`           | Lista tópicos (filtro: `?chapter_id=1`)          |
| GET    | `/questions/filtered`         | Quiz filtrado (`?num=5&chapter_id=1&difficulty=2`)|
| GET    | `/questions/professor/<id>`   | Questões do professor                            |
| POST   | `/questions/add`              | Adiciona questão (professor/admin)               |
| PUT    | `/questions/update`           | Atualiza questão                                 |

### Usuários `/users`

| Método | Rota                              | Acesso      |
|--------|-----------------------------------|-------------|
| GET    | `/users/profile/<email>`          | autenticado |
| PUT    | `/users/update-me`                | autenticado |
| DELETE | `/users/delete-me`                | autenticado |
| GET    | `/users/admin/get-all-professors` | admin       |
| POST   | `/users/admin/create-professor`   | admin       |
| GET    | `/users/admin/get-all-alunos`     | admin       |

---

## Fluxo do Quiz

O quiz usa exclusivamente `GET /questions/filtered`. Cada questão retorna:

```json
{
  "id": 397,
  "issue": "Enunciado da questão...",
  "correct_answer": "C",
  "solution": "Explicação detalhada...",
  "alternatives": [
    { "letter": "A", "text": "...", "is_correct": false },
    { "letter": "C", "text": "...", "is_correct": true }
  ]
}
```

A checagem de resposta é feita no cliente — `userAnswer === correct_answer`.

---

## Identidade Visual

| Cor           | Hex       |
|---------------|-----------|
| Verde primário| `#55bf44` |
| Vermelho      | `#f65151` |
| Azul primário | `#0074c3` |
| Azul escuro   | `#093d60` |
