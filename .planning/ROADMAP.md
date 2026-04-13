# Roadmap: Staticlass v1

**Milestone:** v1 — First Real Release
**Target:** Next semester launch
**Generated:** 2026-04-08

---

## Phase Overview

| Phase | Name | Status | Plans | Requirements |
|-------|------|--------|-------|--------------|
| 1 | Foundation & Auth Hardening | Complete | 4 | QA-01, QA-02, QA-03, QA-04 |
| 2 | Question Bank Expansion | Complete | 3 | QUEST-01, QUEST-02, QUEST-03 |
| 3 | Gamification | Complete | 4 | GAME-01, GAME-02, GAME-03, GAME-04, GAME-05, GAME-06 |
| 4 | Professor Lists | Complete | 4/4 | LIST-01, LIST-02, LIST-03, LIST-04, LIST-05, LIST-06, LIST-07 |
| 5 | Statistics & Analytics | Complete | 3/3 | STAT-01, STAT-02, STAT-03, STAT-04, STAT-05 |
| 6 | Polish, Release & Turmas | Pending | 5 | POL-01, POL-02, POL-03 |
| 7 | Rich Content nas Questões | Planned | TBD | RICH-01, RICH-02, RICH-03 |

---

## Phases

### Phase 1: Foundation & Auth Hardening

**Goal:** The app is stable, secure, and correctly enforces access rules — every other phase builds on this foundation without carrying forward known bugs.

**Plans:**
1. `01-01` — Register Fix: Eliminate intermittent errors in the registration flow (diagnose `RegisterNewUserService`, validate error propagation from backend to frontend, add regression test)
2. `01-02` — Password Reset Production Fix: Replace hardcoded localhost URL with configurable base URL from environment variable; validate end-to-end on a non-local host
3. `01-03` — Inactive User Gate: Enforce `active` flag on login — `POST /auth/login` rejects users where `active = false` with a clear error message
4. `01-04` — Question Endpoint Authentication: Add `@require_role` to all `/questions` routes so unauthenticated requests get 401; audit that `correct_answer` is not returned in unauthenticated contexts

**Requirements covered:** QA-01, QA-02, QA-03, QA-04
**Depends on:** —

**Success Criteria** (what must be TRUE when this phase completes):
1. A new user can register, receive a confirmation, and log in without encountering any error on the happy path
2. A password-reset link sent in any non-localhost environment opens a working reset page
3. An admin-deactivated user is rejected at login with an informative message, not silently allowed in
4. An unauthenticated GET to `/questions/filtered` returns 401, not question data with correct answers

---

### Phase 2: Question Bank Expansion

**Goal:** Questions carry source metadata and both professors and students can use source as a filter, making the bank meaningfully navigable beyond chapter/difficulty.

**Plans:**
1. `02-01` — Source Field: Add `source` column to the `questions` table (enum: vestibular, ENEM, lista, concurso, olimpíada, outro); expose it in the question schema; migrate existing questions to `outro` as default
2. `02-02` — Professor Filter by Source: Expose `source` as a filter parameter on the question-listing endpoint used by professor tools; update the QuestionsManager UI to show a source filter
3. `02-03` — Student Free-Practice Filter: Add `source` to the `GET /questions/filtered` query params; update the questions tab UI so students can select source alongside chapter and difficulty

**Requirements covered:** QUEST-01, QUEST-02, QUEST-03
**Depends on:** Phase 1 (endpoints now require auth; any new endpoint must follow the same pattern)

**Success Criteria** (what must be TRUE when this phase completes):
1. Every question in the database has a non-null `source` value visible in the professor's question editor
2. A professor building a list can filter the question picker to show only "ENEM" questions and see only those questions
3. A student on the free-practice screen can select "vestibular" as a source filter and receive a quiz drawn only from that subset
**UI hint**: yes

---

### Phase 3: Gamification

**Goal:** Every practice session moves a student's XP and streak forward, and students can see where they stand relative to peers — making daily practice intrinsically rewarding.

**Plans:**
1. `03-01` — XP & Streak Backend: Add `xp` (int), `streak` (int), `last_practice_date` (date) columns to the `users` table; implement `POST /gamification/record-session` that awards XP per correct answer and per completed session, advances streak if practiced today, and resets streak if a day was skipped
2. `03-02` — Ranking Endpoint: Implement `GET /gamification/ranking` returning all active `aluno` users ordered by XP descending, with rank position; paginate or cap at top-100
3. `03-03` — Quiz Integration: Hook the existing quiz result screen to call `record-session` on quiz completion, passing correct-answer count and total questions
4. `03-04` — Gamification UI: Add XP total, current streak, and ranking position to the student profile screen; add a Ranking screen (accessible from the tab bar or profile) showing the leaderboard

**Requirements covered:** GAME-01, GAME-02, GAME-03, GAME-04, GAME-05, GAME-06
**Depends on:** Phase 1 (auth-protected endpoints), Phase 2 (no hard dependency but concurrent streaks encourage completing Phase 2 first)

**Success Criteria** (what must be TRUE when this phase completes):
1. After completing a quiz with N correct answers, the student's XP increases by a visible, consistent amount on their profile
2. A student who practices on two consecutive calendar days sees their streak at 2; a student who skips a day sees it reset to 0 or 1 (depending on whether they practiced that day)
3. The ranking screen loads a list of students in XP order; the current student's own entry is highlighted
4. XP, streak count, and ranking position are all visible without leaving the profile screen
**UI hint**: yes

---

### Phase 4: Professor Lists

**Goal:** Professors can assign curated question lists with deadlines to students, and both sides have a clear workflow — professors compose and publish, students see and submit, professors review results.

**Plans:**
1. `04-01` — List Data Model & Backend: Create `lists` (id, professor_id, title, deadline, published, created_at), `list_questions` (list_id, question_id, order), and `list_submissions` (id, list_id, student_id, submitted_at, score) tables; implement CRUD endpoints under `/lists`
2. `04-02` — Professor List Workflow: Build professor screens — create list (name + deadline), pick questions from the bank (with source/chapter/difficulty filters), publish to all students; show submission stats per list (LIST-06); auto-mark expired lists as encerrada (LIST-07, backend job or flag checked on read)
3. `04-03` — Student List Workflow: Build the student side — a "Minhas Listas" section on the home tab showing assigned lists with deadlines and status; a list-quiz flow that works like the regular quiz but submits a `list_submission` record on completion (LIST-04, LIST-05)
4. `04-04` — Professor Analytics per List: Build the professor view showing per-student completion status, score, and a summary of which questions had the highest error rate (LIST-06, LIST-03 polish)

**Requirements covered:** LIST-01, LIST-02, LIST-03, LIST-04, LIST-05, LIST-06, LIST-07
**Depends on:** Phase 1 (auth), Phase 2 (source filter useful when composing lists)

**Success Criteria** (what must be TRUE when this phase completes):
1. A professor can create a list, add at least 5 questions filtered by source, set a deadline one week out, and publish — all without leaving the app
2. A student logs in and sees the assigned list on their home screen with the deadline clearly shown
3. A student completes the list and submits; the submission is recorded and the list is marked as done on their end
4. After the deadline passes, the list is automatically shown as "encerrada" to both professor and students without manual intervention
5. The professor opens the list results and sees each student's name, whether they submitted, and their score
**UI hint**: yes

---

### Phase 5: Statistics & Analytics

**Goal:** Students understand their own learning trajectory, professors can identify struggling students and problematic questions, and admins can see platform health — all without leaving the app.

**Plans:**
1. `05-01` — Answer History Tracking: Create an `answer_history` table (student_id, question_id, is_correct, answered_at, source: free_practice | list); backfill from `list_submissions` where possible; hook the quiz flow to write a record per answer
2. `05-02` — Student Stats Screen: Build the student analytics screen — total questions answered, accuracy rate overall and broken down by chapter and topic, and a simple time-series chart of accuracy over the past 4 weeks (STAT-01, STAT-05)
3. `05-03` — Professor & Admin Stats: Build professor stats for their lists (STAT-02, STAT-03) — completion rate, score distribution, per-student breakdown; build admin global stats screen (STAT-04) — daily active users, questions answered, accuracy by topic, professor/student activity counts; all presented with bar charts or tables (STAT-05)

**Requirements covered:** STAT-01, STAT-02, STAT-03, STAT-04, STAT-05
**Depends on:** Phase 3 (answer data flows through quiz), Phase 4 (list submission data feeds professor stats)

**Success Criteria** (what must be TRUE when this phase completes):
1. A student opens their stats screen and sees at minimum: total questions answered, overall accuracy percentage, and accuracy broken down by chapter
2. A bar chart or line chart is visible on the student stats screen reflecting real data from their quiz history
3. A professor opens a published list and sees what percentage of assigned students submitted and which questions had error rates above 50%
4. An admin opens the admin dashboard and sees platform-wide activity numbers (active users last 7 days, total answers recorded) without querying the database manually
**UI hint**: yes

---

### Phase 6: Polish, Release & Turmas

**Goal:** The app is stable, tested under real usage conditions, and ready to hand to real students and professors at the start of the semester — including a class (turma) system so professors assign lists to specific groups instead of all students.

**Plans:** 5 plans

Plans:
- [x] 06-01-PLAN.md — E2E walkthrough + production config cleanup (debug prints, env vars, .env.example)
- [x] 06-02-PLAN.md — Email verification deep link: staticlass:// scheme, verify-email screen, resend flow
- [x] 06-03-PLAN.md — Interactive attendance calendar: monthly grid, month navigation, sourced from answer_history
- [x] 06-04-PLAN.md — Sistema de Turmas backend: turmas + turma_alunos tables, CRUD API, lists filter
- [x] 06-05-PLAN.md — Sistema de Turmas frontend: TurmaManager, TurmaEditor, CreateNewList picker

**Requirements covered:** POL-01, POL-02, POL-03

**Additional requirements added to Phase 6 scope:**
- `POL-01` — Email Verification: New accounts require email verification before first login; existing users and admin-created accounts are unaffected
- `POL-02` — Interactive Attendance Calendar: Student profile shows a real interactive monthly calendar reflecting actual practice days from `answer_history`; replaces the current static calendar widget
- `POL-03` — Sistema de Turmas: Professors can create named classes, enroll students, and publish lists to a specific class; students only see lists from their enrolled classes

**Depends on:** Phase 1, Phase 2, Phase 3, Phase 4, Phase 5

**Success Criteria** (what must be TRUE when this phase completes):
1. A new student account created from scratch can complete a free-practice quiz, see their XP update, view the ranking, and check their stats — all in one uninterrupted session
2. A professor account can create and publish a list, a student can submit it, and the professor can see that student's result — all without any 500 errors or broken screens
3. The app runs correctly against the production PostgreSQL instance on Fly.io with no localhost references remaining in config
4. Every screen has a non-empty state or loading indicator — no blank white screens visible to end users
5. A newly registered student receives a verification email; attempting to log in before verifying returns a clear error message
6. The student profile calendar is interactive (month navigation), shows real practice days from `answer_history`, and is locked to the current year
7. A professor creates a turma, enrolls two students, publishes a list to that turma — only those two students see the list on their home screen
**UI hint**: yes

---

### Phase 7: Rich Content nas Questões

**Goal:** Questões, alternativas e resoluções suportam LaTeX inline e imagens com posicionamento livre — professores podem criar conteúdo rico sem sair do app, e alunos visualizam fórmulas e figuras renderizadas corretamente. Inclui também a infraestrutura de email em produção para fechar o fluxo de verificação de conta e recuperação de senha.

**Plans:** TBD

**Requirements covered:** RICH-01, RICH-02, RICH-03, AUTH-05

**Requirements:**
- `AUTH-05` — Email Delivery em Produção: serviço SMTP (Gmail/SendGrid/Mailgun) configurado e testado em produção; variáveis `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_SENDER_NAME` documentadas em `.env.example`; fluxos de verificação de conta e recuperação de senha validados de ponta a ponta no ambiente Fly.io
- `RICH-01` — LaTeX Rendering: fórmulas LaTeX inline renderizadas em questões, alternativas e resoluções (usando react-native-mathjax ou similar)
- `RICH-02` — Imagens em Questões: professores associam imagens a questões com posicionamento configurável (antes, depois ou no meio do texto); 2 questões de exemplo com placeholders estáticos
- `RICH-03` — Questões de Resposta Aberta: novo tipo de questão sem alternativas fixas; aluno digita a resposta; professor ou gabarito textual faz a correção

**Depends on:** Phase 6

**Success Criteria** (what must be TRUE when this phase completes):
1. Um aluno se cadastra, recebe o email de verificação, clica no link `staticlass://verify-email?token=...`, e consegue fazer login — tudo em produção (Fly.io)
2. Um aluno usa "Esqueci minha senha", recebe o email com link `staticlass://reset-password?token=...`, define uma nova senha, e faz login — tudo em produção
3. Uma questão com LaTeX (`$\mu = \bar{x}$`) é renderizada como fórmula em todas as telas onde questões aparecem (quiz, lista, resolução)
4. Um professor cria uma questão com uma imagem posicionada antes do enunciado — alunos veem a imagem acima do texto ao responder
5. Existe ao menos 1 questão de exemplo com imagem no banco após o seeding de demo data
6. Um professor cria uma questão de resposta aberta; o aluno a vê no quiz com campo de texto livre em vez de alternativas A–E

---

## Requirement Coverage

| Requirement | Phase | Status |
|-------------|-------|--------|
| QA-01 | Phase 1 | Complete |
| QA-02 | Phase 1 | Complete |
| QA-03 | Phase 1 | Complete |
| QA-04 | Phase 1 | Complete |
| QUEST-01 | Phase 2 | Complete |
| QUEST-02 | Phase 2 | Complete |
| QUEST-03 | Phase 2 | Complete |
| GAME-01 | Phase 3 | Complete |
| GAME-02 | Phase 3 | Complete |
| GAME-03 | Phase 3 | Complete |
| GAME-04 | Phase 3 | Complete |
| GAME-05 | Phase 3 | Complete |
| GAME-06 | Phase 3 | Complete |
| LIST-01 | Phase 4 | Complete |
| LIST-02 | Phase 4 | Complete |
| LIST-03 | Phase 4 | Complete |
| LIST-04 | Phase 4 | Complete |
| LIST-05 | Phase 4 | Complete |
| LIST-06 | Phase 4 | Complete |
| LIST-07 | Phase 4 | Complete |
| STAT-01 | Phase 5 | Complete |
| STAT-02 | Phase 5 | Complete |
| STAT-03 | Phase 5 | Complete |
| STAT-04 | Phase 5 | Complete |
| STAT-05 | Phase 5 | Complete |
| POL-01 | Phase 6 | Pending |
| POL-02 | Phase 6 | Pending |
| POL-03 | Phase 6 | Pending |
| AUTH-05 | Phase 7 | Planned |
| RICH-01 | Phase 7 | Planned |
| RICH-02 | Phase 7 | Planned |
| RICH-03 | Phase 7 | Planned |

**Coverage:** 32/32 requirements mapped. No orphans.

---

## Backlog

### Phase 999.1: Professor Question PR Workflow (BACKLOG)

**Goal:** Professores podem propor criação de novas questões e edições em questões existentes por meio de um fluxo de revisão estilo pull request, com aprovação administrativa antes de publicar no banco principal.
**Requirements:** TBD
**Plans:** 0 plans

---

### Phase 999.2: LaTeX List Import (BACKLOG)

**Goal:** Professores podem criar listas de exercícios colando ou enviando um arquivo LaTeX — o sistema extrai automaticamente enunciados, alternativas e gabarito e popula o banco de questões, reduzindo o esforço de digitalização de provas e listas físicas.
**Requirements:** TBD
**Plans:** 0 plans

---

---

*Roadmap generated: 2026-04-08*
*Granularity: standard (7 phases)*
