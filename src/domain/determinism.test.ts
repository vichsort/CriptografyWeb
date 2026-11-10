import { describe, expect, it } from 'vitest';
import type { Operation } from './algorithm';
import { isDeterministic } from './determinism';

const deterministic: [string, Operation][] = [
  ['caesar', 'encrypt'],
  ['caesar', 'decrypt'],
  ['vigenere', 'encrypt'],
  ['vigenere', 'decrypt'],
  ['hill', 'encrypt'],
  ['hill', 'decrypt'],
  ['sha-256', 'hash'],
  ['sha-512', 'hash'],
  ['base64', 'encode'],
  ['base64', 'decode'],
  ['hex', 'encode'],
  ['hex', 'decode'],
  ['aes-256-gcm', 'decrypt'],
];

describe('isDeterministic', () => {
  it.each(deterministic)('is true for %s %s', (id, op) => {
    expect(isDeterministic(id, op)).toBe(true);
  });

  it('is false for AES encryption, which uses a random nonce', () => {
    expect(isDeterministic('aes-256-gcm', 'encrypt')).toBe(false);
  });

  it('is false for an unknown algorithm', () => {
    expect(isDeterministic('rot13', 'encrypt')).toBe(false);
  });
});
