import { useState, useEffect } from 'react';
import { Flame, Target, Star } from 'lucide-react';
import Topbar from '../../components/Topbar.jsx';
import api from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';

const CRUMBS = [{ label: 'Perfil' }];

export default function PerfilPage() {
  const { email, name } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!email) return;
    api.get(`/users/profile/${encodeURIComponent(email)}`)
      .then((r) => setProfile(r.data))
      .catch(() => setError('Não foi possível carregar o perfil.'))
      .finally(() => setLoading(false));
  }, [email]);

  function initials(n) {
    return (n ?? '?').split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  }

  const stats = profile ? [
    { icon: Star, label: 'XP total', value: profile.xp?.toLocaleString('pt-BR') ?? '0' },
    { icon: Flame, label: 'Streak', value: `${profile.streak ?? 0} dias` },
    { icon: Target, label: 'Taxa de acerto', value: profile.accuracy != null ? `${Math.round(profile.accuracy * 100)}%` : '—' },
  ] : [];

  const topics = profile?.topics ?? profile?.accuracy_by_topic ?? [];

  return (
    <>
      <Topbar crumbs={CRUMBS} />
      <div className="content">
        {loading ? (
          <div className="empty-state"><div className="loader" /></div>
        ) : error ? (
          <div className="empty-state"><p style={{ color: 'var(--danger-500)' }}>{error}</p></div>
        ) : (
          <>
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
              <div className="avatar" style={{ width: 56, height: 56, fontSize: 22, flexShrink: 0 }}>
                {initials(name)}
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 22 }}>{name}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{email}</div>
              </div>
            </div>

            <div className="kpi-grid" style={{ marginBottom: 24 }}>
              {stats.map(({ icon: Icon, label, value }) => (
                <div key={label} className="card kpi-card">
                  <Icon size={20} style={{ color: 'var(--brand-500)', marginBottom: 12 }} />
                  <span className="stat__value">{value}</span>
                  <span className="stat__label">{label}</span>
                </div>
              ))}
            </div>

            {topics.length > 0 && (
              <div className="card">
                <div className="card__header">
                  <div>
                    <h2 className="card__title">Desempenho por tópico</h2>
                    <p className="card__subtitle">Sua taxa de acerto por área de conhecimento.</p>
                  </div>
                </div>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Tópico</th>
                      <th>Corretas / Total</th>
                      <th style={{ width: 180 }}>Acerto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topics.map((t) => {
                      const pct = Math.round((t.accuracy ?? t.taxa_acerto ?? 0) * 100);
                      return (
                        <tr key={t.topic ?? t.topico}>
                          <td>{t.topic ?? t.topico}</td>
                          <td style={{ color: 'var(--text-muted)' }}>
                            {t.correct ?? '—'} / {t.total ?? t.attempts ?? '—'}
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div className="progress__bar" style={{ flex: 1 }}>
                                <div className="progress__fill" style={{ width: `${pct}%` }} />
                              </div>
                              <span style={{ fontSize: 13, width: 36, textAlign: 'right' }}>{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
