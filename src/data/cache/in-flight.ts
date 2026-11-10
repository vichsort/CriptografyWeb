import { useIsFetching, useIsMutating } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';

// Runs that bypass the query cache (non-deterministic operations) are counted here.
let untracked = 0;
const listeners = new Set<() => void>();

export function trackRun<T>(run: Promise<T>): Promise<T> {
  untracked++;
  listeners.forEach((l) => l());
  return run.finally(() => {
    untracked--;
    listeners.forEach((l) => l());
  });
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const getUntracked = () => untracked;
const getServerUntracked = () => 0;

/** True while any request is pending: queries, mutations or untracked runs. */
export function useInFlight(): boolean {
  const fetching = useIsFetching();
  const mutating = useIsMutating();
  const runs = useSyncExternalStore(subscribe, getUntracked, getServerUntracked);
  return fetching + mutating + runs > 0;
}
