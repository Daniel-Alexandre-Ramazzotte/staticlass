import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api.js';
import { appUrl } from '../utils/paths.js';

export default function CompleteInvitePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [meta, setMeta] = useState(null);
  const [metaError, setMetaError] = useState('');

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUem, setIsUem] = useState(false);
  const [ra, setRa] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) {
      setMetaError('Link inválido ou expirado.');
      return;
    }
    api.get(`/auth/invite/${token}`)
      .then((r) => {
        setMeta(r.data);
        setName(r.data.name || '');
      })
      .catch(() => setMetaError('Este link de convite é inválido ou expirou.'));
  }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/complete-invite', {
        token,
        name,
        password,
        confirm_password: confirmPassword,
        ra: isUem ? ra : undefined,
      });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao completar cadastro.');
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="login-shell">
        <div className="login-topright"><img src={appUrl('/logo.png')} alt="Staticlass" /></div>
        <div className="login-card" style={{ textAlign: 'center', gap: 16 }}>
          <div style={{ fontSize: 56, color: 'var(--green, #55bf44)' }}>✓</div>
          <h2 style={{ fontFamily: 'var(--font-display)', margin: 0 }}>Cadastro concluído!</h2>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>
            Você foi matriculado em <strong>{meta?.turma_name}</strong>. Faça login para acessar.
          </p>
          <button className="btn btn--primary" style={{ marginTop: 8 }} onClick={() => navigate('/login', { replace: true })}>
            Ir para o login
          </button>
        </div>
        <div className="login-footer">
          <img src={appUrl('/uem-logo.png')} alt="UEM" />
          <img src={appUrl('/acao11-logo.webp')} alt="DataSci PROPET — Ação 11" />
        </div>
      </div>
    );
  }

  if (metaError) {
    return (
      <div className="login-shell">
        <div className="login-topright"><img src={appUrl('/logo.png')} alt="Staticlass" /></div>
        <div className="login-card" style={{ textAlign: 'center' }}>
          <p className="field__error" style={{ fontSize: 15 }}>{metaError}</p>
          <button className="btn btn--ghost" style={{ marginTop: 12 }} onClick={() => navigate('/login')}>Ir para o login</button>
        </div>
      </div>
    );
  }

  if (!meta) {
    return (
      <div className="login-shell">
        <div className="login-topright"><img src={appUrl('/logo.png')} alt="Staticlass" /></div>
        <div className="login-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="loader" />
        </div>
      </div>
    );
  }

  return (
    <div className="login-shell">
      <div className="login-topright"><img src={appUrl('/logo.png')} alt="Staticlass" /></div>
      <div className="login-card">
        <div className="login-logo">
          <img src={appUrl('/logo.png')} alt="Staticlass" className="login-logo__img" />
        </div>
        <h2 style={{ fontFamily: 'var(--font-display)', marginTop: 0, marginBottom: 4 }}>Completar cadastro</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: 0, marginBottom: 16, fontSize: 13 }}>
          Você foi convidado para a turma <strong>{meta.turma_name}</strong>.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label className="field__label">Email</label>
            <input className="input login-input" type="email" value={meta.email} readOnly style={{ background: 'var(--bg-subtle)', cursor: 'not-allowed' }} />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label className="field__label" htmlFor="name">Nome</label>
            <input className="input login-input" id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label className="field__label" htmlFor="password">Senha</label>
            <input className="input login-input" id="password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label className="field__label" htmlFor="confirm">Confirmar senha</label>
            <input className="input login-input" id="confirm" type="password" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
            <input type="checkbox" checked={isUem} onChange={(e) => setIsUem(e.target.checked)} style={{ width: 16, height: 16 }} />
            Sou aluno da UEM
          </label>

          {isUem && (
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="field__label" htmlFor="ra">Número do RA</label>
              <input className="input login-input" id="ra" type="text" value={ra} onChange={(e) => setRa(e.target.value.toUpperCase())} placeholder="Ex: RA135899" required={isUem} />
            </div>
          )}

          {error && <p className="field__error">{error}</p>}

          <button className="btn btn--primary login-submit" disabled={loading}>
            {loading ? 'Salvando…' : 'Concluir cadastro'}
          </button>
        </form>
      </div>
      <div className="login-footer">
        <img src={appUrl('/uem-logo.png')} alt="UEM" />
        <img src={appUrl('/acao11-logo.webp')} alt="DataSci PROPET — Ação 11" />
      </div>
    </div>
  );
}
