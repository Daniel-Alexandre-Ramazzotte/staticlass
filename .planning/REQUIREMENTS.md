# Requirements: Staticlass

**Defined:** 2026-04-08
**Core Value:** Alunos praticam estatística de forma contínua e engajante — como o Duolingo, mas para o banco de questões real das disciplinas que eles cursam.

## v1 Requirements

Requirements for the first real release (next semester).

### Gamificação

- [ ] **GAME-01**: Aluno acumula XP ao responder questões corretamente
- [ ] **GAME-02**: Aluno acumula XP ao completar sessões de prática (mesmo com erros)
- [ ] **GAME-03**: Aluno mantém streak diário ao praticar pelo menos uma vez por dia
- [ ] **GAME-04**: Aluno perde streak ao pular um dia sem praticar
- [ ] **GAME-05**: Ranking global lista todos os alunos por XP acumulado
- [ ] **GAME-06**: Aluno visualiza seu próprio XP, streak atual e posição no ranking no perfil

### Listas (Professor)

- [ ] **LIST-01**: Professor cria lista de questões selecionando manualmente do banco
- [ ] **LIST-02**: Professor define prazo de entrega para a lista
- [ ] **LIST-03**: Professor publica lista para alunos (turma ou individual)
- [ ] **LIST-04**: Aluno visualiza listas atribuídas a ele na tela inicial
- [ ] **LIST-05**: Aluno resolve lista atribuída e submete resultado
- [ ] **LIST-06**: Professor visualiza quem concluiu a lista e o desempenho de cada aluno
- [ ] **LIST-07**: Lista expirada (prazo passado) é marcada como encerrada automaticamente

### Banco de Questões

- [ ] **QUEST-01**: Questões podem ser categorizadas por fonte (vestibular, ENEM, lista, concurso, olimpíada, etc.)
- [ ] **QUEST-02**: Professor filtra banco de questões por fonte ao montar uma lista
- [ ] **QUEST-03**: Aluno pode filtrar prática livre por fonte além de capítulo e dificuldade

### Estatísticas e Analytics

- [ ] **STAT-01**: Aluno visualiza suas próprias estatísticas — total de questões respondidas, taxa de acerto por tópico/capítulo, evolução ao longo do tempo
- [ ] **STAT-02**: Professor visualiza estatísticas das suas listas — taxa de conclusão, distribuição de notas, questões com maior taxa de erro
- [ ] **STAT-03**: Professor visualiza estatísticas por aluno dentro de uma lista — acertos, erros, tempo (se disponível)
- [ ] **STAT-04**: Admin visualiza estatísticas globais — uso do app, desempenho geral por tópico, atividade de professores e alunos
- [ ] **STAT-05**: Estatísticas são apresentadas com gráficos e tabelas simples (barras, pizza ou linha)

### Qualidade e Correção

- [ ] **QA-01**: Fluxo de cadastro (Register) funciona sem erros intermitentes
- [ ] **QA-02**: Link de reset de senha é funcional em produção (não hardcoded localhost)
- [ ] **QA-03**: Usuários inativos não conseguem fazer login
- [ ] **QA-04**: Endpoints de questões exigem autenticação (correta answer não exposta publicamente)

## v2 Requirements

Deferred to future release — tracked but not in current roadmap.

### Trilha Guiada

- **TRAIL-01**: Capítulo/tópico é desbloqueado ao completar o anterior com nota mínima
- **TRAIL-02**: Aluno visualiza mapa de progresso da trilha
- **TRAIL-03**: Trilha recomenda próximo tópico a estudar

### Repetição Espaçada

- **SRS-01**: App registra histórico de desempenho por questão/tópico por aluno
- **SRS-02**: App sugere sessão de revisão com base em desempenho (algoritmo SRS)
- **SRS-03**: Modo "Revisão" aplica questões priorizadas pelo SRS

### Geração de Questões Similares

- **GEN-01**: Questão-base pode gerar variações com mesmo processo de resolução mas contexto narrativo diferente
- **GEN-02**: Variações parametrizadas (dados numéricos trocados deterministicamente)
- **GEN-03**: Variações narrativas (LLM muda a "historinha" mantendo o conceito)
- **GEN-04**: Validação de tolerância — questões muito simples não geram variações sem sentido

### Expansão Departamental

- **DEPT-01**: Múltiplas turmas/disciplinas por professor
- **DEPT-02**: Geração automática de listas por critérios (tópico, dificuldade, fonte)
- **DEPT-03**: Relatórios de desempenho por turma para o professor
- **DEPT-04**: App suporta questões do bacharelado em Estatística (além da ementa básica)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Chat/mensagens em tempo real | Alta complexidade, não é core para prática de questões |
| OAuth / login social | Email/senha suficiente para v1; adicionar depois se necessário |
| Vídeo-aulas ou conteúdo teórico | O app é de prática, não de ensino — conteúdo fica na apostila |
| PWA / versão web completa | Mobile-first para v1; web como secondary target depois |
| Pagamentos / plano premium | Projeto acadêmico/PET — acesso gratuito |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| QA-01 | Phase 1 | Pending |
| QA-02 | Phase 1 | Pending |
| QA-03 | Phase 1 | Pending |
| QA-04 | Phase 1 | Pending |
| QUEST-01 | Phase 2 | Pending |
| QUEST-02 | Phase 2 | Pending |
| QUEST-03 | Phase 2 | Pending |
| GAME-01 | Phase 3 | Pending |
| GAME-02 | Phase 3 | Pending |
| GAME-03 | Phase 3 | Pending |
| GAME-04 | Phase 3 | Pending |
| GAME-05 | Phase 3 | Pending |
| GAME-06 | Phase 3 | Pending |
| LIST-01 | Phase 4 | Pending |
| LIST-02 | Phase 4 | Pending |
| LIST-03 | Phase 4 | Pending |
| LIST-04 | Phase 4 | Pending |
| LIST-05 | Phase 4 | Pending |
| LIST-06 | Phase 4 | Pending |
| LIST-07 | Phase 4 | Pending |
| STAT-01 | Phase 5 | Pending |
| STAT-02 | Phase 5 | Pending |
| STAT-03 | Phase 5 | Pending |
| STAT-04 | Phase 5 | Pending |
| STAT-05 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 25 total
- Mapped to phases: 25 ✓
- Unmapped: 0

---
*Requirements defined: 2026-04-08*
*Last updated: 2026-04-08 — phase assignments added after roadmap creation*
