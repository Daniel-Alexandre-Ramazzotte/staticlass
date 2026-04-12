# Banco de Questões — Importação e Estrutura

> Use quando trabalhar na migração, nos filtros de questões, ou nos modelos Chapter/Topic.

## Origem

Repositório [Estatistica-Basica](https://github.com/Daniel-Alexandre-Ramazzotte/Estatistica-Basica).
SQLite source: `Desktop/Estatistica-Basica/banco_questoes/questoes.db`

## Números reais

- 356 questões no SQLite de origem
- **230 únicas importadas** — 126 têm `original_id` duplicado na fonte e são puladas
- Questões sem alternativas retornam `alternatives: []` — isso é esperado, não é bug

## Script de importação

```bash
cd app/backend
python -m statl.migrate_questoes
# ou especificando o caminho:
python -m statl.migrate_questoes --db-path /caminho/para/questoes.db
```

**Idempotente:** detecta questões já importadas pelo campo `original_id`. Pode ser re-executado sem duplicar dados.

## Estrutura

- **4 capítulos:** Descritiva, Probabilidade, Inferência, Regressão
- **17 tópicos** distribuídos entre os capítulos
- **Dificuldade:** 1=Fácil, 2=Médio, 3=Difícil (campo `difficulty` em `questions`)

## Source enum

Valores válidos para o campo `source` de uma questão:

```
vestibular | ENEM | lista | concurso | olimpíada | outro
```

Default para questões importadas: `outro`.
