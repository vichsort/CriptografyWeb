import type { Operation } from './algorithm';

// Same input, same output. AES encryption is missing on purpose: its random nonce makes every
// run different. Anything not listed, including algorithms the frontend does not know yet, is
// treated as not deterministic, so it is never memoized.
const DETERMINISTIC = new Set<string>([
  'caesar:encrypt',
  'caesar:decrypt',
  'vigenere:encrypt',
  'vigenere:decrypt',
  'hill:encrypt',
  'hill:decrypt',
  'aes-256-gcm:decrypt',
  'sha-256:hash',
  'sha-512:hash',
  'base64:encode',
  'base64:decode',
  'hex:encode',
  'hex:decode',
]);

export function isDeterministic(algorithmId: string, op: Operation): boolean {
  return DETERMINISTIC.has(`${algorithmId}:${op}`);
}
