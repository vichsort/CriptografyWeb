'use client';

import { useEffect, useRef } from 'react';
import { pingApi } from '@/data/cache';

/** Starts waking the backend as soon as the app loads, so the first real request waits less. */
export function WarmUp() {
  // A ref survives Strict Mode's simulated remount, so the ping still goes out once.
  const pinged = useRef(false);
  useEffect(() => {
    if (pinged.current) return;
    pinged.current = true;
    pingApi();
  }, []);
  return null;
}
