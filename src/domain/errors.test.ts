import { describe, expect, it } from 'vitest';
import { AppFailure, isAppFailure } from './errors';

describe('AppFailure', () => {
  it('carries its AppError', () => {
    const failure = new AppFailure({ kind: 'timeout' });
    expect(failure.error).toEqual({ kind: 'timeout' });
    expect(isAppFailure(failure)).toBe(true);
  });

  it('is not confused with a plain Error', () => {
    expect(isAppFailure(new Error('x'))).toBe(false);
  });
});
