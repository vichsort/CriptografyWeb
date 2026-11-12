import { describe, expect, it } from 'vitest';
import type { OptionsSchema } from '@/domain';
import { initialValues, toOptions } from './to-options';

const schema = (
  properties: OptionsSchema['properties'],
  required: readonly string[] = Object.keys(properties),
): OptionsSchema => ({ type: 'object', properties, required, additionalProperties: false });

const caesar = schema({ shift: { type: 'integer' } });
const vigenere = schema({ key: { type: 'string', pattern: '^[A-Za-z]+$' } });
const aes = schema({ key: { type: 'string', minLength: 1 } });
const hill = schema({
  key: {
    type: 'array',
    minItems: 2,
    maxItems: 6,
    items: { type: 'array', minItems: 2, maxItems: 6, items: { type: 'integer' } },
  },
});

describe('initialValues', () => {
  it('starts integers and strings empty and a matrix as the 2×2 identity', () => {
    expect(initialValues(caesar)).toEqual({ shift: '' });
    expect(initialValues(aes)).toEqual({ key: '' });
    expect(initialValues(hill)).toEqual({
      key: [
        [1, 0],
        [0, 1],
      ],
    });
  });

  it('has no values for a schema without options', () => {
    expect(initialValues(schema({}))).toEqual({});
  });
});

describe('toOptions', () => {
  it('toOptions converts "3" to 3 and rejects "-"', () => {
    expect(toOptions(caesar, { shift: '3' })).toEqual({ options: { shift: 3 } });
    expect(toOptions(caesar, { shift: '-12' })).toEqual({ options: { shift: -12 } });
    expect(toOptions(caesar, { shift: '-' })).toEqual({
      errors: { shift: 'Enter a whole number, like 3 or -1.' },
    });
    expect(toOptions(caesar, { shift: '' })).toEqual({
      errors: { shift: 'Enter a whole number, like 3 or -1.' },
    });
  });

  it('does not trim a number, and rejects decimals', () => {
    expect(toOptions(caesar, { shift: ' 3' })).toHaveProperty('errors.shift');
    expect(toOptions(caesar, { shift: '1.5' })).toHaveProperty('errors.shift');
  });

  it('toOptions keeps " pass " for the AES key verbatim', () => {
    expect(toOptions(aes, { key: ' pass ' })).toEqual({ options: { key: ' pass ' } });
  });

  it('rejects an empty required string, and a pattern mismatch with its own message', () => {
    expect(toOptions(aes, { key: '' })).toEqual({ errors: { key: "This can't be empty." } });
    expect(toOptions(vigenere, { key: '' })).toEqual({ errors: { key: "This can't be empty." } });
    expect(toOptions(vigenere, { key: 'lem on' })).toEqual({
      errors: { key: 'Letters A–Z only, no spaces or accents.' },
    });
    expect(toOptions(vigenere, { key: 'Lemon' })).toEqual({ options: { key: 'Lemon' } });
  });

  it('sends a matrix as it is', () => {
    const key = [
      [3, 3],
      [2, 5],
    ];
    expect(toOptions(hill, { key })).toEqual({ options: { key } });
  });

  it('parses the JSON fallback and rejects text that is not JSON', () => {
    const flag = schema({ flag: { type: 'boolean' } });
    expect(toOptions(flag, { flag: 'true' })).toEqual({ options: { flag: true } });
    expect(toOptions(flag, { flag: 'yes' })).toEqual({ errors: { flag: 'Enter valid JSON.' } });
    expect(toOptions(flag, { flag: '"yes"' })).toHaveProperty('errors.flag');
  });

  it('leaves out an optional option left empty', () => {
    const optional = schema({ shift: { type: 'integer' }, flag: { type: 'boolean' } }, []);
    expect(toOptions(optional, { shift: '', flag: '' })).toEqual({ options: {} });
  });

  it('gives empty options for a schema without options', () => {
    expect(toOptions(schema({}), {})).toEqual({ options: {} });
  });
});
