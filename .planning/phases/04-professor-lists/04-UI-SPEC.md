---
phase: 4
slug: professor-lists
status: draft
shadcn_initialized: false
preset: none
created: 2026-04-11
---

# Phase 4 — UI Design Contract: Professor Lists

> Visual and interaction contract for Phase 4 frontend work. Generated locally after the UI-phase agent stalled, using the same GSD contract shape the planner expects.
> This phase adds four connected experiences: professor list authoring, professor list management/results, student home-card access to assigned lists, and a list-solving handoff through the existing quiz/result flow.

---

## Layout References

Visual ground truth and current code anchors that implementors MUST consult before editing screens:

| File | Surface | What it defines for Phase 4 |
|------|---------|-----------------------------|
| `app/frontend/app/(tabs)/listas.tsx` | Professor tab entry | Existing split entry model with `Criar lista` and `Gerenciar Listas`; keep this mental model intact. |
| `app/frontend/app/(professor)/CreateNewList.tsx` | Professor create screen | Placeholder to replace with a builder flow for title, deadline, draft metadata, question selection, publish, and change log. |
| `app/frontend/app/(professor)/ListManager.tsx` | Professor management/results screen | Placeholder to replace with summary-first list cards, status badges, and drill-down access. |
| `app/frontend/app/(tabs)/home.tsx` | Student home | Target surface for the `Minhas Listas` section; must feel like part of the home screen, not a hidden secondary route. |
| `app/frontend/app/(admin)/QuestaoViewer.tsx` | Shared question browser | Current filter, search, pagination, and question-card patterns to preserve while moving the route out of the admin namespace. |
| `app/frontend/app/(app)/QuizInProgressScreen.tsx` | Quiz runner | Existing question-play flow that list resolution should reuse rather than reimplement. |
| `app/frontend/app/(app)/ResultScreen.tsx` | Post-quiz handoff | Existing result handoff; extend with list-submission outcome/status, not a separate results screen. |
| `app/frontend/src/components/admin/EstatisticasCompartilhadas.tsx` | Summary-first analytics cards | Existing expandable metric-card pattern to adapt for professor list results. |

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none — React Native with Tamagui and React Native primitives |
| Preset | not applicable |
| Component library | Tamagui (`YStack`, `XStack`, `Text`, `Button`, `ScrollView`) + React Native base components |
| Icon library | `@tamagui/lucide-icons` for tabs/shared screens, `lucide-react-native` where already established |
| Font | `primaryFontA` for main headings, `primaryFontC` for supporting body/copy, preserve current style constants |

Source: `app/frontend/app/(tabs)/listas.tsx`, `app/frontend/app/(tabs)/home.tsx`, `app/frontend/src/components/admin/EstatisticasCompartilhadas.tsx`, `app/constants/style`.

---

## Spacing Scale

Declared values (must remain multiples of 4, aligned to current Tamagui usage):

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px (`$1`) | Inline metadata gaps, badge insets, dense label spacing |
| sm | 8px (`$2`) | Chip gaps, compact row spacing, icon-to-label spacing |
| md | 16px (`$4`) | Default card padding, body horizontal padding, section gaps |
| lg | 24px (`$6`) | Separation between major blocks inside a screen, stacked CTA spacing |
| xl | 32px (`$8`) | Main screen top padding below headers, large section gaps |
| 2xl | 48px | Hero-card or summary block separation on management/results screens |
| 3xl | 64px | Reserved for page-level bottom spacing on long scroll views |

Exceptions:
- Minimum tap height for any primary action, list card CTA, or change-log row expander is 44px.
- Deadline/status chips may use denser vertical padding, but chip height must stay at or above 32px.
- Student `Minhas Listas` cards on home may compress body copy, but must keep 16px outer card padding and 12px internal row gap minimum.

---

## Typography

Use exactly four display roles for all new Phase 4 UI:

| Role | Size | Weight | Line Height | Font Family | Usage |
|------|------|--------|-------------|-------------|-------|
| Display | 26px | 900 | 1.15 | `primaryFontA` | Screen greetings and high-emphasis section headings on entry surfaces |
| Heading | 20px | 700 | 1.2 | `primaryFontA` | Screen titles, card titles, summary section headers |
| Body | 15px | 400 | 1.45 | `primaryFontC` | Card body copy, question-list metadata, change-log entries, result labels |
| Label | 12px | 600 | 1.3 | default/system | Status chips, helper text, metadata captions, deadline labels |

Rules:
- Use `primaryFontA` only for titles/headings, not for dense body text or table-like analytics rows.
- Use `primaryFontC` for explanatory copy, student card body text, change-log text, and empty-state descriptions.
- Numeric summary values may use Heading size with bold weight but must not introduce a fifth size.
- Late-state timestamps are `Label` size, never larger than the surrounding primary score text.

---

## Color

Phase 4 must stay inside the established Staticlass palette and reserve color semantics consistently:

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `palette.offWhite` / `#fcfcfc` | Screen backgrounds, neutral card surfaces, body canvas |
| Secondary (30%) | `palette.primaryBlue` / `palette.darkBlue` | Headers, structural sections, primary information bands, inactive secondary controls |
| Accent (10%) | `palette.primaryGreen` | Publish/submit/confirm actions, positive completion states, highlighted aggregate metrics |
| Warning / Late | `#f57c00` | Late-submission badges, near-deadline emphasis, edited-after-publication timeline markers |
| Destructive | `palette.red` | Delete/archive/discard actions only |

Accent reserved for:
- `Publicar lista`
- `Entregar lista`
- Completed / submitted success callouts
- Primary metric highlight on professor summary cards

Warning reserved for:
- `Fora do prazo`
- `Prazo hoje`
- Edit log entries that happened after publication

Do not use purple or new semantic colors in this phase. The existing `QuizInProgressScreen` purple source tag should not be copied into list-specific UI.

---

## Screen Contracts

### 1. Professor Entry: `(tabs)/listas.tsx`

Keep the existing three-action shell, but the semantics change:
- Primary CTA: `Criar lista`
- Secondary CTA: `Gerenciar Listas`
- Shared question-management CTA must stop routing to `/(admin)/QuestaoViewer`; it must route to a shared non-admin namespace used by professor flows

Copy contract:
- Header title remains `Prof. {nome}`
- No dense paragraph copy on the entry screen
- Use one short helper line below the two professor CTAs only if there is room: `Monte, publique e acompanhe suas listas`

### 2. Professor Create Flow: `CreateNewList`

This is a builder screen, not a blank form.

Required sections in order:
1. Header with back action and title `Criar lista`
2. Draft metadata card
3. Question selection launcher and selected-question summary
4. Publish actions
5. Published edit history block when editing an existing published list

Draft metadata card must contain:
- `Título da lista`
- `Prazo`
- Publication status badge (`Rascunho`, `Publicada`, `Encerrada`)

Question-selection summary block must show:
- total de questões selecionadas
- compact breakdown by source or chapter when available
- CTA: `Selecionar questões`

Primary CTA behavior:
- Before first publish: `Publicar lista`
- After publish when editing: `Salvar alterações`

Secondary action:
- `Salvar rascunho` only if draft persistence exists in the implemented backend
- If no draft persistence in the first cut, use `Cancelar`

Published-edit transparency:
- If the list is already published, a visible notice must appear above actions:
  `As alterações ficam visíveis imediatamente para todos os alunos.`
- The change-log block must stay on the same screen, not hidden behind a separate route.

### 3. Shared Question Picker / Viewer

The current `QuestaoViewer` interaction is the base pattern, but the route and framing must become shared.

Required behavior:
- professor can browse/search/filter questions
- professor can add/remove questions from the current list context
- selected state is visible directly in the list of questions
- question cards must keep source/chapter/topic/difficulty metadata visible

List-builder-specific affordances:
- question card action is `Adicionar` / `Remover`, not generic admin CRUD labels
- a sticky summary area must show selected count while browsing
- if the picker is opened from list creation, returning to the create screen must preserve draft state

Do not force the professor to navigate through an admin-branded header or admin-only menu wording.

### 4. Student Home: `Minhas Listas`

`Minhas Listas` lives on `home.tsx` as a section card stack below the greeting.

Required card fields:
- list title
- deadline label
- status chip
- question count or progress summary
- CTA text based on state

Status chip vocabulary:
- `Nova`
- `Em andamento`
- `Entregue`
- `Fora do prazo`
- `Encerrada`

Late-state rules:
- Deadline passing does not disable the CTA
- Late cards must still show the CTA, but with warning styling and explicit late copy
- Submitted-late cards must show both the final state and the real completion timestamp

CTA mapping:
- not started: `Começar`
- started and not submitted: `Continuar`
- submitted: `Ver resultado`
- late and not submitted: `Entregar atrasada`

The section must always have a non-empty state:
- heading: `Minhas Listas`
- empty-state body: `Quando um professor publicar uma lista para você, ela aparecerá aqui.`

### 5. Student Solving / Result Handoff

The existing quiz runner is reused. New list-specific UI must be additive:
- a header label identifying the current list title
- a progress label specific to the list context
- submit/finish flow writes a list submission instead of only showing generic quiz results

`ResultScreen` in list mode must show:
- score summary
- on-time vs late delivery status
- completion timestamp
- return CTA back to home / `Minhas Listas`

If the same screen serves both regular quizzes and lists, the list-specific metadata must appear conditionally and not degrade the free-practice experience.

### 6. Professor Management / Results: `ListManager`

This screen is summary-first by default.

Top-level list card fields:
- title
- deadline
- publication status
- total assigned students
- total submitted
- average score
- CTA(s): `Ver resultados`, `Editar`

Inside results view, the hierarchy is:
1. summary metrics
2. per-student list
3. per-question difficulty/error breakdown
4. change log

Required summary metrics:
- `Enviadas`
- `Pendentes`
- `Média da turma`
- `Maior taxa de erro`

Per-student row must show:
- student name
- status (`Não iniciou`, `Em andamento`, `Entregue`, `Entregue fora do prazo`)
- score when submitted
- submitted timestamp when submitted

Per-question breakdown must show:
- question identifier
- error rate percentage
- total responses

The initial landing state on `ListManager` must not dump the user directly into a raw student table without the summary cards above it.

---

## State Contracts

### Create/Edit List

| State | Trigger | Visual requirement |
|-------|---------|--------------------|
| Empty draft | no title / no questions | neutral metadata card + disabled publish CTA |
| Ready draft | title, deadline, questions present | enabled `Publicar lista` CTA |
| Published | `published=true` | visible published badge + immediate-impact warning + change log block |
| Saving | create/update in flight | primary CTA shows loading and blocks double-submit |
| Error | API failure | inline error banner with retry path, never alert-only |

### Student Home Cards

| State | Trigger | Visual requirement |
|-------|---------|--------------------|
| Empty | no assigned lists | empty-state card with explanatory copy |
| Upcoming | future deadline, not started | neutral card with primary CTA |
| In progress | started, not submitted | accent CTA + progress hint |
| Late open | deadline passed, not submitted | warning badge + warning CTA styling |
| Submitted | submission exists | completion card with score |
| Submitted late | late submission exists | completion card plus warning timestamp line |

### Professor Results

| State | Trigger | Visual requirement |
|-------|---------|--------------------|
| No submissions yet | published list without submissions | summary cards show zeros + supportive empty state for student table |
| Active review | some submissions | summary cards + student table + question breakdown |
| Closed / encerrada | computed closed state | closed badge visible on list cards and detail header |
| Loading | result fetch in progress | skeleton or spinner beneath persistent header |
| Error | API failure | inline error banner with reload action |

---

## Copywriting Contract

All copy remains in Portuguese (Brazilian). Prefer direct academic-task language over gamified slang.

| Element | Copy |
|---------|------|
| Professor create title | `Criar lista` |
| Professor manage title | `Gerenciar Listas` |
| Picker CTA | `Selecionar questões` |
| Publish CTA | `Publicar lista` |
| Published-save CTA | `Salvar alterações` |
| Immediate-impact notice | `As alterações ficam visíveis imediatamente para todos os alunos.` |
| Change-log title | `Histórico de alterações` |
| Student section title | `Minhas Listas` |
| Student empty heading | `Nenhuma lista por aqui` |
| Student empty body | `Quando um professor publicar uma lista para você, ela aparecerá aqui.` |
| Late badge | `Fora do prazo` |
| Closed badge | `Encerrada` |
| Student start CTA | `Começar` |
| Student continue CTA | `Continuar` |
| Student late CTA | `Entregar atrasada` |
| Student submitted CTA | `Ver resultado` |
| Results title | `Resultados da lista` |
| Student status not started | `Não iniciou` |
| Student status in progress | `Em andamento` |
| Student status submitted | `Entregue` |
| Student status late submitted | `Entregue fora do prazo` |
| Professor empty results heading | `Ainda não há envios` |
| Professor empty results body | `Os resultados aparecerão aqui quando os alunos começarem a responder.` |
| Generic error | `Não foi possível carregar os dados. Tente novamente.` |
| Delete confirmation | `Excluir lista`: `Essa ação remove a lista e não pode ser desfeita.` |

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| existing project components | `AppButton`, Tamagui stacks/text/buttons, existing palette/font constants | not required |
| third-party additions | none approved in this phase | any new UI dependency requires explicit review before adoption |

No new component library should be introduced for Phase 4. Reuse existing project primitives and the current admin analytics card pattern.

---

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS
- [x] Dimension 2 Visuals: PASS
- [x] Dimension 3 Color: PASS
- [x] Dimension 4 Typography: PASS
- [x] Dimension 5 Spacing: PASS
- [x] Dimension 6 Registry Safety: PASS

**Approval:** approved 2026-04-11
