---
created: 2026-04-25T00:00:00.000Z
title: Assunto personalizado não aparece como chip na próxima criação de questão
area: frontend
files:
  - app/frontend/app/(professor)/AddNewQuestion.tsx
  - app/backend/statl/routes/questions.py
  - app/backend/statl/services/questions_service.py
  - app/backend/statl/repositories/questions_repository.py
---

## Problem

Ao salvar uma questão com assunto personalizado (campo livre "Assunto"), a seção é gravada em `questions.section`. Na próxima abertura do formulário de adicionar questão, o chip correspondente não aparece.

A infra está implementada:
- `GET /questions/sections` retorna seções únicas por professor
- Frontend carrega `/questions/sections` no `useEffect` de mount e popula `savedSections`

Possíveis causas a investigar:
1. O `professor_id` não está sendo gravado junto com a questão quando o assunto é personalizado (se `chapter_id` vier junto, a query de `buscar_secoes_unicas` pode não retornar)
2. O endpoint `/questions/sections` pode estar retornando erro silencioso (o catch loga no console mas não bloqueia a UI)
3. Race condition: o form monta antes da resposta do endpoint chegar e o estado não é atualizado

## Reproduction

1. Abrir formulário Nova Questão como professor
2. Preencher questão completa com assunto personalizado digitado no campo livre (sem selecionar chip de capítulo)
3. Salvar
4. Abrir formulário Nova Questão novamente
5. O assunto digitado **não aparece** como chip na seção "Assunto"

## Expected

O assunto personalizado salvo deve aparecer como chip clicável na próxima sessão.

## Debug hints

- Verificar no console do browser o log `sections error:` ao abrir o form
- Verificar no banco se a questão salva tem `section` preenchido e `professor_id` correto
- Testar `GET /questions/sections` manualmente com o token do professor
