import Link from 'next/link';
import type { ReactNode } from 'react';
import { cn } from './cn';
import { ChevronRightIcon } from './icons';

interface ListRowProps {
  icon?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  href?: string;
  onSelect?: () => void;
  selected?: boolean;
  chevron?: boolean;
}

/**
 * A list item: icon tile, title, subtitle and chevron. The separator is inset to the text and
 * hidden on the last row, so it belongs inside a `<ul>`.
 */
export function ListRow({
  icon,
  title,
  subtitle,
  href,
  onSelect,
  selected,
  chevron,
}: ListRowProps) {
  const interactive = href !== undefined || onSelect !== undefined;
  const row = cn(
    'flex w-full min-w-0 items-center gap-3 pl-4 text-left',
    interactive &&
      'transition-colors duration-fast ease-standard hover:bg-fill active:bg-fill focus-visible:-outline-offset-2',
    selected && 'bg-tint-weak hover:bg-tint-weak',
  );
  const content = (
    <>
      {icon}
      <span className="flex min-h-11 min-w-0 flex-1 items-center gap-3 border-b border-separator py-[10px] pr-4 group-last/row:border-b-0">
        <span className="min-w-0 flex-1">
          <span
            className={cn(
              'block truncate text-body',
              selected ? 'font-semibold text-tint-text' : 'text-label',
            )}
          >
            {title}
          </span>
          {subtitle != null && (
            <span className="block truncate text-footnote text-label-secondary">{subtitle}</span>
          )}
        </span>
        {chevron && <ChevronRightIcon className="shrink-0 text-footnote text-label-tertiary" />}
      </span>
    </>
  );

  let body: ReactNode;
  if (href !== undefined) {
    body = (
      <Link href={href} className={row} aria-current={selected ? 'page' : undefined}>
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

  return <li className="group/row">{body}</li>;
}
