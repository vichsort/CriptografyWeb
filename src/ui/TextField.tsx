'use client';

import { useId, useState, type InputHTMLAttributes } from 'react';
import { cn } from './cn';
import {
  describedBy,
  Field,
  fieldDescription,
  fieldInput,
  fieldSurface,
  plainTextEntry,
} from './field';
import { EyeIcon, EyeOffIcon } from './icons';

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  help?: string;
  error?: string | null;
  /** Masks the value, with a toggle to reveal it. */
  secret?: boolean;
  /** Accessible name of the reveal toggle. */
  revealLabel?: string;
};

export function TextField({
  label,
  help,
  error,
  secret = false,
  revealLabel = 'Show',
  id: idProp,
  type = 'text',
  className,
  ...rest
}: TextFieldProps) {
  const generated = useId();
  const id = idProp ?? generated;
  const [revealed, setRevealed] = useState(false);
  const invalid = error != null && error !== '';

  return (
    <Field id={id} label={label} help={help} error={error} className={className}>
      <div className={cn('flex h-10 items-center gap-2 rounded-[10px] px-3', fieldSurface)}>
        <input
          {...plainTextEntry}
          autoComplete="off"
          {...rest}
          id={id}
          type={secret ? (revealed ? 'text' : 'password') : type}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy(
            fieldDescription(id, help, error),
            rest['aria-describedby'],
          )}
          className={fieldInput}
        />
        {secret && (
          <button
            type="button"
            aria-label={revealLabel}
            aria-pressed={revealed}
            onClick={() => setRevealed((r) => !r)}
            className="grid size-6 shrink-0 cursor-pointer place-items-center rounded-xs text-callout text-label-tertiary hover:text-label-secondary"
          >
            {revealed ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        )}
      </div>
    </Field>
  );
}
