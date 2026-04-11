# Staticlass

## What This Is

Staticlass é um app mobile-first (React Native/Expo + Flask) para prática gamificada de estatística, criado como parte do Programa de Ensino Tutorial (PET). Integra-se à apostila *Estatística Básica com Ênfase Computacional* e tem como visão de longo prazo ser o app oficial do Departamento de Estatística, cobrindo desde disciplinas básicas até o bacharelado.

## Core Value

Alunos praticam estatística de forma contínua e engajante — como o Duolingo, mas para o banco de questões real das disciplinas que eles cursam.

## Requirements

### Validated

- ✓ Cadastro e login de alunos, professores e admin com JWT — existing
- ✓ Banco de 230 questões importadas da apostila, organizadas por capítulo e tópico — existing
- ✓ Quiz filtrado por capítulo e dificuldade com checagem no cliente — existing
- ✓ Categorização de questões por fonte — vestibular, ENEM, lista, concurso, olimpíada
- ✓ CRUD de questões pelo professor (adicionar, editar, listar) — existing
- ✓ Gerenciamento de usuários pelo admin — existing
- ✓ Sistema de capítulos e tópicos (4 capítulos, 17 tópicos) — existing
- ✓ Alternativas normalizadas (A-E) com flag is_correct — existing
- ✓ Sistema de XP e streaks — pontos por questão respondida, sequência diária, ranking global
- ✓ Professor cria listas com prazo, seleção manual de questões e publicação para alunos — Phase 4
- ✓ Aluno visualiza, resolve e submete listas atribuídas com status de prazo — Phase 4
- ✓ Professor visualiza submissões, notas e taxa de erro por questão nas listas publicadas — Phase 4

### Active

- [ ] Geração de questões similares — híbrido determinístico + LLM (mesmo processo, contexto variado)
- [ ] Trilha guiada com desbloqueio progressivo — capítulo/tópico desbloqueado ao completar o anterior
- [ ] Repetição espaçada — app sugere revisão com base em desempenho histórico

### Out of Scope

- Chat em tempo real entre alunos/professores — alta complexidade, não é core para prática
- OAuth/login social — email/senha suficiente para v1
- Versão web completa (PWA/SPA) — mobile-first para v1, web é secondary target
- Vídeo-aulas ou conteúdo teórico inline — o app é de prática, não de ensino teórico

## Context

- **PET (Programa de Ensino Tutorial):** Projeto acadêmico, equipe pequena, ciclo de desenvolvimento alinhado ao semestre letivo
- **Apostila:** Desktop/Estatistica-Basica — banco-fonte de questões; script de migração idempotente já implementado
- **Usuários atuais:** Apenas desenvolvedores; primeiro lançamento real planejado para o próximo semestre
- **Stack consolidado:** React Native (Expo Router), Flask/Python, MySQL (Docker), JWT
- **Gamificação:** Inspirada no Duolingo — streaks diários, XP por questão, ranking global entre todos os usuários
- **Dados demo:** `app/backend/seed_demo_data.py` cria contas fictícias para admin/professor/aluno e popula histórico inicial de quizzes/gamificação
- **Expansão futura:** Bacharelado em Estatística → app oficial do departamento, com geração automática de listas/tarefas e integração com múltiplos professores/disciplinas

## Constraints

- **Stack:** React Native + Flask — não trocar frameworks; app existente em produção incipiente
- **Timeline:** V1 operacional até início do próximo semestre letivo (~6 meses)
- **Banco de questões:** Fonte primária é a apostila; geração de similares é incremento, não substituição
- **Roles:** Aluno, Professor, Admin — hierarquia já implementada no JWT, não rearquitetar auth

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Checagem de resposta no cliente | Elimina round-trip, simplifica o quiz flow | — Pending |
| SQLite em testes, MySQL em prod | Dialeto RETURNING/RANDOM() pode divergir | ⚠️ Revisit |
| Importação idempotente via original_id | Permite re-migrar sem duplicar questões | ✓ Good |
| JWT sem refresh token | Simples para v1; pode ser problema em sessões longas | — Pending |
| Status de lista calculado na leitura | Evita job de expiração e mantém professor/aluno consistentes com o prazo real | ✓ Good |
| Question picker compartilhado fora do namespace admin | Professor precisa montar listas sem depender de rota administrativa | ✓ Good |

---
*Last updated: 2026-04-11 after Phase 04 execution*
