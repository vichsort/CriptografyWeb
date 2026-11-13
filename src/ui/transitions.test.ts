// @vitest-environment node
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(path.join(import.meta.dirname, 'transitions.css'), 'utf8').replace(
  /\/\*[\s\S]*?\*\//g,
  '',
);

/** The declarations of the first rule for `selector` after `from`. */
function rule(selector: string, from = 0): string {
  const start = css.indexOf(selector, from);
  if (start === -1) throw new Error(`missing ${selector}`);
  return css.slice(css.indexOf('{', start) + 1, css.indexOf('}', start));
}

const reducedMotion = css.indexOf('@media (prefers-reduced-motion: reduce)');

describe('route transitions', () => {
  it('crossfades the page and lifts the new one slightly', () => {
    expect(rule('::view-transition-old(.page)')).toContain('page-fade-out');
    const enter = rule('::view-transition-new(.page)');
    expect(enter).toContain('page-fade-in');
    expect(enter).toContain('page-rise');
  });

  it('keeps only the crossfade under reduced motion', () => {
    expect(reducedMotion).toBeGreaterThan(-1);
    const enter = rule('::view-transition-new(.page)', reducedMotion);
    expect(enter).toContain('page-fade-in');
    expect(enter).not.toContain('page-rise');
  });

  it('keeps the header and the progress bar still, above the pages', () => {
    for (const name of ['app-header', 'app-progress']) {
      expect(css).toContain(`view-transition-name: ${name};`);
      expect(rule(`::view-transition-old(${name})`)).toContain('display: none');
    }
  });

  it('makes the theme crossfade one picture of the whole page', () => {
    expect(rule(':root[data-theme-switch] body *')).toContain(
      'view-transition-name: none !important',
    );
  });

  it('times every animation with the motion tokens', () => {
    const animations = css.match(/animation:[^;]+;/g) ?? [];
    expect(animations.length).toBeGreaterThan(0);
    for (const animation of animations) expect(animation).not.toMatch(/\d(m?s)\b|cubic-bezier/);
  });
});
