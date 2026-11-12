import type { OptionCopy } from '@/content';
import type { JsonSchema } from '@/domain';

export type WidgetSpec =
  | { kind: 'integer' }
  | { kind: 'pattern'; pattern: string }
  | { kind: 'text' }
  | { kind: 'secret' }
  | { kind: 'matrix'; min: number; max: number }
  | { kind: 'json' };

const isObject = (value: unknown): value is JsonSchema =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const sizeOr = (value: unknown, fallback: number) =>
  typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : fallback;

/** A square matrix of integers: an array of arrays of integers. */
function isMatrix(schema: JsonSchema): boolean {
  if (schema.type !== 'array' || !isObject(schema.items)) return false;
  const row = schema.items;
  return row.type === 'array' && isObject(row.items) && row.items.type === 'integer';
}

/**
 * The input that edits one option. What the form cannot recognise gets a JSON field, so a new
 * backend option is still usable before the frontend learns about it.
 */
export function resolveWidget(schema: JsonSchema, copy?: OptionCopy): WidgetSpec {
  if (schema.type === 'integer') return { kind: 'integer' };
  if (schema.type === 'string') {
    if (copy?.secret) return { kind: 'secret' };
    if (typeof schema.pattern === 'string') return { kind: 'pattern', pattern: schema.pattern };
    return { kind: 'text' };
  }
  if (isMatrix(schema)) {
    const min = sizeOr(schema.minItems, 2);
    return { kind: 'matrix', min, max: Math.max(min, sizeOr(schema.maxItems, 6)) };
  }
  return { kind: 'json' };
}
