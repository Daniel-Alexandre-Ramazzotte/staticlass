import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach } from 'vitest';
import { AuthProvider } from '../../context/AuthContext.jsx';
import DashboardPage from '../../pages/admin/DashboardPage.jsx';
import { ADMIN_TOKEN } from '../mocks/handlers.js';

function setup() {
  localStorage.setItem('auth_token', ADMIN_TOKEN);
  return render(
    <MemoryRouter>
      <AuthProvider>
        <DashboardPage />
      </AuthProvider>
    </MemoryRouter>
  );
}

beforeEach(() => localStorage.clear());

describe('DashboardPage (admin)', () => {
  it('renders page title', async () => {
    setup();
    expect(await screen.findByText(/painel do administrador/i)).toBeInTheDocument();
  });

  it('shows KPI values from API', async () => {
    setup();
    expect(await screen.findByText('142')).toBeInTheDocument(); // active_users
    expect(await screen.findByText('8430')).toBeInTheDocument(); // total_answers
    expect(await screen.findByText('67%')).toBeInTheDocument(); // accuracy 0.67
  });

  it('shows topic accuracy table', async () => {
    setup();
    expect(await screen.findByText('Probabilidade')).toBeInTheDocument();
    expect(await screen.findByText('Inferência')).toBeInTheDocument();
    expect(await screen.findByText('72%')).toBeInTheDocument();
    expect(await screen.findByText('58%')).toBeInTheDocument();
  });
});
