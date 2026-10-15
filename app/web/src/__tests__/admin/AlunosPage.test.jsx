import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach } from 'vitest';
import { AuthProvider } from '../../context/AuthContext.jsx';
import AlunosPage from '../../pages/admin/AlunosPage.jsx';
import { ADMIN_TOKEN } from '../mocks/handlers.js';

function setup() {
  localStorage.setItem('auth_token', ADMIN_TOKEN);
  return render(
    <MemoryRouter>
      <AuthProvider>
        <AlunosPage />
      </AuthProvider>
    </MemoryRouter>
  );
}

beforeEach(() => localStorage.clear());

describe('AlunosPage (admin)', () => {
  it('renders list of students with XP and streak', async () => {
    setup();
    expect(await screen.findByText('Ana Aluna')).toBeInTheDocument();
    expect(await screen.findByText('Bruno Aluno')).toBeInTheDocument();
    expect(screen.getByText('540')).toBeInTheDocument();   // Ana XP
    expect(screen.getByText('7 dias')).toBeInTheDocument(); // Ana streak
  });

  it('filters by search input', async () => {
    const user = userEvent.setup();
    setup();
    await screen.findByText('Ana Aluna');
    await user.type(screen.getByPlaceholderText(/buscar/i), 'Bruno');
    expect(screen.getByText('Bruno Aluno')).toBeInTheDocument();
    expect(screen.queryByText('Ana Aluna')).not.toBeInTheDocument();
  });

  it('shows add student panel with form fields', async () => {
    const user = userEvent.setup();
    setup();
    await screen.findByText('Ana Aluna');
    await user.click(screen.getByRole('button', { name: /adicionar aluno/i }));
    expect(screen.getByRole('button', { name: /criar conta/i })).toBeInTheDocument();
  });
});
