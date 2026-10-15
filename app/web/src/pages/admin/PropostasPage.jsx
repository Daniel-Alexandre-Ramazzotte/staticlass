import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X, Pencil, ChevronRight, Clock, User, MessageSquare } from 'lucide-react';
import Topbar from '../../components/Topbar.jsx';
import api from '../../services/api.js';

const CRUMBS = [{ label: 'Propostas de alteração' }];

const STATUS_LABEL = {
  pending: 'Aguardando',
  approved: 'Aceita',
  approved_modified: 'Aceita com ajustes',
  rejected: 'Recusada',
};
const STATUS_CHIP = {
  pending: 'chip--medium',
  approved: 'chip--easy',
  approved_modified: 'chip--easy',
  rejected: 'chip',
};

const DIFF_LABELS = {
  issue: 'Enunciado',
  question_type: 'Tipo',
  correct_answer: 'Resposta correta',
  solution: 'Resolução',
  difficulty: 'Dificuldade',
  source: 'Fonte',
  section: 'Assunto',
  chapter_id: 'Capítulo',
  topic_id: 'Tópico',
};
const DIFF_TYPE_LABEL = { multiple_choice: 'Múltipla Escolha', true_false: 'V/F', open_answer: 'Resposta Aberta' };
const DIFF_DIFF_LABEL = { 1: 'Fácil', 2: 'Médio', 3: 'Difícil' };

function fmt(field, val, chapters, topics) {
  if (val === null || val === undefined || val === '') return '—';
  if (field === 'question_type') return DIFF_TYPE_LABEL[val] ?? val;
  if (field === 'difficulty') return DIFF_DIFF_LABEL[val] ?? val;
  if (field === 'chapter_id') return chapters.find((c) => c.id === val)?.name ?? `#${val}`;
  if (field === 'topic_id') return topics.find((t) => t.id === val)?.name ?? `#${val}`;
  if (typeof val === 'string' && val.length > 120) return val.slice(0, 120) + '…';
  return String(val);
}

function AlternativesDiff({ current, proposed }) {
  const allLetters = [
    ...new Set([
      ...(current ?? []).map((a) => a.letter),
      ...(proposed ?? []).map((a) => a.letter),
    ]),
  ].sort();
  const curMap = Object.fromEntries((current ?? []).map((a) => [a.letter, a]));
  const propMap = Object.fromEntries((proposed ?? []).map((a) => [a.letter, a]));

  if (allLetters.length === 0) return <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>sem alternativas</span>;

  return (
    <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th style={{ textAlign: 'left', padding: '4px 8px', color: 'var(--text-muted)', fontWeight: 500, width: 40 }}>Letra</th>
          <th style={{ textAlign: 'left', padding: '4px 8px', color: 'var(--text-muted)', fontWeight: 500 }}>Atual</th>
          <th style={{ textAlign: 'left', padding: '4px 8px', color: 'var(--text-muted)', fontWeight: 500 }}>Proposta</th>
        </tr>
      </thead>
      <tbody>
        {allLetters.map((letter) => {
          const cur = curMap[letter];
          const prop = propMap[letter];
          const changed = !cur || !prop || cur.text !== prop.text || cur.is_correct !== prop.is_correct;
          return (
            <tr key={letter} style={{ background: changed ? 'color-mix(in srgb, var(--warning-500, #f59e0b) 10%, transparent)' : undefined }}>
              <td style={{ padding: '4px 8px', fontWeight: 700 }}>{letter}</td>
              <td style={{ padding: '4px 8px' }}>
                {cur ? <>{cur.text}{cur.is_correct && <span style={{ color: 'var(--success-600)', marginLeft: 4 }}>✓</span>}</> : <em style={{ color: 'var(--text-muted)' }}>—</em>}
              </td>
              <td style={{ padding: '4px 8px', color: changed ? 'var(--success-600)' : 'inherit', fontWeight: changed ? 600 : 400 }}>
                {prop ? <>{prop.text}{prop.is_correct && <span style={{ marginLeft: 4 }}>✓</span>}</> : <em style={{ color: 'var(--danger-500)' }}>removida</em>}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function DiffRow({ label, cur, prop }) {
  const changed = cur !== prop;
  return (
    <tr style={{ background: changed ? 'color-mix(in srgb, var(--warning-500, #f59e0b) 10%, transparent)' : undefined }}>
      <td style={{ padding: '8px 10px', color: 'var(--text-muted)', fontSize: 13, fontWeight: 500, width: 130, verticalAlign: 'top' }}>{label}</td>
      <td style={{ padding: '8px 10px', fontSize: 13, verticalAlign: 'top', maxWidth: 220, wordBreak: 'break-word' }}>{cur || '—'}</td>
      <td style={{
        padding: '8px 10px', fontSize: 13, verticalAlign: 'top',
        maxWidth: 220, wordBreak: 'break-word',
        color: changed ? 'var(--success-600)' : 'inherit',
        fontWeight: changed ? 600 : 400,
      }}>{prop || '—'}</td>
    </tr>
  );
}

export default function PropostasPage() {
  const navigate = useNavigate();
  const [proposals, setProposals] = useState([]);
  const [selected, setSelected] = useState(null);
  const [currentQ, setCurrentQ] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingQ, setLoadingQ] = useState(false);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [rejecting, setRejecting] = useState(false);
  const [rejectionNote, setRejectionNote] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setSelected(null);
    Promise.all([
      api.get('/questions/propostas', { params: { status: statusFilter } }),
      api.get('/questions/chapters'),
      api.get('/questions/topics'),
    ])
      .then(([prRes, chRes, toRes]) => {
        setProposals(prRes.data);
        setChapters(chRes.data);
        setTopics(toRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => {
    if (!selected) { setCurrentQ(null); return; }
    const proposal = proposals.find((p) => p.id === selected);
    if (!proposal) return;
    setLoadingQ(true);
    api.get(`/questions/${proposal.question_id}`)
      .then((r) => setCurrentQ(r.data))
      .catch(() => setCurrentQ(null))
      .finally(() => setLoadingQ(false));
  }, [selected]);

  const selectedProposal = proposals.find((p) => p.id === selected) ?? null;

  async function handleApprove() {
    if (!selected) return;
    setProcessing(true);
    setError('');
    try {
      await api.put(`/questions/propostas/${selected}`, { action: 'approve' });
      setProposals((prev) => prev.map((p) => p.id === selected ? { ...p, status: 'approved' } : p));
      setSelected(null);
    } catch (e) {
      setError(e.response?.data?.error || 'Erro ao aceitar proposta.');
    } finally {
      setProcessing(false);
    }
  }

  async function handleReject() {
    if (!selected) return;
    setProcessing(true);
    setError('');
    try {
      await api.put(`/questions/propostas/${selected}`, { action: 'reject', admin_note: rejectionNote.trim() || undefined });
      setProposals((prev) => prev.map((p) => p.id === selected ? { ...p, status: 'rejected' } : p));
      setSelected(null);
      setRejecting(false);
      setRejectionNote('');
    } catch (e) {
      setError(e.response?.data?.error || 'Erro ao recusar proposta.');
    } finally {
      setProcessing(false);
    }
  }

  function handleAcceptModified() {
    if (!selectedProposal) return;
    navigate(`/questoes/nova?edit=${selectedProposal.question_id}&from_proposal=${selectedProposal.id}`);
  }

  const SCALAR_FIELDS = ['issue', 'question_type', 'correct_answer', 'solution', 'difficulty', 'source', 'section', 'chapter_id', 'topic_id'];

  function relativeDate(iso) {
    if (!iso) return '';
    const diff = Date.now() - new Date(iso).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'hoje';
    if (days === 1) return 'ontem';
    return `há ${days} dias`;
  }

  return (
    <>
      <Topbar crumbs={CRUMBS} />
      <div className="content content--detail">
        <div>
          <div className="page-header">
            <div>
              <h1 className="page-header__title">Propostas de alteração</h1>
              <p className="page-header__subtitle">Revisão de sugestões de professores para questões do banco.</p>
            </div>
            <div className="page-header__actions" style={{ gap: 6 }}>
              {['pending', 'all'].map((f) => (
                <button
                  key={f}
                  className={`btn ${statusFilter === f ? 'btn--primary' : 'btn--ghost'}`}
                  onClick={() => setStatusFilter(f)}
                >
                  {f === 'pending' ? 'Pendentes' : 'Todas'}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="field__error" style={{ marginBottom: 12 }}>{error}</p>}

          {loading ? (
            <div className="empty-state"><div className="loader" /></div>
          ) : proposals.length === 0 ? (
            <div className="empty-state">
              <p style={{ color: 'var(--text-muted)' }}>
                {statusFilter === 'pending' ? 'Nenhuma proposta pendente.' : 'Nenhuma proposta encontrada.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {proposals.map((p) => (
                <div
                  key={p.id}
                  className={`card${selected === p.id ? ' card--selected' : ''}`}
                  style={{
                    cursor: 'pointer',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    border: selected === p.id ? '2px solid var(--primary, #0074c3)' : undefined,
                  }}
                  onClick={() => setSelected(selected === p.id ? null : p.id)}
                >
                  <span className={`chip ${STATUS_CHIP[p.status] ?? 'chip--neutral'}`} style={{ flexShrink: 0 }}>
                    {STATUS_LABEL[p.status] ?? p.status}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>Questão #{p.question_id}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.question_issue?.slice(0, 80)}…
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, flexShrink: 0 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <User size={11} /> {p.proposer_name}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={11} /> {relativeDate(p.created_at)}
                    </div>
                  </div>
                  <ChevronRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0, transform: selected === p.id ? 'rotate(90deg)' : undefined, transition: 'transform 0.15s' }} />
                </div>
              ))}
            </div>
          )}
        </div>

        <aside className="side-panel">
          {!selectedProposal ? (
            <div className="card">
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Selecione uma proposta para ver o diff e as ações disponíveis.</p>
            </div>
          ) : (
            <>
              <div className="card">
                <div className="card__header">
                  <h2 className="card__title">Proposta #{selectedProposal.id}</h2>
                  <span className={`chip ${STATUS_CHIP[selectedProposal.status] ?? 'chip--neutral'}`}>
                    {STATUS_LABEL[selectedProposal.status] ?? selectedProposal.status}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', color: 'var(--text-muted)' }}>
                    <User size={13} /> {selectedProposal.proposer_name}
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', color: 'var(--text-muted)' }}>
                    <Clock size={13} /> {selectedProposal.created_at ? new Date(selectedProposal.created_at).toLocaleString('pt-BR') : '—'}
                  </div>
                  {selectedProposal.reason && (
                    <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start', marginTop: 4 }}>
                      <MessageSquare size={13} style={{ flexShrink: 0, marginTop: 1, color: 'var(--text-muted)' }} />
                      <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>{selectedProposal.reason}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="card">
                <div className="card__header">
                  <h2 className="card__title">Alterações propostas</h2>
                </div>
                {loadingQ ? (
                  <div className="empty-state" style={{ margin: '16px 0' }}><div className="loader" /></div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: 'left', padding: '6px 10px', fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, width: 130 }}>Campo</th>
                          <th style={{ textAlign: 'left', padding: '6px 10px', fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>Atual</th>
                          <th style={{ textAlign: 'left', padding: '6px 10px', fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>Proposto</th>
                        </tr>
                      </thead>
                      <tbody>
                        {SCALAR_FIELDS.map((field) => {
                          const cur = currentQ?.[field === 'chapter_id' ? 'chapter_id' : field === 'topic_id' ? 'topic_id' : field];
                          const prop = selectedProposal.changes?.[field];
                          const curFmt = fmt(field, cur, chapters, topics);
                          const propFmt = fmt(field, prop, chapters, topics);
                          if (curFmt === '—' && propFmt === '—') return null;
                          return <DiffRow key={field} label={DIFF_LABELS[field] ?? field} cur={curFmt} prop={propFmt} />;
                        })}
                      </tbody>
                    </table>
                    <div style={{ marginTop: 16 }}>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, marginBottom: 8 }}>Alternativas</p>
                      <AlternativesDiff
                        current={currentQ?.alternatives}
                        proposed={selectedProposal.changes?.alternatives}
                      />
                    </div>
                  </div>
                )}
              </div>

              {selectedProposal.status === 'pending' && (
                <div className="card">
                  <div className="card__header">
                    <h2 className="card__title">Ações</h2>
                  </div>
                  {!rejecting ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <button
                        className="btn btn--success"
                        style={{ width: '100%', justifyContent: 'center' }}
                        disabled={processing}
                        onClick={handleApprove}
                      >
                        <Check size={15} /> Aceitar proposta
                      </button>
                      <button
                        className="btn btn--secondary"
                        style={{ width: '100%', justifyContent: 'center' }}
                        disabled={processing}
                        onClick={handleAcceptModified}
                      >
                        <Pencil size={15} /> Aceitar com ajustes
                      </button>
                      <button
                        className="btn btn--ghost"
                        style={{ width: '100%', justifyContent: 'center', color: 'var(--danger-500)' }}
                        disabled={processing}
                        onClick={() => setRejecting(true)}
                      >
                        <X size={15} /> Recusar
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div className="field">
                        <label className="field__label" htmlFor="rej-note">Motivo da recusa (opcional)</label>
                        <textarea
                          className="textarea"
                          id="rej-note"
                          rows={3}
                          value={rejectionNote}
                          onChange={(e) => setRejectionNote(e.target.value)}
                          placeholder="Informe o motivo para o professor…"
                        />
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          className="btn btn--ghost"
                          style={{ flex: 1 }}
                          disabled={processing}
                          onClick={() => { setRejecting(false); setRejectionNote(''); }}
                        >
                          Cancelar
                        </button>
                        <button
                          className="btn btn--primary"
                          style={{ flex: 1, justifyContent: 'center', color: '#fff', background: 'var(--danger-500)' }}
                          disabled={processing}
                          onClick={handleReject}
                        >
                          <X size={15} /> Confirmar recusa
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {selectedProposal.admin_note && (
                <div className="card">
                  <div className="card__header">
                    <h2 className="card__title">Nota do admin</h2>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>{selectedProposal.admin_note}</p>
                </div>
              )}
            </>
          )}
        </aside>
      </div>
    </>
  );
}
