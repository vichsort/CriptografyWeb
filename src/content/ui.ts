import type { SecurityLevel } from '@/domain';

/** "a", "a and b", "a, b and c". */
function listOf(items: readonly string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`;
}

export const site = {
  name: 'Criptografy',
  description:
    'Try out cryptography in your browser: classical ciphers, modern encryption, hashes and encodings.',
} as const;

export const ui = {
  homeTitle: 'What are we doing today?',
  algorithmsTitle: 'Algorithms',
  resultsCount: (count: number, query: string) =>
    `${count} ${count === 1 ? 'option' : 'options'} for “${query}”`,
  noResults: (query: string, names: readonly string[]) =>
    `Nothing for “${query}” yet. The available algorithms are ${listOf(names)}.`,
  searchPlaceholder: 'Search: "password", "hash", "base64", "Caesar"…',
  sidebarSearchPlaceholder: 'Search',
  waking: {
    title: 'Waking up the server…',
    body: 'The free server sleeps when nobody uses it. The first operation can take up to a minute; the next ones are fast.',
  },
} as const;

/** The options form of the workbench. */
export const form = {
  wholeNumber: 'Enter a whole number, like 3 or -1.',
  lettersOnly: 'Letters A–Z only, no spaces or accents.',
  required: "This can't be empty.",
  invalidJson: 'Enter valid JSON.',
  mismatch: "This doesn't match the expected format.",
  reveal: 'Show',
  matrixFeedback: (determinant: number, residue: number, gcd: number) =>
    `det(K) = ${determinant} · gcd(${residue}, 26) = ${gcd}${gcd === 1 ? ' ✓ invertible' : ''}`,
} as const;

const characters = (n: number) => `${n} ${n === 1 ? 'character' : 'characters'}`;

/** The algorithm screen. */
export const workbench = {
  modeLabel: 'Mode',
  options: 'Options',
  input: 'Input',
  inputHint: 'spaces count',
  characters,
  result: 'Result',
  resultReady: (n: number) => `Result ready, ${characters(n)}.`,
  keyRequired: 'Key required',
  copy: 'Copy',
  copied: 'Copied ✓',
  useAsInput: 'Use as input',
  shortcut: { apple: '⌘ Enter', other: 'Ctrl Enter' },
  notFound: {
    title: 'Algorithm not found',
    body: 'There is no algorithm at this address. It may have been renamed or removed.',
    link: 'See all algorithms',
  },
} as const;

/** The fixed header, the sidebar frame and the mobile menu. */
export const shell = {
  nav: [
    { label: 'Algorithms', href: '/algorithms' },
    { label: 'Learn', href: '/learn' },
    { label: 'About the API', href: '/about' },
  ],
  brandMark: 'C',
  navLabel: 'Main',
  sidebarLabel: 'Sidebar',
  showSidebar: 'Show sidebar',
  hideSidebar: 'Hide sidebar',
  openMenu: 'Open menu',
  closeMenu: 'Close menu',
  menuLabel: 'Menu',
  home: 'Home',
  noMatches: (query: string) => `Nothing for “${query}”.`,
  theme: { light: 'Light', dark: 'Dark', useSystem: 'Use system setting' },
} as const;

export const securityLevelCopy: Record<SecurityLevel, string> = {
  educational: 'educational',
  modern: 'modern',
  'not-applicable': 'not applicable',
};
