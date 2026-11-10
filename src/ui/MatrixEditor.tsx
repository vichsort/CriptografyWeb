'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useId, useRef, useState, type KeyboardEvent } from 'react';
import { cn } from './cn';
import { describedBy, plainTextEntry } from './field';
import { MinusIcon, PlusIcon } from './icons';
import { durations, springs, useReducedMotionSafe } from './motion';

interface MatrixEditorProps {
  label: string;
  help?: string;
  /** A square matrix of integers. */
  value: number[][];
  /** Smallest and largest size, in rows. */
  min: number;
  max: number;
  onChange(matrix: number[][]): void;
  feedback?: { text: string; ok: boolean } | null;
  labels?: {
    smaller: string;
    larger: string;
    cell: (row: number, column: number) => string;
  };
}

const defaultLabels = {
  smaller: 'Smaller matrix',
  larger: 'Larger matrix',
  cell: (row: number, column: number) => `Row ${row}, column ${column}`,
};

/** Resizes to n×n, keeping the values that still fit and filling new cells from the identity. */
function resizeMatrix(matrix: number[][], n: number): number[][] {
  return Array.from({ length: n }, (_, r) =>
    Array.from({ length: n }, (_, c) => matrix[r]?.[c] ?? (r === c ? 1 : 0)),
  );
}

const WHOLE = /^-?\d+$/;

function without(drafts: Record<string, string>, key: string): Record<string, string> {
  const next = { ...drafts };
  delete next[key];
  return next;
}
const MOVES: Record<string, [number, number]> = {
  ArrowUp: [-1, 0],
  ArrowDown: [1, 0],
  ArrowLeft: [0, -1],
  ArrowRight: [0, 1],
};

const sizeButton =
  'grid size-8 cursor-pointer place-items-center text-footnote text-tint-text transition-colors duration-fast hover:bg-fill active:bg-tint-weak disabled:cursor-not-allowed disabled:text-label-tertiary disabled:hover:bg-transparent';

/** Size control from min×min to max×max, one field per cell, and a live feedback line. */
export function MatrixEditor({
  label,
  help,
  value,
  min,
  max,
  onChange,
  feedback,
  labels = defaultLabels,
}: MatrixEditorProps) {
  const id = useId();
  const reduced = useReducedMotionSafe();
  const n = value.length;
  const cells = useRef(new Map<string, HTMLInputElement>());
  // Text being typed that is not a whole number yet ("", "-"), per cell.
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const resize = (size: number) =>
    onChange(resizeMatrix(value, Math.min(max, Math.max(min, size))));

  const edit = (r: number, c: number, text: string) => {
    const key = `${r}-${c}`;
    if (WHOLE.test(text)) {
      setDrafts((d) => without(d, key));
      onChange(
        value.map((row, i) => (i === r ? row.map((v, j) => (j === c ? Number(text) : v)) : row)),
      );
    } else {
      setDrafts((d) => ({ ...d, [key]: text }));
    }
  };

  const clearDraft = (r: number, c: number) => setDrafts((d) => without(d, `${r}-${c}`));

  const move = (event: KeyboardEvent<HTMLInputElement>, r: number, c: number) => {
    const delta = MOVES[event.key];
    if (!delta) return;
    const target = cells.current.get(`${r + delta[0]}-${c + delta[1]}`);
    if (!target) return;
    event.preventDefault();
    target.focus();
    target.select();
  };

  return (
    <fieldset className="min-w-0" aria-describedby={describedBy(help && `${id}-help`)}>
      <legend className="mb-1 text-footnote font-semibold text-label">{label}</legend>
      {help && (
        <p id={`${id}-help`} className="mb-2 text-footnote text-label-secondary">
          {help}
        </p>
      )}
      <div className="mb-[10px] flex items-center gap-[10px] text-footnote text-label-secondary">
        <div className="inline-flex h-8 items-center overflow-hidden rounded-[10px] border border-field-border bg-field">
          <button
            type="button"
            aria-label={labels.smaller}
            disabled={n <= min}
            onClick={() => resize(n - 1)}
            className={sizeButton}
          >
            <MinusIcon />
          </button>
          <span className="px-[10px] font-mono text-footnote text-label">{`${n}×${n}`}</span>
          <button
            type="button"
            aria-label={labels.larger}
            disabled={n >= max}
            onClick={() => resize(n + 1)}
            className={sizeButton}
          >
            <PlusIcon />
          </button>
        </div>
      </div>
      <div
        className="inline-grid gap-[6px] rounded-sm border-x-2 border-label-tertiary px-[10px] py-2"
        style={{ gridTemplateColumns: `repeat(${n}, auto)` }}
      >
        {/* Cells present on the first render appear as they are; cells added later animate in. */}
        <AnimatePresence initial={false}>
          {value.map((row, r) =>
            row.map((cell, c) => {
              const key = `${r}-${c}`;
              return (
                <motion.input
                  key={key}
                  {...plainTextEntry}
                  ref={(el) => {
                    if (el) cells.current.set(key, el);
                    else cells.current.delete(key);
                  }}
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  aria-label={labels.cell(r + 1, c + 1)}
                  value={drafts[key] ?? String(cell)}
                  onChange={(e) => edit(r, c, e.target.value)}
                  onBlur={() => clearDraft(r, c)}
                  onKeyDown={(e) => move(e, r, c)}
                  initial={{ opacity: 0, scale: reduced ? 1 : 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={reduced ? { duration: durations.fast } : springs.snappy}
                  className="h-[38px] w-[42px] rounded-sm border border-field-border bg-field text-center font-mono text-input text-label outline-none transition-[border-color,box-shadow] duration-fast focus:border-tint focus:ring-[3px] focus:ring-tint-weak sm:w-12"
                />
              );
            }),
          )}
        </AnimatePresence>
      </div>
      {feedback && (
        <p
          aria-live="polite"
          className={cn(
            'mt-2 font-mono text-mono-small transition-colors duration-fast',
            feedback.ok ? 'text-success' : 'text-danger',
          )}
        >
          {feedback.text}
        </p>
      )}
    </fieldset>
  );
}
