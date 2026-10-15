#!/usr/bin/env node
// Manual conversion: livro/*.qmd (Estatistica-Basica, sibling repo) -> committed
// JSON under src/content/livro/. Not part of build/CI — run by hand when the
// pilot chapters change, same posture as statl/migrate_questoes.py.
//
// Usage: node scripts/livro/convert.mjs [--src <path-to-livro-dir>]

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { parseQmd } from './parseQmd.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SOURCES = [
  { file: 'index.qmd', slug: 'prefacio', title: 'Prefácio', lang: null, group: 'prefacio', expectedCodeBlocks: 0 },
  { file: '01-descritiva.qmd', slug: 'descritiva', title: 'Estatística Descritiva', lang: 'r', group: 'capitulo', expectedCodeBlocks: 36 },
  { file: '02-probabilidade.qmd', slug: 'probabilidade', title: 'Probabilidade', lang: 'r', group: 'capitulo', expectedCodeBlocks: 8 },
  { file: '03-inferencia.qmd', slug: 'inferencia', title: 'Inferência Estatística', lang: 'r', group: 'capitulo', expectedCodeBlocks: 10 },
  { file: '04-regressao.qmd', slug: 'regressao', title: 'Regressão Linear Simples', lang: 'r', group: 'capitulo', expectedCodeBlocks: 12 },
  { file: '05-problemas-pesquisa-aplicados.qmd', slug: 'problemas-pesquisa', title: 'Problemas de Pesquisa Aplicados', lang: 'r', group: 'capitulo', expectedCodeBlocks: 2 },
  { file: 'A-intro-r.qmd', slug: 'r-intro', title: 'Introdução ao R', lang: 'r', group: 'apendice', expectedCodeBlocks: 44 },
  { file: 'B-intro-python.qmd', slug: 'python-intro', title: 'Introdução ao Python', lang: 'python', group: 'apendice', expectedCodeBlocks: 29 },
  { file: 'C-dicas-ia.qmd', slug: 'dicas-ia', title: 'Dicas de Geração de Código com IA', lang: null, group: 'apendice', expectedCodeBlocks: 0 },
  { file: 'D-quarto-git-tutorial.qmd', slug: 'quarto-git-tutorial', title: 'Tutorial: Quarto, Git e Claude Code', lang: null, group: 'apendice', expectedCodeBlocks: 0 },
  { file: 'E-creditos.qmd', slug: 'creditos', title: 'Créditos e Agradecimentos', lang: null, group: 'apendice', expectedCodeBlocks: 0 },
];

const OUT_DIR = path.resolve(__dirname, '../../src/content/livro');

function parseArgs(argv) {
  const args = { src: path.resolve(__dirname, '../../../../../Estatistica-Basica/livro') };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--src') args.src = path.resolve(argv[i + 1]);
  }
  return args;
}

function main() {
  const { src } = parseArgs(process.argv.slice(2));

  if (!existsSync(src)) {
    console.error(`Source directory not found: ${src}`);
    console.error('Pass --src <path-to-Estatistica-Basica/livro> if it lives elsewhere.');
    process.exit(1);
  }

  const manifest = [];

  for (const entry of SOURCES) {
    const srcPath = path.join(src, entry.file);
    if (!existsSync(srcPath)) {
      console.error(`Missing source file: ${srcPath}`);
      process.exit(1);
    }

    const raw = readFileSync(srcPath, 'utf-8');
    const { blocks, toc, counts } = parseQmd(raw, { slug: entry.slug });

    if (counts.code !== entry.expectedCodeBlocks) {
      console.warn(
        `[warn] ${entry.file}: expected ${entry.expectedCodeBlocks} code blocks, found ${counts.code}. `
        + 'Upstream file may have changed since this pilot was scoped — double-check the output.',
      );
    }

    const output = {
      slug: entry.slug,
      title: entry.title,
      lang: entry.lang,
      sourceFile: entry.file,
      generatedAt: new Date().toISOString(),
      toc,
      blocks,
    };

    const outPath = path.join(OUT_DIR, `${entry.slug}.json`);
    writeFileSync(outPath, JSON.stringify(output, null, 2) + '\n');
    console.log(`Wrote ${outPath} (${counts.prose} prose, ${counts.callout} callout, ${counts.code} code blocks)`);

    manifest.push({ slug: entry.slug, title: entry.title, lang: entry.lang, group: entry.group, file: `${entry.slug}.json` });
  }

  const manifestPath = path.join(OUT_DIR, 'manifest.json');
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`Wrote ${manifestPath}`);
}

main();
