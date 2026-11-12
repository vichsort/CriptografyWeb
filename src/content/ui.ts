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
  retry: 'Try again',
  shortcut: { apple: '⌘ Enter', other: 'Ctrl Enter' },
  notFound: {
    title: 'Algorithm not found',
    body: 'There is no algorithm at this address. It may have been renamed or removed.',
    link: 'See all algorithms',
  },
} as const;

/** The tool that hashes two texts and says whether they are the same. */
export const compareHash = {
  title: 'Compare two texts by hash',
  description:
    'Both texts are hashed with SHA-256. One changed character, even a trailing space, gives a completely different hash.',
  textA: 'Text A',
  textB: 'Text B',
  compare: 'Compare',
  comparing: 'Comparing…',
  same: 'Same text: the hashes match.',
  different: "Different texts: the hashes don't match.",
  hashOf: (label: 'A' | 'B') => `SHA-256 of ${label}`,
} as const;

/** The Learn section. */
export const learn = {
  title: 'Learn',
  description: 'Short reads on the ideas behind the tools.',
  minutes: (n: number) => `${n} min read`,
  back: 'All articles',
  notFound: {
    title: 'Article not found',
    body: 'There is no article at this address. It may have been renamed or removed.',
  },
} as const;

/** The page about the backend this app talks to. */
export const about = {
  title: 'About the API',
  description: 'Every operation here runs on a small public API, built for learning.',
  whatItIs: {
    title: 'What it is',
    body: 'An educational REST API built with Laravel 13 on PHP 8.3. It is stateless: nothing you send is stored. It encrypts, decrypts, hashes, encodes and decodes text, and describes each algorithm, options included, so this site can build its forms from it.',
  },
  contract: {
    title: 'Contract',
    headers: ['Method', 'Path', 'Body', 'Success'] as const,
    endpoints: [
      ['GET', '/api/algorithms', 'none', '{ "data": [metadata, …] }'],
      ['POST', '/api/encrypt', '{ algorithm, input, options }', '{ "result": "…" }'],
      ['POST', '/api/decrypt', '{ algorithm, input, options }', '{ "result": "…" }'],
      ['POST', '/api/hash', '{ algorithm, input }', '{ "result": "…" }'],
      ['POST', '/api/encode', '{ algorithm, input }', '{ "result": "…" }'],
      ['POST', '/api/decode', '{ algorithm, input }', '{ "result": "…" }'],
      ['GET', '/', 'none', '{ name, status, version }'],
      ['GET', '/up', 'none', 'health check for the host'],
    ] as const,
    note: 'Errors come back as 404, 405, 422 or 429 with a message written for people, or as a 500 if something breaks on the server. Input is used exactly as sent: spaces count.',
  },
  quality: {
    title: 'Quality bar',
    items: [
      '100% line coverage, enforced in CI.',
      'Mutation testing with Infection: at least 95% of mutants caught.',
      'PHPStan at level max over the whole codebase, tests included, with no baseline.',
    ],
  },
  source: {
    title: 'Source',
    links: [
      {
        label: 'API: github.com/vichsort/Criptografy',
        href: 'https://github.com/vichsort/Criptografy',
      },
      {
        label: 'This site: github.com/vichsort/CriptografyWeb',
        href: 'https://github.com/vichsort/CriptografyWeb',
      },
    ],
  },
  status: {
    title: 'Live status',
    checking: 'Checking…',
    name: 'Name',
    state: 'Status',
    version: 'Version',
    unavailable: 'Unavailable right now. The server may be asleep.',
  },
} as const;

/** Any address the app does not know. */
export const notFoundPage = {
  title: 'Page not found',
  body: 'There is nothing at this address.',
  link: 'Go to the home page',
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
