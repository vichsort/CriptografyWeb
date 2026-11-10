import { hashKey, isCancelledError, type QueryClient } from '@tanstack/react-query';
import { runOperation } from '@/data/api';
import { AppFailure, isDeterministic, type OperationRequest } from '@/domain';
import { trackRun } from './in-flight';
import { queryKeys } from './keys';
import { policies } from './query-client';

interface RunOptions {
  signal: AbortSignal;
  onWaking: () => void;
}

/** Runs waiting on the same pending request, so one cancelled run does not cancel the others. */
interface Shared {
  waiting: number;
  waking: boolean;
  wakingListeners: Set<() => void>;
}

const sharedByClient = new WeakMap<QueryClient, Map<string, Shared>>();

const aborted = () => new AppFailure({ kind: 'aborted' });

function sharedFor(client: QueryClient, hash: string): Shared {
  let byHash = sharedByClient.get(client);
  if (!byHash) {
    byHash = new Map();
    sharedByClient.set(client, byHash);
  }
  let shared = byHash.get(hash);
  if (!shared) {
    shared = { waiting: 0, waking: false, wakingListeners: new Set() };
    byHash.set(hash, shared);
  }
  return shared;
}

function runDeterministic(
  client: QueryClient,
  req: OperationRequest,
  opts: RunOptions,
): Promise<string> {
  if (opts.signal.aborted) return Promise.reject(aborted());

  const queryKey = queryKeys.operation(req);
  const hash = hashKey(queryKey);
  const shared = sharedFor(client, hash);
  shared.waiting++;
  shared.wakingListeners.add(opts.onWaking);
  if (shared.waking) opts.onWaking();

  const fetching = client.fetchQuery({
    queryKey,
    queryFn: ({ signal }) =>
      runOperation(req, {
        signal,
        onWaking: () => {
          shared.waking = true;
          shared.wakingListeners.forEach((listener) => listener());
        },
      }),
    ...policies.operation,
  });

  return new Promise<string>((resolve, reject) => {
    let done = false;
    const leave = (): number => {
      done = true;
      opts.signal.removeEventListener('abort', onAbort);
      shared.wakingListeners.delete(opts.onWaking);
      shared.waiting--;
      if (shared.waiting === 0) sharedByClient.get(client)?.delete(hash);
      return shared.waiting;
    };
    function onAbort() {
      if (done) return;
      // The last run to give up cancels the request; otherwise the others still want it.
      if (leave() === 0) void client.cancelQueries({ queryKey, exact: true });
      reject(aborted());
    }
    opts.signal.addEventListener('abort', onAbort);

    fetching.then(
      (result) => {
        if (done) return;
        leave();
        resolve(result);
      },
      (error: unknown) => {
        if (done) return;
        leave();
        reject(isCancelledError(error) ? aborted() : error);
      },
    );
  });
}

/**
 * Runs an operation on explicit user action. Deterministic results are memoized in the query
 * cache, so running the same thing again costs no request; the rest always go to the API.
 */
export function executeOperation(
  client: QueryClient,
  req: OperationRequest,
  opts: RunOptions,
): Promise<string> {
  if (!isDeterministic(req.algorithmId, req.operation)) return trackRun(runOperation(req, opts));
  return runDeterministic(client, req, opts);
}
