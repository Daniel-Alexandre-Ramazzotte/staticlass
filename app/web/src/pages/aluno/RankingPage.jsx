import { useState, useEffect } from 'react';
import Topbar from '../../components/Topbar.jsx';
import api from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';

const CRUMBS = [{ label: 'Ranking' }];

function initials(name) {
  return (name ?? '?').split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

export default function RankingPage() {
  const { role } = useAuth();
  const [entries, setEntries] = useState([]);
  const [ownEntry, setOwnEntry] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load(p = 1) {
    setLoading(true);
    try {
      const r = await api.get(`/gamification/ranking?page=${p}`);
      const incoming = r.data?.ranking ?? [];
      if (p === 1) {
        setEntries(incoming);
      } else {
        setEntries((prev) => {
          const seen = new Set(prev.map((e) => e.id));
          return [...prev, ...incoming.filter((e) => !seen.has(e.id))];
        });
      }
      setOwnEntry(r.data?.own_entry ?? null);
      setHasMore(Boolean(r.data?.has_more));
      setPage(p);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(1); }, []);

  return (
    <>
      <Topbar crumbs={CRUMBS} />
      <div className="content">
        <div className="page-header">
          <div>
            <h1 className="page-header__title">Ranking global</h1>
            <p className="page-header__subtitle">Top alunos por XP acumulado.</p>
          </div>
        </div>

        <div className="card">
          {entries.length === 0 && !loading ? (
            <div className="empty-state"><p>Nenhum dado disponível.</p></div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 48 }}>#</th>
                  <th>Aluno</th>
                  <th style={{ textAlign: 'right' }}>XP</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => {
                  const isMe = role === 'aluno' && ownEntry && entry.id === ownEntry.id;
                  return (
                    <tr key={entry.id} style={isMe ? { background: 'var(--brand-50)', fontWeight: 700 } : {}}>
                      <td style={{ color: entry.posicao <= 3 ? 'var(--brand-500)' : 'var(--text-muted)', fontWeight: entry.posicao <= 3 ? 700 : 400 }}>
                        {entry.posicao}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div className="avatar" style={{ width: 32, height: 32, fontSize: 12 }}>{initials(entry.nome)}</div>
                          <span>
                            {entry.nome}
                            {isMe && <span style={{ color: 'var(--brand-500)', marginLeft: 8, fontSize: 12 }}>você</span>}
                          </span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-display)', fontSize: 16 }}>
                        {entry.xp?.toLocaleString('pt-BR')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {loading && <div className="empty-state"><div className="loader" /></div>}

          {!loading && hasMore && (
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <button className="btn btn--secondary" onClick={() => load(page + 1)}>Carregar mais</button>
            </div>
          )}
        </div>

        {ownEntry && (
          <div className="card" style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 16, padding: '12px 20px' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Sua posição:</span>
            <strong style={{ color: 'var(--brand-500)', fontSize: 18 }}>#{ownEntry.posicao}</strong>
            <span>{ownEntry.nome}</span>
            <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-display)', fontSize: 16 }}>{ownEntry.xp?.toLocaleString('pt-BR')} XP</span>
          </div>
        )}
      </div>
    </>
  );
}
