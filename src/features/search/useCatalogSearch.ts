'use client';

import { useMemo } from 'react';
import { joinCatalog, type CatalogEntry } from '@/content';
import { useCatalog } from '@/data/cache';
import { FAMILIES, type Family } from '@/domain';
import { buildSearchIndex, normalizeText, searchEntries } from './search';

export interface FamilyGroup {
  family: Family;
  entries: readonly CatalogEntry[];
}

/** Entries by family, in display order. Families without entries are left out. */
export function groupByFamily(entries: readonly CatalogEntry[]): FamilyGroup[] {
  return FAMILIES.map((family) => ({
    family,
    entries: entries.filter((e) => e.family === family),
  })).filter((group) => group.entries.length > 0);
}

export interface CatalogSearch {
  /** Every entry of the joined catalog; empty until it loads. */
  entries: readonly CatalogEntry[];
  /** The entries matching the query; all of them while it is blank. */
  matches: readonly CatalogEntry[];
  /** The matches by family. */
  groups: readonly FamilyGroup[];
  /** The query has something to search for. */
  searching: boolean;
}

/** The catalog joined with the content layer, searched and grouped: what every list shows. */
export function useCatalogSearch(query: string): CatalogSearch {
  const { data } = useCatalog();
  const entries = useMemo(() => joinCatalog(data ?? []), [data]);
  const index = useMemo(() => buildSearchIndex(entries), [entries]);
  return useMemo(() => {
    const matches = searchEntries(index, query);
    return {
      entries,
      matches,
      groups: groupByFamily(matches),
      searching: normalizeText(query) !== '',
    };
  }, [entries, index, query]);
}
