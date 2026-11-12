'use client';

import { motion } from 'motion/react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { cn } from './cn';
import { ChevronRightIcon } from './icons';
import { durations, useReducedMotionSafe } from './motion';

interface ListRowProps {
  icon?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  href?: string;
  /** Called on click; with `href`, alongside the navigation. */
  onSelect?: () => void;
  selected?: boolean;
  chevron?: boolean;
  /** `regular` rows sit in cards with inset separators; `compact` rows are the sidebar's pills. */
  density?: 'regular' | 'compact';
  /** Enters and leaves with a fade and a height change, and moves with layout changes. */
  animated?: boolean;
}

/**
 * A list item: icon tile, title, subtitle and chevron. The separator is inset to the text and
 * hidden on the last row, so it belongs inside a `<ul>`. Animated rows go inside AnimatePresence.
 */
export function ListRow({
  icon,
  title,
  subtitle,
  href,
  onSelect,
  selected,
  chevron,
  density = 'regular',
  animated,
}: ListRowProps) {
  const reduced = useReducedMotionSafe();
  const compact = density === 'compact';
  const interactive = href !== undefined || onSelect !== undefined;
  const row = cn(
    'flex w-full min-w-0 items-center text-left',
    compact ? 'gap-[10px] rounded-[9px] px-2 py-[7px] max-lg:py-[10px]' : 'gap-3 pl-4',
    interactive &&
      'transition-colors duration-fast ease-standard hover:bg-fill active:bg-fill focus-visible:-outline-offset-2',
    selected && 'bg-tint-weak hover:bg-tint-weak active:bg-tint-weak',
  );
  const titleClass = cn(
    'block truncate',
    compact ? 'text-callout max-lg:text-body' : 'text-body',
    selected ? 'font-semibold text-tint-text' : 'text-label',
  );
  const subtitleClass = cn(
    'block truncate',
    compact ? 'text-caption text-label-tertiary' : 'text-footnote text-label-secondary',
  );
  const text = (
    <span className="min-w-0 flex-1">
      <span className={titleClass}>{title}</span>
      {subtitle != null && <span className={subtitleClass}>{subtitle}</span>}
    </span>
  );
  const content = (
    <>
      {icon}
      {compact ? (
        text
      ) : (
        <span className="flex min-h-11 min-w-0 flex-1 items-center gap-3 border-b border-separator py-[10px] pr-4 group-last/row:border-b-0">
          {text}
          {chevron && <ChevronRightIcon className="shrink-0 text-footnote text-label-tertiary" />}
        </span>
      )}
    </>
  );

  let body: ReactNode;
  if (href !== undefined) {
    body = (
      <Link
        href={href}
        className={row}
        {...(onSelect && { onClick: onSelect })}
        aria-current={selected ? 'page' : undefined}
      >
        {content}
      </Link>
    );
  } else if (onSelect !== undefined) {
    body = (
      <button
        type="button"
        className={row}
        onClick={onSelect}
        aria-current={selected ? 'true' : undefined}
      >
        {content}
      </button>
    );
  } else {
    body = <div className={row}>{content}</div>;
  }

  if (!animated) return <li className="group/row">{body}</li>;

  const hidden = reduced ? { opacity: 0 } : { opacity: 0, height: 0 };
  return (
    <motion.li
      layout={reduced ? false : 'position'}
      className="group/row overflow-hidden"
      initial={hidden}
      animate={{ opacity: 1, height: 'auto' }}
      exit={hidden}
      transition={{ duration: durations.fast }}
    >
      {body}
    </motion.li>
  );
}
