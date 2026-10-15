export default function ChapterToc({ toc }) {
  function handleClick(e, blockId) {
    e.preventDefault();
    document.getElementById(blockId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div className="card livro-toc">
      <p className="card__subtitle" style={{ marginBottom: 12 }}>Neste capítulo</p>
      <nav>
        {toc.map((item) => (
          <a
            key={item.blockId}
            href={`#${item.blockId}`}
            className={`livro-toc__link livro-toc__link--level-${item.level}`}
            onClick={(e) => handleClick(e, item.blockId)}
          >
            {item.text}
          </a>
        ))}
      </nav>
    </div>
  );
}
