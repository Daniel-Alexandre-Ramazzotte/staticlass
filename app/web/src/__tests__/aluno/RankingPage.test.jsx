import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach } from 'vitest';
import { AuthProvider } from '../../context/AuthContext.jsx';
import RankingPage from '../../pages/aluno/RankingPage.jsx';
import { ALUNO_TOKEN } from '../mocks/handlers.js';

function setup() {
  localStorage.setItem('auth_token', ALUNO_TOKEN);
  return render(
    <MemoryRouter>
      <AuthProvider>
        <RankingPage />
      </AuthProvider>
    </MemoryRouter>
  );
}

beforeEach(() => localStorage.clear());

describe('RankingPage (aluno)', () => {
  it('renders ranking entries', async () => {
    setup();
    expect((await screen.findAllByText('João Aluno')).length).toBeGreaterThan(0);
    expect(await screen.findByText('Ana Aluna')).toBeInTheDocument();
  });

  it('shows XP values', async () => {
    setup();
    await screen.findAllByText('João Aluno');
    expect(screen.getAllByText('1.200').length).toBeGreaterThan(0); // pt-BR format, appears in table + own_entry
  });

  it('highlights current user row', async () => {
    setup();
    await screen.findAllByText('João Aluno');
    expect(screen.getByText('você')).toBeInTheDocument();
  });

  it('shows position numbers', async () => {
    setup();
    await screen.findAllByText('João Aluno');
    // posicao 1 appears both in table and own_entry card (#1)
    expect(screen.getAllByText('1').length).toBeGreaterThan(0);
    expect(screen.getByText('2')).toBeInTheDocument();
  });
});
