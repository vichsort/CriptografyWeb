'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react';
import { preferences } from '@/data/persistence';

export interface SidebarState {
  /** The desktop sidebar is hidden. Persisted. */
  collapsed: boolean;
  setCollapsed(v: boolean): void;
  /** The mobile overlay is open. Not persisted. */
  mobileOpen: boolean;
  setMobileOpen(v: boolean): void;
}

export const SidebarStateContext = createContext<SidebarState | null>(null);

const DESKTOP_QUERY = '(min-width: 1024px)';
const serverFalse = () => false;

/**
 * Marks <html> so CSS lays the shell out, as the head script does before paint. Written only on a
 * change, never from render values: during hydration those are the server's and would undo it.
 */
function markCollapsed(collapsed: boolean) {
  if (collapsed) document.documentElement.dataset.sidebar = 'collapsed';
  else delete document.documentElement.dataset.sidebar;
}

/** Owns the state; AppShell provides it to everything under the shell. */
export function useSidebarStateValue(): SidebarState {
  const collapsed = useSyncExternalStore(
    preferences.subscribe,
    preferences.sidebarCollapsed,
    serverFalse,
  );
  const [mobileOpen, setMobileOpen] = useState(false);

  // A change made in another tab.
  useEffect(() => preferences.subscribe(() => markCollapsed(preferences.sidebarCollapsed())), []);

  // The overlay exists only below the desktop breakpoint: growing past it closes the overlay.
  useEffect(() => {
    if (!mobileOpen || typeof window.matchMedia !== 'function') return;
    const desktop = window.matchMedia(DESKTOP_QUERY);
    const onChange = () => {
      if (desktop.matches) setMobileOpen(false);
    };
    desktop.addEventListener('change', onChange);
    return () => desktop.removeEventListener('change', onChange);
  }, [mobileOpen]);

  return useMemo(
    () => ({
      collapsed,
      setCollapsed(v: boolean) {
        preferences.setSidebarCollapsed(v);
        markCollapsed(v);
      },
      mobileOpen,
      setMobileOpen,
    }),
    [collapsed, mobileOpen],
  );
}

export function useSidebarState(): SidebarState {
  const state = useContext(SidebarStateContext);
  if (!state) throw new Error('useSidebarState must be used inside AppShell');
  return state;
}
