import { QueryClient } from '@tanstack/react-query';
import { isAppFailure } from '@/domain';

const CATALOG_RETRIES = 5;
const RETRIABLE = new Set(['network', 'timeout', 'server']);

export const policies = {
  catalog: {
    staleTime: 3_600_000,
    // At least the persister's maxAge, so a restored catalog is not collected right away.
    gcTime: 604_800_000,
    retry: (count: number, err: unknown): boolean =>
      count < CATALOG_RETRIES && isAppFailure(err) && RETRIABLE.has(err.error.kind),
    retryDelay: (attempt: number): number => Math.min(1000 * 2 ** attempt, 30_000),
  },
  operation: {
    staleTime: Infinity,
    gcTime: 300_000,
    retry: false,
  },
} as const;

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { refetchOnWindowFocus: false },
    },
  });
}
