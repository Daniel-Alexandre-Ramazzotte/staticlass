# Guia de Acesso — Staticlass

## Primeiro Acesso

### 1. Cadastro (Aluno)

1. Abra o app e toque em **"Criar conta"**
2. Preencha nome, e-mail e senha (mínimo 6 caracteres)
3. Toque em **"Registrar"**
4. Você será redirecionado automaticamente para a tela principal

> Professores são criados pelo administrador — não pelo cadastro público.

### 2. Login

1. Insira seu e-mail e senha
2. Toque em **"Entrar"**
3. O app salva a sessão automaticamente — você não precisa fazer login toda vez

### 3. Recuperar Senha

1. Na tela de login, toque em **"Esqueci a senha"**
2. Insira seu e-mail cadastrado
3. Você receberá um link de redefinição por e-mail
4. Clique no link, insira a nova senha e confirme

---

## Navegação por Papel

### Aluno

| Aba | O que faz |
|-----|-----------|
| 🏠 Home | Tela inicial com atalhos |
| 📚 Questões | Configura e inicia um quiz |
| 📅 Diária | Responde a questão diária (1 por dia) |
| 🏆 Ranking | Vê o top 10 de alunos por pontuação |
| 👤 Perfil | Edita dados pessoais, vê pontuação |

### Professor

| Aba | O que faz |
|-----|-----------|
| 🏠 Home | Tela inicial |
| 📋 Listas | Criar listas, gerenciar questões próprias |
| 👤 Perfil | Edita dados pessoais |

### Admin

| Aba | O que faz |
|-----|-----------|
| 🏠 Home | Atalhos para gerenciamento |
| 👤 Perfil | Edita dados pessoais |

---

## Fazendo um Quiz

1. Vá para a aba **Questões**
2. Toque em **"Personalizar"** para abrir os filtros:
   - **Quantidade**: número de questões (padrão: 5)
   - **Capítulo**: Descritiva, Probabilidade, Inferência ou Regressão
   - **Dificuldade**: Fácil, Médio ou Difícil
3. Toque em **"Iniciar Quiz"**
4. Selecione uma alternativa e confirme com **"CONFIRMAR"**
5. Ao terminar, veja o **Resumo** com sua pontuação
6. Toque em qualquer questão para ver a **resolução detalhada**
7. Toque em **"VOLTAR"** para ir à tela inicial

### Pontuação

- Cada acerto vale **10 pontos**
- Os pontos são acumulados no seu perfil
- O ranking é atualizado automaticamente

---

## Questão Diária

- Disponível **uma vez por dia** para cada aluno
- Acesse pela aba **Diária**
- Se já foi feita hoje, a aba mostra "Você já fez a sua questão diária!"
- Reseta à meia-noite

---

## Ranking

- Exibe o **top 10** de alunos com maior pontuação acumulada
- Atualiza sempre que você abre a aba
- O pódio mostra os 3 primeiros em destaque

---

## Estatísticas

- Acesse pelo menu de navegação interno (tela Statistics)
- Mostra as últimas 10 tentativas de quiz
- Para cada tentativa: data, acertos/total, capítulo, dificuldade, % de acerto

---

## Professor — Gerenciar Questões

1. Acesse a aba **Listas** → **Gerenciar Questões**
2. Veja todas as questões que você criou
3. Toque em **"Adicionar Questão"** para criar uma nova:
   - Preencha o enunciado
   - Insira as alternativas A a E
   - Marque a alternativa correta
   - (Opcional) Adicione imagem do enunciado e da solução
4. Toque em uma questão existente para editá-la

---

## Admin — Gerenciar Usuários

1. Na **Home**, toque em **"Gerenciar Professores"** ou **"Gerenciar Alunos"**
2. Para criar um professor:
   - Informe nome e e-mail
   - Uma senha temporária é gerada automaticamente
   - Compartilhe a senha com o professor — ele pode alterá-la no perfil
3. Para desativar ou remover um usuário, use as ações na lista

---

## Dúvidas Frequentes

**O app não conecta ao servidor**
→ Verifique se o backend está rodando. Em desenvolvimento, rode `flask --app statl run` na pasta `app/backend`.

**Erro "Tente novamente" no cadastro**
→ Verifique se o e-mail já está cadastrado. Se o problema persistir, tente novamente em alguns segundos.

**Minha pontuação não atualizou**
→ A pontuação é salva ao final de cada quiz. Se houve erro de rede, pode não ter sido registrada. Repita o quiz.

**A questão diária não aparece como "feita"**
→ Certifique-se de ter concluído o quiz (chegado à tela de Resumo). Apenas completar o quiz registra a diária.
