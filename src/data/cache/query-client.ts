import { QueryClient } from '@tanstack/react-query';
import { isAppFailure, type AppError } from '@/domain';
import { PERSIST_MAX_AGE } from './persister';

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
    // As long as the persister keeps it, so a restored catalog is not collected right away.
    gcTime: PERSIST_MAX_AGE,
    retry: (count: number, err: unknown): boolean =>
      count < CATALOG_RETRIES && isAppFailure(err) && isTransient(err.error),
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
