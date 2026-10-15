import { http, HttpResponse } from 'msw';

/** Fake JWT: header.payload.sig — jwtDecode only base64-decodes the payload */
export function makeToken(payload) {
  const enc = (obj) => btoa(JSON.stringify(obj)).replace(/=/g, '');
  return `${enc({ alg: 'HS256', typ: 'JWT' })}.${enc(payload)}.fakesig`;
}

export const ADMIN_TOKEN = makeToken({
  sub: '1', role: 'admin', email: 'admin@test.com', name: 'Admin User',
  email_verified: true, exp: Math.floor(Date.now() / 1000) + 3600,
});

export const PROF_TOKEN = makeToken({
  sub: '2', role: 'professor', email: 'prof@test.com', name: 'Prof Silva',
  email_verified: true, exp: Math.floor(Date.now() / 1000) + 3600,
});

export const ALUNO_TOKEN = makeToken({
  sub: '3', role: 'aluno', email: 'aluno@test.com', name: 'João Aluno',
  email_verified: true, exp: Math.floor(Date.now() / 1000) + 3600,
});

export const EXPIRED_TOKEN = makeToken({
  sub: '4', role: 'aluno', email: 'old@test.com', name: 'Old User',
  exp: Math.floor(Date.now() / 1000) - 1,
});

export const handlers = [
  /* Auth */
  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json();
    if (body.email === 'admin@test.com' && body.password === 'admin123') {
      return HttpResponse.json({ access_token: ADMIN_TOKEN });
    }
    if (body.email === 'prof@test.com' && body.password === 'prof123') {
      return HttpResponse.json({ access_token: PROF_TOKEN });
    }
    if (body.email === 'aluno@test.com' && body.password === 'aluno123') {
      return HttpResponse.json({ access_token: ALUNO_TOKEN });
    }
    return HttpResponse.json({ error: 'Email ou senha incorretos.' }, { status: 400 });
  }),

  /* Admin dashboard */
  http.get('/api/admin/stats/dashboard', () =>
    HttpResponse.json({
      active_users: 142,
      total_answers: 8430,
      accuracy: 0.67,
      avg_streak: 4,
      accuracy_by_topic: [
        { topic: 'Probabilidade', attempts: 1200, accuracy: 0.72 },
        { topic: 'Inferência', attempts: 980, accuracy: 0.58 },
      ],
    })
  ),

  /* Professors list */
  http.get('/api/users/admin/professors', () =>
    HttpResponse.json([
      { id: 10, name: 'Prof. R. Lima', email: 'rlima@test.com', active: true },
      { id: 11, name: 'Prof. M. Souza', email: 'msouza@test.com', active: false },
    ])
  ),

  http.post('/api/users/admin/professors', () =>
    HttpResponse.json({ id: 99, name: 'Nova Professora', email: 'nova@test.com', active: true })
  ),

  http.delete('/api/users/admin/professors/:id', () =>
    HttpResponse.json({ message: 'deleted' })
  ),

  /* Students list */
  http.get('/api/users/admin/alunos', () =>
    HttpResponse.json([
      { id: 20, name: 'Ana Aluna', email: 'ana@test.com', active: true, xp: 540, streak: 7 },
      { id: 21, name: 'Bruno Aluno', email: 'bruno@test.com', active: true, xp: 220, streak: 2 },
    ])
  ),

  http.delete('/api/users/admin/alunos/:id', () =>
    HttpResponse.json({ message: 'deleted' })
  ),

  /* Lists — professor */
  http.get('/api/lists', () =>
    HttpResponse.json([
      { id: 1, title: 'Lista de Probabilidade', status: 'published', deadline: '2026-05-30', turma_name: 'Turma A', submission_count: 12, avg_score: 0.75 },
      { id: 2, title: 'Inferência Estatística', status: 'draft', deadline: null, turma_name: null, submission_count: 0, avg_score: null },
    ])
  ),

  /* Lists — assigned (aluno) */
  http.get('/api/lists/assigned', () =>
    HttpResponse.json([
      { id: 1, title: 'Lista de Probabilidade', status: 'published', deadline: '2099-05-30', professor_name: 'Lima', my_submission: null },
      { id: 3, title: 'Descritiva Básica', status: 'closed', deadline: '2026-04-01', professor_name: 'Souza', my_submission: { score: 0.8 } },
    ])
  ),

  /* Ranking */
  http.get('/api/gamification/ranking', () =>
    HttpResponse.json({
      ranking: [
        { id: 3, posicao: 1, nome: 'João Aluno', email: 'aluno@test.com', xp: 1200 },
        { id: 20, posicao: 2, nome: 'Ana Aluna', email: 'ana@test.com', xp: 540 },
      ],
      own_entry: { id: 3, posicao: 1, nome: 'João Aluno', xp: 1200 },
      has_more: false,
    })
  ),

  /* Profile */
  http.get('/api/users/profile/:email', ({ params }) =>
    HttpResponse.json({
      id: 3, name: 'João Aluno', email: params.email, role: 'aluno',
      xp: 1200, streak: 5, accuracy: 0.68,
      topics: [
        { topic: 'Probabilidade', attempts: 40, accuracy: 0.75 },
        { topic: 'Inferência', attempts: 30, accuracy: 0.60 },
      ],
    })
  ),

  /* Questions */
  http.get('/api/questions/chapters', () =>
    HttpResponse.json([
      { id: 1, name: 'Descritiva' },
      { id: 2, name: 'Probabilidade' },
    ])
  ),

  http.get('/api/questions/admin/:id', ({ params }) =>
    HttpResponse.json({
      id: Number(params.id),
      issue: 'Qual é a média de 2, 4 e 6?',
      correct_answer: 'B',
      solution: 'A média é (2+4+6)/3 = 4.',
      difficulty: 1,
      chapter_name: 'Descritiva',
      topic_name: 'Média',
      alternatives: [
        { letter: 'A', text: '3', is_correct: false },
        { letter: 'B', text: '4', is_correct: true },
        { letter: 'C', text: '5', is_correct: false },
      ],
    })
  ),

  /* Turmas */
  http.get('/api/turmas', () =>
    HttpResponse.json([
      { id: 1, name: 'Turma A', student_count: 25 },
      { id: 2, name: 'Turma B', student_count: 18 },
    ])
  ),

  http.post('/api/turmas/:id/invite', () =>
    HttpResponse.json({ enrolled: 2, invited: 1, skipped: 0, errors: [] })
  ),

  /* Register */
  http.post('/api/auth/register', async ({ request }) => {
    const body = await request.json();
    if (body.email === 'existing@test.com') {
      return HttpResponse.json({ error: 'Email já cadastrado.' }, { status: 400 });
    }
    return HttpResponse.json({ message: 'Usuário criado. Verifique seu email.' }, { status: 201 });
  }),

  /* OTP verification */
  http.post('/api/auth/verify-code', async ({ request }) => {
    const body = await request.json();
    if (body.code === '123456') {
      return HttpResponse.json({ message: 'Email verificado com sucesso.' });
    }
    return HttpResponse.json({ error: 'Código inválido.' }, { status: 400 });
  }),

  http.post('/api/auth/resend-verification', () =>
    HttpResponse.json({ message: 'Código reenviado.' })
  ),

  /* Invite */
  http.get('/api/auth/invite/:token', ({ params }) => {
    if (params.token === 'valid-token') {
      return HttpResponse.json({ email: 'convidado@test.com', name: 'Convidado', turma_name: 'Turma A' });
    }
    return HttpResponse.json({ error: 'Token inválido.' }, { status: 400 });
  }),

  http.post('/api/auth/complete-invite', () =>
    HttpResponse.json({ message: 'Cadastro concluído.' })
  ),
];
