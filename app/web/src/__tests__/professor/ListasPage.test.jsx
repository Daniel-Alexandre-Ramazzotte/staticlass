import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { AuthProvider } from '../../context/AuthContext.jsx';
import ListasPage from '../../pages/professor/ListasPage.jsx';
import { PROF_TOKEN } from '../mocks/handlers.js';
import { server } from '../mocks/server.js';

function setup() {
  localStorage.setItem('auth_token', PROF_TOKEN);
  return render(
    <MemoryRouter>
      <AuthProvider>
        <ListasPage />
      </AuthProvider>
    </MemoryRouter>
  );
}

beforeEach(() => localStorage.clear());

describe('ListasPage (professor)', () => {
  it('renders lists from API', async () => {
    setup();
    expect(await screen.findByText('Lista de Probabilidade')).toBeInTheDocument();
    expect(await screen.findByText('Inferência Estatística')).toBeInTheDocument();
  });

  it('shows correct status chips', async () => {
    setup();
    await screen.findByText('Lista de Probabilidade');
    expect(screen.getByText('Publicada')).toBeInTheDocument();
    expect(screen.getByText('Rascunho')).toBeInTheDocument();
  });

  it('shows submission count and avg score for published list', async () => {
    setup();
    await screen.findByText('Lista de Probabilidade');
    expect(screen.getByText('12 submissões')).toBeInTheDocument();
    expect(screen.getByText('Média: 75%')).toBeInTheDocument();
  });

  it('shows empty state when no lists exist', async () => {
    server.use(http.get('/api/lists', () => HttpResponse.json([])));
    setup();
    expect(await screen.findByText(/nenhuma lista criada/i)).toBeInTheDocument();
  });

  it('shows Nova lista button', async () => {
    setup();
    expect(await screen.findByRole('button', { name: /nova lista/i })).toBeInTheDocument();
  });
});
