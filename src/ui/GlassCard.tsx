import { useId, type ReactNode } from 'react';
import { cn } from './cn';

interface GlassCardProps {
  title?: ReactNode;
  hint?: ReactNode;
  description?: ReactNode;
  material?: 'thin' | 'regular';
  /** Content runs edge to edge (list rows bring their own insets). */
  flush?: boolean;
  children: ReactNode;
}

/** A glass surface: title, hint and description inside the card, content below. */
export function GlassCard({
  title,
  hint,
  description,
  material = 'regular',
  flush,
  children,
}: GlassCardProps) {
  const titleId = useId();
  const hasHeader = title != null || hint != null || description != null;
  return (
    <section
      aria-labelledby={title != null ? titleId : undefined}
      className={cn(
        'rounded-xl',
        flush && 'overflow-hidden',
        material === 'thin' ? 'material-glass-thin' : 'material-glass-regular',
      )}
    >
      {hasHeader && (
        <header className="px-4 pt-[14px]">
          {(title != null || hint != null) && (
            <div className="flex items-baseline justify-between gap-3">
              {title != null && (
                <h2 id={titleId} className="text-headline text-label">
                  {title}
                </h2>
              )}
              {hint != null && <span className="text-mono-small text-label-tertiary">{hint}</span>}
            </div>
          )}
          {description != null && (
            <p className="mt-0.5 text-footnote text-label-secondary">{description}</p>
          )}
        </header>
      )}
      <div
        className={cn(
          flush ? 'pb-1' : 'px-4 pb-4',
          hasHeader ? (flush ? 'pt-2' : 'pt-3') : flush ? 'pt-1' : 'pt-4',
        )}
      >
        {children}
      </div>
    </section>
  );
}
