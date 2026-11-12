const WHOLE = /^-?\d+$/;

/** A whole number exactly as typed (no spaces, no decimals), or null; too long to keep exact is null. */
export function parseWholeNumber(text: string): number | null {
  if (!WHOLE.test(text)) return null;
  const n = Number(text);
  return Number.isSafeInteger(n) ? n : null;
}

/** The n×n identity matrix. */
export function identityMatrix(n: number): number[][] {
  return Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => (r === c ? 1 : 0)));
}
