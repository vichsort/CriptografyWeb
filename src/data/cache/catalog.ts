import { queryOptions, useIsRestoring, useQuery, type UseQueryResult } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';
import { getCatalog } from '@/data/api';
import type { Algorithm, AppFailure } from '@/domain';
import { queryKeys } from './keys';
import { policies } from './query-client';

// Set by the transport's cold-start signal while a catalog request goes unanswered, and kept
// across retries until the catalog arrives, so every screen tells the same story at once.
let waking = false;
const wakingListeners = new Set<() => void>();

function setWaking(value: boolean) {
  if (waking === value) return;
  waking = value;
  wakingListeners.forEach((listener) => listener());
}

async function fetchCatalog(signal: AbortSignal): Promise<Algorithm[]> {
  try {
    const algorithms = await getCatalog(signal, { onWaking: () => setWaking(true) });
    setWaking(false);
    return algorithms;
  } catch (error) {
    // A cancelled request says nothing about the server.
    if (signal.aborted) setWaking(false);
    throw error;
  }
}

export function catalogQueryOptions() {
  return queryOptions<Algorithm[], AppFailure>({
    queryKey: queryKeys.catalog,
    queryFn: ({ signal }) => fetchCatalog(signal),
    ...policies.catalog,
  });
}

/** The algorithm catalog, shared by every screen under one key. */
export function useCatalog(): UseQueryResult<Algorithm[], AppFailure> & { isRestoring: boolean } {
  const query = useQuery(catalogQueryOptions());
  const isRestoring = useIsRestoring();
  return Object.assign(query, { isRestoring });
}

function subscribeWaking(listener: () => void): () => void {
  wakingListeners.add(listener);
  return () => wakingListeners.delete(listener);
}

const getWaking = () => waking;
const getServerWaking = () => false;

/**
 * True while a catalog request has gone unanswered past the transport's cold-start threshold:
 * the server is probably waking up, so the loading copy should say so.
 */
export function useCatalogWaking(): boolean {
  return useSyncExternalStore(subscribeWaking, getWaking, getServerWaking);
}
