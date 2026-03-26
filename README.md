# Staticlass

Aplicativo mobile de quiz para alunos e professores da disciplina de **Estatística Básica**, desenvolvido no âmbito do projeto PROPET DataSci — Ação 11 (UEM).

O banco de questões é alimentado pela [Apostila Interativa de Estatística Básica](https://daniel-alexandre-ramazzotte.github.io/Estatistica-Basica/) — 356 questões categorizadas por capítulo, tópico e dificuldade.

---

## Visão Geral

O Staticlass permite que alunos pratiquem questões de estatística filtradas por capítulo e dificuldade, acompanhem seu desempenho no ranking e respondam a uma questão diária. Professores podem cadastrar e gerenciar questões. Admins controlam usuários e professores.

### Papéis de usuário

| Papel | Acesso |
|-------|--------|
| `aluno` | Quiz, Questão Diária, Ranking, Histórico, Perfil |
| `professor` | Gerenciar Questões, Criar Listas + tudo do aluno |
| `admin` | Gerenciar Professores e Alunos + tudo acima |

---

## Estrutura do Repositório

```
staticlass/
├── app/
│   ├── backend/          # API Flask (Python)
│   │   └── statl/
│   │       ├── models/       # ORM SQLAlchemy
│   │       ├── repositories/ # Queries SQL (camada de dados)
│   │       ├── services/     # Lógica de negócio
│   │       ├── routes/       # Blueprints Flask (HTTP)
│   │       ├── security/     # Hash de senha, JWT reset
│   │       └── utils/        # Middleware de autenticação
│   └── frontend/         # App React Native (Expo)
│       ├── app/              # Rotas (Expo Router, file-based)
│       │   ├── (public)/     # Login, Registro, Recuperar Senha
│       │   ├── (tabs)/       # Abas: Home, Questões, Diária, Ranking, Perfil
│       │   ├── (app)/        # Quiz: InProgress, Result, Solution, Statistics
│       │   ├── (professor)/  # Gestão de questões e listas
│       │   └── (admin)/      # Gestão de usuários
│       └── src/              # Código compartilhado
│           ├── components/   # AppButton, CustomAccordion
│           ├── constants/    # Paleta de cores, estilos, nomes
│           ├── context/      # AuthContext (JWT)
│           └── services/     # Axios (api.tsx), serviços de auth
├── uploads/              # Imagens de questões (servidas pelo Flask)
├── docker-compose.yml    # MySQL via Docker
└── propet.sql            # Schema SQL de referência
```

---

## Backend

### Pré-requisitos

- Python 3.10+
- MySQL (ou Docker)

### Configuração

Crie o arquivo `app/backend/.env`:

```env
DB_HOST=localhost
DB_USER=flask_user
DB_PASS=staticlass123
DB_NAME=staticlass
SECRET_KEY=sua_chave_secreta_aqui
```

### Subir banco com Docker

```bash
docker compose up -d
```

### Instalar dependências e rodar

```bash
cd app/backend
pip install -r requirements.txt
flask --app statl run
```

O banco é criado automaticamente pelo `db.create_all()` na inicialização — incluindo as tabelas `quiz_resultados` e `questao_diaria_historico`.

### Rodar testes

```bash
cd app/backend
pytest
```

Os testes usam SQLite em memória (`create_app(testing=True)`).

### Arquitetura do Backend

Camadas estritamente separadas: **Routes → Services → Repositories**

- **Routes** — recebem a requisição HTTP, delegam ao service, devolvem JSON
- **Services** — lógica de negócio (validação, regras, montagem de resposta)
- **Repositories** — toda e qualquer query ao banco via SQLAlchemy

### Endpoints

#### Autenticação (`/auth`)

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/auth/register` | Cadastrar novo aluno |
| POST | `/auth/login` | Login — retorna JWT |
| POST | `/auth/password-reset` | Solicitar reset de senha |
| POST | `/auth/password-reset/confirm` | Confirmar novo password |

#### Questões (`/questions`)

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/questions/filtered` | — | Quiz filtrado (`?num=5&chapter_id=1&difficulty=2`) |
| GET | `/questions/chapters` | — | Lista os 4 capítulos |
| GET | `/questions/topics` | — | Lista tópicos (`?chapter_id=1` opcional) |
| GET | `/questions/diaria/status` | JWT | Se o aluno já fez a diária hoje |
| POST | `/questions/diaria/marcar` | JWT | Registrar conclusão da diária |
| POST | `/questions/add` | professor/admin | Adicionar questão |
| PUT | `/questions/update` | professor/admin | Editar questão |

#### Usuários (`/users`)

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/users/ranking` | — | Top 10 alunos por pontuação |
| GET | `/users/historico` | JWT | Histórico de quizzes do usuário logado |
| POST | `/users/salvar-resultado` | JWT | Salvar resultado e ganhar pontos |
| GET | `/users/profile/<email>` | JWT | Perfil do usuário |
| PUT | `/users/update-me` | JWT | Atualizar próprio perfil |

---

## Frontend

### Pré-requisitos

- Node.js 18+
- Expo CLI

### Instalar e rodar

```bash
cd app/frontend
npm install
npx expo start          # Metro bundler (web/QR code)
npx expo run:android    # Build e abrir no emulador Android
```

### URL da API

O arquivo `src/services/api.tsx` define a URL base:

- **Emulador Android**: `http://10.0.2.2:5000/`
- **Dispositivo físico**: altere para o IP da sua máquina na rede local

### Lint

```bash
cd app/frontend
npm run lint
```

### Fluxo de Autenticação

1. `_layout.tsx` envolve o app com `AuthProvider`
2. No startup, lê o JWT de `AsyncStorage` (`@auth_session`)
3. Decodifica e verifica expiração com `jwt-decode`
4. Sem sessão → redireciona para `/(public)/login`
5. Com sessão → redireciona para `/(tabs)/home`

### Fluxo do Quiz

```
questions.tsx
  └─ seleciona filtros (capítulo, dificuldade, quantidade)
      └─ QuizInProgressScreen
          └─ GET /questions/filtered
          └─ usuário responde questão por questão
          └─ checagem local: userAnswer === correct_answer
              └─ ResultScreen
                  └─ POST /users/salvar-resultado  (salva acertos + pontos)
                  └─ POST /questions/diaria/marcar (se era a diária)
                      └─ SolutionScreen (por questão)
```

### Pontuação

Cada acerto vale **10 pontos**, acumulados no campo `score` do usuário. O ranking exibe os alunos em ordem decrescente de pontuação.

---

## Banco de Questões

O app importa 230 questões únicas do projeto [Estatistica-Basica](https://github.com/Daniel-Alexandre-Ramazzotte/Estatistica-Basica), organizadas em:

- **4 capítulos**: Estatística Descritiva, Probabilidade, Inferência, Regressão
- **17 tópicos** distribuídos pelos capítulos
- **Dificuldade** de 1 (Fácil) a 3 (Difícil)

### Importar questões

```bash
cd app/backend
python -m statl.migrate_questoes
# ou com caminho customizado:
python -m statl.migrate_questoes --db-path /caminho/para/questoes.db
```

O script é idempotente — pula questões já importadas (detecta pelo `original_id`).

---

## Paleta de Cores

| Nome | Hex |
|------|-----|
| Verde primário | `#55bf44` |
| Azul primário | `#0074c3` |
| Azul escuro | `#093d60` |
| Vermelho | `#f65151` |

---

## Licença

Projeto acadêmico — PROPET DataSci / UEM.
