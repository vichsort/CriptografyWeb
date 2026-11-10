import type { Family } from '@/domain';

export interface FamilyContent {
  title: string;
  hint: string;
  description: string;
}

export const familyContent: Record<Family, FamilyContent> = {
  encryption: {
    title: 'Encrypt',
    hint: 'encrypt · decrypt',
    description: 'Hide a message with a key.',
  },
  hashing: { title: 'Hash', hint: 'hash', description: 'Fingerprint a text.' },
  encoding: {
    title: 'Encode',
    hint: 'encode · decode',
    description: 'Change the form, no secret involved.',
  },
};
