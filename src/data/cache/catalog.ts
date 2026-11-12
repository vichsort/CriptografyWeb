import { queryOptions, useIsRestoring, useQuery, type UseQueryResult } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { getCatalog } from '@/data/api';
import type { Algorithm, AppFailure } from '@/domain';
import { queryKeys } from './keys';
import { policies } from './query-client';

export function catalogQueryOptions() {
  return queryOptions<Algorithm[], AppFailure>({
    queryKey: queryKeys.catalog,
    queryFn: ({ signal }) => getCatalog(signal),
    ...policies.catalog,
  });
}

/** The algorithm catalog, shared by every screen under one key. */
export function useCatalog(): UseQueryResult<Algorithm[], AppFailure> & { isRestoring: boolean } {
  const query = useQuery(catalogQueryOptions());
  const isRestoring = useIsRestoring();
  return Object.assign(query, { isRestoring });
}

/** Matches the transport's cold-start signal (data/http): no answer after this long. */
export const CATALOG_WAKING_AFTER_MS = 3_000;

/**
 * True while the catalog has been loading, with nothing to show, for longer than `afterMs`: the
 * server is probably waking up, so the loading copy should say so.
 */
export function useCatalogWaking(afterMs = CATALOG_WAKING_AFTER_MS): boolean {
  const { data, fetchStatus } = useQuery(catalogQueryOptions());
  const loading = data === undefined && fetchStatus === 'fetching';
  const [late, setLate] = useState(false);

  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => setLate(true), afterMs);
    return () => {
      clearTimeout(timer);
      setLate(false);
    };
  }, [loading, afterMs]);

  return loading && late;
}
