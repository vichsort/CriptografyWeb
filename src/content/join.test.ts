import { describe, expect, expectTypeOf, it } from 'vitest';
import type { Algorithm, Family } from '@/domain';
import type { IconColorToken } from '@/ui';
import type { IconColor } from './algorithms';
import { joinCatalog } from './join';

function algorithm(id: string, family: Family, extra: Partial<Algorithm> = {}): Algorithm {
  return {
    id,
    name: id.toUpperCase(),
    family,
    description: `${id} description.`,
    operations: [],
    requiresKey: false,
    securityLevel: 'educational',
    optionsSchema: { type: 'object', properties: {}, required: [], additionalProperties: false },
    ...extra,
  };
}

const catalog: Algorithm[] = [
  algorithm('hex', 'encoding'),
  algorithm('sha-512', 'hashing'),
  algorithm('aes-256-gcm', 'encryption'),
  algorithm('base64', 'encoding'),
  algorithm('caesar', 'encryption'),
  algorithm('sha-256', 'hashing'),
  algorithm('hill', 'encryption'),
  algorithm('vigenere', 'encryption'),
];

const keys = (entries: { key: string }[]) => entries.map((e) => e.key);

describe('joinCatalog', () => {
  it('orders by family then content order', () => {
    expect(keys(joinCatalog(catalog))).toEqual([
      'caesar',
      'vigenere',
      'hill',
      'aes-256-gcm',
      'sha-256',
      'sha-512',
      'compare-hash',
      'base64',
      'hex',
      'encoding-is-not-encryption',
    ]);
  });

  it('presents a known algorithm with its content', () => {
    const caesar = joinCatalog(catalog).find((e) => e.key === 'caesar');
    expect(caesar).toMatchObject({
      family: 'encryption',
      title: 'Shift letters',
      subtitle: 'Caesar',
      glyph: 'Cs',
      color: 'encryption-1',
      href: '/algorithms/caesar',
      algorithm: { id: 'caesar' },
    });
    expect(caesar?.synonyms).toContain('julius');
  });

  it('appends extras per family when available', () => {
    const withoutSha256 = catalog.filter((a) => a.id !== 'sha-256');
    const entries = joinCatalog(withoutSha256);
    expect(keys(entries)).not.toContain('compare-hash');
    expect(entries.at(-1)).toMatchObject({
      key: 'encoding-is-not-encryption',
      family: 'encoding',
      href: '/learn/encoding-is-not-encryption',
      algorithm: null,
    });
    expect(joinCatalog(catalog).find((e) => e.key === 'compare-hash')).toMatchObject({
      family: 'hashing',
      href: '/tools/compare-hash',
      algorithm: null,
    });
  });

  it('unknown catalog id gets generic presentation', () => {
    const rot13 = algorithm('rot13', 'encryption', {
      name: 'Rot13',
      description: 'Rotates letters by 13. Its own inverse.',
    });
    const entries = joinCatalog([...catalog, rot13]);
    expect(keys(entries).indexOf('rot13')).toBe(keys(entries).indexOf('aes-256-gcm') + 1);
    expect(entries.find((e) => e.key === 'rot13')).toEqual({
      key: 'rot13',
      family: 'encryption',
      title: 'Rot13',
      subtitle: 'Rotates letters by 13.',
      glyph: 'Ro',
      color: 'neutral',
      href: '/algorithms/rot13',
      synonyms: [],
      algorithm: rot13,
    });
  });

  it('content entry without catalog id is hidden', () => {
    expect(keys(joinCatalog([algorithm('caesar', 'encryption')]))).toEqual([
      'caesar',
      'encoding-is-not-encryption',
    ]);
  });
});

describe('IconColor', () => {
  it('is the same union as the ui IconColorToken (ui may not import content)', () => {
    expectTypeOf<IconColor>().toEqualTypeOf<IconColorToken>();
  });
});
