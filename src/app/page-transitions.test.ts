// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const pages = readdirSync(import.meta.dirname, { recursive: true, encoding: 'utf8' })
  .filter((file) => path.basename(file) === 'page.tsx')
  .sort();

describe('route transitions', () => {
  it('finds the pages', () => {
    expect(pages.length).toBeGreaterThanOrEqual(7);
  });

  // Each page enters and leaves on its own: a transition on the layout would replay whenever
  // content streams in or resizes later (docs/DESIGN.md §7).
  it.each(pages)('%s wraps its content in PageTransition', (page) => {
    const source = readFileSync(path.join(import.meta.dirname, page), 'utf8');
    expect(source).toMatch(/return \(?\s*<PageTransition>/);
  });
});
