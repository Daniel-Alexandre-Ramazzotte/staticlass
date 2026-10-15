// Client-side R execution via webR (WASM), loaded lazily from CDN on first
// run — never bundled into the Vite build. One persistent R environment per
// chapter-visit session, so later cells can see variables/objects created by
// earlier cells in the same chapter (e.g. `dados <- mtcars` built once).
//
// webR's `captureR` defaults to `throwJsException: true` — on an R error it
// throws a JS Error with a pre-formatted "Error in <call>: <message>" text
// instead of returning it inside `output`, so R errors are handled by the
// try/catch below rather than by scanning the output array. This means
// stdout printed before a mid-cell error is not recovered (unlike the
// Pyodide runtime, which buffers stdout outside the try/catch) — an accepted
// simplification for the pilot, since the book's chunks are short.

const WEBR_URL = 'https://webr.r-wasm.org/latest/webr.mjs';
const BASE_PACKAGES = ['dplyr', 'ggplot2'];

let webRPromise = null;
const sessionEnvs = new Map();

async function preloadDatasets(webR) {
  // Book chunks in 01/03/04 do `read.csv("dados/pesquisa_exemplo.csv")` with
  // a relative path — write it into webR's default working directory
  // (homedir) so that call resolves without touching the book's source code.
  const res = await fetch(`${import.meta.env.BASE_URL}livro/pesquisa_exemplo.csv`);
  const bytes = new Uint8Array(await res.arrayBuffer());
  await webR.FS.mkdir('/home/web_user/dados');
  await webR.FS.writeFile('/home/web_user/dados/pesquisa_exemplo.csv', bytes);
}

function getWebR() {
  if (!webRPromise) {
    webRPromise = (async () => {
      const { WebR } = await import(/* @vite-ignore */ WEBR_URL);
      const webR = new WebR({ interactive: false });
      await webR.init();
      await webR.installPackages(BASE_PACKAGES);
      await preloadDatasets(webR);
      return webR;
    })();
  }
  return webRPromise;
}

async function getSessionEnv(webR, sessionId) {
  if (!sessionEnvs.has(sessionId)) {
    const env = await webR.evalR('new.env(parent = globalenv())');
    sessionEnvs.set(sessionId, env);
  }
  return sessionEnvs.get(sessionId);
}

function bitmapToDataUrl(bitmap) {
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  canvas.getContext('2d').drawImage(bitmap, 0, 0);
  return canvas.toDataURL('image/png');
}

export async function runR(code, { sessionId, width = 624, height = 416 }) {
  const webR = await getWebR();
  const env = await getSessionEnv(webR, sessionId);
  const shelter = await new webR.Shelter();
  try {
    const result = await shelter.captureR(code, {
      env,
      withAutoprint: true,
      captureStreams: true,
      captureConditions: true,
      captureGraphics: { width, height, bg: 'white' },
    });

    const stdout = result.output
      .filter((o) => o.type === 'stdout')
      .map((o) => o.data)
      .join('\n');

    const images = result.images.map(bitmapToDataUrl);

    return { ok: true, stdout: stdout.trim(), stderr: '', images };
  } catch (err) {
    return { ok: false, stdout: '', stderr: '', images: [], error: err.message ?? String(err) };
  } finally {
    await shelter.purge();
  }
}

export function resetRSession(sessionId) {
  sessionEnvs.delete(sessionId);
}
