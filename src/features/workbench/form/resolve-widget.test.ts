import { describe, expect, it } from 'vitest';
import { resolveWidget } from './resolve-widget';

const matrixSchema = {
  type: 'array',
  minItems: 2,
  maxItems: 6,
  items: { type: 'array', minItems: 2, maxItems: 6, items: { type: 'integer' } },
};

describe('resolveWidget', () => {
  it('resolves an integer to a number field', () => {
    expect(resolveWidget({ type: 'integer' })).toEqual({ kind: 'integer' });
  });

  it('resolves a string with a pattern to a pattern field', () => {
    expect(resolveWidget({ type: 'string', pattern: '^[A-Za-z]+$' })).toEqual({
      kind: 'pattern',
      pattern: '^[A-Za-z]+$',
    });
  });

  it('resolves a plain string to a text field', () => {
    expect(resolveWidget({ type: 'string', minLength: 1 })).toEqual({ kind: 'text' });
  });

  it('resolves a string marked secret by the copy to a secret field', () => {
    expect(resolveWidget({ type: 'string', minLength: 1 }, { secret: true })).toEqual({
      kind: 'secret',
    });
  });

  it('resolves an array of arrays of integers to a matrix with its size bounds', () => {
    expect(resolveWidget(matrixSchema)).toEqual({ kind: 'matrix', min: 2, max: 6 });
    expect(resolveWidget({ ...matrixSchema, minItems: 3, maxItems: 4 })).toEqual({
      kind: 'matrix',
      min: 3,
      max: 4,
    });
  });

  it('unknown schema resolves to json widget', () => {
    expect(resolveWidget({ type: 'boolean' })).toEqual({ kind: 'json' });
    expect(resolveWidget({ type: 'array', items: { type: 'string' } })).toEqual({ kind: 'json' });
    expect(resolveWidget({})).toEqual({ kind: 'json' });
  });
});
