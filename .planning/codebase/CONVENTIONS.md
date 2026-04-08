# Coding Conventions
*Generated: 2026-04-08*
*Focus: Naming patterns, code style, imports, error handling, and component structure across both backend (Flask/Python) and frontend (React Native/TypeScript)*

## Summary
The project has a strict layered backend (Routes → Services → Repositories) and a file-based Expo Router frontend. The most important naming quirk: the backend repository layer uses **Portuguese names internally** with English aliases at the module bottom for backward compatibility. The frontend mixes React Native primitives and Tamagui components, preferring Tamagui's shorthand props (`f={1}`, `jc`, `ai`) on layout containers.

---

## Backend — Naming Conventions

### Functions
The repository and service layers use **Portuguese snake_case** as the canonical name, with English snake_case aliases appended at the bottom of each file.

```python
# Canonical Portuguese name (primary definition)
def buscar_questoes_filtradas(quantidade, chapter_id=None, ...): ...

# English alias at module bottom (backward-compat shim)
get_random_question_filtered = buscar_questoes_filtradas
```

- `app/backend/statl/repositories/questions_repository.py` — lines 254–266 show full alias block
- `app/backend/statl/repositories/user_repository.py` — lines 112–122 show full alias block

Service functions keep English names (they post-date the repository rename):
- `get_user_by_email_service`, `create_managed_user_service`, `delete_own_account_service`

Private helpers are prefixed with `_`:
- `_normalizar_payload`, `_normalizar_fonte`, `_para_int_opcional`, `_gerar_senha_temporaria`

### Files
All Python source files use **snake_case**:
- `auth_service.py`, `questions_repository.py`, `auth_middleware.py`, `resultado_service.py`

### Variables / Local names
- Portuguese variable names inside function bodies are common in newer code:
  - `dados`, `resultado`, `alternativas`, `campos`, `papel`, `novo_id`
- Older code (e.g., `auth_service.py`) uses English: `user`, `email`, `password`, `token`

### Constants
Module-level constants use `SCREAMING_SNAKE_CASE`:
```python
NUM_QUESTIONS = 5           # routes/questions.py
NUM_QUESTOES_PADRAO = 5     # services/questions_service.py
_FONTES_VALIDAS = {"apostila", ...}
_CAMPOS_ATUALIZAVEIS = {"name", "email", ...}
```

### Blueprint Registration
Each route file creates `bp = Blueprint('name', __name__, url_prefix='/prefix')`.
Route functions use Portuguese names matching the HTTP action:
- `atualizar_perfil`, `deletar_conta`, `criar_professor`, `listar_alunos`

---

## Backend — Code Style

### Blueprint Structure
Every blueprint file follows this pattern:
1. Imports (flask, jwt, service imports, middleware)
2. Module-level constants
3. Optional private helper (e.g., `_ensure_question_access`)
4. Route functions decorated with `@bp.route` + optional `@require_role`

```python
@bp.route('/admin/professors', methods=['POST'])
@require_role('admin')
def criar_professor():
    resultado, erro, status = create_managed_user_service(request.json, 'professor')
    if erro:
        return erro, status
    return jsonify({"message": "professor criado", **resultado}), 201
```

### Service Return Pattern
Services consistently return a **3-tuple** `(data, error, http_code)`:
```python
# Route unpacks it
user, error, http_code = register_user(data)
if error:
    return error, http_code
```

Some newer services return `(result, status_code)` pairs (2-tuple) — this is inconsistent. See `delete_own_account_service` in `app/backend/statl/services/user_service.py`.

### Repository Pattern
All database access uses raw SQL via `sqlalchemy.text()` — no ORM query API:
```python
db.session.execute(text("SELECT * FROM users WHERE email = :email"), {"email": email}).fetchone()
```
Every mutating operation wraps in try/except with `db.session.rollback()` on failure.

### Docstrings
Services use single-quoted triple-string docstrings on public functions:
```python
def register_user(data):
    ''' Serviço para registrar um novo usuário.
    '''
```
Repositories use double-quoted triple strings on private helpers:
```python
def _buscar_alternativas_em_lote(ids_questoes):
    """Retorna {question_id: [alternativas]} em uma única query."""
```
Route functions on newer endpoints use `"""..."""` docstrings (see `/diaria/status` in `app/backend/statl/routes/questions.py`).

### Section Separators
Code sections are separated with box-drawing comments:
```python
# ── Criação ─────────────────────────────────────────────────────────────────
# ── Aliases para compatibilidade com código existente ──────────────────────
```

---

## Backend — Error Handling

Services return `jsonify({"error": "..."})` response objects (not exceptions) for expected failures, paired with an HTTP status int:
```python
return None, jsonify({"error": "Usuario ja registrado."}), 400
```

Unexpected failures in repositories raise exceptions after rollback. Services catch specific types:
```python
except (ValueError, TypeError, json.JSONDecodeError) as e:
    return jsonify({"error": str(e)}), 400
except Exception as e:
    return jsonify({"error": str(e)}), 500
```

The `require_role` decorator (`app/backend/statl/utils/auth_middleware.py`) returns 401 for invalid/missing JWT and 403 for insufficient role — never raises.

---

## Frontend — Naming Conventions

### Files
- **Route screens**: `PascalCase.tsx` for named screens (`QuizInProgressScreen.tsx`, `QuestionsManager.tsx`)
- **Tab routes**: `lowercase.tsx` matching the tab name (`home.tsx`, `profile.tsx`, `questions.tsx`)
- **Components**: `PascalCase.tsx` (`AppButton.tsx`, `CustomAccordion.tsx`, `MathText.tsx`)
- **Services**: `PascalCase.tsx` or `camelCase.tsx` — inconsistent (`CheckLogin.tsx` vs `RegisterNewUserService.tsx` vs `api.tsx`)
- **Constants**: `camelCase.ts` or `.tsx` (`style.tsx`, `names.tsx`, `layout.ts`)
- **Context**: `PascalCase.tsx` (`AuthContext.tsx`, `ThemeContext.tsx`)

### Functions / Hooks
- **Event handlers**: `handle` prefix — `handleLogin`, `handleRegister`, `handleStartQuiz`, `handleDeleteQuestion`
- **Async fetchers**: `fetch` prefix — `fetchQuestions`, `fetchImage`
- **Custom hooks**: `use` prefix — `useAuth`, `useLayout`, `useTema`
- **Screen components**: default export, PascalCase — `export default function LoginScreen()`
- **Helper utilities**: camelCase — `parseIds`, `parseStrs`, `toggleN`

### State Variables
All `useState` variables use camelCase. Loading states are consistently named `isLoading` or `[scope]Loading` (`detailLoading`, `imageLoading`).

### TypeScript Types
Local types use `PascalCase` with `type` (not `interface`):
```typescript
type Alternative = { letter: string; text: string; is_correct: boolean; };
type QuizQuestion = { id: number; issue: string; ... };
```
Context interface props use `interface` + `Props` suffix: `interface AuthContextProps`.

---

## Frontend — Code Style

### Component Structure
Screens follow a consistent internal order:
1. Hooks (`useRouter`, `useAuth`, `useLayout`, etc.)
2. `useState` declarations
3. `useEffect` / `useFocusEffect` data fetching
4. Event handler functions
5. JSX return

### Tamagui Shorthand Props
Layout containers use Tamagui's abbreviated props throughout:
```tsx
<YStack f={1} jc="center" ai="center" gap="$4" px={pad(16)}>
```
- `f={1}` = `flex={1}`
- `jc` = `justifyContent`
- `ai` = `alignItems`
- `pt`, `pb`, `px`, `py` = padding shorthands

### Styling Approach
Two parallel approaches exist — both are acceptable:
1. **Tamagui inline props** (preferred in newer screens): `backgroundColor={palette.primaryBlue}`, `borderRadius={25}`
2. **`StyleSheet.create`** (from `app/constants/style.tsx`): used in older screens and for complex shared styles

The global `palette` object from `app/frontend/src/constants/style.tsx` is the single source of truth for colors. Always import from there:
```typescript
import { palette } from 'app/constants/style';
```

### Responsive Layout
Use `useLayout()` from `app/frontend/src/constants/layout.ts` for adaptive sizing:
```typescript
const { isWide, fs, pad, btnH, maxW } = useLayout();
// fs(16) → scales font; pad(16) → scales padding; isWide → boolean for breakpoint
```

---

## Frontend — Import Organization

### Path Aliases (from `tsconfig.json`)
Always use these aliases — never relative paths to `src/`:
```typescript
import { useAuth } from 'app/context/AuthContext';
import api from 'app/services/api';
import { palette } from 'app/constants/style';
import { AppButton } from 'app/components/AppButton';
```

Alias mappings:
- `app/services/*` → `src/services/*`
- `app/components/*` → `src/components/*`
- `app/constants/*` → `src/constants/*`
- `app/context/*` → `src/context/*`

### Import Order (observed pattern)
1. Third-party (expo-router, react, react-native, tamagui, lucide-react-native)
2. Internal services (`app/services/api`)
3. Internal components (`app/components/AppButton`)
4. Internal constants (`app/constants/style`, `app/constants/names`)
5. Internal context (`app/context/AuthContext`)

---

## Frontend — Error Handling

Service functions return `error.response` on Axios errors (not throwing), so callers receive the full response object or `undefined`:
```typescript
// app/frontend/src/services/CheckLogin.tsx
const CheckLogin = async (data) => {
  try {
    return await api.post('/auth/login', data);
  } catch (error: any) {
    return error.response;
  }
};
```

Screen-level error handling stores messages in state and renders them in a `<Text>` element:
```typescript
const [errorMessage, setErrorMessage] = useState<string>('');
// ...
setErrorMessage(response?.data?.error || 'Fallback message.');
// In JSX:
<Text style={styles.errorLoginText}>{errorMessage}</Text>
```

Async operations inside effects swallow errors silently with empty catch:
```typescript
api.get('/questions/chapters').then(...).catch(() => {});
```

---

## Frontend — Comments

- Block comments above components describe screen purpose and expected behavior (see `app/frontend/app/(public)/login.tsx`, lines 21–35)
- Inline comments explain navigation intent: `// LÓGICA DO PORTEIRO`, `// Carregar dados do AsyncStorage`
- No JSDoc on component functions; sparse inline docs
- Portuguese is used for comments throughout the frontend

---

## Mixed-Language Notes

Both backend and frontend codebases are bilingual (Portuguese/English):
- Backend function names and variable names are increasingly Portuguese in newer files
- Frontend comments, state variable names, and error messages are Portuguese
- JSON field names for the API use English snake_case (`issue`, `correct_answer`, `chapter_id`)
- Database column names use English snake_case throughout
