'use client';

import { AnimatePresence, motion } from 'motion/react';
import { cn } from './cn';
import { MoonIcon, SunIcon } from './icons';
import { durations, springs, useReducedMotionSafe } from './motion';

interface ThemeToggleProps {
  resolved: 'light' | 'dark';
  explicit: boolean;
  onToggle(): void;
  onUseSystem(): void;
  labels: { light: string; dark: string; useSystem: string };
}

/** Light / dark switch. While a theme is chosen explicitly, it offers to follow the system again. */
export function ThemeToggle({
  resolved,
  explicit,
  onToggle,
  onUseSystem,
  labels,
}: ThemeToggleProps) {
  const dark = resolved === 'dark';
  const reduced = useReducedMotionSafe();
  const fade = { duration: durations.base };

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={dark}
        aria-label={labels.dark}
        onClick={onToggle}
        className={cn(
          'relative h-[30px] w-[58px] shrink-0 cursor-pointer rounded-pill transition-colors duration-base',
          dark ? 'bg-switch-on' : 'bg-switch-off',
        )}
      >
        <motion.span
          aria-hidden="true"
          className={cn(
            'absolute top-[2px] left-[2px] grid size-[26px] place-items-center rounded-pill bg-knob text-callout shadow-knob',
            dark ? 'text-moon' : 'text-sun',
          )}
          initial={false}
          animate={{ x: dark ? 28 : 0 }}
          transition={reduced ? { duration: 0 } : springs.snappy}
        >
          {dark ? <MoonIcon /> : <SunIcon />}
        </motion.span>
      </button>
      <span aria-hidden="true" className="text-footnote text-label">
        {dark ? labels.dark : labels.light}
      </span>
      <AnimatePresence initial={false}>
        {explicit && (
          <motion.button
            key="use-system"
            type="button"
            onClick={onUseSystem}
            className="ml-auto cursor-pointer text-caption text-tint-text"
            initial={{ opacity: 0, x: reduced ? 0 : 4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: reduced ? 0 : 4 }}
            transition={fade}
          >
            {labels.useSystem}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
