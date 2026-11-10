import { QueryClient } from '@tanstack/react-query';
import { isAppFailure, type AppError } from '@/domain';

const CATALOG_RETRIES = 5;
// Transient failures only. A 4xx mapped to `server` (403, 405, ...) is a client bug: retrying it
// would just keep the loading state on screen.
function isTransient(error: AppError): boolean {
  return (
    error.kind === 'network' ||
    error.kind === 'timeout' ||
    (error.kind === 'server' && error.status >= 500)
  );
}

export const policies = {
  catalog: {
    staleTime: 3_600_000,
    // At least the persister's maxAge, so a restored catalog is not collected right away.
    gcTime: 604_800_000,
    retry: (count: number, err: unknown): boolean =>
      count < CATALOG_RETRIES && isAppFailure(err) && isTransient(err.error),
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
