'use client';

import { useId } from 'react';
import { cn } from './cn';
import { Field, fieldDescription, fieldSurface, plainTextEntry } from './field';
import { MinusIcon, PlusIcon } from './icons';

interface NumberStepperProps {
  label: string;
  help?: string;
  /** Raw text, so "-" or "" mid-typing is allowed; the form validates it. */
  value: string;
  onChange(value: string): void;
  error?: string | null;
  stepLabels?: { decrease: string; increase: string };
}

/** Empty or non-numeric text steps from 0. */
function step(value: string, by: number): string {
  const n = Number.parseInt(value, 10);
  return String((Number.isNaN(n) ? 0 : n) + by);
}

const stepButton =
  'grid h-full w-10 shrink-0 cursor-pointer place-items-center text-headline text-tint-text transition-colors duration-fast hover:bg-fill active:bg-tint-weak';

/** − value +, with typing allowed. */
export function NumberStepper({
  label,
  help,
  value,
  onChange,
  error,
  stepLabels = { decrease: 'Decrease', increase: 'Increase' },
}: NumberStepperProps) {
  const id = useId();
  const invalid = error != null && error !== '';
  return (
    <Field id={id} label={label} help={help} error={error}>
      <div
        className={cn(
          'inline-flex h-10 items-stretch overflow-hidden rounded-[10px]',
          fieldSurface,
        )}
      >
        <button
          type="button"
          aria-label={stepLabels.decrease}
          onClick={() => onChange(step(value, -1))}
          className={stepButton}
        >
          <MinusIcon />
        </button>
        <input
          {...plainTextEntry}
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={invalid || undefined}
          aria-describedby={fieldDescription(id, help, error)}
          className="w-16 border-x border-separator bg-transparent text-center font-mono text-input text-label outline-none focus-visible:outline-none"
        />
        <button
          type="button"
          aria-label={stepLabels.increase}
          onClick={() => onChange(step(value, 1))}
          className={stepButton}
        >
          <PlusIcon />
        </button>
      </div>
    </Field>
  );
}
