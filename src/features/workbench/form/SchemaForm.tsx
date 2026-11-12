'use client';

import { form, type OptionCopy } from '@/content';
import { hillKeyFeedback, type JsonSchema, type OptionsSchema } from '@/domain';
import { MatrixEditor, NumberStepper, TextArea, TextField } from '@/ui';
import { resolveWidget } from './resolve-widget';
import type { FormValues } from './to-options';

/** The Hill key check: the determinant, and whether it is coprime with 26. */
export function matrixFeedback(matrix: number[][]): { text: string; ok: boolean } {
  const { determinant, residue, gcdWith26, invertible } = hillKeyFeedback(matrix);
  return { text: form.matrixFeedback(determinant, residue, gcdWith26), ok: invertible };
}

/** Algorithms whose matrix key is checked against the alphabet of 26 letters. */
const MOD_26_MATRIX = new Set(['hill']);

const textOf = (value: unknown): string => (typeof value === 'string' ? value : '');

interface FieldProps {
  algorithmId: string;
  name: string;
  schema: JsonSchema;
  copy: OptionCopy | undefined;
  value: FormValues[string] | undefined;
  error: string | undefined;
  onChange(value: FormValues[string]): void;
}

function OptionField({ algorithmId, name, schema, copy, value, error, onChange }: FieldProps) {
  const widget = resolveWidget(schema, copy);
  const label = copy?.label ?? (textOf(schema.title) || name);
  const help = copy?.help ?? (textOf(schema.description) || undefined);
  const shared = { label, ...(help ? { help } : {}), error: error ?? null };

  switch (widget.kind) {
    case 'integer':
      return <NumberStepper {...shared} value={textOf(value)} onChange={onChange} />;
    case 'pattern':
    case 'text':
    case 'secret':
      return (
        <TextField
          {...shared}
          secret={widget.kind === 'secret'}
          revealLabel={form.reveal}
          value={textOf(value)}
          onChange={(event) => onChange(event.target.value)}
        />
      );
    case 'matrix': {
      const matrix = Array.isArray(value) ? value : [];
      return (
        <MatrixEditor
          {...shared}
          value={matrix}
          min={widget.min}
          max={widget.max}
          onChange={onChange}
          feedback={MOD_26_MATRIX.has(algorithmId) ? matrixFeedback(matrix) : null}
        />
      );
    }
    case 'json': {
      // TextArea has no error slot of its own: the error takes the place of the help line.
      const note = error || help;
      return (
        <TextArea
          label={label}
          value={textOf(value)}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={error ? true : undefined}
          {...(note ? { note } : {})}
        />
      );
    }
  }
}

/** One input per option of the schema, in the schema's order. */
export function SchemaForm({
  algorithmId,
  schema,
  copy,
  values,
  onChange,
  errors,
}: {
  algorithmId: string;
  schema: OptionsSchema;
  copy?: Readonly<Record<string, OptionCopy>> | undefined;
  values: FormValues;
  onChange(values: FormValues): void;
  errors: Record<string, string>;
}) {
  const names = Object.keys(schema.properties);
  if (names.length === 0) return null;
  return (
    <div className="flex flex-col gap-4">
      {names.map((name) => (
        <OptionField
          key={name}
          algorithmId={algorithmId}
          name={name}
          schema={schema.properties[name] ?? {}}
          copy={copy?.[name]}
          value={values[name]}
          error={errors[name]}
          onChange={(value) => onChange({ ...values, [name]: value })}
        />
      ))}
    </div>
  );
}
