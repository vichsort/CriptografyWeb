import { describe, expect, it } from 'vitest';
import { determinant, hillKeyFeedback } from './hill';

describe('hillKeyFeedback', () => {
  it('accepts a matrix whose determinant is coprime with 26', () => {
    expect(
      hillKeyFeedback([
        [3, 3],
        [2, 5],
      ]),
    ).toEqual({
      determinant: 9,
      residue: 9,
      gcdWith26: 1,
      invertible: true,
    });
  });

  it('rejects a matrix whose determinant shares a factor with 26', () => {
    expect(
      hillKeyFeedback([
        [2, 4],
        [1, 3],
      ]),
    ).toEqual({
      determinant: 2,
      residue: 2,
      gcdWith26: 2,
      invertible: false,
    });
  });

  it('handles a 3x3 matrix', () => {
    const feedback = hillKeyFeedback([
      [6, 24, 1],
      [13, 16, 10],
      [20, 17, 15],
    ]);
    expect(feedback.determinant).toBe(441);
    expect(feedback.invertible).toBe(true);
  });

  it('takes the positive residue of a negative determinant', () => {
    expect(
      hillKeyFeedback([
        [1, 2],
        [3, 4],
      ]),
    ).toEqual({
      determinant: -2,
      residue: 24,
      gcdWith26: 2,
      invertible: false,
    });
  });

  it('keeps the residue exact when the determinant exceeds the safe integer range', () => {
    const big = 2 ** 52 + 1;
    const exact = hillKeyFeedback([
      [big % 26, 3],
      [2, 5],
    ]);
    expect(
      hillKeyFeedback([
        [big, 3],
        [2, 5],
      ]).residue,
    ).toBe(exact.residue);
    expect(
      hillKeyFeedback([
        [big, big],
        [big, 7],
      ]).residue,
    ).toBe(
      hillKeyFeedback([
        [big % 26, big % 26],
        [big % 26, 7],
      ]).residue,
    );
  });
});

describe('hillKeyFeedback with a malformed matrix', () => {
  it.each([
    ['empty', []],
    ['1x1', [[3]]],
    [
      'non-square',
      [
        [1, 0, 5],
        [0, 1, 7],
      ],
    ],
    ['ragged', [[1, 2], [3]]],
  ])('never reports a %s matrix as invertible', (_, m) => {
    expect(hillKeyFeedback(m).invertible).toBe(false);
  });
});

describe('determinant', () => {
  it('expands a 6x6 matrix', () => {
    const identity = Array.from({ length: 6 }, (_, i) =>
      Array.from({ length: 6 }, (_, j) => (i === j ? 2 : 0)),
    );
    expect(determinant(identity)).toBe(64);
  });
});
