import type { Family } from '@/domain';
import type { IconColor } from './algorithms';

/** Frontend-only entries, listed next to the algorithms of their family. */
export interface ExtraContent {
  key: string;
  family: Family;
  title: string;
  subtitle: string;
  glyph: string;
  color: IconColor;
  href: string;
  synonyms: readonly string[];
  /** Shown only when this algorithm is in the catalog; `null` means always. */
  requires: string | null;
}

export const extras: readonly ExtraContent[] = [
  {
    key: 'compare-hash',
    family: 'hashing',
    title: 'Compare two texts by hash',
    subtitle: 'SHA-256 on both sides',
    glyph: '=',
    color: 'hashing-3',
    href: '/tools/compare-hash',
    synonyms: ['compare', 'equal', 'match', 'verify'],
    requires: 'sha-256',
  },
  {
    key: 'encoding-is-not-encryption',
    family: 'encoding',
    title: 'Encoding is not encryption',
    subtitle: '2-minute read',
    glyph: '?',
    color: 'neutral',
    href: '/learn/encoding-is-not-encryption',
    synonyms: ['learn', 'article', 'difference'],
    requires: null,
  },
];
