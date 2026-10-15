// Parses a single Quarto book chapter (.qmd) into a JSON content model of
// prose/callout/code blocks. Only handles the exact patterns found in the
// pilot chapters (A-intro-r.qmd, B-intro-python.qmd) — not a general
// Quarto/Pandoc parser.

const CALLOUT_OPEN = /^:::\s*\{\.callout-([a-z]+)([^}]*)\}\s*$/;
const GENERIC_DIV_OPEN = /^:::\s*\{[^}]*\}\s*$/;
const CALLOUT_CLOSE = /^:::\s*$/;
const KNOWN_CALLOUT_TYPES = new Set(['tip', 'note', 'warning', 'important']);
const CALLOUT_TITLE_ATTR = /title="([^"]*)"/;

const CODE_OPEN = /^```\{([a-z]+)\}\s*$/;
const CODE_CLOSE = /^```\s*$/;
const KNOWN_LANGS = new Set(['r', 'python']);

const FENCE_TOGGLE = /^```/;
const CHUNK_OPTION_LINE = /^#\|/;
const CALLOUT_TITLE_LINE = /^##\s+(.+)$/;
const HEADING_LINE = /^(#{1,6})\s+(.+)$/;
const HEADING_ATTR = /^(#{1,6}\s+.+?)\s*\{[^}]*\}\s*$/;
const TABLE_CAPTION = /^:\s*(.+?)\s*\{[^}]*\}\s*$/;
const IMAGE_ATTR = /(!\[[^\]]*\]\([^)]+\))\s*\{[^}]*\}/g;
const IMAGE_PATH_PREFIX = /(!\[[^\]]*\]\()imagens\//g;

function stripFrontmatter(lines) {
  if (lines[0]?.trim() !== '---') return lines;
  for (let i = 1; i < lines.length; i += 1) {
    if (lines[i].trim() === '---') return lines.slice(i + 1);
  }
  return lines;
}

function stripChunkOptions(lines) {
  let start = 0;
  while (start < lines.length && CHUNK_OPTION_LINE.test(lines[start])) start += 1;
  return trimBlankEdges(lines.slice(start));
}

function trimBlankEdges(lines) {
  let start = 0;
  let end = lines.length;
  while (start < end && lines[start].trim() === '') start += 1;
  while (end > start && lines[end - 1].trim() === '') end -= 1;
  return lines.slice(start, end);
}

function cleanMarkdownText(text) {
  const lineClean = text
    .split('\n')
    .map((line) => {
      if (CHUNK_OPTION_LINE.test(line)) return null;
      const headingMatch = line.match(HEADING_ATTR);
      if (headingMatch) return headingMatch[1];
      const captionMatch = line.match(TABLE_CAPTION);
      if (captionMatch) return `_${captionMatch[1]}_`;
      return line;
    })
    .filter((line) => line !== null)
    .join('\n');
  return lineClean
    .replace(IMAGE_ATTR, '$1')
    .replace(IMAGE_PATH_PREFIX, '$1/livro/');
}

function extractToc(blocks) {
  const toc = [];
  for (const block of blocks) {
    if (block.type !== 'prose') continue;
    for (const line of block.markdown.split('\n')) {
      const match = line.match(HEADING_LINE);
      if (match) toc.push({ level: match[1].length, text: match[2].trim(), blockId: block.id });
    }
  }
  return toc;
}

export function parseQmd(source, { slug }) {
  const rawLines = stripFrontmatter(source.replace(/\r\n?/g, '\n').split('\n'));
  const blocks = [];
  let proseBuffer = [];

  const flushProse = () => {
    const trimmed = trimBlankEdges(proseBuffer);
    if (trimmed.length > 0) {
      blocks.push({ type: 'prose', markdown: cleanMarkdownText(trimmed.join('\n')) });
    }
    proseBuffer = [];
  };

  let i = 0;
  while (i < rawLines.length) {
    const line = rawLines[i];

    const calloutOpen = line.match(CALLOUT_OPEN);
    if (calloutOpen) {
      const calloutType = calloutOpen[1];
      if (!KNOWN_CALLOUT_TYPES.has(calloutType)) {
        throw new Error(`Unknown callout type ".callout-${calloutType}" at line ${i + 1}`);
      }
      const attrTitle = calloutOpen[2].match(CALLOUT_TITLE_ATTR)?.[1] ?? null;
      flushProse();
      i += 1;
      const body = [];
      let inFence = false;
      while (i < rawLines.length) {
        const bodyLine = rawLines[i];
        if (FENCE_TOGGLE.test(bodyLine)) inFence = !inFence;
        if (!inFence && CALLOUT_CLOSE.test(bodyLine)) { i += 1; break; }
        body.push(bodyLine);
        i += 1;
      }
      let title = attrTitle;
      if (!title) {
        const titleMatch = body[0]?.match(CALLOUT_TITLE_LINE);
        if (titleMatch) {
          title = titleMatch[1].trim();
          body.shift();
        }
      }
      const markdown = cleanMarkdownText(trimBlankEdges(body).join('\n'));
      blocks.push({ type: 'callout', calloutType, title, markdown });
      continue;
    }

    // A fenced div that isn't a known callout (e.g. `{.text-center}`) — Pandoc
    // syntax `marked` doesn't understand. Unwrap it: drop the `:::` marker
    // lines, keep the content flowing as ordinary prose.
    if (GENERIC_DIV_OPEN.test(line)) {
      i += 1;
      while (i < rawLines.length && !CALLOUT_CLOSE.test(rawLines[i])) {
        proseBuffer.push(rawLines[i]);
        i += 1;
      }
      i += 1; // consume closing :::
      continue;
    }

    const codeOpen = line.match(CODE_OPEN);
    if (codeOpen) {
      const lang = codeOpen[1];
      if (!KNOWN_LANGS.has(lang)) {
        throw new Error(`Unknown code chunk language "{${lang}}" at line ${i + 1}`);
      }
      flushProse();
      i += 1;
      const body = [];
      while (i < rawLines.length && !CODE_CLOSE.test(rawLines[i])) {
        body.push(rawLines[i]);
        i += 1;
      }
      i += 1; // consume closing fence
      const code = stripChunkOptions(body).join('\n');
      blocks.push({ type: 'code', lang, code });
      continue;
    }

    // Flush before a heading so every heading starts its own prose block —
    // gives the TOC a precise, independently-scrollable anchor per heading
    // instead of landing mid-block on headings buried after other content.
    if (HEADING_LINE.test(line) && proseBuffer.some((l) => l.trim() !== '')) {
      flushProse();
    }

    proseBuffer.push(line);
    i += 1;
  }
  flushProse();

  const blocksWithIds = blocks.map((block, index) => ({
    id: `${slug}-b${String(index).padStart(3, '0')}`,
    ...block,
  }));

  return {
    blocks: blocksWithIds,
    toc: extractToc(blocksWithIds),
    counts: {
      prose: blocksWithIds.filter((b) => b.type === 'prose').length,
      callout: blocksWithIds.filter((b) => b.type === 'callout').length,
      code: blocksWithIds.filter((b) => b.type === 'code').length,
    },
  };
}
