import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { THEME_COLORS } from '@/ui';
import { stubMatchMedia } from '@/test/match-media';
import { ThemeProvider, useTheme } from './ThemeProvider';

const DARK = '(prefers-color-scheme: dark)';
const wrapper = ({ children }: { children: ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

function addThemeMetas() {
  const metas: [string, string][] = [
    ['(prefers-color-scheme: light)', THEME_COLORS.light],
    [DARK, THEME_COLORS.dark],
  ];
  for (const [media, color] of metas) {
    const meta = document.createElement('meta');
    meta.name = 'theme-color';
    meta.media = media;
    meta.content = color;
    document.head.append(meta);
  }
}

const metaContents = () =>
  [...document.querySelectorAll('meta[name="theme-color"]')].map((m) => m.getAttribute('content'));

describe('ThemeProvider', () => {
  beforeEach(addThemeMetas);
  afterEach(() => {
    document.head.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.remove());
    delete document.documentElement.dataset.theme;
    document.documentElement.style.colorScheme = '';
    vi.unstubAllGlobals();
  });

  it('theme toggle persists explicit dark and useSystem resets to system', () => {
    stubMatchMedia({ [DARK]: false });
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.preference).toBe('system');
    expect(result.current.resolved).toBe('light');

    act(() => result.current.toggle());
    expect(result.current.preference).toBe('dark');
    expect(result.current.resolved).toBe('dark');
    expect(localStorage.getItem('cw:v1:theme')).toBe('"dark"');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(document.documentElement.style.colorScheme).toBe('dark');
    expect(metaContents()).toEqual([THEME_COLORS.dark, THEME_COLORS.dark]);

    act(() => result.current.useSystem());
    expect(result.current.preference).toBe('system');
    expect(result.current.resolved).toBe('light');
    expect(localStorage.getItem('cw:v1:theme')).toBe('"system"');
    expect(document.documentElement.dataset.theme).toBeUndefined();
    expect(document.documentElement.style.colorScheme).toBe('');
    expect(metaContents()).toEqual([THEME_COLORS.light, THEME_COLORS.dark]);
  });

  it('toggle flips the resolved system theme into the opposite explicit one', () => {
    stubMatchMedia({ [DARK]: true });
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.resolved).toBe('dark');
    act(() => result.current.toggle());
    expect(result.current.preference).toBe('light');
    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('follows the system while the preference is system', () => {
    const media = stubMatchMedia({ [DARK]: false });
    const { result } = renderHook(() => useTheme(), { wrapper });
    act(() => media.set(DARK, true));
    expect(result.current.resolved).toBe('dark');
    // CSS follows the system on its own: nothing is pinned on the document.
    expect(document.documentElement.dataset.theme).toBeUndefined();
  });

  it('applies a theme chosen in another tab', () => {
    stubMatchMedia({ [DARK]: false });
    const { result } = renderHook(() => useTheme(), { wrapper });
    act(() => {
      localStorage.setItem('cw:v1:theme', '"dark"');
      window.dispatchEvent(new StorageEvent('storage', { key: 'cw:v1:theme' }));
    });
    expect(result.current.preference).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('switches through a view transition when the browser has one', () => {
    stubMatchMedia({ [DARK]: false });
    const start = vi.fn((update: () => void) => update());
    Object.assign(document, { startViewTransition: start });
    const { result } = renderHook(() => useTheme(), { wrapper });
    act(() => result.current.toggle());
    expect(start).toHaveBeenCalledOnce();
    expect(document.documentElement.dataset.theme).toBe('dark');
    delete (document as { startViewTransition?: unknown }).startViewTransition;
  });

  it('works without matchMedia', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.resolved).toBe('light');
  });
});
