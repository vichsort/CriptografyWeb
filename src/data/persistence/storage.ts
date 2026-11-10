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

function browserStore(): KeyValueStore | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    // Reading window.localStorage itself throws when storage is blocked.
    return null;
  }
}

function safe(backend: KeyValueStore): KeyValueStore {
  return {
    getItem(k) {
      try {
        return backend.getItem(k);
      } catch {
        return null;
      }
    },
    setItem(k, v) {
      try {
        backend.setItem(k, v);
      } catch {
        // Private mode or quota exceeded: preferences are a convenience, not a requirement.
      }
    },
    removeItem(k) {
      try {
        backend.removeItem(k);
      } catch {
        // Same as setItem.
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
