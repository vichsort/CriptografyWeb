'use client';

import { useSyncExternalStore } from 'react';
import { DEFAULT_OPEN_FAMILIES, preferences } from '@/data/persistence';
import type { Family } from '@/domain';

// The server cannot know what this browser saved; hydration starts from what it rendered.
const onTheServer = () => DEFAULT_OPEN_FAMILIES;

/** The families the visitor left open in the sidebar. */
export function useOpenFamilies(): readonly Family[] {
  return useSyncExternalStore(preferences.subscribe, preferences.openFamilies, onTheServer);
}
