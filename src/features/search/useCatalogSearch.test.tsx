import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeAll, describe, expect, it } from 'vitest';
import type { CatalogEntry } from '@/content';
import { createQueryClient } from '@/data/cache';
import { fixtureEntries } from '@/test/catalog-entries';
import { groupByFamily, useCatalogSearch } from './useCatalogSearch';

let entries: CatalogEntry[] = [];
beforeAll(async () => {
  entries = await fixtureEntries();
});

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={createQueryClient()}>{children}</QueryClientProvider>;
}

describe('groupByFamily', () => {
  it('groups entries by family in display order and drops empty families', () => {
    const groups = groupByFamily(entries.filter((e) => e.family !== 'hashing'));
    expect(groups.map((g) => g.family)).toEqual(['encryption', 'encoding']);
    expect(groups[0]?.entries.map((e) => e.key)).toEqual([
      'caesar',
      'vigenere',
      'hill',
      'aes-256-gcm',
    ]);
  });
});

describe('useCatalogSearch', () => {
  it('returns every entry, grouped, while the query is blank', async () => {
    const { result } = renderHook(() => useCatalogSearch('   '), { wrapper });
    await waitFor(() => expect(result.current.entries).toHaveLength(entries.length));
    expect(result.current.searching).toBe(false);
    expect(result.current.matches).toHaveLength(entries.length);
    expect(result.current.groups.map((g) => g.family)).toEqual([
      'encryption',
      'hashing',
      'encoding',
    ]);
  });

  it('filters and groups the matches of a query', async () => {
    const { result } = renderHook(() => useCatalogSearch('sha'), { wrapper });
    await waitFor(() => expect(result.current.matches).toHaveLength(3));
    expect(result.current.searching).toBe(true);
    expect(result.current.groups.map((g) => g.family)).toEqual(['hashing']);
  });
});
