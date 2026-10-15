import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, X, Users, Search, UserPlus, Upload } from 'lucide-react';
import Topbar from '../../components/Topbar.jsx';
import api from '../../services/api.js';

const CRUMBS = [{ label: 'Turmas' }];

export default function TurmasPage() {
  const [turmas, setTurmas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [selectedTurma, setSelectedTurma] = useState(null);
  const [turmaDetail, setTurmaDetail] = useState(null);
  const [allAlunos, setAllAlunos] = useState([]);
  const [search, setSearch] = useState('');
  const [updating, setUpdating] = useState(null);
  const [error, setError] = useState('');
  const searchRef = useRef(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState(null);

  function loadTurmas() {
    setLoading(true);
    api.get('/turmas')
      .then((r) => setTurmas(r.data))
      .catch(() => setError('Não foi possível carregar.'))
      .finally(() => setLoading(false));
  }

  useEffect(loadTurmas, []);

  async function handleCreate(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await api.post('/turmas', { name: newName.trim() });
      setNewName('');
      loadTurmas();
    } catch {
      setError('Erro ao criar turma.');
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/turmas/${id}`);
      setTurmas((prev) => prev.filter((t) => t.id !== id));
      setDeleteId(null);
    } catch {
      setError('Não foi possível deletar.');
    }
  }

  async function openTurma(turma) {
    setSelectedTurma(turma);
    setSearch('');
    const [detail, alunosRes] = await Promise.all([
      api.get(`/turmas/${turma.id}`).then((r) => r.data).catch(() => null),
      api.get('/users/alunos').then((r) => r.data).catch(() => []),
    ]);
    setTurmaDetail(detail);
    setAllAlunos(alunosRes);
    setTimeout(() => searchRef.current?.focus(), 100);
  }

  function closePanel() {
    setSelectedTurma(null);
    setTurmaDetail(null);
    setSearch('');
    loadTurmas(); // refresh student_count on cards
  }

  const enrolledIds = new Set((turmaDetail?.students ?? turmaDetail?.alunos ?? []).map((a) => a.id));
  const enrolledAlunos = allAlunos.filter((a) => enrolledIds.has(a.id));

  const q = search.trim().toLowerCase();
  const availableAlunos = allAlunos
    .filter((a) => !enrolledIds.has(a.id))
    .filter((a) =>
      !q ||
      a.name.toLowerCase().includes(q) ||
      String(a.ra ?? a.id).toLowerCase().includes(q)
    );

  async function setStudents(newIds, alunoId) {
    setUpdating(alunoId);
    try {
      await api.post(`/turmas/${selectedTurma.id}/students`, { student_ids: newIds });
      const updated = await api.get(`/turmas/${selectedTurma.id}`).then((r) => r.data);
      setTurmaDetail(updated);
    } catch {
      setError('Erro ao atualizar matrícula.');
    } finally {
      setUpdating(null);
    }
  }

  function addAluno(alunoId) {
    return setStudents([...enrolledIds, alunoId], alunoId);
  }

  function removeAluno(alunoId) {
    return setStudents([...enrolledIds].filter((x) => x !== alunoId), alunoId);
  }

  async function handleImport() {
    if (!importText.trim() || !selectedTurma) return;
    setImportLoading(true);
    setImportResult(null);
    try {
      const res = await api.post(`/turmas/${selectedTurma.id}/invite`, { raw_list: importText });
      setImportResult(res.data);
      const updated = await api.get(`/turmas/${selectedTurma.id}`).then((r) => r.data);
      setTurmaDetail(updated);
    } catch {
      setError('Erro ao importar lista.');
    } finally {
      setImportLoading(false);
    }
  }

  return (
    <>
      <Topbar crumbs={CRUMBS} />
      <div className="content">
        <div className="page-header">
          <div>
            <h1 className="page-header__title">Turmas</h1>
            <p className="page-header__subtitle">Gerencie as turmas e os alunos matriculados.</p>
          </div>
        </div>

        {error && <p className="field__error" style={{ marginBottom: 16 }}>{error}</p>}

        <div className="card" style={{ marginBottom: 24 }}>
          <form onSubmit={handleCreate} style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
            <div className="field" style={{ flex: 1, marginBottom: 0 }}>
              <label className="field__label">Nome da nova turma</label>
              <input
                className="input"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex: Turma A — 2026"
              />
            </div>
            <button className="btn btn--primary" type="submit" disabled={creating || !newName.trim()}>
              <Plus size={16} /> Criar
            </button>
          </form>
        </div>

        {loading ? (
          <div className="empty-state"><div className="loader" /></div>
        ) : turmas.length === 0 ? (
          <div className="empty-state"><p>Nenhuma turma criada ainda.</p></div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {turmas.map((t) => (
              <div key={t.id} className="card" style={{ cursor: 'pointer' }} onClick={() => openTurma(t)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, marginBottom: 6 }}>{t.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 13 }}>
                      <Users size={13} /> {t.student_count ?? t.aluno_count ?? 0} alunos
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {deleteId === t.id ? (
                      <>
                        <button className="btn btn--danger btn--sm" onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }}>Sim</button>
                        <button className="btn btn--ghost btn--sm" onClick={(e) => { e.stopPropagation(); setDeleteId(null); }}>Não</button>
                      </>
                    ) : (
                      <button className="btn btn--ghost btn--sm" onClick={(e) => { e.stopPropagation(); setDeleteId(t.id); }}>
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedTurma && (
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Header */}
          <div className="panel__header">
            <h2 className="card__title">{selectedTurma.name}</h2>
            <button className="icon-btn" onClick={closePanel}><X size={20} /></button>
          </div>

          {!turmaDetail ? (
            <div className="empty-state"><div className="loader" /></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, overflow: 'hidden', flex: 1 }}>

              {/* ── Matriculados ─────────────────────────────── */}
              <div style={{ padding: '0 0 16px' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  marginBottom: 10, color: 'var(--text-muted)', fontSize: 12,
                  textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600,
                }}>
                  <Users size={12} />
                  Matriculados
                  <span style={{
                    marginLeft: 'auto',
                    background: 'var(--accent)',
                    color: '#fff',
                    borderRadius: 99,
                    fontSize: 11,
                    padding: '1px 7px',
                    fontWeight: 700,
                  }}>
                    {enrolledAlunos.length}
                  </span>
                </div>

                {enrolledAlunos.length === 0 ? (
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    Nenhum aluno matriculado ainda.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {enrolledAlunos.map((a) => (
                      <span
                        key={a.id}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          background: 'var(--bg-subtle, var(--surface))',
                          border: '1px solid var(--border)',
                          borderRadius: 6,
                          padding: '4px 8px',
                          fontSize: 13,
                          opacity: updating === a.id ? 0.5 : 1,
                          transition: 'opacity 0.15s',
                        }}
                      >
                        {a.name}
                        <button
                          onClick={() => removeAluno(a.id)}
                          disabled={updating === a.id}
                          style={{
                            background: 'none', border: 'none', padding: 0,
                            cursor: 'pointer', color: 'var(--text-muted)',
                            display: 'flex', alignItems: 'center',
                            lineHeight: 1,
                          }}
                          aria-label={`Remover ${a.name}`}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ height: 1, background: 'var(--border)', margin: '0 0 16px' }} />

              {/* ── Adicionar alunos ─────────────────────────── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, overflow: 'hidden' }}>
                <div style={{
                  color: 'var(--text-muted)', fontSize: 12,
                  textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <UserPlus size={12} />
                  Adicionar aluno
                </div>

                <div style={{ position: 'relative' }}>
                  <Search
                    size={15}
                    style={{
                      position: 'absolute', left: 10, top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-muted)', pointerEvents: 'none',
                    }}
                  />
                  <input
                    ref={searchRef}
                    className="input"
                    style={{ paddingLeft: 32 }}
                    placeholder="Buscar por nome ou RA…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                <div style={{ overflowY: 'auto', flex: 1 }}>
                  {availableAlunos.length === 0 ? (
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic', paddingTop: 4 }}>
                      {q ? 'Nenhum resultado para a busca.' : 'Todos os alunos já estão matriculados.'}
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {availableAlunos.map((a) => (
                        <button
                          key={a.id}
                          onClick={() => addAluno(a.id)}
                          disabled={updating === a.id}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '9px 6px',
                            background: 'none', border: 'none',
                            borderBottom: '1px solid var(--border)',
                            cursor: 'pointer',
                            textAlign: 'left',
                            opacity: updating === a.id ? 0.5 : 1,
                            transition: 'background 0.12s, opacity 0.15s',
                            borderRadius: 0,
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-subtle, rgba(0,0,0,0.04))'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                        >
                          <div style={{
                            width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                            background: 'var(--accent)', color: '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-display)',
                          }}>
                            {a.name.trim().split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{a.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>RA {a.ra ?? a.id}</div>
                          </div>
                          <Plus size={15} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              className="btn btn--ghost"
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              onClick={() => { setImportResult(null); setShowImportModal(true); }}
            >
              <Upload size={15} /> Importar por lista
            </button>
            <button className="btn btn--primary" style={{ width: '100%' }} onClick={closePanel}>
              Concluído
            </button>
          </div>
        </div>
      )}

      {showImportModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 200,
        }}
          onClick={(e) => e.target === e.currentTarget && setShowImportModal(false)}
        >
          <div className="card" style={{ width: 480, maxWidth: '95vw', padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 17 }}>Importar alunos por lista</h3>
              <button className="icon-btn" onClick={() => setShowImportModal(false)}><X size={18} /></button>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
              Cole um email por linha, ou no formato:<br />
              <code style={{ background: 'var(--bg-subtle)', padding: '2px 6px', borderRadius: 4 }}>
                Nome Completo &lt;email@exemplo.com&gt;
              </code>
            </p>
            <textarea
              className="input"
              rows={8}
              style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: 13 }}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder={'João Silva <joao@uem.br>\nMaria <maria@exemplo.com>'}
            />
            {importResult && (
              <div style={{ background: 'var(--bg-subtle)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--text)' }}>
                ✓ <strong>{importResult.enrolled}</strong> matriculados ·{' '}
                <strong>{importResult.invited}</strong> convites enviados ·{' '}
                <strong>{importResult.skipped}</strong> ignorados
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn--ghost" onClick={() => { setShowImportModal(false); setImportText(''); setImportResult(null); }}>
                Fechar
              </button>
              <button
                className="btn btn--primary"
                onClick={handleImport}
                disabled={importLoading || !importText.trim()}
              >
                {importLoading ? 'Importando…' : 'Importar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
