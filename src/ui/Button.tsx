'use client';

import { AnimatePresence, motion, type MotionStyle } from 'motion/react';
import {
  useLayoutEffect,
  useRef,
  type ButtonHTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from 'react';
import { ActivityIndicator } from './ActivityIndicator';
import { cn } from './cn';
import { durations, springs, useReducedMotionSafe } from './motion';

type Variant = 'primary' | 'secondary' | 'tertiary' | 'destructive';
type Size = 'sm' | 'md' | 'lg' | 'icon';

// Handlers whose signatures differ between the DOM and Motion; buttons never need them.
type MotionConflicts =
  | 'onAnimationStart'
  | 'onAnimationEnd'
  | 'onAnimationIteration'
  | 'onDrag'
  | 'onDragStart'
  | 'onDragEnd';

export type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, MotionConflicts> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  /** The gerund shown while loading ("Encrypting…"). Defaults to the label. */
  loadingLabel?: string;
  icon?: ReactNode;
};

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-tint text-on-tint shadow-control hover:brightness-110',
  secondary: 'bg-tint-weak text-tint-text hover:brightness-95 dark:hover:brightness-125',
  tertiary: 'bg-transparent text-tint-text hover:bg-fill',
  destructive: 'bg-danger-weak text-danger hover:brightness-95 dark:hover:brightness-125',
};

const SIZES: Record<Size, string> = {
  sm: 'h-8 gap-[6px] rounded-sm px-3 text-footnote font-semibold',
  md: 'h-11 gap-2 rounded-md px-5 text-body font-semibold',
  lg: 'h-12 gap-2 rounded-lg px-6 text-headline',
  icon: 'size-11 rounded-md text-headline',
};

// The indicator slides in from the left: its box grows from nothing while the gap closes.
const GAP = { sm: 6, md: 8, lg: 8, icon: 0 } as const;
const INDICATOR = { sm: 14, md: 18, lg: 18, icon: 18 } as const;

/**
 * The app's button. While loading it shows the activity indicator and the gerund, keeps the width
 * it had at rest, stays focusable, and ignores presses.
 */
export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  loadingLabel,
  icon,
  className,
  type = 'button',
  onClick,
  children,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const restWidth = useRef(0);
  const reduced = useReducedMotionSafe();

  // Lock the width measured at rest while loading, so the gerund never makes the button jump.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (loading) {
      if (restWidth.current > 0) el.style.minWidth = `${restWidth.current}px`;
      return;
    }
    el.style.minWidth = '';
    restWidth.current = el.getBoundingClientRect().width;
  }, [loading, children, size, icon]);

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (loading) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  };

  const pressable = !disabled && !loading && !reduced;
  const label = loading && loadingLabel !== undefined ? loadingLabel : children;
  const slide = reduced ? { duration: 0, opacity: { duration: durations.fast } } : springs.snappy;
  const hidden = { width: 0, marginRight: -GAP[size], opacity: 0, scale: 0.6 };
  const shown = { width: INDICATOR[size], marginRight: 0, opacity: 1, scale: 1 };

  return (
    <motion.button
      ref={ref}
      type={type}
      disabled={disabled}
      aria-busy={loading || undefined}
      onClick={handleClick}
      {...(pressable && { whileTap: { scale: 0.97 } })}
      transition={springs.snappy}
      className={cn(
        'relative inline-flex shrink-0 cursor-pointer items-center justify-center overflow-hidden whitespace-nowrap select-none',
        'transition-[background-color,filter,opacity] duration-fast ease-standard',
        'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:brightness-100',
        VARIANTS[variant],
        SIZES[size],
        loading && 'cursor-progress',
        className,
      )}
      // React's CSSProperties types a few SVG keys (x, y) more loosely than Motion does.
      {...(style !== undefined && { style: style as MotionStyle })}
      {...rest}
    >
      <AnimatePresence initial={false}>
        {loading && (
          <motion.span
            key="indicator"
            className="inline-flex shrink-0 items-center justify-center"
            initial={hidden}
            animate={shown}
            exit={hidden}
            transition={slide}
          >
            <ActivityIndicator size={size === 'sm' ? 'sm' : 'md'} />
          </motion.span>
        )}
      </AnimatePresence>
      {icon !== undefined && !loading && (
        <span className="inline-flex shrink-0" aria-hidden="true">
          {icon}
        </span>
      )}
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={loading ? 'busy' : 'rest'}
          className="inline-block"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: durations.fast }}
        >
          {label}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}
