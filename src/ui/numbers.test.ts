import { describe, expect, it } from 'vitest';
import { identityMatrix, parseWholeNumber } from './numbers';

describe('parseWholeNumber', () => {
  it('reads whole numbers, signed, exactly as typed', () => {
    expect(parseWholeNumber('3')).toBe(3);
    expect(parseWholeNumber('-12')).toBe(-12);
  });

  it('rejects drafts, spaces, decimals and numbers too long to keep exact', () => {
    for (const text of ['', '-', ' 3', '3 ', '1.5', '1e3', '99999999999999999999']) {
      expect(parseWholeNumber(text)).toBeNull();
    }
  });
});

describe('identityMatrix', () => {
  it('builds the n×n identity', () => {
    expect(identityMatrix(3)).toEqual([
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ]);
  });
});
