'use client';

import {
  useCallback,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type TextareaHTMLAttributes,
} from 'react';
import { cn } from './cn';
import { describedBy, fieldSurface, plainTextEntry } from './field';

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  /** Shows the character count under the field. */
  counter?: boolean;
  note?: string;
  formatCount?: (count: number) => string;
};

const defaultCount = (n: number) => `${n} ${n === 1 ? 'character' : 'characters'}`;

/** Counts what a person sees as characters: an emoji is one, not two UTF-16 units. */
const characterCount = (text: string) => Array.from(text).length;

/** A multi-line field that grows with its content. Whitespace is part of the value. */
export function TextArea({
  label,
  counter = false,
  note,
  formatCount = defaultCount,
  id: idProp,
  className,
  onChange,
  value,
  defaultValue,
  ...rest
}: TextAreaProps) {
  const generated = useId();
  const id = idProp ?? generated;
  const ref = useRef<HTMLTextAreaElement>(null);
  const [uncontrolledLength, setUncontrolledLength] = useState(() =>
    characterCount(String(defaultValue ?? '')),
  );
  const count = value !== undefined ? characterCount(String(value)) : uncontrolledLength;

  const grow = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  useLayoutEffect(grow, [grow, value]);

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    if (value === undefined) setUncontrolledLength(characterCount(event.target.value));
    onChange?.(event);
    grow();
  };

  const showMeta = counter || (note != null && note !== '');

  return (
    <div className={cn('min-w-0', className)}>
      <label htmlFor={id} className="mb-1 block text-footnote font-semibold text-label">
        {label}
      </label>
      <textarea
        {...plainTextEntry}
        {...rest}
        ref={ref}
        id={id}
        value={value}
        defaultValue={defaultValue}
        onChange={handleChange}
        aria-describedby={describedBy(note ? `${id}-note` : null, rest['aria-describedby'])}
        className={cn(
          'block min-h-[96px] w-full resize-none overflow-hidden rounded-md px-[14px] py-3 text-input text-label outline-none focus-visible:outline-none',
          fieldSurface,
        )}
      />
      {showMeta && (
        <div className="mt-[6px] flex justify-between gap-3 text-caption text-label-tertiary">
          <span id={`${id}-note`}>{note}</span>
          {counter && <span aria-live="polite">{formatCount(count)}</span>}
        </div>
      )}
    </div>
  );
}
