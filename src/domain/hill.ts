type Matrix = readonly (readonly number[])[];

const MODULUS = 26;

function minor(m: Matrix, column: number): number[][] {
  return m.slice(1).map((row) => row.filter((_, j) => j !== column));
}

type Combine = (sign: number, entry: number, minorDet: number) => number;

/** Laplace expansion along the first row. Hill keys are at most 6x6, so this stays cheap. */
function expand(m: Matrix, combine: Combine): number {
  const size = m.length;
  if (size === 0) return 1;
  const first = m[0] ?? [];
  if (size === 1) return first[0] ?? 0;
  let total = 0;
  for (let j = 0; j < size; j++) {
    const entry = first[j] ?? 0;
    if (entry === 0) continue;
    total += combine(j % 2 === 0 ? 1 : -1, entry, expand(minor(m, j), combine));
  }
  return total;
}

function mod(n: number): number {
  return ((n % MODULUS) + MODULUS) % MODULUS;
}

function gcd(a: number, b: number): number {
  return b === 0 ? Math.abs(a) : gcd(b, a % b);
}

export function determinant(m: Matrix): number {
  return expand(m, (sign, entry, minorDet) => sign * entry * minorDet);
}

/** The determinant mod 26, computed on reduced entries so it stays exact for any integer size. */
function residueOf(m: Matrix): number {
  const reduced = m.map((row) => row.map(mod));
  return mod(expand(reduced, (sign, entry, minorDet) => mod(sign * mod(entry * minorDet))));
}

export function hillKeyFeedback(m: Matrix): {
  determinant: number;
  residue: number;
  gcdWith26: number;
  invertible: boolean;
} {
  const size = m.length;
  if (size < 2 || m.some((row) => row.length !== size)) {
    // Not a Hill key: the backend only accepts square matrices from 2x2 up.
    return { determinant: 0, residue: 0, gcdWith26: MODULUS, invertible: false };
  }
  const residue = residueOf(m);
  const gcdWith26 = gcd(residue, MODULUS);
  return { determinant: determinant(m), residue, gcdWith26, invertible: gcdWith26 === 1 };
}
