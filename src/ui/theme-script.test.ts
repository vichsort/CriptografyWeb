import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { STORAGE_PREFIX } from '@/data/persistence';
import { THEME_COLORS, THEME_STORAGE_KEY, themeScript } from './theme-script';

function setSystemDark(dark: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({ matches: dark && query.includes('dark'), media: query })),
  );
}

function run() {
  new Function(themeScript())();
}

const theme = () => document.documentElement.dataset.theme;

beforeEach(() => {
  delete document.documentElement.dataset.theme;
  document.documentElement.style.colorScheme = '';
  document.head.innerHTML =
    '<meta name="theme-color" media="(prefers-color-scheme: light)" content="x">' +
    '<meta name="theme-color" media="(prefers-color-scheme: dark)" content="y">';
  setSystemDark(false);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('themeScript', () => {
  it('reads the key the preferences repository writes', () => {
    expect(THEME_STORAGE_KEY).toBe(`${STORAGE_PREFIX}theme`);
  });

  it('sets dark when stored dark', () => {
    localStorage.setItem(THEME_STORAGE_KEY, '"dark"');
    run();
    expect(theme()).toBe('dark');
    expect(document.documentElement.style.colorScheme).toBe('dark');
  });

  it('sets light when stored light, even on a dark system', () => {
    setSystemDark(true);
    localStorage.setItem(THEME_STORAGE_KEY, '"light"');
    run();
    expect(theme()).toBe('light');
  });

  it('leaves the theme to CSS when stored system or missing, so it follows the system live', () => {
    setSystemDark(true);
    localStorage.setItem(THEME_STORAGE_KEY, '"system"');
    run();
    expect(theme()).toBeUndefined();
    expect(document.documentElement.style.colorScheme).toBe('');

    localStorage.clear();
    run();
    expect(theme()).toBeUndefined();
  });

  it('survives malformed storage', () => {
    localStorage.setItem(THEME_STORAGE_KEY, '{oops');
    expect(run).not.toThrow();
    expect(theme()).toBeUndefined();

    localStorage.setItem(THEME_STORAGE_KEY, '"purple"');
    run();
    expect(theme()).toBeUndefined();
  });

  it('survives a throwing localStorage', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    expect(run).not.toThrow();
    expect(theme()).toBeUndefined();
    vi.restoreAllMocks();
  });

  const metas = () => [...document.querySelectorAll('meta[name="theme-color"]')];

  it('paints the browser chrome in an explicit theme, keeping the media queries', () => {
    localStorage.setItem(THEME_STORAGE_KEY, '"dark"');
    run();
    expect(metas()).toHaveLength(2);
    for (const meta of metas()) {
      expect(meta.getAttribute('content')).toBe(THEME_COLORS.dark);
      expect(meta.hasAttribute('media')).toBe(true);
    }
  });

  it('leaves the theme-color metas alone on the system theme', () => {
    localStorage.setItem(THEME_STORAGE_KEY, '"system"');
    run();
    expect(metas().map((m) => m.getAttribute('content'))).toEqual(['x', 'y']);
  });
});
