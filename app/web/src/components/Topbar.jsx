import { useState, useEffect } from 'react';
import { Search, Bell, Sun, Moon } from 'lucide-react';
import { Link } from 'react-router-dom';

const THEME_KEY = 'staticlass-theme';

export default function Topbar({ crumbs = [] }) {
  const [isDark, setIsDark] = useState(
    () => document.documentElement.getAttribute('data-theme') === 'dark'
  );

  useEffect(() => {
    const obs = new MutationObserver(() => {
      setIsDark(document.documentElement.getAttribute('data-theme') === 'dark');
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);

  function toggleTheme() {
    const next = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem(THEME_KEY, next);
    setIsDark(next === 'dark');
  }

  return (
    <header className="topbar">
      <nav className="breadcrumb" aria-label="Navegação estrutural">
        {crumbs.map((c, i) => (
          <span key={i}>
            {i > 0 && <span className="breadcrumb__sep">/</span>}
            {i === crumbs.length - 1 ? (
              <span className="breadcrumb__current">{c.label}</span>
            ) : (
              <Link to={c.to ?? '#'} style={{ color: 'inherit' }}>
                {c.label}
              </Link>
            )}
          </span>
        ))}
      </nav>

      <div className="topbar__spacer" />

      <div className="search" role="search">
        <Search size={16} />
        <span>Buscar questões, alunos…</span>
        <kbd>/</kbd>
      </div>

      <button className="icon-btn" aria-label="Notificações">
        <Bell size={20} />
      </button>

      <button
        className="icon-btn"
        aria-label={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
        onClick={toggleTheme}
      >
        {isDark ? <Sun size={20} /> : <Moon size={20} />}
      </button>
    </header>
  );
}
