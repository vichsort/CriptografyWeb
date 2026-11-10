import type { QueryClient } from '@tanstack/react-query';
import { runOperation } from '@/data/api';
import { isDeterministic, type OperationRequest } from '@/domain';
import { trackRun } from './in-flight';
import { queryKeys } from './keys';
import { policies } from './query-client';

/**
 * Runs an operation on explicit user action. Deterministic results are memoized in the query
 * cache, so running the same thing again costs no request; the rest always go to the API.
 */
export function executeOperation(
  client: QueryClient,
  req: OperationRequest,
  opts: { signal: AbortSignal; onWaking: () => void },
): Promise<string> {
  const run = () => runOperation(req, opts);
  if (!isDeterministic(req.algorithmId, req.operation)) return trackRun(run());
  return client.fetchQuery({
    queryKey: queryKeys.operation(req),
    queryFn: run,
    ...policies.operation,
  });
}
