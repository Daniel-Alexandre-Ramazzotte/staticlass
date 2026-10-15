import { useEffect, useRef, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { StreamLanguage } from '@codemirror/language';
import { r as rMode } from '@codemirror/legacy-modes/mode/r';
import { Play, RotateCcw, Loader2 } from 'lucide-react';

const EXTENSIONS = { python: [python()], r: [StreamLanguage.define(rMode)] };

function storageKeyFor(slug, blockId) {
  return `livro:${slug}:${blockId}`;
}

export default function CodeCell({ slug, block, onRun, result }) {
  const storageKey = storageKeyFor(slug, block.id);
  const [value, setValue] = useState(() => localStorage.getItem(storageKey) ?? block.code);
  const saveTimer = useRef(null);

  useEffect(() => () => clearTimeout(saveTimer.current), []);

  function handleChange(next) {
    setValue(next);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      if (next === block.code) localStorage.removeItem(storageKey);
      else localStorage.setItem(storageKey, next);
    }, 400);
  }

  function handleReset() {
    clearTimeout(saveTimer.current);
    localStorage.removeItem(storageKey);
    setValue(block.code);
  }

  const isEdited = value !== block.code;
  const running = result?.status === 'running';

  return (
    <div id={block.id} className="code-cell">
      <div className="code-cell__toolbar">
        <span className="code-cell__lang">{block.lang}</span>
        <div className="code-cell__actions">
          {isEdited && (
            <button className="btn btn--ghost btn--sm" onClick={handleReset} title="Restaurar código original">
              <RotateCcw size={13} /> Restaurar
            </button>
          )}
          <button
            className="btn btn--primary btn--sm"
            onClick={() => onRun?.(value)}
            disabled={!onRun || running}
            title={onRun ? 'Rodar código' : 'Ambiente de execução ainda não carregado'}
          >
            {running ? <Loader2 size={13} className="spin-icon" /> : <Play size={13} />}
            {running ? 'Rodando…' : 'Rodar'}
          </button>
        </div>
      </div>
      <CodeMirror
        value={value}
        onChange={handleChange}
        extensions={EXTENSIONS[block.lang] ?? []}
        theme="dark"
        basicSetup={{ lineNumbers: true, foldGutter: false }}
      />
      {result && (result.stdout || result.stderr || result.error || result.images?.length > 0) && (
        <div className="code-cell__output">
          {result.stdout && <pre className="code-cell__stdout"><code>{result.stdout}</code></pre>}
          {(result.stderr || result.error) && (
            <pre className="code-cell__error"><code>{result.error || result.stderr}</code></pre>
          )}
          {result.images?.map((src, i) => (
            <img key={i} src={src} alt={`Saída gráfica ${i + 1}`} className="code-cell__image" />
          ))}
        </div>
      )}
    </div>
  );
}
