import { useState, useEffect } from 'react';
import { Users, BookOpen, Target, Flame } from 'lucide-react';
import Topbar from '../../components/Topbar.jsx';
import api from '../../services/api.js';

const CRUMBS = [{ label: 'Início' }];

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/admin/stats/dashboard')
      .then((r) => setData(r.data))
      .catch(() => setError('Não foi possível carregar os dados.'))
      .finally(() => setLoading(false));
  }, []);

  const kpis = data ? [
    { icon: Users, label: 'Alunos ativos', value: data.active_users ?? data.total_alunos ?? '—' },
    { icon: BookOpen, label: 'Questões respondidas', value: data.total_answers ?? '—' },
    { icon: Target, label: 'Taxa de acerto', value: data.accuracy != null ? `${Math.round(data.accuracy * 100)}%` : '—' },
    { icon: Flame, label: 'Streak médio', value: data.avg_streak != null ? `${data.avg_streak} dias` : '—' },
  ] : [];

  const topicRows = data?.accuracy_by_topic ?? data?.topics ?? [];

  return (
    <>
      <Topbar crumbs={CRUMBS} />
      <div className="content">
        <div className="page-header">
          <div>
            <h1 className="page-header__title">Painel do administrador</h1>
            <p className="page-header__subtitle">Visão geral de atividade e desempenho da plataforma.</p>
          </div>
        </div>

        {loading && <div className="empty-state"><div className="loader" /><p>Carregando…</p></div>}
        {error && <div className="empty-state"><p style={{ color: 'var(--danger-500)' }}>{error}</p></div>}

        {data && (
          <>
            <div className="kpi-grid">
              {kpis.map(({ icon: Icon, label, value }) => (
                <div key={label} className="card kpi-card">
                  <Icon size={20} style={{ color: 'var(--brand-500)', marginBottom: 12 }} />
                  <span className="stat__value">{value}</span>
                  <span className="stat__label">{label}</span>
                </div>
              ))}
            </div>

            <div style={{ height: 24 }} />

            {topicRows.length > 0 && (
              <div className="card">
                <div className="card__header">
                  <div>
                    <h2 className="card__title">Acerto por tópico</h2>
                    <p className="card__subtitle">Percentual de respostas corretas por área.</p>
                  </div>
                </div>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Tópico</th>
                      <th>Tentativas</th>
                      <th>Taxa de acerto</th>
                      <th style={{ width: 180 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {topicRows.map((t) => {
                      const pct = Math.round((t.accuracy ?? t.taxa_acerto ?? 0) * 100);
                      return (
                        <tr key={t.topic ?? t.topico}>
                          <td>{t.topic ?? t.topico}</td>
                          <td>{t.attempts ?? t.tentativas ?? '—'}</td>
                          <td>{pct}%</td>
                          <td>
                            <div className="progress__bar" style={{ width: '100%' }}>
                              <div className="progress__fill" style={{ width: `${pct}%` }} />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {data.activity_by_role && (
              <>
                <div style={{ height: 24 }} />
                <div className="card">
                  <div className="card__header">
                    <div>
                      <h2 className="card__title">Atividade por perfil</h2>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
                    {Object.entries(data.activity_by_role).map(([r, v]) => (
                      <div key={r} className="stat">
                        <span className="stat__label">{r}</span>
                        <span className="stat__value">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}
