import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { AuthProvider, useAuth } from '../context/AuthContext.jsx';
import { ADMIN_TOKEN, PROF_TOKEN, EXPIRED_TOKEN } from './mocks/handlers.js';

function Inspector() {
  const { token, role, email, name, userId, isLoading } = useAuth();
  if (isLoading) return <span>loading</span>;
  return (
    <div>
      <span data-testid="role">{role}</span>
      <span data-testid="email">{email}</span>
      <span data-testid="name">{name}</span>
      <span data-testid="userId">{userId}</span>
      <span data-testid="hasToken">{token ? 'yes' : 'no'}</span>
    </div>
  );
}

function SignInButton({ token }) {
  const { signIn } = useAuth();
  return <button onClick={() => signIn(token)}>signin</button>;
}

function SignOutButton() {
  const { signOut } = useAuth();
  return <button onClick={signOut}>signout</button>;
}

beforeEach(() => {
  localStorage.clear();
});

describe('AuthContext', () => {
  it('starts unauthenticated when localStorage is empty', async () => {
    render(<AuthProvider><Inspector /></AuthProvider>);
    expect(await screen.findByTestId('hasToken')).toHaveTextContent('no');
    expect(screen.getByTestId('role')).toHaveTextContent('aluno');
  });

  it('restores admin session from localStorage on mount', async () => {
    localStorage.setItem('auth_token', ADMIN_TOKEN);
    render(<AuthProvider><Inspector /></AuthProvider>);
    expect(await screen.findByTestId('role')).toHaveTextContent('admin');
    expect(screen.getByTestId('email')).toHaveTextContent('admin@test.com');
    expect(screen.getByTestId('hasToken')).toHaveTextContent('yes');
  });

  it('clears expired token on mount', async () => {
    localStorage.setItem('auth_token', EXPIRED_TOKEN);
    render(<AuthProvider><Inspector /></AuthProvider>);
    expect(await screen.findByTestId('hasToken')).toHaveTextContent('no');
    expect(localStorage.getItem('auth_token')).toBeNull();
  });

  it('signIn sets role, email, name and persists token', async () => {
    render(
      <AuthProvider>
        <Inspector />
        <SignInButton token={PROF_TOKEN} />
      </AuthProvider>
    );
    await screen.findByTestId('hasToken');
    await act(async () => screen.getByText('signin').click());
    expect(screen.getByTestId('role')).toHaveTextContent('professor');
    expect(screen.getByTestId('email')).toHaveTextContent('prof@test.com');
    expect(screen.getByTestId('name')).toHaveTextContent('Prof Silva');
    expect(localStorage.getItem('auth_token')).toBe(PROF_TOKEN);
  });

  it('signOut clears token from state and localStorage', async () => {
    localStorage.setItem('auth_token', ADMIN_TOKEN);
    const { location } = window;
    delete window.location;
    window.location = { href: '' };

    render(
      <AuthProvider>
        <Inspector />
        <SignOutButton />
      </AuthProvider>
    );
    await screen.findByTestId('hasToken');
    await act(async () => screen.getByText('signout').click());
    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(window.location.href).toBe('/login');

    window.location = location;
  });
});
