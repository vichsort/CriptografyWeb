import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { createStorage, STORAGE_PREFIX, type KeyValueStore } from './storage';

const Theme = z.enum(['light', 'dark', 'system']);

function memoryStore(initial: Record<string, string> = {}): KeyValueStore & {
  data: Record<string, string>;
} {
  const data = { ...initial };
  return {
    data,
    getItem: (k) => data[k] ?? null,
    setItem: (k, v) => {
      data[k] = v;
    },
    removeItem: (k) => {
      delete data[k];
    },
  };
}

const throwing: KeyValueStore = {
  getItem: () => {
    throw new Error('SecurityError');
  },
  setItem: () => {
    throw new Error('QuotaExceededError');
  },
  removeItem: () => {
    throw new Error('SecurityError');
  },
};

describe('createStorage', () => {
  it('read returns fallback on missing key', () => {
    expect(createStorage(memoryStore()).read('theme', Theme, 'system')).toBe('system');
  });

  it('read falls back on malformed JSON', () => {
    const store = memoryStore({ [`${STORAGE_PREFIX}theme`]: '{not json' });
    expect(createStorage(store).read('theme', Theme, 'system')).toBe('system');
  });

  it('read falls back on schema mismatch', () => {
    const store = memoryStore({ [`${STORAGE_PREFIX}theme`]: '"purple"' });
    expect(createStorage(store).read('theme', Theme, 'system')).toBe('system');
  });

  it('read falls back on throwing backend', () => {
    expect(createStorage(throwing).read('theme', Theme, 'system')).toBe('system');
  });

  it('writes JSON under the versioned prefix and reads it back', () => {
    const store = memoryStore();
    const storage = createStorage(store);
    storage.write('theme', 'dark');
    expect(store.data).toEqual({ 'cw:v1:theme': '"dark"' });
    expect(storage.read('theme', Theme, 'system')).toBe('dark');
    storage.remove('theme');
    expect(store.data).toEqual({});
  });

  it('write swallows quota errors', () => {
    const storage = createStorage(throwing);
    expect(() => storage.write('theme', 'dark')).not.toThrow();
    expect(() => storage.remove('theme')).not.toThrow();
  });

  it('kv prefixes nothing and swallows errors', () => {
    const store = memoryStore();
    createStorage(store).kv.setItem('cw:v1:query-cache', 'x');
    expect(store.data).toEqual({ 'cw:v1:query-cache': 'x' });

    const kv = createStorage(throwing).kv;
    expect(kv.getItem('k')).toBeNull();
    expect(() => kv.setItem('k', 'v')).not.toThrow();
    expect(() => kv.removeItem('k')).not.toThrow();
  });

  it('createStorage without window is a no-op', () => {
    const storage = createStorage(null);
    storage.write('theme', 'dark');
    expect(storage.read('theme', Theme, 'system')).toBe('system');
    expect(storage.kv.getItem('cw:v1:theme')).toBeNull();
  });

  it('keeps written values in memory when the backend throws', () => {
    const storage = createStorage(throwing);
    storage.write('theme', 'dark');
    expect(storage.read('theme', Theme, 'system')).toBe('dark');
    storage.remove('theme');
    expect(storage.read('theme', Theme, 'system')).toBe('system');
  });

  it('keeps values in memory when window.localStorage is blocked', () => {
    const spy = vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    try {
      const storage = createStorage();
      storage.write('theme', 'dark');
      expect(storage.read('theme', Theme, 'system')).toBe('dark');
    } finally {
      spy.mockRestore();
    }
  });

  it('uses window.localStorage by default', () => {
    createStorage().write('theme', 'light');
    expect(localStorage.getItem('cw:v1:theme')).toBe('"light"');
  });
});
