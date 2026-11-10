export type IconColor =
  | 'encryption-1'
  | 'encryption-2'
  | 'encryption-3'
  | 'encryption-4'
  | 'hashing-1'
  | 'hashing-2'
  | 'hashing-3'
  | 'encoding-1'
  | 'encoding-2'
  | 'neutral';

export interface OptionCopy {
  label?: string;
  help?: string;
  secret?: boolean;
}

export interface AlgorithmContent {
  intent: string;
  subtitle: string;
  glyph: string;
  color: IconColor;
  synonyms: readonly string[];
  description?: string;
  note?: string;
  options?: Readonly<Record<string, OptionCopy>>;
}

/** Presentation of each known algorithm. The order of the keys is the display order. */
export const algorithmContent: Readonly<Record<string, AlgorithmContent>> = {
  caesar: {
    intent: 'Shift letters',
    subtitle: 'Caesar',
    glyph: 'Cs',
    color: 'encryption-1',
    synonyms: ['shift', 'rot', 'rotate', 'classic', 'julius'],
    options: {
      shift: {
        label: 'Shift',
        help: 'How many positions each letter moves. Any integer works; only its value mod 26 matters.',
      },
    },
  },
  vigenere: {
    intent: 'Use a keyword',
    subtitle: 'Vigenère',
    glyph: 'Vg',
    color: 'encryption-2',
    synonyms: ['keyword', 'polyalphabetic', 'classic'],
    options: { key: { label: 'Keyword', help: "Letters A–Z only. Case doesn't matter." } },
  },
  hill: {
    intent: 'Encrypt with a matrix',
    subtitle: 'Hill',
    glyph: 'Hl',
    color: 'encryption-3',
    synonyms: ['matrix', 'linear algebra', 'block', 'classic'],
    note: 'Hill works on uppercase letters only: spaces, punctuation and accents are removed, and the last block is padded with X. Decrypting returns the normalized text, not the original.',
    options: {
      key: {
        label: 'Key matrix',
        help: 'Square, from 2×2 to 6×6. Its determinant must be coprime with 26 so the matrix can be inverted.',
      },
    },
  },
  'aes-256-gcm': {
    intent: 'Protect it with a password',
    subtitle: 'AES-256-GCM',
    glyph: 'AE',
    color: 'encryption-4',
    synonyms: ['password', 'secure', 'protect', 'aes', 'gcm', 'modern'],
    note: "The output changes on every run because a random nonce is included. That's expected, and it's part of what makes it secure.",
    options: {
      key: {
        label: 'Password',
        help: 'Any non-empty text. It is never saved in this browser.',
        secret: true,
      },
    },
  },
  'sha-256': {
    intent: 'Generate a SHA-256',
    subtitle: '64 hex characters',
    glyph: '#2',
    color: 'hashing-1',
    synonyms: ['fingerprint', 'digest', 'checksum', 'integrity'],
  },
  'sha-512': {
    intent: 'Generate a SHA-512',
    subtitle: '128 hex characters',
    glyph: '#5',
    color: 'hashing-2',
    synonyms: ['fingerprint', 'digest', 'checksum', 'integrity'],
  },
  base64: {
    intent: 'Read or write Base64',
    subtitle: 'Base64',
    glyph: '64',
    color: 'encoding-1',
    synonyms: ['b64'],
  },
  hex: {
    intent: 'See the bytes in hex',
    subtitle: 'Hex',
    glyph: '0x',
    color: 'encoding-2',
    synonyms: ['hexadecimal', 'bytes'],
    note: 'To decode, use an even number of 0–9 and a–f characters (uppercase works too).',
  },
};
