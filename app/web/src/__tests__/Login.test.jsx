import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, expect, beforeEach } from 'vitest';
import { AuthProvider } from '../context/AuthContext.jsx';
import Login from '../pages/Login.jsx';

function setup() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<span>admin dashboard</span>} />
          <Route path="/listas" element={<span>professor listas</span>} />
          <Route path="/minhas-listas" element={<span>aluno listas</span>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

beforeEach(() => localStorage.clear());

describe('Login page', () => {
  it('renders email and password fields and submit button', () => {
    setup();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
  });

  it('shows error message on wrong credentials', async () => {
    const user = userEvent.setup();
    setup();
    await user.type(screen.getByLabelText(/email/i), 'wrong@test.com');
    await user.type(screen.getByLabelText(/senha/i), 'wrongpass');
    await user.click(screen.getByRole('button', { name: /entrar/i }));
    expect(await screen.findByText(/email ou senha incorretos/i)).toBeInTheDocument();
  });

  it('redirects admin to /dashboard on successful login', async () => {
    const user = userEvent.setup();
    setup();
    await user.type(screen.getByLabelText(/email/i), 'admin@test.com');
    await user.type(screen.getByLabelText(/senha/i), 'admin123');
    await user.click(screen.getByRole('button', { name: /entrar/i }));
    expect(await screen.findByText('admin dashboard')).toBeInTheDocument();
  });

  it('redirects professor to /listas on successful login', async () => {
    const user = userEvent.setup();
    setup();
    await user.type(screen.getByLabelText(/email/i), 'prof@test.com');
    await user.type(screen.getByLabelText(/senha/i), 'prof123');
    await user.click(screen.getByRole('button', { name: /entrar/i }));
    expect(await screen.findByText('professor listas')).toBeInTheDocument();
  });

  it('redirects aluno to /minhas-listas on successful login', async () => {
    const user = userEvent.setup();
    setup();
    await user.type(screen.getByLabelText(/email/i), 'aluno@test.com');
    await user.type(screen.getByLabelText(/senha/i), 'aluno123');
    await user.click(screen.getByRole('button', { name: /entrar/i }));
    expect(await screen.findByText('aluno listas')).toBeInTheDocument();
  });

  it('stores token in localStorage after login', async () => {
    const user = userEvent.setup();
    setup();
    await user.type(screen.getByLabelText(/email/i), 'admin@test.com');
    await user.type(screen.getByLabelText(/senha/i), 'admin123');
    await user.click(screen.getByRole('button', { name: /entrar/i }));
    await waitFor(() => expect(localStorage.getItem('auth_token')).not.toBeNull());
  });

  it('disables button while submitting', async () => {
    const user = userEvent.setup();
    setup();
    await user.type(screen.getByLabelText(/email/i), 'admin@test.com');
    await user.type(screen.getByLabelText(/senha/i), 'admin123');
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));
    expect(screen.getByRole('button', { name: /entrando/i })).toBeDisabled();
  });
});
