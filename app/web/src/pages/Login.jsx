import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api.js';

const ROLE_HOME = { admin: '/dashboard', professor: '/listas', aluno: '/minhas-listas' };

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      signIn(res.data.access_token);
      const decoded = JSON.parse(atob(res.data.access_token.split('.')[1]));
      navigate(ROLE_HOME[decoded.role] ?? '/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao conectar ao servidor.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-shell">

      {/* Logo Staticlass — canto superior direito */}
      <div className="login-topright">
        <img src="/logo.png" alt="Staticlass" />
      </div>

      <div className="login-card">
        <div className="login-logo">
          <img src="/logo.png" alt="Staticlass" className="login-logo__img" />
        </div>

        <form onSubmit={handleSubmit}>
          <div className="field" style={{ marginBottom: 16 }}>
            <label className="field__label" htmlFor="email">Email</label>
            <input
              className="input login-input"
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
            />
          </div>

          <div className="field" style={{ marginBottom: 8 }}>
            <label className="field__label" htmlFor="password">Senha</label>
            <div className="login-password-wrap">
              <input
                className="input login-input"
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Senha"
                required
              />
              <button
                type="button"
                className="login-show-btn"
                onClick={() => setShowPassword(v => !v)}
              >
                {showPassword ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
          </div>

          {error && <p className="field__error" style={{ marginBottom: 16 }}>{error}</p>}

          <button
            className="btn btn--primary login-submit"
            disabled={loading}
          >
            {loading ? 'Entrando…' : 'Entrar'}
          </button>

          <p style={{ marginTop: 16, textAlign: 'center', fontSize: 14, color: 'var(--text-muted)' }}>
            Não tem conta?{' '}
            <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 600 }}>
              Criar conta
            </Link>
          </p>
        </form>
      </div>

      {/* Rodapé institucional: UEM + Ação 11 */}
      <div className="login-footer">
        <img src="/uem-logo.png" alt="UEM" />
        <img src="/acao11-logo.webp" alt="DataSci PROPET — Ação 11" />
      </div>

    </div>
  );
}
