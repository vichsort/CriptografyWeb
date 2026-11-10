import type { z } from 'zod';

export interface KeyValueStore {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
  removeItem(k: string): void;
}

export interface Storage {
  /** Reads a JSON value under the versioned prefix; anything missing or invalid gives `fallback`. */
  read<T>(key: string, schema: z.ZodType<T>, fallback: T): T;
  write(key: string, value: unknown): void;
  remove(key: string): void;
  /** The raw backend, without prefix, that never throws. Used by the catalog persister. */
  readonly kv: KeyValueStore;
}

export const STORAGE_PREFIX = 'cw:v1:';

const noopStore: KeyValueStore = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

function memoryStore(): KeyValueStore {
  const data = new Map<string, string>();
  return {
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  };
}

function browserStore(): KeyValueStore | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    // Reading window.localStorage itself throws when site data is blocked. Keep this tab working.
    return memoryStore();
  }
}

/**
 * Never throws. A value the backend refuses to store (private mode, quota) is kept in memory, so
 * toggles still work for the rest of the session.
 */
function safe(backend: KeyValueStore): KeyValueStore {
  const unsaved = new Map<string, string>();
  return {
    getItem(k) {
      const pending = unsaved.get(k);
      if (pending !== undefined) return pending;
      try {
        return backend.getItem(k);
      } catch {
        return null;
      }
    },
    setItem(k, v) {
      try {
        backend.setItem(k, v);
        unsaved.delete(k);
      } catch {
        unsaved.set(k, v);
      }
    },
    removeItem(k) {
      unsaved.delete(k);
      try {
        backend.removeItem(k);
      } catch {
        // Nothing stored, nothing to remove.
      }
    },
  };
}

/**
 * Storage adapter over localStorage. `backend` defaults to window.localStorage when available;
 * `null` (or a server render) gives a store that keeps nothing.
 */
export function createStorage(backend?: KeyValueStore | null): Storage {
  const kv = safe((backend === undefined ? browserStore() : backend) ?? noopStore);

  return {
    kv,
    read(key, schema, fallback) {
      const raw = kv.getItem(STORAGE_PREFIX + key);
      if (raw === null) return fallback;
      let value: unknown;
      try {
        value = JSON.parse(raw);
      } catch {
        return fallback;
      }
      const parsed = schema.safeParse(value);
      return parsed.success ? parsed.data : fallback;
    },
    write(key, value) {
      kv.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
    },
    remove(key) {
      kv.removeItem(STORAGE_PREFIX + key);
    },
  };
}
