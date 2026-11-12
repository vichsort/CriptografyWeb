import { describe, expect, it } from 'vitest';
import type { OptionsSchema } from '@/domain';
import { FORM_ERROR, validateOptions } from './validate';

const schema = (properties: OptionsSchema['properties']): OptionsSchema => ({
  type: 'object',
  properties,
  required: Object.keys(properties),
  additionalProperties: false,
});

describe('validateOptions', () => {
  it('validateOptions reports a missing required key with an English message', () => {
    expect(validateOptions(schema({ shift: { type: 'integer' } }), {})).toEqual({
      shift: "This can't be empty.",
    });
  });

  it('accepts options that match', () => {
    expect(validateOptions(schema({ shift: { type: 'integer' } }), { shift: 3 })).toEqual({});
  });

  it('names the option a nested error belongs to', () => {
    const hill = schema({
      key: {
        type: 'array',
        minItems: 2,
        items: { type: 'array', minItems: 2, items: { type: 'integer' } },
      },
    });
    const errors = validateOptions(hill, { key: [[1, 2], [3]] });
    expect(Object.keys(errors)).toEqual(['key']);
    expect(errors.key).toMatch(/^[A-Z].*\.$/);
  });

  it('uses the form messages for types, patterns and empty strings', () => {
    expect(validateOptions(schema({ shift: { type: 'integer' } }), { shift: 1.5 })).toEqual({
      shift: 'Enter a whole number, like 3 or -1.',
    });
    expect(
      validateOptions(schema({ key: { type: 'string', pattern: '^[A-Za-z]+$' } }), { key: 'a b' }),
    ).toEqual({ key: 'Letters A–Z only, no spaces or accents.' });
    expect(
      validateOptions(schema({ key: { type: 'string', minLength: 1 } }), { key: '' }),
    ).toEqual({ key: "This can't be empty." });
  });

  it('keeps an error that names no option, under the form-level key', () => {
    const atLeastOne: OptionsSchema = {
      type: 'object',
      properties: { shift: { type: 'integer' } },
      required: [],
      additionalProperties: false,
      minProperties: 1,
    } as OptionsSchema;
    const errors = validateOptions(atLeastOne, {});
    expect(Object.keys(errors)).toEqual([FORM_ERROR]);
    expect(errors[FORM_ERROR]).toMatch(/^[A-Z].*\.$/);
  });

  it('gives the same answer when the same schema arrives as a new object', () => {
    const first = schema({ shift: { type: 'integer' } });
    const second = structuredClone(first);
    expect(validateOptions(first, {})).toEqual(validateOptions(second, {}));
  });
});
