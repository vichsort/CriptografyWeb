import type { ReactNode } from 'react';
import { cn } from './cn';

/** Attributes every text entry gets: cipher text and keys are never "corrected". */
export const plainTextEntry = {
  autoCapitalize: 'off',
  autoCorrect: 'off',
  spellCheck: false,
} as const;

/** The field surface; the ring shows on the surface, so the inner control drops its outline. */
export const fieldSurface =
  'border border-field-border bg-field transition-[border-color,box-shadow] duration-fast ease-standard focus-within:border-tint focus-within:ring-[3px] focus-within:ring-tint-weak';

export const fieldInput =
  'min-w-0 flex-1 bg-transparent text-input text-label outline-none focus-visible:outline-none';

export function describedBy(...ids: (string | false | null | undefined)[]): string | undefined {
  const joined = ids.filter(Boolean).join(' ');
  return joined === '' ? undefined : joined;
}

interface FieldProps {
  id: string;
  label: string;
  help?: string | undefined;
  error?: string | null | undefined;
  children: ReactNode;
  className?: string | undefined;
}

/** Label above, help below the label, the control, then the error. */
export function Field({ id, label, help, error, children, className }: FieldProps) {
  return (
    <div className={cn('min-w-0', className)}>
      <label htmlFor={id} className="mb-1 block text-footnote font-semibold text-label">
        {label}
      </label>
      {help != null && help !== '' && (
        <p id={`${id}-help`} className="mb-2 text-footnote text-label-secondary">
          {help}
        </p>
      )}
      {children}
      {error != null && error !== '' && (
        <p id={`${id}-error`} className="mt-[6px] text-footnote text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export function fieldDescription(
  id: string,
  help: string | undefined,
  error: string | null | undefined,
): string | undefined {
  return describedBy(help ? `${id}-help` : null, error ? `${id}-error` : null);
}
