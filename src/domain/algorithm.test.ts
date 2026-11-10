import { describe, expect, it } from 'vitest';
import { endpointFor, FAMILIES, operationsFor } from './algorithm';

const flags = { supportsEncryption: false, supportsDecryption: false, supportsHashing: false };

describe('operationsFor', () => {
  it('gives encrypt and decrypt to an encryption algorithm with both flags', () => {
    expect(
      operationsFor({
        ...flags,
        category: 'encryption',
        supportsEncryption: true,
        supportsDecryption: true,
      }),
    ).toEqual(['encrypt', 'decrypt']);
  });

  it('drops decrypt when the algorithm does not support it', () => {
    expect(operationsFor({ ...flags, category: 'encryption', supportsEncryption: true })).toEqual([
      'encrypt',
    ]);
  });

  it('gives hash to a hashing algorithm', () => {
    expect(operationsFor({ ...flags, category: 'hashing', supportsHashing: true })).toEqual([
      'hash',
    ]);
  });

  it('gives encode and decode to an encoding algorithm, whose flags are all false', () => {
    expect(operationsFor({ ...flags, category: 'encoding' })).toEqual(['encode', 'decode']);
  });
});

describe('endpointFor', () => {
  it('maps an operation to its endpoint', () => {
    expect(endpointFor('decode')).toBe('/api/decode');
  });
});

describe('FAMILIES', () => {
  it('lists the families in display order', () => {
    expect(FAMILIES).toEqual(['encryption', 'hashing', 'encoding']);
  });
});
