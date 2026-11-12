import { z } from 'zod';
import type { Family } from '@/domain';
import { createStorage, STORAGE_PREFIX, type Storage } from './storage';

export type ThemePreference = 'light' | 'dark' | 'system';

export type PreferenceKey = 'theme' | 'sidebarCollapsed' | 'openFamilies';

/** Receives the preference that changed, or `null` when every one may have (storage cleared). */
export type PreferenceListener = (key: PreferenceKey | null) => void;

export interface Preferences {
  theme(): ThemePreference;
  setTheme(t: ThemePreference): void;
  sidebarCollapsed(): boolean;
  setSidebarCollapsed(v: boolean): void;
  openFamilies(): readonly Family[];
  setOpenFamilies(f: Family[]): void;
  /** Fires on every change, including changes made in other tabs. Returns the unsubscribe. */
  subscribe(listener: PreferenceListener): () => void;
}

const KEYS = {
  theme: 'theme',
  sidebarCollapsed: 'sidebar.collapsed',
  openFamilies: 'sidebar.openFamilies',
} as const satisfies Record<PreferenceKey, string>;

const BY_STORAGE_KEY = new Map<string, PreferenceKey>(
  Object.entries(KEYS).map(([key, name]) => [STORAGE_PREFIX + name, key as PreferenceKey]),
);

export const DEFAULT_OPEN_FAMILIES: readonly Family[] = ['encryption'];

const ThemeSchema = z.enum(['light', 'dark', 'system']);
const OpenFamiliesSchema = z.array(z.enum(['encryption', 'hashing', 'encoding']));

export function createPreferences(storage: Storage): Preferences {
  const listeners = new Set<PreferenceListener>();
  const notify = (key: PreferenceKey | null) => listeners.forEach((listener) => listener(key));

  const onStorage = (event: StorageEvent) => {
    if (event.key === null) return notify(null);
    const key = BY_STORAGE_KEY.get(event.key);
    if (key) notify(key);
  };

  // Snapshot reads must be referentially stable for useSyncExternalStore.
  let familiesRaw: string | null | undefined;
  let families: readonly Family[] = DEFAULT_OPEN_FAMILIES;

  return {
    theme: () => storage.read(KEYS.theme, ThemeSchema, 'system'),
    setTheme(t) {
      storage.write(KEYS.theme, t);
      notify('theme');
    },
    sidebarCollapsed: () => storage.read(KEYS.sidebarCollapsed, z.boolean(), false),
    setSidebarCollapsed(v) {
      storage.write(KEYS.sidebarCollapsed, v);
      notify('sidebarCollapsed');
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
      notify('openFamilies');
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
