import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Pencil } from 'lucide-react';
import Topbar from '../components/Topbar.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api.js';

const CRUMBS = [{ label: 'Questões' }];

const DIFF_LABEL = { 1: 'Fácil', 2: 'Médio', 3: 'Difícil' };
const DIFF_CHIP = { 1: 'chip--easy', 2: 'chip--medium', 3: 'chip--hard' };
const PAGE_SIZE = 20;

export default function QuestoesPage() {
  const navigate = useNavigate();
  const { role, userId } = useAuth();

  const [questions, setQuestions] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterChapter, setFilterChapter] = useState('');
  const [filterDiff, setFilterDiff] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    api.get('/questions/chapters').then((r) => setChapters(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!userId) return;
    const endpoint = role === 'admin'
      ? `/questions/admin/${userId}`
      : `/questions/professor/${userId}`;
    api.get(endpoint)
      .then((r) => setQuestions(Array.isArray(r.data) ? r.data : []))
      .catch(() => setError('Não foi possível carregar as questões.'))
      .finally(() => setLoading(false));
  }, [role, userId]);

  const chapterMap = Object.fromEntries(chapters.map((c) => [c.id, c.name]));

  const filtered = questions.filter((q) => {
    const matchSearch = !search || q.issue?.toLowerCase().includes(search.toLowerCase());
    const matchChapter = !filterChapter || String(q.chapter_id) === filterChapter;
    const matchDiff = !filterDiff || String(q.difficulty) === filterDiff;
    return matchSearch && matchChapter && matchDiff;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const resetPage = () => setPage(1);

  return (
    <>
      <Topbar crumbs={CRUMBS} />
      <div className="content">
        <div className="page-header">
          <div>
            <h1 className="page-header__title">Questões</h1>
            <p className="page-header__subtitle">
              {loading ? 'Carregando…' : `${filtered.length} questão${filtered.length !== 1 ? 'ões' : ''} encontrada${filtered.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <div className="page-header__actions">
            <button className="btn btn--primary" onClick={() => navigate('/questoes/nova')}>
              <Plus size={16} /> Nova questão
            </button>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <input
              className="input"
              placeholder="Buscar pelo enunciado…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); resetPage(); }}
              style={{ flex: 1, minWidth: 200 }}
            />
            <select
              className="select"
              value={filterChapter}
              onChange={(e) => { setFilterChapter(e.target.value); resetPage(); }}
              style={{ minWidth: 160 }}
            >
              <option value="">Todos os capítulos</option>
              {chapters.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select
              className="select"
              value={filterDiff}
              onChange={(e) => { setFilterDiff(e.target.value); resetPage(); }}
              style={{ minWidth: 130 }}
            >
              <option value="">Qualquer dificuldade</option>
              <option value="1">Fácil</option>
              <option value="2">Médio</option>
              <option value="3">Difícil</option>
            </select>
          </div>

          {loading && <div className="empty-state"><div className="loader" /></div>}
          {error && <p style={{ color: 'var(--danger-500)' }}>{error}</p>}

          {!loading && !error && filtered.length === 0 && (
            <div className="empty-state">
              <p>Nenhuma questão encontrada.</p>
              <button
                className="btn btn--secondary"
                style={{ marginTop: 12 }}
                onClick={() => navigate('/questoes/nova')}
              >
                Criar questão
              </button>
            </div>
          )}

          {!loading && filtered.length > 0 && (
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Enunciado</th>
                  <th>Capítulo</th>
                  <th>Dificuldade</th>
                  <th>Fonte</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((q) => (
                  <tr
                    key={q.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/questoes/${q.id}`)}
                  >
                    <td style={{ color: 'var(--text-muted)', fontSize: 13, whiteSpace: 'nowrap' }}>
                      #{q.id}
                    </td>
                    <td style={{ maxWidth: 400 }}>
                      <span
                        title={q.issue}
                        style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 380 }}
                      >
                        {q.issue}
                      </span>
                    </td>
                    <td>
                      {(q.chapter_name ?? chapterMap[q.chapter_id]) ? (
                        <span className="chip chip--neutral" style={{ fontSize: 11 }}>
                          {q.chapter_name ?? chapterMap[q.chapter_id]}
                        </span>
                      ) : <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>—</span>}
                    </td>
                    <td>
                      {q.difficulty ? (
                        <span className={`chip ${DIFF_CHIP[q.difficulty] ?? 'chip--neutral'}`} style={{ fontSize: 11 }}>
                          {DIFF_LABEL[q.difficulty] ?? q.difficulty}
                        </span>
                      ) : <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>—</span>}
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      {q.source ?? '—'}
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="btn btn--ghost"
                          style={{ padding: '4px 10px', fontSize: 12 }}
                          onClick={() => navigate(`/questoes/${q.id}`)}
                        >
                          <Eye size={13} /> Ver
                        </button>
                        <button
                          className="btn btn--secondary"
                          style={{ padding: '4px 10px', fontSize: 12 }}
                          onClick={() => navigate(`/questoes/nova?edit=${q.id}`)}
                        >
                          <Pencil size={13} /> Editar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {!loading && totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 20 }}>
              <button
                className="btn btn--secondary btn--sm"
                disabled={safePage === 1}
                onClick={() => setPage(1)}
              >
                «
              </button>
              <button
                className="btn btn--secondary btn--sm"
                disabled={safePage === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ‹
              </button>
              <span style={{ fontSize: 13, color: 'var(--text-muted)', minWidth: 100, textAlign: 'center' }}>
                Página {safePage} de {totalPages}
              </span>
              <button
                className="btn btn--secondary btn--sm"
                disabled={safePage === totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                ›
              </button>
              <button
                className="btn btn--secondary btn--sm"
                disabled={safePage === totalPages}
                onClick={() => setPage(totalPages)}
              >
                »
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
