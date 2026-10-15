import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, Users, GraduationCap,
  ClipboardList, Building2, Star, LogOut, Dices, GitPullRequest, Trophy, Library,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { appUrl } from '../utils/paths.js';

const NAV_ADMIN = [
  { label: 'Início', to: '/dashboard', Icon: LayoutDashboard },
  { label: 'Quiz', to: '/quiz', Icon: Dices },
  { label: 'Livro', to: '/livro', Icon: Library },
  { label: 'Questões', to: '/questoes', Icon: BookOpen },
  { label: 'Listas', to: '/listas', Icon: ClipboardList },
  { label: 'Turmas', to: '/turmas', Icon: Building2 },
  { label: 'Propostas', to: '/propostas', Icon: GitPullRequest },
  { label: 'Ranking', to: '/ranking', Icon: Trophy },
  { label: 'Professores', to: '/professores', Icon: GraduationCap },
  { label: 'Alunos', to: '/alunos', Icon: Users },
];

const NAV_PROFESSOR = [
  { label: 'Listas', to: '/listas', Icon: ClipboardList },
  { label: 'Turmas', to: '/turmas', Icon: Building2 },
  { label: 'Quiz', to: '/quiz', Icon: Dices },
  { label: 'Livro', to: '/livro', Icon: Library },
  { label: 'Questões', to: '/questoes', Icon: BookOpen },
  { label: 'Ranking', to: '/ranking', Icon: Trophy },
];

const NAV_ALUNO = [
  { label: 'Minhas listas', to: '/minhas-listas', Icon: ClipboardList },
  { label: 'Quiz', to: '/quiz', Icon: Dices },
  { label: 'Livro', to: '/livro', Icon: Library },
  { label: 'Ranking', to: '/ranking', Icon: Star },
  { label: 'Perfil', to: '/perfil', Icon: Users },
];

const NAV_BY_ROLE = { admin: NAV_ADMIN, professor: NAV_PROFESSOR, aluno: NAV_ALUNO };
const ROLE_LABEL = { admin: 'Admin', professor: 'Professor', aluno: 'Aluno' };

function initials(name) {
  return (name ?? '?').split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

export default function Sidebar() {
  const { name, role, emailVerified, signOut } = useAuth();
  const navItems = NAV_BY_ROLE[role] ?? [];

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <img src={appUrl('/logo.png')} alt="Staticlass" className="sidebar__logo-img" />
        <div className="sidebar__name">Staticlass</div>
      </div>

      <nav className="sidebar__nav">
        {navItems.map(({ label, to, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar__institutions">
        <img src={appUrl('/uem-logo.png')} alt="UEM" />
        <img src={appUrl('/acao11-logo.webp')} alt="DataSci PROPET" />
      </div>

      <div className="sidebar__user">
        <div className="avatar" style={{ position: 'relative' }}>
          {initials(name)}
          {!emailVerified && (
            <span style={{
              position: 'absolute', top: -2, right: -2,
              width: 10, height: 10, borderRadius: '50%',
              background: 'var(--red, #f65151)',
              border: '2px solid var(--sidebar-bg, #093d60)',
            }} />
          )}
        </div>
        <div className="sidebar__user-info">
          <div className="sidebar__user-name">{name ?? '—'}</div>
          <div className="sidebar__user-role">{ROLE_LABEL[role] ?? role}</div>
        </div>
        <button className="icon-btn" title="Sair" onClick={signOut} style={{ marginLeft: 'auto', flexShrink: 0 }}>
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}
