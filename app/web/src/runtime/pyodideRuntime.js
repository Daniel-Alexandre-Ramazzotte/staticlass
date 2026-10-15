// Client-side Python execution via Pyodide (WASM), loaded lazily from CDN on
// first run — never bundled into the Vite build. One Python `globals` dict
// per chapter-visit session, so later cells can see variables created by
// earlier cells in the same chapter (e.g. a `dados` DataFrame built once).

const PYODIDE_VERSION = '0.29.4';
const INDEX_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

let pyodidePromise = null;
const sessionGlobals = new Map();

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Falha ao carregar Pyodide de ${src}`));
    document.head.appendChild(script);
  });
}

function getPyodide() {
  if (!pyodidePromise) {
    pyodidePromise = (async () => {
      await loadScript(`${INDEX_URL}pyodide.js`);
      const pyodide = await window.loadPyodide({ indexURL: INDEX_URL });
      await pyodide.loadPackage('matplotlib');
      await pyodide.runPythonAsync("import matplotlib\nmatplotlib.use('AGG')\n");
      return pyodide;
    })();
  }
  return pyodidePromise;
}

function getSessionGlobals(pyodide, sessionId) {
  if (!sessionGlobals.has(sessionId)) {
    sessionGlobals.set(sessionId, pyodide.globals.get('dict')());
  }
  return sessionGlobals.get(sessionId);
}

const CAPTURE_FIGURES_SRC = `
def __livro_capture_figures():
    import matplotlib.pyplot as plt
    import io, base64
    images = []
    for num in plt.get_fignums():
        fig = plt.figure(num)
        buf = io.BytesIO()
        fig.savefig(buf, format="png", bbox_inches="tight")
        buf.seek(0)
        images.append(base64.b64encode(buf.read()).decode("ascii"))
    plt.close("all")
    return images
__livro_capture_figures()
`;

export async function runPython(code, { sessionId }) {
  const pyodide = await getPyodide();
  const globals = getSessionGlobals(pyodide, sessionId);
  let stdout = '';
  let stderr = '';
  pyodide.setStdout({ batched: (s) => { stdout += `${s}\n`; } });
  pyodide.setStderr({ batched: (s) => { stderr += `${s}\n`; } });
  try {
    await pyodide.loadPackagesFromImports(code);
    await pyodide.runPythonAsync(code, { globals });
    const imagesProxy = await pyodide.runPythonAsync(CAPTURE_FIGURES_SRC);
    const images = imagesProxy.toJs().map((b64) => `data:image/png;base64,${b64}`);
    imagesProxy.destroy();
    return { ok: true, stdout: stdout.trim(), stderr: stderr.trim(), images };
  } catch (err) {
    return { ok: false, stdout: stdout.trim(), stderr: stderr.trim(), images: [], error: err.message ?? String(err) };
  } finally {
    pyodide.setStdout({});
    pyodide.setStderr({});
  }
}

export function resetPythonSession(sessionId) {
  const globals = sessionGlobals.get(sessionId);
  if (globals) globals.destroy();
  sessionGlobals.delete(sessionId);
}
