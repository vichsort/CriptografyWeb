import { persistQueryClientSave } from '@tanstack/react-query-persist-client';
import { expect, vi } from 'vitest';
import { catalogQueryOptions } from '@/data/cache/catalog';
import { executeOperation } from '@/data/cache/operations';
import { createCatalogPersister, persistOptions, PERSIST_CACHE_KEY } from '@/data/cache/persister';
import { createQueryClient } from '@/data/cache/query-client';
import { createStorage } from '@/data/persistence';

/**
 * Persists a real client to localStorage, as the app would: the catalog from the default MSW
 * handler plus one operation run with `secretInput`. Needs a handler for POST /api/encrypt.
 */
export async function persistCatalog(secretInput = 'secret-input') {
  const persister = createCatalogPersister(createStorage(localStorage));
  const client = createQueryClient();
  await client.fetchQuery(catalogQueryOptions());
  await executeOperation(
    client,
    { algorithmId: 'caesar', operation: 'encrypt', input: secretInput, options: { shift: 1 } },
    { signal: new AbortController().signal, onWaking: () => {} },
  );
  await persistQueryClientSave({ queryClient: client, ...persistOptions(persister) });
  await vi.waitFor(() => expect(localStorage.getItem(PERSIST_CACHE_KEY)).not.toBeNull(), {
    timeout: 3000,
  });
  return persister;
}
