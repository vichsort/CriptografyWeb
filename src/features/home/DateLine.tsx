'use client';

import { useSyncExternalStore } from 'react';

const formatter = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
});

// Re-renders at midnight, so a page left open overnight shows the new day.
function subscribe(onChange: () => void): () => void {
  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const timer = setTimeout(onChange, midnight.getTime() - now.getTime());
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
