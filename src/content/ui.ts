import type { SecurityLevel } from '@/domain';

export const site = {
  name: 'Criptografy',
  description:
    'Try out cryptography in your browser: classical ciphers, modern encryption, hashes and encodings.',
} as const;

export const ui = {
  homeTitle: 'What are we doing today?',
  searchPlaceholder: 'Search: "password", "hash", "base64", "Caesar"…',
  sidebarSearchPlaceholder: 'Search',
  waking: {
    title: 'Waking up the server…',
    body: 'The free server sleeps when nobody uses it. The first operation can take up to a minute; the next ones are fast.',
  },
} as const;

export const securityLevelCopy: Record<SecurityLevel, string> = {
  educational: 'educational',
  modern: 'modern',
  'not-applicable': 'not applicable',
};
