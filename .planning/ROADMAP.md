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
| 4 | Professor Lists | Pending | 4 | LIST-01, LIST-02, LIST-03, LIST-04, LIST-05, LIST-06, LIST-07 |
| 5 | Statistics & Analytics | Pending | 3 | STAT-01, STAT-02, STAT-03, STAT-04, STAT-05 |
| 6 | Polish & Release | Pending | 3 | — (cross-cutting) |

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

### Phase 6: Polish & Release

**Goal:** The app is stable, tested under real usage conditions, and ready to hand to real students and professors at the start of the semester.

**Plans:**
1. `06-01` — End-to-End Testing & Bug Fixes: Run full manual walkthroughs of every user flow (register → quiz → gamification → list → stats) across the three roles; document and fix blocking bugs found
2. `06-02` — Production Environment Validation: Verify the app connects correctly to the production MySQL instance (not Docker dev), all environment variables are set, password reset links resolve correctly, image uploads work; fix any remaining SQLite/MySQL dialect issues
3. `06-03` — UX Tightening: Address rough edges found in testing — loading states, empty states, error messages, navigation dead ends; ensure the app is usable by someone who has never seen it before

**Requirements covered:** (no new requirements — this phase validates all 25 v1 requirements work together in production)
**Depends on:** Phase 1, Phase 2, Phase 3, Phase 4, Phase 5

**Success Criteria** (what must be TRUE when this phase completes):
1. A new student account created from scratch can complete a free-practice quiz, see their XP update, view the ranking, and check their stats — all in one uninterrupted session
2. A professor account can create and publish a list, a student can submit it, and the professor can see that student's result — all without any 500 errors or broken screens
3. The app runs correctly against the production database with no localhost references remaining in config
4. Every screen has a non-empty state or loading indicator — no blank white screens visible to end users
**UI hint**: yes

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

**Coverage:** 25/25 v1 requirements mapped. No orphans.

---

*Roadmap generated: 2026-04-08*
*Granularity: standard (6 phases)*
