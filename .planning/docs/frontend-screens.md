# Frontend — Mapa de Telas e Auth Flow

> Use quando trabalhar em navegação, redirecionamentos, ou adicionar novas telas.

## Estrutura de rotas (Expo Router)

Raiz: `app/frontend/src/` (não `app/frontend/app/` — o código real está em `src/`)

| Grupo | Telas | Acesso |
|-------|-------|--------|
| `(public)/` | Login, Register, RecoverPassword | Sem auth |
| `(tabs)/` | Home, Questions, Profile | Qualquer autenticado |
| `(app)/` | QuizInProgress, Result, Solution, Ranking, Statistics, Settings | Qualquer autenticado |
| `(professor)/` | ProfessorMenu, AddNewQuestion, ListManager, CreateNewList | Role `professor` |
| `(admin)/` | AdminMenu, AddProfessor, ProfessorManager, AlunoManager, QuestaoViewer | Role `admin` |

## Auth flow

1. JWT lido do AsyncStorage pela chave `@auth_session`
2. Decodificado com `jwt-decode`, expiry verificado no mount
3. `_layout.tsx` redireciona: sem sessão → `(public)/Login`; com sessão → `(tabs)/Home`
4. `AuthContext` expõe: `session`, `role`, `email`, `name`, `userId`, `signIn`, `signOut`

**Arquivo de contexto:** `src/context/AuthContext.tsx`
**Instância Axios:** `src/services/api.tsx` — anexa `Bearer <token>` automaticamente

## Arquivos de constantes

| Arquivo | Conteúdo |
|---------|----------|
| `src/constants/style.tsx` | `palette`, `PRIMARY`, `BG`, `CARD`, `BUTTONS`, `styles` (StyleSheet), `tamaguiStyles` |
| `src/constants/names.tsx` | Strings compartilhadas entre telas |

## Nota sobre o profile do aluno

`(tabs)/profile.tsx` faz 3 chamadas paralelas:
- `/users/profile` — dados básicos
- `/users/historico` — histórico de quizzes
- `/gamification/ranking` — posição no ranking

Qualquer mudança no shape dessas respostas quebra o profile screen.
