'use client';

import { useSyncExternalStore } from 'react';

/** How long Run stays off after a 429 that does not say (Retry-After is not always exposed). */
export const DEFAULT_COOLDOWN_SECONDS = 60;

// The API limits each client, not each screen: one cooldown for every workbench.
let cooling = false;
let timer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();

const notify = () => listeners.forEach((listener) => listener());

/** Turns Run off for `seconds`, or longer if a cooldown already runs past that. */
export function startCooldown(seconds: number | null): void {
  clearTimeout(timer);
  cooling = true;
  timer = setTimeout(
    () => {
      cooling = false;
      notify();
    },
    (seconds ?? DEFAULT_COOLDOWN_SECONDS) * 1_000,
  );
  notify();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => void listeners.delete(listener);
}

/** Whether the API asked us to wait. */
export function useCooling(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => cooling,
    () => false,
  );
}
