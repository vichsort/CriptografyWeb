import type { Operation } from '@/domain';

export const operationCopy: Record<Operation, { label: string; gerund: string; verb: string }> = {
  encrypt: { label: 'Encrypt', gerund: 'Encrypting…', verb: 'encrypt' },
  decrypt: { label: 'Decrypt', gerund: 'Decrypting…', verb: 'decrypt' },
  hash: { label: 'Generate hash', gerund: 'Generating…', verb: 'generate the hash' },
  encode: { label: 'Encode', gerund: 'Encoding…', verb: 'encode' },
  decode: { label: 'Decode', gerund: 'Decoding…', verb: 'decode' },
};
