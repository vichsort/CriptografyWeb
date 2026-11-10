import {
  persistQueryClientRestore,
  persistQueryClientSave,
} from '@tanstack/react-query-persist-client';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createStorage, type KeyValueStore } from '@/data/persistence';
import { catalogQueryOptions } from './catalog';
import { executeOperation } from './operations';
import { apiUrl, server } from '@/test/msw/server';
import { persistCatalog } from '@/test/persisted-catalog';
import { createCatalogPersister, persistOptions, PERSIST_CACHE_KEY } from './persister';
import { createQueryClient } from './query-client';

beforeEach(() => {
  server.use(http.post(apiUrl('/api/encrypt'), () => HttpResponse.json({ result: 'tfdsfu' })));
});

describe('catalog persister', () => {
  it('writes under the versioned key', () => {
    expect(PERSIST_CACHE_KEY).toBe('cw:v1:query-cache');
  });

  it('only the catalog is persisted', async () => {
    await persistCatalog('secret-input');
    const raw = localStorage.getItem(PERSIST_CACHE_KEY) ?? '';
    const persisted = JSON.parse(raw) as {
      clientState: { queries: { queryKey: unknown[] }[]; mutations: unknown[] };
    };
    expect(persisted.clientState.queries.map((q) => q.queryKey)).toEqual([['catalog']]);
    expect(persisted.clientState.mutations).toEqual([]);
    expect(raw).not.toContain('secret-input');
  });

  it('restores a catalog saved by this version', async () => {
    const persister = await persistCatalog();
    const client = createQueryClient();
    await persistQueryClientRestore({ queryClient: client, ...persistOptions(persister) });
    expect(client.getQueryData(['catalog'])).toHaveLength(8);
  });

  it('persisted catalog from another buster is discarded', async () => {
    const persister = await persistCatalog();
    const stored = JSON.parse(localStorage.getItem(PERSIST_CACHE_KEY) ?? '{}') as object;
    localStorage.setItem(PERSIST_CACHE_KEY, JSON.stringify({ ...stored, buster: 'old-version' }));

    const client = createQueryClient();
    await persistQueryClientRestore({ queryClient: client, ...persistOptions(persister) });
    expect(client.getQueryData(['catalog'])).toBeUndefined();
    await vi.waitFor(() => expect(localStorage.getItem(PERSIST_CACHE_KEY)).toBeNull());
  });

  it.each(['null', '42', '"text"', '{"buster":1}', '[]'])(
    'ignores a persisted value that is not a client: %s',
    async (raw) => {
      localStorage.setItem(PERSIST_CACHE_KEY, raw);
      const client = createQueryClient();
      const persister = createCatalogPersister(createStorage(localStorage));
      await persistQueryClientRestore({ queryClient: client, ...persistOptions(persister) });
      expect(client.getQueryData(['catalog'])).toBeUndefined();
    },
  );

  it('does not rewrite the catalog when only operations changed', async () => {
    let writes = 0;
    const counting: KeyValueStore = {
      getItem: (k) => localStorage.getItem(k),
      setItem: (k, v) => {
        if (k === PERSIST_CACHE_KEY) writes++;
        localStorage.setItem(k, v);
      },
      removeItem: (k) => localStorage.removeItem(k),
    };
    const persister = createCatalogPersister(createStorage(counting));
    const client = createQueryClient();
    await client.fetchQuery(catalogQueryOptions());
    await persistQueryClientSave({ queryClient: client, ...persistOptions(persister) });
    await vi.waitFor(() => expect(writes).toBe(1), { timeout: 3000 });

    await executeOperation(
      client,
      { algorithmId: 'caesar', operation: 'encrypt', input: 'a', options: { shift: 1 } },
      { signal: new AbortController().signal, onWaking: () => {} },
    );
    await persistQueryClientSave({ queryClient: client, ...persistOptions(persister) });
    await new Promise((r) => setTimeout(r, 1500));
    expect(writes).toBe(1);
  });

  it('ignores a corrupted persisted cache', async () => {
    localStorage.setItem(PERSIST_CACHE_KEY, '{broken');
    const client = createQueryClient();
    const persister = createCatalogPersister(createStorage(localStorage));
    await persistQueryClientRestore({ queryClient: client, ...persistOptions(persister) });
    expect(client.getQueryData(['catalog'])).toBeUndefined();
  });
});
