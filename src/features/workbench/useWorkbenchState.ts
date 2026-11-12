'use client';

import { useSearchParams } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import type { Algorithm, Operation } from '@/domain';
import { initialValues, toOptions, type FormValues } from './form/to-options';

/**
 * What the person is editing on one algorithm's screen: the mode (kept in `?mode=`), the
 * options and the input. Field errors show only once that field was edited.
 */
export function useWorkbenchState(algorithm: Algorithm) {
  const params = useSearchParams();
  const requested = params.get('mode');
  const mode: Operation | undefined =
    algorithm.operations.find((op) => op === requested) ?? algorithm.operations[0];

  // Next keeps useSearchParams in sync with replaceState, without a server round trip.
  const setMode = useCallback((op: Operation) => {
    const next = new URLSearchParams(window.location.search);
    next.set('mode', op);
    window.history.replaceState(null, '', `?${next.toString()}`);
  }, []);

  const schema = algorithm.optionsSchema;
  const [values, setValuesState] = useState<FormValues>(() => initialValues(schema));
  const [edited, setEdited] = useState<ReadonlySet<string>>(() => new Set());
  const [input, setInput] = useState('');

  const setValues = useCallback(
    (next: FormValues) => {
      const changed = Object.keys(next).filter((key) => next[key] !== values[key]);
      if (changed.length > 0) setEdited((keys) => new Set([...keys, ...changed]));
      setValuesState(next);
    },
    [values],
  );

  const converted = useMemo(() => toOptions(schema, values), [schema, values]);
  const errors = useMemo(() => {
    if (!('errors' in converted)) return {};
    return Object.fromEntries(Object.entries(converted.errors).filter(([key]) => edited.has(key)));
  }, [converted, edited]);

  return {
    mode,
    setMode,
    values,
    setValues,
    errors,
    options: 'options' in converted ? converted.options : null,
    input,
    setInput,
  };
}
