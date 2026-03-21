# Staticlass

Plataforma educacional de quizzes voltada para o ambiente escolar, com papéis distintos para alunos, professores e administradores.

## Stack

| Camada     | Tecnologia                          |
|------------|-------------------------------------|
| Frontend   | React Native (Expo)                 |
| Backend    | Python + Flask                      |
| Banco      | MySQL                               |
| Auth       | JWT (Flask-JWT-Extended)            |
| Email      | Flask-Mail                          |

---

## Estrutura do Projeto

```
staticlass/
├── app/
│   ├── backend/
│   │   └── statl/
│   │       ├── models/          # Modelos SQLAlchemy
│   │       ├── repositories/    # Acesso ao banco de dados (SQL puro)
│   │       ├── routes/          # Endpoints Flask (auth, users, questions)
│   │       ├── services/        # Regras de negócio
│   │       ├── security/        # Hash de senha e geração de tokens
│   │       └── utils/           # Middlewares e formulários
│   └── frontend/
│       └── app/
│           ├── (admin)/         # Telas do administrador
│           ├── (professor)/     # Telas do professor
│           ├── (app)/           # Telas do aluno (quiz, ranking, resultados)
│           ├── (tabs)/          # Navegação por abas (home, perfil, questões)
│           ├── (public)/        # Login, registro e recuperação de senha
│           ├── components/      # Componentes reutilizáveis
│           ├── context/         # Contexto de autenticação
│           └── services/        # Chamadas à API REST
```

---

## Funcionalidades

### Aluno
- Registro e login com JWT
- Realizar quizzes de múltipla escolha (A a E)
- Ver solução das questões após resposta
- Acompanhar ranking e estatísticas pessoais

### Professor
- Criar e gerenciar questões
- Criar e gerenciar listas de questões

### Administrador
- Criar e gerenciar professores
- Visualizar e gerenciar alunos
- Acesso ao painel administrativo completo

### Autenticação
- Login com email e senha
- Recuperação de senha via email (token temporário)
- Controle de acesso por papel (`aluno`, `professor`, `admin`)

---

## Configuracao

### Backend

1. Crie um arquivo `.env` dentro de `app/backend/` com:

```env
DB_USER=usuario_mysql
DB_PASS=senha_do_usuario
DB_HOST=localhost
DB_PORT=3306
DB_NAME=nome_do_banco
SECRET_KEY=sua_chave_secreta
```

2. Instale as dependencias:

```bash
pip install -r app/backend/requirements.txt
```

3. Inicie o servidor:

```bash
flask --app backend/statl run --debug
```

### Frontend

1. Instale as dependencias:

```bash
cd app/frontend
npm install
```

2. Inicie no Android (fisico ou emulado):

```bash
npx expo start --android
```

---

## Rotas da API

### Auth — `/auth`

| Metodo | Rota                        | Descricao                        |
|--------|-----------------------------|----------------------------------|
| POST   | `/auth/register`            | Registra novo aluno              |
| POST   | `/auth/login`               | Autentica e retorna token JWT    |
| POST   | `/auth/password-reset`      | Solicita redefinicao de senha    |
| POST   | `/auth/password-reset/confirm` | Confirma nova senha com token |

### Usuarios — `/users`

| Metodo | Rota                            | Acesso     |
|--------|---------------------------------|------------|
| PUT    | `/users/update/<id>`            | admin      |
| PUT    | `/users/update-me`              | autenticado|
| DELETE | `/users/delete/<id>`            | admin      |
| DELETE | `/users/delete-me`              | autenticado|
| GET    | `/users/profile/<email>`        | publico    |
| GET    | `/users/admin/get-all-professors` | admin    |
| POST   | `/users/admin/create-professor` | admin      |
| GET    | `/users/admin/get-all-alunos`   | admin      |

### Questoes — `/questions`

Gerenciamento de questoes de multipla escolha com enunciado, alternativas A-E, resposta correta e solucao explicativa.
