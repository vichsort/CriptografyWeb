import type { ReactNode } from 'react';
import { cn } from './cn';
import { ErrorIcon, InfoIcon, WarningIcon } from './icons';

type Tone = 'info' | 'warning' | 'error';

const TONES: Record<Tone, { surface: string; accent: string; icon: ReactNode }> = {
  info: { surface: 'bg-info-weak', accent: 'text-tint-text', icon: <InfoIcon /> },
  warning: { surface: 'bg-warning-weak', accent: 'text-warning-text', icon: <WarningIcon /> },
  error: { surface: 'bg-danger-weak', accent: 'text-danger', icon: <ErrorIcon /> },
};

interface InlineMessageProps {
  tone: Tone;
  title: string;
  body?: string | null;
  apiMessage?: string | null;
  icon?: ReactNode;
  /**
   * Whether the message is its own live region. A screen that announces through a live region
   * of its own passes false, so the message is not read twice.
   */
  live?: boolean;
}

/** Headline, explanation, and the API's own message in monospace. Errors interrupt; the rest wait. */
export function InlineMessage({
  tone,
  title,
  body,
  apiMessage,
  icon,
  live = true,
}: InlineMessageProps) {
  const { surface, accent, icon: toneIcon } = TONES[tone];
  return (
    <div
      role={live ? (tone === 'error' ? 'alert' : 'status') : undefined}
      className={cn('flex gap-3 rounded-lg px-4 py-3', surface)}
    >
      <span className={cn('mt-0.5 shrink-0 text-headline', accent)}>{icon ?? toneIcon}</span>
      <div className="min-w-0 space-y-1">
        <strong className="block text-callout font-semibold text-label">{title}</strong>
        {body != null && body !== '' && (
          <p className="text-footnote text-label-secondary">{body}</p>
        )}
        {apiMessage != null && apiMessage !== '' && (
          <p className="text-mono-small break-words text-label-secondary">{apiMessage}</p>
        )}
      </div>
    </div>
  );
}
