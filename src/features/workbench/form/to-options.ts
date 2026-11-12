import { form } from '@/content';
import type { OptionsSchema } from '@/domain';
import { identityMatrix, parseWholeNumber } from '@/ui';
import { resolveWidget } from './resolve-widget';
import { validateOptions } from './validate';

/** What the inputs hold: text as typed, or a matrix of integers. */
export type FormValues = Record<string, string | number[][]>;

export function initialValues(schema: OptionsSchema): FormValues {
  const values: FormValues = {};
  for (const [key, property] of Object.entries(schema.properties)) {
    const widget = resolveWidget(property);
    values[key] = widget.kind === 'matrix' ? identityMatrix(widget.min) : '';
  }
  return values;
}

type Converted = { value: unknown } | { error: string } | { omit: true };

function convert(
  property: OptionsSchema['properties'][string],
  raw: unknown,
  required: boolean,
): Converted {
  const widget = resolveWidget(property);
  if (widget.kind === 'matrix') {
    return Array.isArray(raw) ? { value: raw } : { error: form.required };
  }
  // Strings are sent exactly as typed: a space in a password is part of the password.
  const text = typeof raw === 'string' ? raw : '';
  if (text === '' && !required) return { omit: true };
  switch (widget.kind) {
    case 'integer': {
      const n = parseWholeNumber(text);
      return n === null ? { error: form.wholeNumber } : { value: n };
    }
    case 'json':
      try {
        return { value: JSON.parse(text) as unknown };
      } catch {
        return { error: form.invalidJson };
      }
    default:
      return text === '' ? { error: form.required } : { value: text };
  }
}

/**
 * Turns the form into the options the API receives, or into one message per invalid field.
 * Fields are converted first; what converts is then checked against the schema.
 */
export function toOptions(
  schema: OptionsSchema,
  values: FormValues,
): { options: Record<string, unknown> } | { errors: Record<string, string> } {
  const options: Record<string, unknown> = {};
  const errors: Record<string, string> = {};
  for (const [key, property] of Object.entries(schema.properties)) {
    const result = convert(property, values[key], schema.required.includes(key));
    if ('error' in result) errors[key] = result.error;
    else if ('value' in result) options[key] = result.value;
  }
  const invalid = validateOptions(schema, options);
  for (const [key, message] of Object.entries(invalid)) errors[key] ??= message;
  return Object.keys(errors).length > 0 ? { errors } : { options };
}
