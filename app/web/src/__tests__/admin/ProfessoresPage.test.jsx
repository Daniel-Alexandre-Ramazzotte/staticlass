import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { AuthProvider } from '../../context/AuthContext.jsx';
import ProfessoresPage from '../../pages/admin/ProfessoresPage.jsx';
import { ADMIN_TOKEN } from '../mocks/handlers.js';
import { server } from '../mocks/server.js';

function setup() {
  localStorage.setItem('auth_token', ADMIN_TOKEN);
  return render(
    <MemoryRouter>
      <AuthProvider>
        <ProfessoresPage />
      </AuthProvider>
    </MemoryRouter>
  );
}

beforeEach(() => localStorage.clear());

describe('ProfessoresPage (admin)', () => {
  it('renders list of professors', async () => {
    setup();
    expect(await screen.findByText('Prof. R. Lima')).toBeInTheDocument();
    expect(await screen.findByText('Prof. M. Souza')).toBeInTheDocument();
  });

  it('shows active/inactive status chips', async () => {
    setup();
    await screen.findByText('Prof. R. Lima');
    const activeChips = screen.getAllByText('Ativo');
    const inactiveChips = screen.getAllByText('Inativo');
    expect(activeChips.length).toBeGreaterThan(0);
    expect(inactiveChips.length).toBeGreaterThan(0);
  });

  it('filters professors by search input', async () => {
    const user = userEvent.setup();
    setup();
    await screen.findByText('Prof. R. Lima');
    await user.type(screen.getByPlaceholderText(/buscar/i), 'Lima');
    expect(screen.getByText('Prof. R. Lima')).toBeInTheDocument();
    expect(screen.queryByText('Prof. M. Souza')).not.toBeInTheDocument();
  });

  it('opens add panel when clicking Adicionar professor', async () => {
    const user = userEvent.setup();
    setup();
    await screen.findByText('Prof. R. Lima');
    await user.click(screen.getByRole('button', { name: /adicionar professor/i }));
    expect(screen.getByRole('button', { name: /criar conta/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
  });

  it('shows delete confirmation inline', async () => {
    const user = userEvent.setup();
    setup();
    const deleteButtons = await screen.findAllByRole('button', { name: '' });
    await user.click(deleteButtons[0]);
    expect(await screen.findByText(/confirmar/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sim/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /não/i })).toBeInTheDocument();
  });

  it('removes professor from list after delete confirmation', async () => {
    const user = userEvent.setup();
    setup();
    await screen.findByText('Prof. R. Lima');
    const deleteButtons = screen.getAllByRole('button', { name: '' });
    await user.click(deleteButtons[0]);
    await user.click(await screen.findByRole('button', { name: /sim/i }));
    await waitFor(() =>
      expect(screen.queryByText('Prof. R. Lima')).not.toBeInTheDocument()
    );
  });

  it('shows error when API fails', async () => {
    server.use(
      http.get('/api/users/admin/professors', () =>
        HttpResponse.json({ error: 'Unauthorized' }, { status: 403 })
      )
    );
    setup();
    expect(await screen.findByText(/não foi possível carregar/i)).toBeInTheDocument();
  });
});
