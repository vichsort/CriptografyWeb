import { z } from 'zod';
import type { Family } from '@/domain';
import { createStorage, STORAGE_PREFIX, type Storage } from './storage';

export type ThemePreference = 'light' | 'dark' | 'system';

export interface Preferences {
  theme(): ThemePreference;
  setTheme(t: ThemePreference): void;
  sidebarCollapsed(): boolean;
  setSidebarCollapsed(v: boolean): void;
  openFamilies(): Family[];
  setOpenFamilies(f: Family[]): void;
  /** Fires on every change, including changes made in other tabs. Returns the unsubscribe. */
  subscribe(listener: () => void): () => void;
}

const KEYS = {
  theme: 'theme',
  sidebarCollapsed: 'sidebar.collapsed',
  openFamilies: 'sidebar.openFamilies',
} as const;

const ThemeSchema = z.enum(['light', 'dark', 'system']);
const OpenFamiliesSchema = z.array(z.enum(['encryption', 'hashing', 'encoding']));
const DEFAULT_OPEN_FAMILIES: Family[] = ['encryption'];

export function createPreferences(storage: Storage): Preferences {
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((listener) => listener());

  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key.startsWith(STORAGE_PREFIX)) notify();
  };

  // Snapshot reads must be referentially stable for useSyncExternalStore.
  let familiesRaw: string | null | undefined;
  let families: Family[] = DEFAULT_OPEN_FAMILIES;

  return {
    theme: () => storage.read(KEYS.theme, ThemeSchema, 'system'),
    setTheme(t) {
      storage.write(KEYS.theme, t);
      notify();
    },
    sidebarCollapsed: () => storage.read(KEYS.sidebarCollapsed, z.boolean(), false),
    setSidebarCollapsed(v) {
      storage.write(KEYS.sidebarCollapsed, v);
      notify();
    },
    openFamilies() {
      const raw = storage.kv.getItem(STORAGE_PREFIX + KEYS.openFamilies);
      if (raw !== familiesRaw) {
        familiesRaw = raw;
        families = storage.read(KEYS.openFamilies, OpenFamiliesSchema, DEFAULT_OPEN_FAMILIES);
      }
      return families;
    },
    setOpenFamilies(f) {
      storage.write(KEYS.openFamilies, f);
      notify();
    },
    subscribe(listener) {
      if (listeners.size === 0 && typeof window !== 'undefined') {
        window.addEventListener('storage', onStorage);
      }
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0 && typeof window !== 'undefined') {
          window.removeEventListener('storage', onStorage);
        }
      };
    },
  };
}

export const preferences: Preferences = createPreferences(createStorage());
