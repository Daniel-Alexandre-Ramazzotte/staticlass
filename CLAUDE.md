# CLAUDE.md

## Status

- **Fase ativa**: Phase 06 — Polish & Release (fases 1–5 concluídas)
- **Pendência de lint**: avisos preexistentes no frontend fora dos arquivos tocados — limpar antes do release

## Decisões não-óbvias

- **Checagem de resposta é client-side**: `userAnswer === current.correct_answer` no frontend. `POST /questions/check` existe mas não é usado — não adicionar round-trip ao quiz sem redesenhar o contrato.
- **Expiração de lista é calculada na leitura**: não há background job. Status `encerrada` é derivado do `deadline` no momento do GET.
- **`answer_history` é a única fonte de verdade para analytics**: tanto quiz livre quanto submissão de listas escrevem aqui. Analytics de aluno, professor e admin leem daqui.
- **Dialect risk**: testes usam SQLite in-memory; produção usa PostgreSQL. Evitar `RETURNING`, `RANDOM()` e outros construtos sem fallback.
- **`/rand/<num>` está depreciado**: o quiz usa exclusivamente `/questions/filtered`. A rota antiga ainda existe no código.
- **Código do frontend está em `src/`**: `app/frontend/src/` — não `app/frontend/app/`.

## Identidades de código para grep

| Identificador | Onde vive | Por que importa |
|---------------|-----------|-----------------|
| `@auth_session` | `src/context/AuthContext.tsx` | Chave do AsyncStorage para o JWT — nome não-óbvio |
| `10.0.2.2:5000` | `src/services/api.tsx` | URL do backend no emulador Android — trocar para device físico |
| `original_id` | `statl/models/` + `migrate_questoes` | Campo de idempotência da importação do banco PROPET |
| `require_role` | `statl/utils/auth_middleware.py` | Decorator de proteção de rota; importar daqui |
| `palette` | `src/constants/style.tsx` | Objeto de cores canônico do projeto |
| `seed_demo_data.py` | `app/backend/` | Cria contas admin/prof/aluno de teste e popula histórico |

## Referências GSD

| Necessidade | Arquivo |
|-------------|---------|
| Estado atual, progresso por fase, próximos passos | `.planning/STATE.md` |
| Roadmap, fases, critérios de sucesso, backlog | `.planning/ROADMAP.md` |
| Requisitos validados, decisões técnicas, constraints | `.planning/PROJECT.md` |

## Referências de docs segmentados

| Buscar quando... | Keywords | Arquivo |
|------------------|----------|---------|
| Trabalhando em endpoints / rotas / blueprints | api, route, blueprint, endpoint, prefix | `.planning/docs/api-endpoints.md` |
| Modificando modelos / schema / migrações | table, column, schema, migration, model | `.planning/docs/db-schema.md` |
| Trabalhando no quiz flow / checagem / record-session | quiz, filtered, alternatives, correct_answer, record | `.planning/docs/quiz-flow.md` |
| Trabalhando em telas / navegação / auth redirect | screen, tab, router, redirect, layout, group | `.planning/docs/frontend-screens.md` |
| Aplicando roles / protegendo rotas / criando usuários de teste | require_role, permission, aluno, professor, admin, seed | `.planning/docs/role-patterns.md` |
| Importação / banco de questões / chapters / topics | original_id, migrate, questoes.db, chapter, topic, difficulty | `.planning/docs/question-bank.md` |
| Cores, estilos, componentes, fontes, Tamagui | palette, style, color, font, AppButton, Tamagui | `.planning/docs/ui-conventions.md` |
