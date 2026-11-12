'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useId, type ReactNode } from 'react';
import { ChevronRightIcon } from './icons';
import { durations, springs, useReducedMotionSafe } from './motion';

interface AccordionProps {
  title: string;
  count?: number;
  open: boolean;
  onOpenChange(open: boolean): void;
  children: ReactNode;
}

/** A glass section with a title, a count and a rotating chevron; its height animates. */
export function Accordion({ title, count, open, onOpenChange, children }: AccordionProps) {
  const panelId = useId();
  const reduced = useReducedMotionSafe();
  const transition = reduced
    ? { duration: 0, opacity: { duration: durations.fast } }
    : { ...springs.gentle, opacity: { duration: durations.fast } };

  return (
    <div className="material-glass-regular overflow-hidden rounded-lg">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => onOpenChange(!open)}
        className="flex w-full cursor-pointer items-center gap-2 px-3 py-[10px] text-left text-label focus-visible:-outline-offset-2"
      >
        <span className="min-w-0 flex-1 truncate text-callout font-semibold">{title}</span>
        {count !== undefined && (
          <span className="font-mono text-[0.65625rem] text-label-tertiary">{count}</span>
        )}
        <motion.span
          aria-hidden="true"
          className="grid text-footnote text-label-tertiary"
          initial={false}
          animate={{ rotate: open ? 90 : 0 }}
          transition={reduced ? { duration: 0 } : springs.snappy}
        >
          <ChevronRightIcon />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="panel"
            id={panelId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={transition}
            className="overflow-hidden"
          >
            <div className="px-[6px] pb-[6px]">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
