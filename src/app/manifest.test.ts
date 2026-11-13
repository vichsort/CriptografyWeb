// @vitest-environment node
import { describe, expect, it } from 'vitest';
import manifest from './manifest';

describe('manifest', () => {
  it('manifest has name, standalone display, theme and background colors, and icons', () => {
    const m = manifest();
    expect(m.name).toBe('Criptografy');
    expect(m.short_name).toBe('Criptografy');
    expect(m.start_url).toBe('/');
    expect(m.display).toBe('standalone');
    expect(m.theme_color).toBe('#f2f2f6');
    expect(m.background_color).toBe('#f2f2f6');
    expect(m.icons).toEqual([
      { src: '/icon.png', sizes: '512x512', type: 'image/png' },
      { src: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ]);
  });
});
