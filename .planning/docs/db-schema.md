# DB Schema — Tabelas não-óbvias

> Use quando modificar modelos, escrever migrações ou criar queries.
> Tabelas padrão (users, questions) não estão aqui — use Grep para inspecioná-las.

## Tabelas adicionadas pelo PROPET

| Tabela | Descrição |
|--------|-----------|
| `chapters` | 4 capítulos do livro: Descritiva, Probabilidade, Inferência, Regressão |
| `topics` | 17 tópicos; cada um tem `chapter_id` |
| `alternatives` | Alternativas A–E por questão; campo `is_correct` indica gabarito |
| `answer_history` | Registro canônico de toda resposta do aluno (prática livre + listas) |
| `lists` | Listas criadas pelo professor com deadline e flag published |
| `list_questions` | Associação lista ↔ questão com campo `order` |
| `list_submissions` | Submissão de aluno a uma lista; contém score e timestamp |

## Campos adicionados a `questions`

| Campo | Tipo | Observação |
|-------|------|------------|
| `chapter_id` | FK | Liga questão ao capítulo |
| `topic_id` | FK | Liga questão ao tópico |
| `difficulty` | int 1–3 | 1=Fácil, 2=Médio, 3=Difícil |
| `section` | str | Seção da apostila de origem |
| `needs_fix` | bool | Flag de questão problemática para revisão |
| `original_id` | str | ID na fonte SQLite; controla idempotência da importação |
| `source` | enum | vestibular, ENEM, lista, concurso, olimpíada, outro |

## `answer_history` — schema relevante

```
student_id    FK → users
question_id   FK → questions
is_correct    bool
answered_at   datetime
source        enum: free_practice | list
```

Esta tabela é a **única fonte de verdade** para analytics de aluno, professor e admin.
Tanto o quiz livre quanto a submissão de listas escrevem aqui.

## Nota sobre dialect

Testes usam SQLite in-memory; produção usa PostgreSQL.
Evite usar `RETURNING`, `RANDOM()`, ou outros construtos dialect-específicos sem fallback.
