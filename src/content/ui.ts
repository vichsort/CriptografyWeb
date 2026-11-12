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
