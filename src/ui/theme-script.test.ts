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

  it('follows matchMedia when stored system or missing', () => {
    setSystemDark(true);
    localStorage.setItem(THEME_STORAGE_KEY, '"system"');
    run();
    expect(theme()).toBe('dark');

    localStorage.clear();
    setSystemDark(false);
    run();
    expect(theme()).toBe('light');
  });

  it('survives malformed storage', () => {
    localStorage.setItem(THEME_STORAGE_KEY, '{oops');
    expect(run).not.toThrow();
    expect(theme()).toBe('light');

    localStorage.setItem(THEME_STORAGE_KEY, '"purple"');
    run();
    expect(theme()).toBe('light');
  });

  it('survives a throwing localStorage', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    setSystemDark(true);
    expect(run).not.toThrow();
    expect(theme()).toBe('dark');
    vi.restoreAllMocks();
  });

  it('sets theme-color meta', () => {
    localStorage.setItem(THEME_STORAGE_KEY, '"dark"');
    run();
    const metas = [...document.querySelectorAll('meta[name="theme-color"]')];
    expect(metas).toHaveLength(2);
    for (const meta of metas) {
      expect(meta.getAttribute('content')).toBe(THEME_COLORS.dark);
      expect(meta.hasAttribute('media')).toBe(false);
    }
  });
});
