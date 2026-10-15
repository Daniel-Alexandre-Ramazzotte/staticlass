import { Check, Plus } from 'lucide-react';
import Topbar from '../components/Topbar.jsx';

const BRAND_SCALE = ['50','100','200','300','400','500','600','700','800','900'];

const CRUMBS = [
  { label: 'Início', to: '/' },
  { label: 'Design system' },
];

export default function TokensPage({ theme, onToggleTheme }) {
  return (
    <>
      <Topbar crumbs={CRUMBS} theme={theme} onToggleTheme={onToggleTheme} />
      <div className="content">
        <div className="page-header">
          <div>
            <h1 className="page-header__title">Tokens & componentes</h1>
            <p className="page-header__subtitle">
              Referência visual dos tokens do design system web do Staticlass.
            </p>
          </div>
        </div>

        {/* Color scale */}
        <div className="card">
          <div className="card__header">
            <div>
              <h2 className="card__title">Cor da marca</h2>
              <p className="card__subtitle">500 para primários. 600 para hover. 50/100 para fundos sutis.</p>
            </div>
          </div>
          <div className="swatches">
            {BRAND_SCALE.map((s) => (
              <div key={s} className="swatch">
                <div className="swatch__chip" style={{ background: `var(--brand-${s})` }} />
                <div className="swatch__name">brand-{s}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ height: 16 }} />

        {/* Semantic */}
        <div className="card">
          <div className="card__header">
            <div>
              <h2 className="card__title">Cores semânticas</h2>
              <p className="card__subtitle">Verde = conclusão de fluxo. Vermelho = destrutivo/erro. Nunca dois CTAs verdes.</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {[
              { name: 'success-500', hex: '#55bf44' },
              { name: 'success-600', hex: '#449a36' },
              { name: 'danger-500',  hex: '#f65151' },
              { name: 'danger-600',  hex: '#d83f3f' },
              { name: 'warn-500',    hex: '#e2a13a' },
            ].map(({ name, hex }) => (
              <div key={name} className="swatch">
                <div className="swatch__chip" style={{ background: `var(--${name})`, width: 96 }} />
                <div className="swatch__name">{name}</div>
                <div className="swatch__value">{hex}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ height: 16 }} />

        {/* Typography */}
        <div className="card">
          <div className="card__header">
            <div>
              <h2 className="card__title">Tipografia — Chau Philomene One + Carlito</h2>
              <p className="card__subtitle">Display em títulos e CTAs primários; Carlito em corpo, labels e UI.</p>
            </div>
          </div>
          <div>
            <div className="type-row">
              <span className="type-row__name">display / 32px</span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 32, lineHeight: '36px' }}>
                Adicionar questão
              </span>
            </div>
            <div className="type-row">
              <span className="type-row__name">display / 24px</span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 24 }}>
                Cabeçalho de seção
              </span>
            </div>
            <div className="type-row">
              <span className="type-row__name">display / 20px</span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 20 }}>
                Título de card
              </span>
            </div>
            <div className="type-row">
              <span className="type-row__name">sans / 15px 400</span>
              <span style={{ fontSize: 15 }}>
                Corpo de texto e enunciados de questão. Carlito a 400 — leitura confortável em telas grandes.
              </span>
            </div>
            <div className="type-row">
              <span className="type-row__name">sans / 14px 700</span>
              <span style={{ fontSize: 14, fontWeight: 700 }}>
                Labels de input e botões secundários
              </span>
            </div>
            <div className="type-row">
              <span className="type-row__name">sans / 12px 700 caps</span>
              <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, color: 'var(--text-muted)' }}>
                Metadata / Tabelas
              </span>
            </div>
          </div>
        </div>

        <div style={{ height: 16 }} />

        {/* Buttons */}
        <div className="card">
          <div className="card__header">
            <div>
              <h2 className="card__title">Botões</h2>
              <p className="card__subtitle">Sem caixa-alta. Sem pill. Radius 8px. Primários em font-display.</p>
            </div>
          </div>
          <div className="preview-strip">
            <button className="btn btn--primary">Salvar alterações</button>
            <button className="btn btn--secondary">Cancelar</button>
            <button className="btn btn--ghost">Voltar</button>
            <button className="btn btn--success">
              <Check size={16} /> Concluir
            </button>
            <button className="btn btn--danger">Deletar conta</button>
            <button className="btn btn--primary btn--sm">Pequeno</button>
            <button className="btn btn--primary btn--lg">
              <Plus size={18} /> Adicionar questão
            </button>
          </div>
        </div>

        <div style={{ height: 16 }} />

        {/* Chips */}
        <div className="card">
          <div className="card__header">
            <div>
              <h2 className="card__title">Chips de dificuldade</h2>
              <p className="card__subtitle">Pill radius. Fácil → verde; Médio → azul; Difícil → vermelho.</p>
            </div>
          </div>
          <div className="preview-strip">
            <span className="chip chip--easy">Fácil</span>
            <span className="chip chip--medium">Médio</span>
            <span className="chip chip--hard">Difícil</span>
            <span className="chip chip--neutral">Probabilidade</span>
          </div>
        </div>
      </div>
    </>
  );
}
