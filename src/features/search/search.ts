import type { CatalogEntry } from '@/content';

/**
 * Lowercase, without diacritics, with whitespace collapsed. For search only: operation input is
 * never normalized.
 */
export function normalizeText(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export interface SearchIndex {
  entries: readonly CatalogEntry[];
  haystacks: readonly string[];
}

export function buildSearchIndex(entries: readonly CatalogEntry[]): SearchIndex {
  return {
    entries,
    haystacks: entries.map((e) =>
      normalizeText([e.title, e.subtitle, e.algorithm?.name ?? '', ...e.synonyms].join(' ')),
    ),
  };
}

/** Entries whose text contains every word of the query. An empty query returns them all. */
export function searchEntries(index: SearchIndex, query: string): CatalogEntry[] {
  const terms = normalizeText(query).split(' ').filter(Boolean);
  if (terms.length === 0) return [...index.entries];
  return index.entries.filter((_, i) => {
    const haystack = index.haystacks[i] ?? '';
    return terms.every((term) => haystack.includes(term));
  });
}
