import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, expect, beforeEach } from 'vitest';
import { AuthProvider } from '../context/AuthContext.jsx';
import ProtectedRoute from '../components/ProtectedRoute.jsx';
import { ADMIN_TOKEN, PROF_TOKEN, ALUNO_TOKEN } from './mocks/handlers.js';

function wrapper(token, roles, content = 'protected') {
  if (token) localStorage.setItem('auth_token', token);
  return render(
    <MemoryRouter initialEntries={['/protected']}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<span>login page</span>} />
          <Route path="/" element={<span>home</span>} />
          <Route
            path="/protected"
            element={
              <ProtectedRoute roles={roles}>
                <span>{content}</span>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

beforeEach(() => localStorage.clear());

describe('ProtectedRoute', () => {
  it('redirects to /login when no token', async () => {
    wrapper(null);
    expect(await screen.findByText('login page')).toBeInTheDocument();
  });

  it('renders children when token is valid and no role restriction', async () => {
    wrapper(ALUNO_TOKEN);
    expect(await screen.findByText('protected')).toBeInTheDocument();
  });

  it('renders children when user role matches allowed roles', async () => {
    wrapper(ADMIN_TOKEN, ['admin', 'professor']);
    expect(await screen.findByText('protected')).toBeInTheDocument();
  });

  it('redirects to / when role is not in allowed list', async () => {
    wrapper(ALUNO_TOKEN, ['admin', 'professor']);
    expect(await screen.findByText('home')).toBeInTheDocument();
  });

  it('professor can access professor-only routes', async () => {
    wrapper(PROF_TOKEN, ['professor']);
    expect(await screen.findByText('protected')).toBeInTheDocument();
  });

  it('admin cannot access aluno-only routes', async () => {
    wrapper(ADMIN_TOKEN, ['aluno']);
    expect(await screen.findByText('home')).toBeInTheDocument();
  });
});
