import { describe, it, expect } from 'vitest';
import { parseQmd } from '../../scripts/livro/parseQmd.mjs';

const FIXTURE = `---
engine: knitr
knitr:
  opts_chunk:
    eval: false
---

# Titulo do Capitulo {#cap-teste}

Paragrafo introdutorio com **negrito** e um [link](https://example.com).

::: {.callout-tip}
## Dica
Use \`Ctrl + Enter\` para rodar.
:::

## Secao com codigo

\`\`\`{python}
#| echo: true
#| eval: false

import numpy as np
x = np.array([1, 2, 3])
\`\`\`

::: {.callout-note}
## Nota com exemplo aninhado
Compare as duas formas:

\`\`\`{python}
#| eval: false
# forma antiga
print(1)
\`\`\`
:::

: Legenda da Tabela {.striped .hover}
`;

describe('parseQmd', () => {
  const result = parseQmd(FIXTURE, { slug: 'teste' });

  it('strips YAML frontmatter', () => {
    expect(result.blocks[0].markdown).not.toContain('engine: knitr');
  });

  it('strips heading attribute blocks', () => {
    expect(result.blocks[0].markdown).toContain('# Titulo do Capitulo');
    expect(result.blocks[0].markdown).not.toContain('{#cap-teste}');
  });

  it('parses a callout with title extracted from the leading heading', () => {
    const callout = result.blocks.find((b) => b.type === 'callout' && b.calloutType === 'tip');
    expect(callout.title).toBe('Dica');
    expect(callout.markdown).toContain('Ctrl + Enter');
    expect(callout.markdown).not.toContain('## Dica');
  });

  it('parses a top-level code chunk and strips #| option lines', () => {
    const code = result.blocks.find((b) => b.type === 'code');
    expect(code.lang).toBe('python');
    expect(code.code).not.toContain('#|');
    expect(code.code).toContain('import numpy as np');
  });

  it('keeps a code fence nested inside a callout as part of its markdown, not a separate block', () => {
    const callout = result.blocks.find((b) => b.type === 'callout' && b.calloutType === 'note');
    expect(callout.markdown).toContain('```{python}');
    expect(callout.markdown).toContain('print(1)');
    expect(callout.markdown).not.toContain('#|');
    expect(result.counts.code).toBe(1);
  });

  it('converts Pandoc table-caption lines into an italic paragraph without the attribute block', () => {
    const captionBlock = result.blocks.find((b) => b.markdown?.includes('Legenda da Tabela'));
    expect(captionBlock.markdown).toContain('_Legenda da Tabela_');
    expect(captionBlock.markdown).not.toContain('{.striped');
  });

  it('assigns stable, ordered block ids', () => {
    expect(result.blocks[0].id).toBe('teste-b000');
    expect(result.blocks.every((b, i) => b.id === `teste-b${String(i).padStart(3, '0')}`)).toBe(true);
  });

  it('builds a toc from headings across prose blocks', () => {
    expect(result.toc.some((t) => t.text === 'Titulo do Capitulo' && t.level === 1)).toBe(true);
    expect(result.toc.some((t) => t.text === 'Secao com codigo' && t.level === 2)).toBe(true);
  });

  it('throws on an unknown callout type', () => {
    expect(() => parseQmd('::: {.callout-danger}\n## X\nY\n:::\n', { slug: 'x' })).toThrow();
  });

  it('throws on an unsupported code chunk language', () => {
    expect(() => parseQmd('```{julia}\nx = 1\n```\n', { slug: 'x' })).toThrow();
  });
});
