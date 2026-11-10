'use client';

import { useReducedMotion, type Transition } from 'motion/react';

/** Springs from docs/DESIGN.md §7: `snappy` for controls, `gentle` for larger surfaces. */
export const springs = {
  snappy: { type: 'spring', stiffness: 560, damping: 36, mass: 0.7 },
  gentle: { type: 'spring', stiffness: 260, damping: 30, mass: 1 },
} satisfies Record<'snappy' | 'gentle', Transition>;

/** Durations in seconds, mirroring the CSS duration tokens. */
export const durations = { instant: 0.1, fast: 0.16, base: 0.22, slow: 0.32 } as const;

/**
 * Whether the user asked for reduced motion. False until known (on the server and the first
 * client render), so markup matches during hydration.
 */
export function useReducedMotionSafe(): boolean {
  return useReducedMotion() ?? false;
}
