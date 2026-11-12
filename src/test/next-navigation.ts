import { useMemo, useSyncExternalStore } from 'react';

/**
 * A stand-in for next/navigation that follows the jsdom URL. Next integrates
 * `history.replaceState` with its router; this does the same by notifying on each call.
 */
const listeners = new Set<() => void>();
const nativeReplaceState = window.history.replaceState.bind(window.history);
window.history.replaceState = (...args: Parameters<History['replaceState']>) => {
  nativeReplaceState(...args);
  listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => void listeners.delete(listener);
};

export const navigationMock = {
  usePathname: () => useSyncExternalStore(subscribe, () => window.location.pathname),
  useSearchParams: () => {
    const search = useSyncExternalStore(subscribe, () => window.location.search);
    return useMemo(() => new URLSearchParams(search), [search]);
  },
};

/** Moves the jsdom URL, as a navigation would. */
export function setUrl(path: string): void {
  window.history.replaceState(null, '', path);
}
