'use client';

import { useSyncExternalStore } from 'react';

const formatter = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
});

// Re-renders at every midnight, so a page left open for days keeps showing today.
function subscribe(onChange: () => void): () => void {
  let timer: ReturnType<typeof setTimeout>;
  const arm = () => {
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    timer = setTimeout(() => {
      onChange();
      arm();
    }, midnight.getTime() - now.getTime());
  };
  arm();
  return () => clearTimeout(timer);
}

const today = () => formatter.format(new Date());
const notOnTheServer = () => null;

/**
 * Today's date, e.g. "Tuesday, November 10". The page is prerendered at build time, so the date
 * exists only in the browser; until then an invisible line keeps the title from moving.
 */
export function DateLine() {
  const date = useSyncExternalStore(subscribe, today, notOnTheServer);
  return (
    <p className="text-eyebrow text-label-tertiary">
      {date ?? (
        <span aria-hidden="true" className="invisible">
          {' '}
        </span>
      )}
    </p>
  );
}
