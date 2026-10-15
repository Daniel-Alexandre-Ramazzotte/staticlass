import { Link } from 'react-router-dom';
import { Library, Clock } from 'lucide-react';
import Topbar from '../components/Topbar.jsx';
import { BOOKS } from '../content/livro/books.js';

const CRUMBS = [{ label: 'Livro' }];

function BookCard({ book }) {
  if (!book.available) {
    return (
      <div className="card livro-chapter-card livro-chapter-card--disabled">
        <span className="livro-chapter-card__lang">
          <Clock size={14} /> Em breve
        </span>
        <h2 className="card__title" style={{ fontSize: 18 }}>{book.title}</h2>
        <p className="card__subtitle">{book.description}</p>
      </div>
    );
  }

  return (
    <Link to={`/livro/${book.slug}`} className="card livro-chapter-card">
      <span className="livro-chapter-card__lang">
        <Library size={14} /> Livro
      </span>
      <h2 className="card__title" style={{ fontSize: 18 }}>{book.title}</h2>
      <p className="card__subtitle">{book.description}</p>
    </Link>
  );
}

export default function LivroLibraryPage() {
  return (
    <>
      <Topbar crumbs={CRUMBS} />
      <div className="content">
        <div className="page-header">
          <div>
            <h1 className="page-header__title">Livros</h1>
            <p className="page-header__subtitle">
              Escolha um livro para ler os capítulos e rodar os exemplos de código direto na página.
            </p>
          </div>
        </div>

        <div className="kpi-grid">
          {BOOKS.map((book) => <BookCard key={book.slug} book={book} />)}
        </div>
      </div>
    </>
  );
}
