import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach } from 'vitest';
import { AuthProvider } from '../../context/AuthContext.jsx';
import PerfilPage from '../../pages/aluno/PerfilPage.jsx';
import { ALUNO_TOKEN } from '../mocks/handlers.js';

function setup() {
  localStorage.setItem('auth_token', ALUNO_TOKEN);
  return render(
    <MemoryRouter>
      <AuthProvider>
        <PerfilPage />
      </AuthProvider>
    </MemoryRouter>
  );
}

beforeEach(() => localStorage.clear());

describe('PerfilPage (aluno)', () => {
  it('renders user name and email', async () => {
    setup();
    expect(await screen.findByText('João Aluno')).toBeInTheDocument();
    expect(await screen.findByText('aluno@test.com')).toBeInTheDocument();
  });

  it('shows XP, streak and accuracy stats', async () => {
    setup();
    await screen.findByText('João Aluno');
    expect(screen.getByText('1.200')).toBeInTheDocument(); // XP
    expect(screen.getByText('5 dias')).toBeInTheDocument(); // streak
    expect(screen.getByText('68%')).toBeInTheDocument(); // accuracy
  });

  it('renders topic breakdown table', async () => {
    setup();
    await screen.findByText('João Aluno');
    expect(screen.getByText('Probabilidade')).toBeInTheDocument();
    expect(screen.getByText('Inferência')).toBeInTheDocument();
  });
});
