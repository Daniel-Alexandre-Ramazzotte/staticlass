import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { RotateCcw } from 'lucide-react';
import Topbar from '../components/Topbar.jsx';
import ProseBlock from '../components/livro/ProseBlock.jsx';
import CalloutBox from '../components/livro/CalloutBox.jsx';
import CodeCell from '../components/livro/CodeCell.jsx';
import StoryBlock from '../components/livro/StoryBlock.jsx';
import ChapterToc from '../components/livro/ChapterToc.jsx';
import { useCellSession } from '../hooks/useCellSession.js';
import { BOOKS } from '../content/livro/books.js';

// Auto-discovered so adding a chapter is just: run convert.mjs, done — no
// per-slug entry to remember to add here.
const CHAPTER_MODULES = import.meta.glob('../content/livro/*.json');
// Hand-authored narrative content, kept in separate files from the
// auto-generated chapter JSON so re-running scripts/livro/convert.mjs never
// wipes it out. Optional per chapter — missing file just means no stories yet.
const ENRICHMENT_MODULES = import.meta.glob('../content/livro/*.enrichment.json');

function chapterLoader(slug) {
  return CHAPTER_MODULES[`../content/livro/${slug}.json`];
}
function enrichmentLoader(slug) {
  return ENRICHMENT_MODULES[`../content/livro/${slug}.enrichment.json`];
}

// Languages with a wired-up client-side runtime; others show a disabled
// Run button until their runtime module lands.
const RUNNABLE_LANGS = new Set(['python', 'r']);

function mergeEnrichment(baseBlocks, entries) {
  const blocks = [...baseBlocks];
  for (const entry of entries) {
    const index = blocks.findIndex((b) => b.id === entry.afterBlockId);
    if (index === -1) continue;
    blocks.splice(index + 1, 0, { id: `${entry.afterBlockId}-story`, ...entry.block });
  }
  return blocks;
}

export default function LivroCapituloPage() {
  const { bookSlug, slug } = useParams();
  const book = BOOKS.find((b) => b.slug === bookSlug);
  const [chapter, setChapter] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const session = useCellSession(chapter?.lang ?? 'none');

  useEffect(() => {
    setChapter(null);
    setNotFound(false);
    if (!book || !book.available) { setNotFound(true); return; }
    const loader = chapterLoader(slug);
    if (!loader) { setNotFound(true); return; }
    Promise.all([
      loader().then((mod) => mod.default ?? mod),
      (enrichmentLoader(slug)?.() ?? Promise.resolve({ default: [] })).then((mod) => mod.default ?? mod).catch(() => []),
    ]).then(([base, enrichment]) => {
      setChapter({ ...base, blocks: mergeEnrichment(base.blocks, enrichment) });
    });
  }, [bookSlug, slug]);

  const crumbs = [
    { label: 'Livro', to: '/livro' },
    { label: book?.title ?? '…', to: `/livro/${bookSlug}` },
    { label: chapter?.title ?? '…' },
  ];

  if (notFound) {
    return (
      <>
        <Topbar crumbs={[{ label: 'Livro', to: '/livro' }, { label: 'Não encontrado' }]} />
        <div className="content content--narrow">
          <div className="empty-state">
            <p>Capítulo não encontrado.</p>
            <Link to={`/livro/${bookSlug}`} className="btn btn--secondary" style={{ marginTop: 12 }}>Voltar ao índice</Link>
          </div>
        </div>
      </>
    );
  }

  if (!chapter) {
    return (
      <>
        <Topbar crumbs={crumbs} />
        <div className="content content--narrow">
          <div className="empty-state"><div className="loader" /></div>
        </div>
      </>
    );
  }

  return (
    <>
      <Topbar crumbs={crumbs} />
      <div className="content content--detail">
        <div>
          <div className="page-header">
            <div>
              <h1 className="page-header__title">{chapter.title}</h1>
              <p className="page-header__subtitle">
                Execute os blocos em ordem — alguns dependem de variáveis criadas em blocos anteriores, como <code>dados</code>.
              </p>
            </div>
            {RUNNABLE_LANGS.has(chapter.lang) && (
              <div className="page-header__actions">
                <button className="btn btn--secondary" onClick={session.resetSession}>
                  <RotateCcw size={16} /> Reiniciar sessão
                </button>
              </div>
            )}
          </div>

          <div className="card">
            {chapter.blocks.map((block) => {
              if (block.type === 'prose') return <ProseBlock key={block.id} id={block.id} markdown={block.markdown} />;
              if (block.type === 'callout') {
                return (
                  <CalloutBox
                    key={block.id}
                    id={block.id}
                    calloutType={block.calloutType}
                    title={block.title}
                    markdown={block.markdown}
                  />
                );
              }
              if (block.type === 'story') {
                return (
                  <StoryBlock
                    key={block.id}
                    id={block.id}
                    title={block.title}
                    image={block.image}
                    markdown={block.markdown}
                  />
                );
              }
              if (block.type === 'code') {
                const runnable = RUNNABLE_LANGS.has(block.lang);
                return (
                  <CodeCell
                    key={block.id}
                    slug={chapter.slug}
                    block={block}
                    onRun={runnable ? (code) => session.runCell(block.id, code) : undefined}
                    result={session.results[block.id]}
                  />
                );
              }
              return null;
            })}
          </div>
        </div>

        <ChapterToc toc={chapter.toc} />
      </div>
    </>
  );
}
