import { useCallback, useMemo, useState } from 'react';
import { runPython, resetPythonSession } from '../runtime/pyodideRuntime.js';
import { runR, resetRSession } from '../runtime/webrRuntime.js';

const RUNNERS = { python: runPython, r: runR };
const RESETTERS = { python: resetPythonSession, r: resetRSession };

function makeSessionId(lang, epoch) {
  return `${lang}-${epoch}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useCellSession(lang) {
  const [epoch, setEpoch] = useState(0);
  const sessionId = useMemo(() => makeSessionId(lang, epoch), [lang, epoch]);
  const [results, setResults] = useState({});

  const runCell = useCallback(async (blockId, code) => {
    const runner = RUNNERS[lang];
    if (!runner) return;
    setResults((prev) => ({ ...prev, [blockId]: { status: 'running' } }));
    const result = await runner(code, { sessionId });
    setResults((prev) => ({
      ...prev,
      [blockId]: {
        status: result.ok ? 'done' : 'error',
        stdout: result.stdout,
        stderr: result.stderr,
        images: result.images,
        error: result.error,
      },
    }));
  }, [lang, sessionId]);

  const resetSession = useCallback(() => {
    RESETTERS[lang]?.(sessionId);
    setResults({});
    setEpoch((e) => e + 1);
  }, [lang, sessionId]);

  return { results, runCell, resetSession };
}
