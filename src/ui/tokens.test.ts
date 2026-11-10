// @vitest-environment node
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { algorithmContent, extras } from '@/content';

const css = readFileSync(path.join(import.meta.dirname, 'tokens.css'), 'utf8');

function block(after: string | RegExp): string {
  const start = typeof after === 'string' ? css.indexOf(after) : css.search(after);
  if (start === -1) throw new Error(`missing ${after}`);
  let depth = 0;
  let i = css.indexOf('{', start);
  const from = i + 1;
  for (; i < css.length; i++) {
    if (css[i] === '{') depth++;
    if (css[i] === '}' && --depth === 0) break;
  }
  return css.slice(from, i);
}

const declarations = (body: string) =>
  body
    .split(';')
    .map((d) => d.replace(/\/\*[\s\S]*?\*\//g, '').trim())
    .filter(Boolean)
    .sort();

describe('tokens.css', () => {
  it('uses the same dark tokens with and without JavaScript', () => {
    const explicit = declarations(block(":root[data-theme='dark']"));
    // The token block, not the dark: variant, which also has a prefers-color-scheme branch.
    const media = block(
      /@media \(prefers-color-scheme: dark\) \{\s*:root:not\(\[data-theme\]\) \{/,
    );
    const noScript = declarations(media.slice(media.indexOf('{') + 1, media.lastIndexOf('}')));
    expect(explicit.length).toBeGreaterThan(10);
    expect(noScript).toEqual(explicit);
  });

  it('defines an icon color for every color the content layer uses', () => {
    const colors = new Set([
      ...Object.values(algorithmContent).map((c) => c.color),
      ...extras.map((e) => e.color),
      'neutral',
    ]);
    for (const color of colors) expect(css).toContain(`--color-icon-${color}:`);
  });

  it('makes dark: follow the chosen theme, not only the system setting', () => {
    expect(css).toMatch(/@custom-variant dark \{[\s\S]*?\[data-theme='dark'\]/);
  });
});
