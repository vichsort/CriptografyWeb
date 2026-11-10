import { queryOptions, useIsRestoring, useQuery, type UseQueryResult } from '@tanstack/react-query';
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
