// Exact messages from the Criptografy API, captured from a local run. The non-UTF-8 one mirrors
// ../Criptografy/app/Cryptography/NonTextResultException.php and drives binaryResult detection.
export const messages = {
  nonTextResult:
    'The operation result is not valid UTF-8 text (it contains binary bytes) and cannot be represented in the JSON response.',
  hillNotInvertible:
    'The key matrix is not invertible modulo 26: det(K) = 2 and gcd(2, 26) != 1. Choose a matrix whose determinant is coprime with 26.',
  aesDecryptionFailed:
    'Decryption failed: wrong key or corrupted/tampered data (the GCM authentication tag does not match).',
  invalidBase64: 'The input is not a valid Base64 string.',
  invalidHex:
    'The input is not a valid hexadecimal string (it must contain only 0-9, a-f or A-F, with an even number of characters).',
  algorithmNotFound: 'Algorithm "nope" does not exist.',
} as const;
