import { Link, useParams } from 'react-router-dom';
import { BookMarked, FileText } from 'lucide-react';
import Topbar from '../components/Topbar.jsx';
import manifest from '../content/livro/manifest.json';
import { BOOKS } from '../content/livro/books.js';

const LANG_LABEL = { r: 'R', python: 'Python' };
const GROUP_LABEL = { prefacio: 'Prefácio', capitulo: 'Capítulos', apendice: 'Apêndices' };
const GROUP_ORDER = ['prefacio', 'capitulo', 'apendice'];

function ChapterCard({ bookSlug, chapter }) {
  return (
    <Link to={`/livro/${bookSlug}/${chapter.slug}`} className="card livro-chapter-card">
      <span className="livro-chapter-card__lang">
        {chapter.lang ? <><BookMarked size={14} /> {LANG_LABEL[chapter.lang] ?? chapter.lang}</> : <><FileText size={14} /> Leitura</>}
      </span>
      <h2 className="card__title" style={{ fontSize: 18 }}>{chapter.title}</h2>
    </Link>
  );
}

export default function LivroIndexPage() {
  const { bookSlug } = useParams();
  const book = BOOKS.find((b) => b.slug === bookSlug);

  const crumbs = [{ label: 'Livro', to: '/livro' }, { label: book?.title ?? 'Não encontrado' }];

  if (!book || !book.available) {
    return (
      <>
        <Topbar crumbs={crumbs} />
        <div className="content content--narrow">
          <div className="empty-state">
            <p>Livro não encontrado.</p>
            <Link to="/livro" className="btn btn--secondary" style={{ marginTop: 12 }}>Voltar aos livros</Link>
          </div>
        </div>
      </>
    );
  }

  const groups = GROUP_ORDER
    .map((group) => ({ group, chapters: manifest.filter((c) => c.group === group) }))
    .filter((g) => g.chapters.length > 0);

  return (
    <>
      <Topbar crumbs={crumbs} />
      <div className="content">
        <div className="page-header">
          <div>
            <h1 className="page-header__title">{book.title}</h1>
            <p className="page-header__subtitle">
              Leia os capítulos e rode os exemplos de código direto na página.
            </p>
          </div>
        </div>

        {groups.map(({ group, chapters }) => (
          <div key={group} style={{ marginBottom: 28 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', color: 'var(--text-muted)', margin: '0 0 12px' }}>
              {GROUP_LABEL[group] ?? group}
            </h3>
            <div className="kpi-grid">
              {chapters.map((chapter) => <ChapterCard key={chapter.slug} bookSlug={bookSlug} chapter={chapter} />)}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
