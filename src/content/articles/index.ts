import type { JSX } from 'react';
import { EncodingIsNotEncryption } from './encoding-is-not-encryption';

export interface ArticleMeta {
  slug: string;
  title: string;
  summary: string;
  /** Reading time, rounded. */
  minutes: number;
}

/** Every article of the Learn section, in display order. Each slug is a static route. */
export const articles: readonly (ArticleMeta & { Body: () => JSX.Element })[] = [
  {
    slug: 'encoding-is-not-encryption',
    title: 'Encoding is not encryption',
    summary:
      'Base64 hides nothing. What encoding, encryption and hashing each do, and how to tell them apart.',
    minutes: 2,
    Body: EncodingIsNotEncryption,
  },
];
