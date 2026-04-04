# Análise do Banco de Dados do Staticlass

## Visão Geral

O backend agora está padronizado para `PostgreSQL`.

A implementação usa:

- `Flask-SQLAlchemy` para conexão, sessão e criação inicial das tabelas
- modelos ORM em `app/backend/statl/models/`
- SQL explícito nos repositórios em `app/backend/statl/repositories/`
- um script de importação do banco de questões SQLite para PostgreSQL em `app/backend/statl/migrate_questoes.py`

O fluxo de persistência continua em camadas:

`routes -> services -> repositories -> banco`

## Conexão e inicialização

O ponto central é `app/backend/statl/__init__.py`.

Regras atuais:

- em runtime normal, o backend exige `DATABASE_URL`
- se a URL vier com prefixo `postgres://`, ela é normalizada para `postgresql://`
- em testes, a aplicação usa `sqlite:///:memory:`
- no startup, o app carrega os modelos e executa `db.create_all()`

Isso significa que o schema operacional é derivado diretamente dos modelos Python.

## Tabelas principais

### `users`

Arquivo: `app/backend/statl/models/user.py`

Campos principais:

- `id`
- `email`
- `password_hash`
- `name`
- `role`
- `score`
- `active`

Uso:

- autenticação
- controle de perfil e papéis
- ranking
- vínculo com histórico de quiz e autoria de questões

### `questions`

Arquivo: `app/backend/statl/models/questions.py`

Campos principais:

- `id`
- `issue`
- `correct_answer`
- `solution`
- `image_q`
- `image_s`
- `original_id`
- `section`
- `difficulty`
- `needs_fix`
- `chapter_id`
- `topic_id`
- `professor_id`

Observações:

- `original_id` é usado para evitar duplicidade na importação
- `professor_id` registra autoria de questões criadas manualmente
- a tabela não guarda mais alternativas em colunas separadas

### `alternatives`

Arquivo: `app/backend/statl/models/questions.py`

Campos:

- `id`
- `question_id`
- `letter`
- `text`
- `is_correct`

Função:

- armazenar as alternativas de forma normalizada
- substituir o formato antigo com `answer_a ... answer_e`

Relação:

- `question_id -> questions.id`
- exclusão em cascata

### `chapters`

Arquivo: `app/backend/statl/models/chapters.py`

Campos:

- `id`
- `name`
- `number`

Função:

- organizar as questões por capítulo

### `topics`

Arquivo: `app/backend/statl/models/chapters.py`

Campos:

- `id`
- `name`
- `chapter_id`

Função:

- organizar subtópicos por capítulo

### `quiz_resultados`

Arquivo: `app/backend/statl/models/quiz_resultado.py`

Campos:

- `id`
- `usuario_id`
- `acertos`
- `total`
- `capitulo_id`
- `dificuldade`
- `criado_em`

Função:

- armazenar cada tentativa de quiz
- alimentar o histórico do aluno
- servir de base para evolução do score

### `questao_diaria_historico`

Arquivo: `app/backend/statl/models/questao_diaria.py`

Campos:

- `id`
- `usuario_id`
- `data`

Restrição importante:

- `UniqueConstraint(usuario_id, data)`

Função:

- impedir múltiplos registros da questão diária no mesmo dia para o mesmo aluno

## Como as questões são persistidas

### Questões importadas

Fonte:

- `banco_questoes/questoes.db`

O script `app/backend/statl/migrate_questoes.py`:

1. lê `chapters`, `topics`, `questions` e `alternatives` do SQLite
2. insere capítulos e tópicos no PostgreSQL se ainda não existirem
3. importa questões para `questions`
4. importa alternativas para `alternatives`
5. usa `original_id` para evitar duplicidade

Mapeamento principal:

- `statement` do SQLite -> `issue`
- `answer_key` -> `correct_answer`
- `explanation` -> `solution`

### Questões criadas por professor

Fluxo:

1. o frontend envia `POST /questions/add`
2. o backend valida o payload em `services/questions_service.py`
3. as alternativas são normalizadas em memória
4. a questão é inserida em `questions`
5. as alternativas são inseridas em `alternatives`
6. o `professor_id` vem do JWT, não do cliente

Isso elimina a dependência de campos antigos como:

- `answer_a`
- `answer_b`
- `answer_c`
- `answer_d`
- `answer_e`
- `id_subject`
- `id_professor`
- tabela `subjects`

## Como o banco é consultado

### Quiz filtrado

Rota: `GET /questions/filtered`

Consulta:

- filtra `questions` por `chapter_id`, `topic_id` e `difficulty`
- aplica `ORDER BY RANDOM()`
- carrega as alternativas da tabela `alternatives`

### Ranking

Rota: `GET /users/ranking`

Consulta:

- lê `users`
- filtra `role = 'aluno'`
- ordena por `score DESC`

### Histórico

Rota: `GET /users/historico`

Consulta:

- lê `quiz_resultados`
- faz `LEFT JOIN` com `chapters`

### Questão diária

Rotas:

- `GET /questions/diaria/status`
- `POST /questions/diaria/marcar`

Persistência:

- consulta e gravação em `questao_diaria_historico`
- duplicidade tratada com `ON CONFLICT (usuario_id, data) DO NOTHING`

## O que foi removido do legado

O backend não depende mais de:

- fallback MySQL na configuração
- `pymysql`
- `dbcfg.py`
- `propet.sql`
- script MySQL separado para migração
- colunas de alternativas embutidas em `questions`
- tabela `subjects`

O projeto passou a ter um único caminho operacional de banco: `PostgreSQL`.

## Arquivos-chave

- `app/backend/statl/__init__.py`
- `app/backend/statl/models/user.py`
- `app/backend/statl/models/questions.py`
- `app/backend/statl/models/chapters.py`
- `app/backend/statl/models/quiz_resultado.py`
- `app/backend/statl/models/questao_diaria.py`
- `app/backend/statl/repositories/questions_repository.py`
- `app/backend/statl/repositories/user_repository.py`
- `app/backend/statl/repositories/resultado_repository.py`
- `app/backend/statl/migrate_questoes.py`
- `banco_questoes/schema_sqlite.sql`
