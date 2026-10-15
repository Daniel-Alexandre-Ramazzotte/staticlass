import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Check, Plus, Minus, Image, Eye, EyeOff, X, Info, AlertTriangle } from 'lucide-react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import Topbar from '../components/Topbar.jsx';
import api from '../services/api.js';

const LETTERS = ['A', 'B', 'C', 'D', 'E'];

const TIPOS = [
  { label: 'Múltipla Escolha', value: 'multiple_choice' },
  { label: 'Verdadeiro/Falso', value: 'true_false' },
  { label: 'Resposta Aberta', value: 'open_answer' },
];

const FONTES = [
  { label: 'Vestibular', value: 'vestibular' },
  { label: 'ENEM', value: 'ENEM' },
  { label: 'Concurso', value: 'concurso' },
  { label: 'Olimpíada', value: 'olimpíada' },
  { label: 'Lista', value: 'lista' },
  { label: 'Apostila', value: 'apostila' },
  { label: 'Outro', value: 'outro' },
];

const DIFFS = [
  { label: 'Fácil', value: '1' },
  { label: 'Médio', value: '2' },
  { label: 'Difícil', value: '3' },
];

function makeDefaultAlts(tipo) {
  if (tipo === 'open_answer') return [];
  if (tipo === 'true_false') return [{ letter: 'A', text: '', isCorrect: false }];
  return LETTERS.slice(0, 5).map((l) => ({ letter: l, text: '', isCorrect: false }));
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');
}

function renderLatex(text) {
  if (!text) return { __html: '' };
  // matches: $$block$$, $inline$, {image.ext}
  const regex = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$|\{[^}\s]+\})/g;
  const parts = [];
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    const raw = match[0];
    if (raw.startsWith('$$')) {
      parts.push({ type: 'block', content: raw.slice(2, -2) });
    } else if (raw.startsWith('$')) {
      parts.push({ type: 'inline', content: raw.slice(1, -1) });
    } else {
      parts.push({ type: 'image', content: raw.slice(1, -1) });
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) });
  }
  const html = parts
    .map((p) => {
      if (p.type === 'text') return escapeHtml(p.content);
      if (p.type === 'image') {
        const src = `/api/questions/uploads/${encodeURIComponent(p.content)}`;
        return `<img src="${src}" alt="${escapeHtml(p.content)}" style="max-width:100%;border-radius:6px;margin:6px 0;display:block;" />`;
      }
      try {
        return katex.renderToString(p.content, {
          displayMode: p.type === 'block',
          throwOnError: false,
        });
      } catch {
        return escapeHtml(p.content);
      }
    })
    .join('');
  return { __html: html };
}

function LatexPreview({ text }) {
  const [open, setOpen] = useState(false);
  if (!text?.trim()) return null;
  return (
    <div style={{ marginTop: 8 }}>
      <button
        type="button"
        className="btn btn--ghost btn--sm"
        style={{ fontSize: 12, height: 28, padding: '0 10px' }}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <EyeOff size={13} /> : <Eye size={13} />}
        {open ? ' Ocultar preview' : ' Pré-visualizar'}
      </button>
      {open && (
        <div
          className="latex-preview"
          dangerouslySetInnerHTML={renderLatex(text)}
        />
      )}
    </div>
  );
}

export default function AdicionarQuestao() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const proposeId = searchParams.get('propose');
  const fromProposalId = searchParams.get('from_proposal');

  const [questionType, setQuestionType] = useState('multiple_choice');
  const [chapters, setChapters] = useState([]);
  const [allTopics, setAllTopics] = useState([]);
  const [sections, setSections] = useState([]);
  const [chapterId, setChapterId] = useState(null);
  const [topicId, setTopicId] = useState(null);
  const [customSection, setCustomSection] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [fonte, setFonte] = useState('');
  const [issue, setIssue] = useState('');
  const [solution, setSolution] = useState('');
  const [alternatives, setAlternatives] = useState(makeDefaultAlts('multiple_choice'));
  const [correct, setCorrect] = useState('A');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [reason, setReason] = useState('');
  const [proposalInfo, setProposalInfo] = useState(null);

  // Images
  const [images, setImages] = useState([]);
  const [imgUploading, setImgUploading] = useState(false);
  const [imgError, setImgError] = useState('');
  const imgInputRef = useRef(null);
  const savedCursor = useRef(null); // { fieldId, start, end }

  const visibleTopics = chapterId
    ? allTopics.filter((t) => t.chapter_id === chapterId)
    : [];

  useEffect(() => {
    api.get('/questions/chapters').then((r) => setChapters(r.data)).catch(() => {});
    api.get('/questions/topics').then((r) => setAllTopics(r.data)).catch(() => {});
    api.get('/questions/sections').then((r) => setSections(Array.isArray(r.data) ? r.data : [])).catch(() => {});
  }, []);

  function _applyQuestionData(q) {
    const qt = q.question_type || 'multiple_choice';
    setQuestionType(qt);
    setIssue(q.issue ?? '');
    setSolution(q.solution ?? '');
    setDifficulty(q.difficulty ? String(q.difficulty) : '');
    setFonte(q.source ?? '');
    setChapterId(q.chapter_id ?? null);
    setTopicId(q.topic_id ?? null);
    setCustomSection(q.section ?? '');
    setCorrect(q.correct_answer ?? 'A');
    const existing = [q.image_q, q.image_s].filter(Boolean);
    if (existing.length) setImages(existing);
    const alts = (q.alternatives ?? []).map((a) => ({
      letter: a.letter,
      text: a.text,
      isCorrect: a.is_correct,
    }));
    setAlternatives(alts.length >= 1 ? alts : makeDefaultAlts(qt));
  }

  // Edit mode: load existing question
  useEffect(() => {
    if (!editId) return;
    const sourceId = fromProposalId ? null : editId;
    if (!sourceId) return;
    api.get(`/questions/${editId}`)
      .then((r) => _applyQuestionData(r.data))
      .catch(() => setError('Não foi possível carregar a questão.'));
  }, [editId]);

  // Propose mode: load current question to pre-fill form
  useEffect(() => {
    if (!proposeId) return;
    api.get(`/questions/${proposeId}`)
      .then((r) => _applyQuestionData(r.data))
      .catch(() => setError('Não foi possível carregar a questão.'));
  }, [proposeId]);

  // From-proposal mode (admin accepting with modifications): load proposed data
  useEffect(() => {
    if (!fromProposalId || !editId) return;
    api.get(`/questions/propostas/${fromProposalId}`)
      .then((r) => {
        const p = r.data;
        setProposalInfo(p);
        _applyQuestionData(p.changes);
      })
      .catch(() => setError('Não foi possível carregar a proposta.'));
  }, [fromProposalId, editId]);

  function saveCursor(fieldId, e) {
    savedCursor.current = {
      fieldId,
      start: e.target.selectionStart,
      end: e.target.selectionEnd,
    };
  }

  async function handleImgUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImgError('');
    setImgUploading(true);
    try {
      const form = new FormData();
      form.append('image', file);
      const res = await api.post('/questions/upload_image', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImages((prev) => [...prev, res.data.filename]);
    } catch {
      setImgError('Falha ao enviar imagem.');
    } finally {
      setImgUploading(false);
      e.target.value = '';
    }
  }

  function insertImage(filename) {
    const tag = `{${filename}}`;
    const cur = savedCursor.current;

    if (!cur) {
      setIssue((prev) => prev + (prev && !prev.endsWith('\n') ? '\n' : '') + tag);
      return;
    }

    const { fieldId, start, end } = cur;
    const splice = (prev) => prev.slice(0, start) + tag + prev.slice(end);

    if (fieldId === 'issue') setIssue(splice);
    else if (fieldId === 'solution') setSolution(splice);
    else if (fieldId?.startsWith('alt-')) {
      const letter = fieldId.slice(4);
      setAlternatives((prev) =>
        prev.map((a) => (a.letter === letter ? { ...a, text: splice(a.text) } : a))
      );
    }

    savedCursor.current = { ...cur, start: start + tag.length, end: start + tag.length };
  }

  function handleSetType(tipo) {
    setQuestionType(tipo);
    setCorrect('A');
    setAlternatives(makeDefaultAlts(tipo));
  }

  function addAlternative() {
    setAlternatives((prev) => {
      if (questionType === 'multiple_choice' && prev.length >= 5) return prev;
      const nextLetter = LETTERS[prev.length] ?? String.fromCharCode(65 + prev.length);
      return [...prev, { letter: nextLetter, text: '', isCorrect: false }];
    });
  }

  function removeAlternative(idx) {
    setAlternatives((prev) => {
      const min = questionType === 'multiple_choice' ? 2 : 1;
      if (prev.length <= min) return prev;
      return prev.filter((_, i) => i !== idx);
    });
  }

  function updateAltText(idx, text) {
    setAlternatives((prev) => prev.map((a, i) => (i === idx ? { ...a, text } : a)));
  }

  function toggleVF(idx) {
    setAlternatives((prev) => prev.map((a, i) => (i === idx ? { ...a, isCorrect: !a.isCorrect } : a)));
  }

  async function handleSave() {
    setError('');
    if (!issue.trim()) { setError('Preencha o enunciado.'); return; }
    if (questionType === 'multiple_choice' && !correct) { setError('Selecione a resposta correta.'); return; }

    setSaving(true);
    const altsPayload = questionType === 'open_answer'
      ? []
      : alternatives.map((a) => ({
          letter: a.letter,
          text: a.text,
          is_correct: questionType === 'multiple_choice' ? a.letter === correct : a.isCorrect,
        }));

    const payload = {
      issue,
      question_type: questionType,
      solution: solution || undefined,
      section: !chapterId && customSection.trim() ? customSection.trim() : null,
      chapter_id: chapterId ?? undefined,
      topic_id: topicId ?? undefined,
      difficulty: difficulty ? Number(difficulty) : undefined,
      source: fonte || undefined,
      correct_answer: questionType === 'multiple_choice' ? correct : null,
      alternatives: altsPayload,
    };

    try {
      if (proposeId) {
        // Professor proposing changes — not applied directly, goes to admin review
        await api.post(`/questions/${proposeId}/propor`, {
          changes: payload,
          reason: reason.trim() || undefined,
        });
        navigate(`/questoes/${proposeId}`);
      } else if (editId) {
        await api.put('/questions/update', { ...payload, id: editId });
        // After saving with from_proposal, mark proposal as accepted with modifications
        if (fromProposalId) {
          await api.put(`/questions/propostas/${fromProposalId}`, { action: 'approve_modified' });
        }
        navigate(`/questoes/${editId}`);
      } else {
        const res = await api.post('/questions/add', payload);
        const newId = res.data?.id;
        navigate(newId ? `/questoes/${newId}` : '/questoes');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao salvar a questão.');
    } finally {
      setSaving(false);
    }
  }

  const crumbs = proposeId
    ? [{ label: 'Questões', to: '/questoes' }, { label: 'Propor alteração' }]
    : fromProposalId
      ? [{ label: 'Questões', to: '/questoes' }, { label: 'Propostas', to: '/propostas' }, { label: 'Aceitar com ajustes' }]
      : [{ label: 'Questões', to: '/questoes' }, { label: editId ? 'Editar' : 'Adicionar' }];

  const pageTitle = proposeId
    ? 'Propor alteração'
    : fromProposalId
      ? 'Aceitar com ajustes'
      : editId ? 'Editar questão' : 'Adicionar questão';

  const pageSubtitle = proposeId
    ? `Questão #${proposeId} — suas alterações serão enviadas para revisão do administrador.`
    : fromProposalId
      ? `Proposta #${fromProposalId} — edite conforme necessário e salve para aplicar.`
      : editId ? 'Atualize os dados desta questão.' : 'Crie uma nova questão para o banco de dados.';

  return (
    <>
      <Topbar crumbs={crumbs} />
      <div className="content">
        <div className="page-header">
          <div>
            <h1 className="page-header__title">{pageTitle}</h1>
            <p className="page-header__subtitle">{pageSubtitle}</p>
          </div>
          <div className="page-header__actions">
            <button className="btn btn--ghost" onClick={() => navigate(fromProposalId ? '/propostas' : '/questoes')}>
              <ArrowLeft size={16} /> Voltar
            </button>
          </div>
        </div>

        {proposeId && (
          <div style={{
            display: 'flex', gap: 10, alignItems: 'flex-start',
            padding: '12px 16px', borderRadius: 'var(--radius-md)',
            background: 'color-mix(in srgb, var(--warning-500, #f59e0b) 12%, transparent)',
            border: '1px solid color-mix(in srgb, var(--warning-500, #f59e0b) 35%, transparent)',
            marginBottom: 4, fontSize: 14, lineHeight: 1.5,
          }}>
            <AlertTriangle size={18} style={{ color: 'var(--warning-600, #d97706)', flexShrink: 0, marginTop: 1 }} />
            <span>
              Você está propondo uma alteração nesta questão. As mudanças <strong>não serão aplicadas imediatamente</strong> — um administrador precisará revisar e aprovar antes que entrem em vigor.
            </span>
          </div>
        )}

        {fromProposalId && proposalInfo && (
          <div style={{
            display: 'flex', gap: 10, alignItems: 'flex-start',
            padding: '12px 16px', borderRadius: 'var(--radius-md)',
            background: 'color-mix(in srgb, var(--primary, #0074c3) 10%, transparent)',
            border: '1px solid color-mix(in srgb, var(--primary, #0074c3) 30%, transparent)',
            marginBottom: 4, fontSize: 14, lineHeight: 1.5,
          }}>
            <Info size={18} style={{ color: 'var(--primary, #0074c3)', flexShrink: 0, marginTop: 1 }} />
            <span>
              Carregado com base na <strong>proposta #{fromProposalId}</strong>. Edite conforme necessário — ao salvar, as alterações serão aplicadas diretamente e a proposta marcada como aceita.
            </span>
          </div>
        )}

        {/* Tipo de questão */}
        <div className="card">
          <div className="card__header">
            <h2 className="card__title">Tipo de questão</h2>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {TIPOS.map(({ label, value }) => (
              <button
                key={value}
                className={`btn ${questionType === value ? 'btn--primary' : 'btn--ghost'}`}
                onClick={() => handleSetType(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Enunciado + Resolução */}
        <div className="card">
          <div className="card__header">
            <h2 className="card__title">Enunciado</h2>
          </div>
          <div className="field">
            <label className="field__label" htmlFor="issue">
              Enunciado <span className="req">*</span>
            </label>
            <textarea
              className="textarea"
              id="issue"
              rows={5}
              value={issue}
              onChange={(e) => setIssue(e.target.value)}
              onBlur={(e) => saveCursor('issue', e)}
              onKeyUp={(e) => saveCursor('issue', e)}
              onMouseUp={(e) => saveCursor('issue', e)}
              placeholder="Use $...$ para LaTeX inline, $$...$$ para bloco e {imagem.png} para imagens"
            />
            <LatexPreview text={issue} />
          </div>

          <div className="field" style={{ marginTop: 20 }}>
            <label className="field__label" htmlFor="solution">Resolução</label>
            <textarea
              className="textarea"
              id="solution"
              rows={3}
              value={solution}
              onChange={(e) => setSolution(e.target.value)}
              onBlur={(e) => saveCursor('solution', e)}
              onKeyUp={(e) => saveCursor('solution', e)}
              onMouseUp={(e) => saveCursor('solution', e)}
              placeholder="Explique a resolução… Use $...$ para LaTeX e {imagem.png} para imagens"
            />
            <LatexPreview text={solution} />
          </div>
        </div>

        {/* Imagens */}
        <div className="card">
          <div className="card__header">
            <div>
              <h2 className="card__title">Imagens</h2>
              <p className="card__subtitle">
                Posicione o cursor no texto e clique{' '}
                <strong>Inserir</strong> — a referência{' '}
                <code style={{ background: 'var(--surface-2)', padding: '1px 5px', borderRadius: 4, fontSize: 12 }}>
                  {'{nome.png}'}
                </code>{' '}
                será colada nessa posição. Use no início, no meio ou no fim do texto.
              </p>
            </div>
            <div>
              <input
                ref={imgInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImgUpload}
              />
              <button
                className="btn btn--secondary btn--sm"
                disabled={imgUploading}
                onClick={() => imgInputRef.current?.click()}
              >
                <Image size={14} />
                {imgUploading ? 'Enviando…' : 'Adicionar imagem'}
              </button>
            </div>
          </div>

          {imgError && <p className="field__error" style={{ marginBottom: 12 }}>{imgError}</p>}

          {images.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Nenhuma imagem adicionada. Clique em "Adicionar imagem" para fazer upload.
            </p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
              {images.map((filename) => (
                <div
                  key={filename}
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    width: 160,
                    flexShrink: 0,
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <div style={{
                    height: 100,
                    background: 'var(--bg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}>
                    <img
                      src={`/api/questions/uploads/${encodeURIComponent(filename)}`}
                      alt={filename}
                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                    />
                  </div>
                  <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <code style={{
                      fontSize: 11,
                      color: 'var(--text-muted)',
                      wordBreak: 'break-all',
                      lineHeight: 1.4,
                    }}>
                      {`{${filename}}`}
                    </code>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        className="btn btn--secondary btn--sm"
                        style={{ flex: 1, fontSize: 12, height: 28 }}
                        onClick={() => insertImage(filename)}
                      >
                        Inserir
                      </button>
                      <button
                        className="btn btn--ghost btn--sm"
                        style={{ padding: '0 8px', height: 28, color: 'var(--text-subtle)' }}
                        onClick={() => setImages((prev) => prev.filter((f) => f !== filename))}
                        aria-label="Remover da galeria"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Assunto */}
        <div className="card">
          <div className="card__header">
            <div>
              <h2 className="card__title">Assunto</h2>
              <p className="card__subtitle">Selecione um capítulo ou digite um assunto personalizado.</p>
            </div>
          </div>

          {chapters.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <p className="field__label" style={{ marginBottom: 8 }}>Capítulo</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {chapters.map((c) => (
                  <button
                    key={c.id}
                    className={`chip ${chapterId === c.id ? 'chip--easy' : 'chip--neutral'}`}
                    style={{ cursor: 'pointer', border: 'none', fontSize: 13 }}
                    onClick={() => {
                      if (chapterId === c.id) { setChapterId(null); setTopicId(null); }
                      else { setChapterId(c.id); setTopicId(null); setCustomSection(''); }
                    }}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {visibleTopics.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <p className="field__label" style={{ marginBottom: 8 }}>Tópico</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {visibleTopics.map((t) => (
                  <button
                    key={t.id}
                    className={`chip ${topicId === t.id ? 'chip--easy' : 'chip--neutral'}`}
                    style={{ cursor: 'pointer', border: 'none', fontSize: 13 }}
                    onClick={() => setTopicId(topicId === t.id ? null : t.id)}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {sections.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <p className="field__label" style={{ marginBottom: 8 }}>Seções salvas</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {sections.map((sec) => (
                  <button
                    key={sec}
                    className={`chip ${!chapterId && customSection === sec ? 'chip--easy' : 'chip--neutral'}`}
                    style={{ cursor: 'pointer', border: 'none', fontSize: 13 }}
                    onClick={() => { setCustomSection(sec); setChapterId(null); setTopicId(null); }}
                  >
                    {sec}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="field">
            <label className="field__label" htmlFor="section">Assunto personalizado</label>
            <input
              className="input"
              id="section"
              type="text"
              value={customSection}
              onChange={(e) => {
                setCustomSection(e.target.value);
                if (e.target.value) { setChapterId(null); setTopicId(null); }
              }}
              placeholder="ex: Correlação e regressão linear"
            />
          </div>
        </div>

        {/* Dificuldade */}
        <div className="card">
          <div className="card__header">
            <h2 className="card__title">Dificuldade</h2>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {DIFFS.map(({ label, value }) => (
              <button
                key={value}
                className={`btn ${difficulty === value ? 'btn--primary' : 'btn--ghost'}`}
                onClick={() => setDifficulty(difficulty === value ? '' : value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Fonte */}
        <div className="card">
          <div className="card__header">
            <h2 className="card__title">Fonte</h2>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {FONTES.map(({ label, value }) => (
              <button
                key={value}
                className={`chip ${fonte === value ? 'chip--easy' : 'chip--neutral'}`}
                style={{ cursor: 'pointer', border: 'none', fontSize: 13 }}
                onClick={() => setFonte(fonte === value ? '' : value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Alternativas */}
        {questionType !== 'open_answer' && (
          <div className="card">
            <div className="card__header">
              <div>
                <h2 className="card__title">Alternativas</h2>
                <p className="card__subtitle">
                  {questionType === 'multiple_choice'
                    ? 'Selecione o radio da alternativa correta.'
                    : 'Marque V ou F para cada afirmação.'}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {alternatives.map((alt, idx) => (
                <div key={alt.letter} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    {questionType === 'multiple_choice' ? (
                      <input
                        type="radio"
                        name="correct"
                        checked={correct === alt.letter}
                        onChange={() => setCorrect(alt.letter)}
                        aria-label={`Marcar ${alt.letter} como correta`}
                      />
                    ) : (
                      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                        <button
                          style={{
                            width: 30, height: 30, borderRadius: 6, border: 'none', cursor: 'pointer',
                            background: alt.isCorrect ? 'var(--success-600)' : 'var(--surface-2)',
                            color: alt.isCorrect ? '#fff' : 'inherit', fontWeight: 700, fontSize: 13,
                          }}
                          onClick={() => { if (!alt.isCorrect) toggleVF(idx); }}
                        >V</button>
                        <button
                          style={{
                            width: 30, height: 30, borderRadius: 6, border: 'none', cursor: 'pointer',
                            background: !alt.isCorrect ? 'var(--danger-500)' : 'var(--surface-2)',
                            color: !alt.isCorrect ? '#fff' : 'inherit', fontWeight: 700, fontSize: 13,
                          }}
                          onClick={() => { if (alt.isCorrect) toggleVF(idx); }}
                        >F</button>
                      </div>
                    )}
                    <label className="alt-edit__letter" htmlFor={`alt-${alt.letter}`}>{alt.letter}</label>
                    <input
                      className="input"
                      id={`alt-${alt.letter}`}
                      style={{ flex: 1 }}
                      type="text"
                      value={alt.text}
                      onChange={(e) => updateAltText(idx, e.target.value)}
                      onBlur={(e) => saveCursor(`alt-${alt.letter}`, e)}
                      onKeyUp={(e) => saveCursor(`alt-${alt.letter}`, e)}
                      onMouseUp={(e) => saveCursor(`alt-${alt.letter}`, e)}
                      placeholder={questionType === 'true_false' ? 'Afirmação…' : 'Texto da alternativa…'}
                      aria-label={`Texto da alternativa ${alt.letter}`}
                    />
                    {alternatives.length > (questionType === 'multiple_choice' ? 2 : 1) && (
                      <button
                        className="btn btn--ghost"
                        style={{ padding: '4px 8px', flexShrink: 0 }}
                        onClick={() => removeAlternative(idx)}
                        aria-label="Remover alternativa"
                      >
                        <Minus size={14} />
                      </button>
                    )}
                  </div>
                  {alt.text && (
                    <div style={{ paddingLeft: 82 }}>
                      <LatexPreview text={alt.text} />
                    </div>
                  )}
                </div>
              ))}
            </div>
            {(questionType === 'multiple_choice' && alternatives.length < 5) ||
              questionType === 'true_false' ? (
              <button
                className="btn btn--secondary"
                style={{ marginTop: 14 }}
                onClick={addAlternative}
              >
                <Plus size={14} />
                {questionType === 'true_false' ? ' Adicionar afirmação' : ' Adicionar alternativa'}
              </button>
            ) : null}
          </div>
        )}

        {proposeId && (
          <div className="card">
            <div className="card__header">
              <h2 className="card__title">Motivo da alteração</h2>
            </div>
            <div className="field">
              <label className="field__label" htmlFor="reason">Explique por que esta questão deve ser alterada (opcional)</label>
              <textarea
                className="textarea"
                id="reason"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="ex: Enunciado ambíguo, alternativa correta diverge do gabarito oficial…"
              />
            </div>
          </div>
        )}

        {error && <p className="field__error">{error}</p>}

        <div className="form-footer">
          <button
            className="btn btn--ghost"
            disabled={saving}
            onClick={() => navigate(fromProposalId ? '/propostas' : '/questoes')}
          >
            Cancelar
          </button>
          <button
            className="btn btn--success"
            disabled={saving || !issue.trim()}
            onClick={handleSave}
          >
            <Check size={16} /> {saving
              ? 'Enviando…'
              : proposeId
                ? 'Enviar para revisão'
                : editId ? 'Atualizar' : 'Concluir'}
          </button>
        </div>
      </div>
    </>
  );
}
