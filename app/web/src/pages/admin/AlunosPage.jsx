import { useState, useEffect } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import Topbar from '../../components/Topbar.jsx';
import api from '../../services/api.js';

const CRUMBS = [{ label: 'Início', to: '/dashboard' }, { label: 'Alunos' }];

function randomPassword() {
  return Math.random().toString(36).slice(-8).toUpperCase();
}

export default function AlunosPage() {
  const [alunos, setAlunos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [panelOpen, setPanelOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', autoPass: true });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [error, setError] = useState('');

  function load() {
    setLoading(true);
    api.get('/users/admin/alunos')
      .then((r) => setAlunos(r.data))
      .catch(() => setError('Não foi possível carregar.'))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  const filtered = alunos.filter(
    (a) =>
      a.name?.toLowerCase().includes(search.toLowerCase()) ||
      a.email?.toLowerCase().includes(search.toLowerCase())
  );

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name: form.name,
      email: form.email,
      password: form.autoPass ? randomPassword() : form.password,
    };
    try {
      await api.post('/users/admin/alunos', payload);
      setPanelOpen(false);
      setForm({ name: '', email: '', password: '', autoPass: true });
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/users/admin/alunos/${id}`);
      setAlunos((prev) => prev.filter((a) => a.id !== id));
      setDeleteId(null);
    } catch {
      setError('Não foi possível deletar.');
    }
  }

  return (
    <>
      <Topbar crumbs={CRUMBS} />
      <div className="content">
        <div className="page-header">
          <div>
            <h1 className="page-header__title">Alunos</h1>
            <p className="page-header__subtitle">Gerencie as contas de alunos da plataforma.</p>
          </div>
          <div className="page-header__actions">
            <button className="btn btn--primary" onClick={() => setPanelOpen(true)}>
              <Plus size={16} /> Adicionar aluno
            </button>
          </div>
        </div>

        {error && <p className="field__error" style={{ marginBottom: 16 }}>{error}</p>}

        <div className="card">
          <div style={{ marginBottom: 16 }}>
            <input
              className="input"
              placeholder="Buscar por nome ou email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ maxWidth: 360 }}
            />
          </div>

          {loading ? (
            <div className="empty-state"><div className="loader" /></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state"><p>Nenhum aluno encontrado.</p></div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Email</th>
                  <th>XP</th>
                  <th>Streak</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.id}>
                    <td>{a.name}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{a.email}</td>
                    <td>{a.xp ?? '—'}</td>
                    <td>{a.streak != null ? `${a.streak} dias` : '—'}</td>
                    <td>
                      <span className={`chip ${a.active !== false ? 'chip--easy' : 'chip--neutral'}`}>
                        {a.active !== false ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {deleteId === a.id ? (
                        <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center', fontSize: 13 }}>
                          Confirmar?
                          <button className="btn btn--danger btn--sm" onClick={() => handleDelete(a.id)}>Sim</button>
                          <button className="btn btn--ghost btn--sm" onClick={() => setDeleteId(null)}>Não</button>
                        </span>
                      ) : (
                        <button className="btn btn--ghost btn--sm" onClick={() => setDeleteId(a.id)}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {panelOpen && (
        <div className="panel">
          <div className="panel__header">
            <h2 className="card__title">Adicionar aluno</h2>
            <button className="icon-btn" onClick={() => setPanelOpen(false)}><X size={20} /></button>
          </div>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="field">
              <label className="field__label">Nome <span className="req">*</span></label>
              <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="field">
              <label className="field__label">Email <span className="req">*</span></label>
              <input className="input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="field">
              <label className="field__label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" checked={form.autoPass} onChange={(e) => setForm({ ...form, autoPass: e.target.checked })} />
                Gerar senha temporária automaticamente
              </label>
            </div>
            {!form.autoPass && (
              <div className="field">
                <label className="field__label">Senha <span className="req">*</span></label>
                <input className="input" type="password" required={!form.autoPass} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </div>
            )}
            {error && <p className="field__error">{error}</p>}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
              <button type="button" className="btn btn--ghost" onClick={() => setPanelOpen(false)}>Cancelar</button>
              <button type="submit" className="btn btn--success" disabled={saving}>
                {saving ? 'Salvando…' : 'Criar conta'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
