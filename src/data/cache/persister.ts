import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import type {
  PersistedClient,
  Persister,
  PersistQueryClientOptions,
} from '@tanstack/react-query-persist-client';
import { APP_VERSION } from '@/config/env';
import { createStorage, STORAGE_PREFIX, type Storage } from '@/data/persistence';

export const PERSIST_CACHE_KEY = `${STORAGE_PREFIX}query-cache`;
export const PERSIST_MAX_AGE = 604_800_000; // 7 days
export const PERSIST_BUSTER: string = APP_VERSION;

// A client that fails the buster check, so a corrupted copy is discarded instead of thrown.
const DISCARDED: PersistedClient = {
  buster: '',
  timestamp: 0,
  clientState: { queries: [], mutations: [] },
};

function deserialize(raw: string): PersistedClient {
  try {
    return JSON.parse(raw) as PersistedClient;
  } catch {
    return DISCARDED;
  }
}

/** Persists the query cache to localStorage through the persistence adapter. */
export function createCatalogPersister(storage: Storage = createStorage()): Persister {
  return createAsyncStoragePersister({ storage: storage.kv, key: PERSIST_CACHE_KEY, deserialize });
}

/**
 * Only a successful catalog is ever persisted. Operation results hold user input, so they stay
 * in memory.
 */
export function persistOptions(
  persister: Persister,
): Omit<PersistQueryClientOptions, 'queryClient'> {
  return {
    persister,
    maxAge: PERSIST_MAX_AGE,
    buster: PERSIST_BUSTER,
    dehydrateOptions: {
      shouldDehydrateQuery: (q) => q.queryKey[0] === 'catalog' && q.state.status === 'success',
      shouldDehydrateMutation: () => false,
    },
  };
}
