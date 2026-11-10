import { beforeAll, describe, expect, it } from 'vitest';
import { joinCatalog, type CatalogEntry } from '@/content';
import { getCatalog } from '@/data/api';
import { buildSearchIndex, normalizeText, searchEntries, type SearchIndex } from './search';

let entries: CatalogEntry[];
let index: SearchIndex;

beforeAll(async () => {
  entries = joinCatalog(await getCatalog());
  index = buildSearchIndex(entries);
});

const keys = (query: string) => searchEntries(index, query).map((e) => e.key);

describe('searchEntries', () => {
  it('"PASSWORD" finds AES', () => {
    expect(keys('PASSWORD')).toEqual(['aes-256-gcm']);
  });

  it('"vigenere" finds Vigenère', () => {
    expect(keys('vigenere')).toEqual(['vigenere']);
    expect(keys('Vigenère')).toEqual(['vigenere']);
  });

  it('"fingerprint" finds both SHAs', () => {
    expect(keys('fingerprint')).toEqual(['sha-256', 'sha-512']);
  });

  it('"  caesar " ignores surrounding spaces', () => {
    expect(keys('  caesar ')).toEqual(['caesar']);
  });

  it('"md5" finds nothing', () => {
    expect(keys('md5')).toEqual([]);
  });

  it('empty query returns everything in order', () => {
    expect(searchEntries(index, '')).toEqual(entries);
    expect(searchEntries(index, '   ')).toEqual(entries);
  });

  it('requires every word of a multi-word query', () => {
    expect(keys('linear algebra')).toEqual(['hill']);
    expect(keys('sha 512')).toEqual(['sha-512']);
  });

  it('matches the algorithm name behind an intent title', () => {
    expect(keys('aes-256')).toEqual(['aes-256-gcm']);
  });
});

describe('normalizeText', () => {
  it('lowercases, strips accents and collapses whitespace', () => {
    expect(normalizeText('  Vigenère\t\nÇifra  ')).toBe('vigenere cifra');
  });
});
