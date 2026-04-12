# Quiz — Fluxo de Dados

> Use quando trabalhar em quiz, resultado, checagem de resposta ou gravação de sessão.

## Endpoint único

O quiz usa **exclusivamente** `GET /questions/filtered`. O endpoint `/rand/<num>` está depreciado.

### Parâmetros

| Parâmetro | Tipo | Padrão | Valores |
|-----------|------|--------|---------|
| `num` | int | 5 | qualquer |
| `chapter_id` | int | — | 1–4 |
| `difficulty` | int | — | 1=Fácil, 2=Médio, 3=Difícil |
| `source` | str | — | vestibular, ENEM, lista, concurso, olimpíada, outro |

### Shape de resposta

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

**Atenção:** questões importadas sem alternativas retornam `alternatives: []`.

## Checagem de resposta — NO CLIENTE

`userAnswer === current.correct_answer` — feita no frontend, **sem chamada ao backend**.

O endpoint `POST /questions/check` existe mas **não é chamado pelo quiz**. Não adicionar checagem server-side ao fluxo atual sem redesenhar o contrato.

## Gravação de sessão

Ao fim de cada quiz, o frontend chama `POST /gamification/record-session` com:
- `correct` — número de acertos
- `total` — total de questões

Essa chamada também escreve em `answer_history` e atualiza XP/streak do aluno.

## Fluxo de telas

```
(tabs)/questions.tsx
  → fetch /questions/chapters no mount
  → passa filtros via router params
  → QuizInProgressScreen (executa o quiz)
  → ResultScreen (mostra score, chama record-session)
  → SolutionScreen (revisão de gabarito)
```
