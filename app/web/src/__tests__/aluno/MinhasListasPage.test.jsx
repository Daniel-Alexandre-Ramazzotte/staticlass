import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { AuthProvider } from '../../context/AuthContext.jsx';
import MinhasListasPage from '../../pages/aluno/MinhasListasPage.jsx';
import { ALUNO_TOKEN } from '../mocks/handlers.js';
import { server } from '../mocks/server.js';

function setup() {
  localStorage.setItem('auth_token', ALUNO_TOKEN);
  return render(
    <MemoryRouter>
      <AuthProvider>
        <MinhasListasPage />
      </AuthProvider>
    </MemoryRouter>
  );
}

beforeEach(() => localStorage.clear());

describe('MinhasListasPage (aluno)', () => {
  it('renders assigned lists', async () => {
    setup();
    expect(await screen.findByText('Lista de Probabilidade')).toBeInTheDocument();
    expect(await screen.findByText('Descritiva Básica')).toBeInTheDocument();
  });

  it('shows pending chip for unsubmitted list', async () => {
    setup();
    await screen.findByText('Lista de Probabilidade');
    expect(screen.getByText('Pendente')).toBeInTheDocument();
  });

  it('shows score for submitted list', async () => {
    setup();
    await screen.findByText('Descritiva Básica');
    expect(screen.getByText('80%')).toBeInTheDocument();
  });

  it('shows professor name', async () => {
    setup();
    await screen.findByText('Lista de Probabilidade');
    expect(screen.getByText('Prof. Lima')).toBeInTheDocument(); // page prepends "Prof. " to professor_name
  });

  it('shows empty state when no lists assigned', async () => {
    server.use(http.get('/api/lists/assigned', () => HttpResponse.json([])));
    setup();
    expect(await screen.findByText(/nenhuma lista atribuída/i)).toBeInTheDocument();
  });
});
