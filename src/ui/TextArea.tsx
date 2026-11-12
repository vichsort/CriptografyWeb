'use client';

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
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

const graphemes =
  typeof Intl !== 'undefined' && 'Segmenter' in Intl
    ? new Intl.Segmenter(undefined, { granularity: 'grapheme' })
    : null;

/**
 * Counts what a person sees as characters: a joined emoji, a flag or a skin tone is one.
 * Without Intl.Segmenter it falls back to code points.
 */
function characterCount(text: string): number {
  const units: Iterator<unknown> = graphemes
    ? graphemes.segment(text)[Symbol.iterator]()
    : text[Symbol.iterator]();
  let n = 0;
  while (!units.next().done) n++;
  return n;
}

/** How long typing must pause before a screen reader hears the new count. */
const ANNOUNCE_DELAY_MS = 1000;

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
    counter ? characterCount(String(defaultValue ?? '')) : 0,
  );
  const controlledLength = useMemo(
    () => (counter && value !== undefined ? characterCount(String(value)) : null),
    [counter, value],
  );
  const count = controlledLength ?? uncontrolledLength;

  // The visible count changes on every keystroke; the live region speaks once typing pauses.
  const [announced, setAnnounced] = useState<number | null>(null);
  const spoken = useRef(count);
  useEffect(() => {
    if (!counter || count === spoken.current) return;
    const timer = setTimeout(() => {
      spoken.current = count;
      setAnnounced(count);
    }, ANNOUNCE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [counter, count]);

  const grow = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  useLayoutEffect(grow, [grow, value]);

  // Lines rewrap when the width changes (resize, rotation) or the web font arrives.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let cancelled = false;
    void document.fonts?.ready.then(() => {
      if (!cancelled) grow();
    });
    if (typeof ResizeObserver === 'undefined') return () => void (cancelled = true);
    // Growing sets the same height again, so the observer settles after one call.
    const observer = new ResizeObserver(() => grow());
    observer.observe(el);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [grow]);

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    if (counter && value === undefined) setUncontrolledLength(characterCount(event.target.value));
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
          {counter && <span>{formatCount(count)}</span>}
        </div>
      )}
      {counter && (
        <span role="status" className="sr-only">
          {announced === null ? '' : formatCount(announced)}
        </span>
      )}
    </div>
  );
}
