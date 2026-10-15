import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import Topbar from '../../components/Topbar.jsx';
import api from '../../services/api.js';

export default function NovaListaPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [title, setTitle] = useState('');
  const [turmaId, setTurmaId] = useState('');
  const [deadline, setDeadline] = useState('');
  const [status, setStatus] = useState('draft');
  const [turmas, setTurmas] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [chapterFilter, setChapterFilter] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 15;

  const CRUMBS = [
    { label: 'Listas', to: '/listas' },
    { label: isEdit ? 'Editar lista' : 'Nova lista' },
  ];

  useEffect(() => {
    Promise.all([
      api.get('/turmas').then((r) => setTurmas(r.data)).catch(() => {}),
      api.get('/questions/chapters').then((r) => setChapters(r.data)).catch(() => {}),
    ]);

    if (isEdit) {
      api.get(`/lists/${id}`)
        .then((r) => {
          const l = r.data;
          setTitle(l.title ?? '');
          setTurmaId(l.turma_id ?? '');
          setDeadline(l.deadline ? l.deadline.slice(0, 10) : '');
          setStatus(l.status ?? 'draft');
          setSelectedIds((l.questions ?? []).map((q) => q.id ?? q));
        })
        .catch(() => setError('Não foi possível carregar a lista.'));
    }
  }, [id, isEdit]);

  useEffect(() => {
    const params = new URLSearchParams({ num: 300 });
    if (chapterFilter) params.set('chapter_id', chapterFilter);
    api.get(`/questions/filtered?${params}`)
      .then((r) => setQuestions(r.data))
      .catch(() => {});
    setPage(0);
  }, [chapterFilter]);

  function toggleQuestion(qid) {
    setSelectedIds((prev) =>
      prev.includes(qid) ? prev.filter((x) => x !== qid) : [...prev, qid]
    );
  }

  async function handleSave() {
    setSaving(true);
    const payload = { title, turma_id: turmaId || undefined, deadline: deadline || undefined, status, question_ids: selectedIds };
    try {
      if (isEdit) {
        await api.put(`/lists/${id}`, payload);
      } else {
        await api.post('/lists', payload);
      }
      navigate('/listas');
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Topbar crumbs={CRUMBS} />
      <div className="content content--narrow">
        <div className="page-header">
          <div>
            <h1 className="page-header__title">{isEdit ? 'Editar lista' : 'Nova lista'}</h1>
            <p className="page-header__subtitle">Configure e selecione as questões desta lista.</p>
          </div>
          <div className="page-header__actions">
            <button className="btn btn--ghost" onClick={() => navigate('/listas')}>
              <ArrowLeft size={16} /> Voltar
            </button>
          </div>
        </div>

        <div className="card">
          <div className="card__header"><div><h2 className="card__title">Configurações</h2></div></div>
          <div className="grid-2">
            <div className="field">
              <label className="field__label">Título <span className="req">*</span></label>
              <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="field">
              <label className="field__label">Status</label>
              <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="draft">Rascunho</option>
                <option value="published">Publicada</option>
                <option value="closed">Fechada</option>
              </select>
            </div>
            <div className="field">
              <label className="field__label">Turma</label>
              <select className="select" value={turmaId} onChange={(e) => setTurmaId(e.target.value)}>
                <option value="">Selecione…</option>
                {turmas.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="field__label">Prazo</label>
              <input className="input" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card__header">
            <div>
              <h2 className="card__title">Questões selecionadas ({selectedIds.length})</h2>
              <p className="card__subtitle">Marque as questões a incluir nesta lista.</p>
            </div>
            <select className="select" style={{ width: 200 }} value={chapterFilter} onChange={(e) => setChapterFilter(e.target.value)}>
              <option value="">Todos os capítulos</option>
              {chapters.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {(() => {
            const totalPages = Math.ceil(questions.length / PAGE_SIZE);
            const pageItems = questions.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
            return (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {pageItems.map((q) => (
                    <label
                      key={q.id}
                      style={{ display: 'flex', gap: 12, alignItems: 'flex-start', cursor: 'pointer', padding: '10px 12px', borderRadius: 8, background: selectedIds.includes(q.id) ? 'var(--brand-50)' : 'transparent' }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(q.id)}
                        onChange={() => toggleQuestion(q.id)}
                        style={{ marginTop: 3, flexShrink: 0 }}
                      />
                      <span style={{ fontSize: 14, lineHeight: 1.5 }}>
                        <strong style={{ marginRight: 8, color: 'var(--text-muted)' }}>#{q.id}</strong>
                        {q.issue?.slice(0, 120)}{q.issue?.length > 120 ? '…' : ''}
                      </span>
                    </label>
                  ))}
                  {questions.length === 0 && <div className="empty-state"><p>Nenhuma questão disponível.</p></div>}
                </div>

                {totalPages > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      {questions.length} questões · página {page + 1} de {totalPages}
                    </span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        className="btn btn--ghost"
                        style={{ padding: '4px 12px', fontSize: 13 }}
                        disabled={page === 0}
                        onClick={() => setPage((p) => p - 1)}
                      >
                        ← Anterior
                      </button>
                      <button
                        className="btn btn--ghost"
                        style={{ padding: '4px 12px', fontSize: 13 }}
                        disabled={page >= totalPages - 1}
                        onClick={() => setPage((p) => p + 1)}
                      >
                        Próxima →
                      </button>
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>

        {error && <p className="field__error">{error}</p>}

        <div className="form-footer">
          <div />
          <div className="form-footer__right">
            <button className="btn btn--secondary" onClick={() => navigate('/listas')}>Cancelar</button>
            <button className="btn btn--success" disabled={saving || !title} onClick={handleSave}>
              <Check size={16} /> {saving ? 'Salvando…' : isEdit ? 'Atualizar' : 'Criar lista'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
