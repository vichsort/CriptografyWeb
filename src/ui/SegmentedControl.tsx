'use client';

import { motion } from 'motion/react';
import { useId, useRef, type KeyboardEvent } from 'react';
import { cn } from './cn';
import { springs, useReducedMotionSafe } from './motion';

interface SegmentedControlProps<T extends string> {
  options: readonly { value: T; label: string }[];
  value: NoInfer<T>;
  onChange(value: NoInfer<T>): void;
  ariaLabel: string;
}

const NEXT: Record<string, 1 | -1> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };

/** A radio group drawn as iOS segments; the thumb slides to the chosen one. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: SegmentedControlProps<T>) {
  const thumbId = useId();
  const reduced = useReducedMotionSafe();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const selected = options.findIndex((o) => o.value === value);
  // With no match, the first segment takes the tab stop so the group stays reachable.
  const tabStop = Math.max(0, selected);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const by = NEXT[event.key];
    if (by === undefined || options.length === 0) return;
    event.preventDefault();
    const next = (tabStop + by + options.length) % options.length;
    const option = options[next];
    if (!option) return;
    onChange(option.value);
    refs.current[next]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      onKeyDown={onKeyDown}
      className="relative inline-grid auto-cols-fr grid-flow-col rounded-[10px] bg-fill p-[3px]"
    >
      {options.map((option, i) => {
        const checked = option.value === value;
        return (
          <button
            key={option.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={i === tabStop ? 0 : -1}
            onClick={() => onChange(option.value)}
            className={cn(
              'relative cursor-pointer rounded-sm px-[22px] py-[7px] text-footnote font-medium whitespace-nowrap text-label',
              'focus-visible:outline-offset-0',
            )}
          >
            {checked && (
              <motion.span
                layoutId={thumbId}
                aria-hidden="true"
                className="absolute inset-0 rounded-sm bg-thumb shadow-control"
                transition={reduced ? { duration: 0 } : springs.snappy}
              />
            )}
            <span className="relative">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
