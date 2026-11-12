'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { flushSync } from 'react-dom';
import { preferences, type ThemePreference } from '@/data/persistence';
import { THEME_COLORS } from '@/ui';

type Resolved = 'light' | 'dark';

export interface ThemeState {
  preference: ThemePreference;
  resolved: Resolved;
  /** Flips the theme on screen and makes it explicit. */
  toggle(): void;
  /** Goes back to following the system. */
  useSystem(): void;
}

const ThemeContext = createContext<ThemeState | null>(null);

const DARK_QUERY = '(prefers-color-scheme: dark)';

function subscribeSystem(onChange: () => void): () => void {
  if (typeof window.matchMedia !== 'function') return () => {};
  const query = window.matchMedia(DARK_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

const systemDark = () =>
  typeof window.matchMedia === 'function' && window.matchMedia(DARK_QUERY).matches;
const serverFalse = () => false;
const serverSystem = (): ThemePreference => 'system';

/**
 * Writes the theme onto the document, as the head script does before paint. The system theme pins
 * nothing: CSS follows prefers-color-scheme, and each theme-color meta answers its own media query.
 */
function applyTheme(preference: ThemePreference) {
  const root = document.documentElement;
  const metas = document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]');
  if (preference === 'system') {
    delete root.dataset.theme;
    root.style.colorScheme = '';
    metas.forEach((meta) => {
      meta.content = meta.media.includes('dark') ? THEME_COLORS.dark : THEME_COLORS.light;
    });
    return;
  }
  root.dataset.theme = preference;
  root.style.colorScheme = preference;
  metas.forEach((meta) => {
    meta.content = THEME_COLORS[preference];
  });
}

/** Crossfades the change when the browser supports view transitions. */
function withViewTransition(update: () => void) {
  if (typeof document.startViewTransition === 'function') document.startViewTransition(update);
  else update();
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const preference = useSyncExternalStore(preferences.subscribe, preferences.theme, serverSystem);
  const dark = useSyncExternalStore(subscribeSystem, systemDark, serverFalse);
  const resolved: Resolved = preference === 'system' ? (dark ? 'dark' : 'light') : preference;

  // A theme chosen in another tab. The document is never written from render values: during
  // hydration they are the server's, and would undo what the head script set.
  useEffect(() => preferences.subscribe(() => applyTheme(preferences.theme())), []);

  const choose = useCallback((next: ThemePreference) => {
    withViewTransition(() => {
      // Synchronous, so the view transition captures the new theme and the new toggle state.
      flushSync(() => preferences.setTheme(next));
      applyTheme(next);
    });
  }, []);

  const value = useMemo<ThemeState>(
    () => ({
      preference,
      resolved,
      toggle: () => choose(resolved === 'dark' ? 'light' : 'dark'),
      useSystem: () => choose('system'),
    }),
    [preference, resolved, choose],
  );

  return <ThemeContext value={value}>{children}</ThemeContext>;
}

export function useTheme(): ThemeState {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error('useTheme must be used inside ThemeProvider');
  return theme;
}
