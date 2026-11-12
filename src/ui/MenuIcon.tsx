'use client';

import { motion } from 'motion/react';
import { springs, useReducedMotionSafe } from './motion';

// Both shapes use the same commands, so Motion can tween one path into the other.
const BARS = ['M4 8L20 8', 'M4 16L20 16'] as const;
const CROSS = ['M6 6L18 18', 'M6 18L18 6'] as const;

/** The mobile menu glyph: two bars that morph into a cross while the menu is open. Decorative. */
export function MenuIcon({ open }: { open: boolean }) {
  const reduced = useReducedMotionSafe();
  const shape = open ? CROSS : BARS;
  return (
    <svg
      viewBox="0 0 24 24"
      width="1.25em"
      height="1.25em"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
    >
      {shape.map((d, i) => (
        <motion.path
          key={i}
          initial={false}
          animate={{ d }}
          transition={reduced ? { duration: 0 } : springs.snappy}
        />
      ))}
    </svg>
  );
}
