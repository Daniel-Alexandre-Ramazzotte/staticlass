# Role Patterns — Proteção de Rotas

> Use quando adicionar novos endpoints ou telas com restrição de acesso.

## Decorator backend

```python
from statl.utils.auth_middleware import require_role

@bp.route("/endpoint")
@require_role("admin")                          # só admin
@require_role(["admin", "professor"])           # admin ou professor
@require_role(["aluno"])                        # só aluno (ex: record-session)
def minha_rota():
    ...
```

O decorator valida o JWT e extrai o campo `role` do payload. Retorna 401 se sem token, 403 se role errada.

## Hierarquia de roles

```
admin > professor > aluno
```

Admins podem fazer tudo o que professores podem, mas as rotas são separadas — não há herança automática. Se um admin precisar de acesso a uma rota de professor, inclua ambos na lista: `["admin", "professor"]`.

## Proteção no frontend

Proteção de rota por role é feita via `role` do `AuthContext`. Telas em `(professor)/` e `(admin)/` devem verificar `role` antes de renderizar — ver padrão nas telas existentes do grupo correspondente.

## Usuários de teste (seed)

| Role | Email | Senha |
|------|-------|-------|
| admin | admin@staticlass.com | admin123 |
| professor | prof@staticlass.com | prof123 |
| aluno | aluno@staticlass.com | aluno123 |

Gerados por `app/backend/seed_demo_data.py`.
