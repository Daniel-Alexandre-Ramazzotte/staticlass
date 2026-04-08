# Codebase Structure

*Generated: 2026-04-08*
*Focus: Directory layout, file purposes, entry points, configuration, where to place new code*

## Summary

The repository has two independent applications under `app/`: a Flask Python backend at `app/backend/` and a React Native/Expo frontend at `app/frontend/`. They share no code. Uploads (question images) live at `uploads/` (root level) and `app/uploads/`. The `.planning/` directory holds planning documents.

---

## Full Directory Tree

```
staticlass/
├── app/
│   ├── backend/
│   │   ├── statl/                    # Flask application package
│   │   │   ├── __init__.py           # App factory: create_app(), blueprint registration
│   │   │   ├── config.py             # Flask-Mail configuration class
│   │   │   ├── models/               # SQLAlchemy ORM model definitions
│   │   │   │   ├── user.py           # User model (users table)
│   │   │   │   ├── questions.py      # Question + Alternative models
│   │   │   │   ├── chapters.py       # Chapter + Topic models
│   │   │   │   ├── quiz_resultado.py # QuizResultado model
│   │   │   │   └── questao_diaria.py # QuestãoDiária model
│   │   │   ├── routes/               # Flask Blueprints — HTTP interface only
│   │   │   │   ├── auth.py           # /auth — register, login, password reset
│   │   │   │   ├── questions.py      # /questions — quiz, CRUD, chapters, topics
│   │   │   │   ├── users.py          # /users — profiles, admin user mgmt, ranking
│   │   │   │   └── admin.py          # /admin — SQL viewer, stats, question viewer
│   │   │   ├── services/             # Business logic layer
│   │   │   │   ├── auth_service.py   # register_user, login_user, password reset
│   │   │   │   ├── questions_service.py  # add/update/delete/filter questions
│   │   │   │   ├── user_service.py   # user CRUD, managed user creation
│   │   │   │   ├── resultado_service.py  # quiz results, ranking, stats, daily
│   │   │   │   └── email_service.py  # send_reset_email via Flask-Mail
│   │   │   ├── repositories/         # Database access — raw SQL via sqlalchemy.text()
│   │   │   │   ├── questions_repository.py  # all question/alternative queries
│   │   │   │   ├── user_repository.py       # all user queries
│   │   │   │   └── resultado_repository.py  # quiz result, ranking, daily queries
│   │   │   ├── security/             # Auth utilities
│   │   │   │   ├── password.py       # password hashing helpers
│   │   │   │   └── tokens.py         # itsdangerous reset token generate/verify
│   │   │   ├── utils/                # Cross-cutting utilities
│   │   │   │   ├── auth_middleware.py # @require_role() decorator
│   │   │   │   └── normalize.py      # normalize_numbering() text normalization
│   │   │   └── tests/                # Pytest test suite
│   │   ├── migrate_questoes.py       # One-off import from Estatística-Básica SQLite
│   │   ├── migrate_apostila.py       # One-off import for apostila questions
│   │   ├── migrate_bcb.py            # One-off import for BCB concurso questions
│   │   ├── requirements.txt          # Python dependencies
│   │   └── .env                      # (not committed) DB_HOST, DB_USER, DB_PASS, DB_NAME, SECRET_KEY
│   │
│   └── frontend/
│       ├── app/                      # Expo Router file-based routes
│       │   ├── _layout.tsx           # Root layout: ThemeProvider > AuthProvider > InitialLayout
│       │   ├── index.js              # Expo entry point redirect
│       │   ├── (public)/             # Unauthenticated screens
│       │   │   ├── login.tsx         # Login screen
│       │   │   ├── register.tsx      # Registration screen
│       │   │   └── RecoverPassword.tsx  # Password reset screen
│       │   ├── (tabs)/               # Tab bar — main app shell
│       │   │   ├── _layout.tsx       # Tab bar config; role-conditional tab visibility
│       │   │   ├── home.tsx          # Home/dashboard screen
│       │   │   ├── questions.tsx     # Quiz filter selection screen
│       │   │   ├── daily.tsx         # Daily question screen (aluno only)
│       │   │   ├── ranking.tsx       # Leaderboard (aluno only)
│       │   │   ├── listas.tsx        # Question lists (professor only)
│       │   │   ├── stats.tsx         # Statistics (admin only)
│       │   │   └── profile.tsx       # User profile (all roles)
│       │   ├── (app)/                # Quiz flow screens (stack navigation)
│       │   │   ├── QuizInProgressScreen.tsx  # Active quiz — fetches /questions/filtered
│       │   │   ├── ResultScreen.tsx          # Post-quiz results summary
│       │   │   ├── SolutionScreen.tsx        # Per-question solution viewer
│       │   │   ├── Ranking.tsx               # Ranking detail
│       │   │   └── Statistics.tsx            # Statistics detail
│       │   ├── (professor)/          # Professor-only screens
│       │   │   ├── ProfessorMenu.tsx         # Professor home menu
│       │   │   ├── QuestionsManager.tsx      # List/manage own questions
│       │   │   ├── AddNewQuestion.tsx         # Add question form
│       │   │   ├── ListManager.tsx           # Manage question lists
│       │   │   └── CreateNewList.tsx         # Create a question list
│       │   └── (admin)/              # Admin-only screens
│       │       ├── AdminMenu.tsx             # Admin home menu
│       │       ├── AddProfessor.tsx          # Add professor form
│       │       ├── AddAluno.tsx              # Add student form
│       │       ├── ProfessorManager.tsx      # List/manage professors
│       │       ├── AlunoManager.tsx          # List/manage students
│       │       ├── EstatisticasAdmin.tsx     # Admin statistics dashboard
│       │       └── QuestaoViewer.tsx         # Admin question browser
│       ├── src/                      # Shared source (non-screen code)
│       │   ├── context/
│       │   │   ├── AuthContext.tsx   # JWT auth state: session, role, signIn, signOut
│       │   │   └── ThemeContext.tsx  # Theme state: paleta, temaEfetivo, alternarTema
│       │   ├── services/
│       │   │   └── api.tsx           # Axios instance with auth interceptor
│       │   ├── components/
│       │   │   ├── AppButton.tsx     # Reusable button component
│       │   │   ├── CustomAccordion.tsx  # Quiz filter accordion
│       │   │   ├── MathText.tsx      # Text component with math rendering
│       │   │   └── admin/            # Admin-specific components
│       │   └── constants/
│       │       ├── style.tsx         # palette object, shared StyleSheet styles
│       │       ├── names.tsx         # CAP_NOMES and other string constants
│       │       └── layout.ts         # useLayout() hook for responsive values
│       ├── assets/
│       │   ├── fonts/                # Custom fonts (ChauPhilomeneOne, AoboshiOne, Carlito)
│       │   └── images/               # App image assets
│       ├── tamagui.config.ts         # Tamagui theme + component config
│       ├── babel.config.js           # Babel config (Expo preset + module-resolver)
│       ├── tsconfig.json             # TypeScript config with path aliases
│       ├── eslint.config.js          # ESLint config
│       ├── app.json                  # Expo app config (name, slug, bundle ID)
│       └── package.json              # NPM dependencies
│
├── uploads/                          # Question images uploaded via /questions/add
├── banco_questoes/                   # Source SQLite from Estatística-Básica project
├── docker-compose.yml                # MySQL container for local dev
├── docs/                             # Project documentation
└── .planning/
    └── codebase/                     # GSD planning documents (this file lives here)
```

---

## Key Files

| File | Purpose |
|---|---|
| `app/backend/statl/__init__.py` | App factory `create_app()`, registers all blueprints, initializes extensions, runs schema migrations |
| `app/backend/statl/config.py` | `Config` class with Flask-Mail settings; loaded by `app.config.from_object(Config)` |
| `app/backend/statl/utils/auth_middleware.py` | `@require_role(roles)` decorator — validates JWT and checks role claim |
| `app/backend/statl/utils/normalize.py` | `normalize_numbering()` — normalizes question text formatting |
| `app/backend/statl/security/tokens.py` | Password reset token generation/verification via itsdangerous |
| `app/frontend/app/_layout.tsx` | Root layout: wraps app in ThemeProvider + AuthProvider; navigation guard logic |
| `app/frontend/app/(tabs)/_layout.tsx` | Tab bar layout; controls tab visibility by user role |
| `app/frontend/src/context/AuthContext.tsx` | JWT auth state; `useAuth()` hook; `signIn()` / `signOut()` |
| `app/frontend/src/context/ThemeContext.tsx` | Theme state with light/dark/system modes; `useTema()` hook |
| `app/frontend/src/services/api.tsx` | Axios instance; auto-attaches Bearer token; handles array params |
| `app/frontend/src/constants/style.tsx` | Global `palette` color object and shared `StyleSheet` styles |
| `app/frontend/src/constants/names.tsx` | `CAP_NOMES` chapter name map and shared string constants |
| `app/frontend/src/constants/layout.ts` | `useLayout()` responsive hook (`isWide`, `fs`, `pad`, `btnH`, `maxW`) |
| `docker-compose.yml` | MySQL container; credentials match `app/backend/.env` defaults |

---

## Entry Points

**Backend:**
- Run: `flask --app statl run` from `app/backend/`
- Factory: `app/backend/statl/__init__.py` → `create_app()`
- Test mode: `create_app(testing=True)` — uses SQLite in-memory

**Frontend:**
- Run: `npx expo start` from `app/frontend/`
- Expo entry: `app/frontend/app/index.js`
- Root layout: `app/frontend/app/_layout.tsx`

---

## Configuration Files

| File | Role |
|---|---|
| `app/backend/.env` | Runtime secrets: `DATABASE_URL`, `SECRET_KEY`, `JWT_SECRET_KEY`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `CORS_ORIGINS` |
| `app/backend/statl/config.py` | `Config` class: Flask-Mail SMTP settings (reads from env) |
| `app/frontend/app.json` | Expo app metadata, bundle ID, icon, splash screen |
| `app/frontend/tamagui.config.ts` | Tamagui design system configuration (tokens, themes, fonts) |
| `app/frontend/tsconfig.json` | TypeScript config; defines path aliases: `app/*` → `app/frontend/src/*` (used in imports like `app/context/AuthContext`) |
| `app/frontend/babel.config.js` | Babel with module-resolver for path aliases |
| `app/frontend/eslint.config.js` | ESLint configuration |
| `docker-compose.yml` | MySQL container definition for local dev |

---

## Path Aliases (Frontend)

The `tsconfig.json` maps the `app/*` alias to `app/frontend/src/*`. Screens import shared code like:

```typescript
import { useAuth } from 'app/context/AuthContext';
import api from 'app/services/api';
import { palette } from 'app/constants/style';
import { AppButton } from 'app/components/AppButton';
```

---

## Where to Add New Code

**New API endpoint:**
1. Add route function to relevant blueprint in `app/backend/statl/routes/` (or create new `routes/foo.py`)
2. Add business logic to corresponding service in `app/backend/statl/services/`
3. Add database queries to corresponding repository in `app/backend/statl/repositories/`
4. If new table needed: add ORM model to `app/backend/statl/models/` and import in `__init__.py`
5. Register new blueprint in `_registrar_blueprints()` in `app/backend/statl/__init__.py`

**New screen:**
- Public (no auth): `app/frontend/app/(public)/ScreenName.tsx`
- Main tab: `app/frontend/app/(tabs)/screen-name.tsx` + add `<Tabs.Screen>` entry in `(tabs)/_layout.tsx`
- Quiz flow (stack): `app/frontend/app/(app)/ScreenName.tsx`
- Professor-only: `app/frontend/app/(professor)/ScreenName.tsx`
- Admin-only: `app/frontend/app/(admin)/ScreenName.tsx`

**New reusable component:**
- `app/frontend/src/components/ComponentName.tsx`
- Import via `app/components/ComponentName`

**New shared constant or utility:**
- String constants: `app/frontend/src/constants/names.tsx`
- Style constants: `app/frontend/src/constants/style.tsx`
- Responsive layout: `app/frontend/src/constants/layout.ts`

**New global context/state:**
- Create provider in `app/frontend/src/context/ContextName.tsx`
- Wrap in provider hierarchy in `app/frontend/app/_layout.tsx`

**New backend test:**
- `app/backend/statl/tests/test_something.py`
- Use `create_app(testing=True)` which provides SQLite in-memory

---

## Database Tables

| Table | Model file | Purpose |
|---|---|---|
| `users` | `models/user.py` | All users (aluno, professor, admin) |
| `questions` | `models/questions.py` | Quiz questions with metadata |
| `alternatives` | `models/questions.py` | Answer options for questions (A–E) |
| `chapters` | `models/chapters.py` | 4 textbook chapters |
| `topics` | `models/chapters.py` | 17 topics under chapters |
| `quiz_resultados` | `models/quiz_resultado.py` | Per-quiz score records |
| `questoes_diarias` | `models/questao_diaria.py` | Daily question completion tracking |
