import { render, screen, within } from '@testing-library/react';
import { beforeAll, describe, expect, it } from 'vitest';
import type { CatalogEntry } from '@/content';
import { fixtureEntries } from '@/test/catalog-entries';
import { FamilyCards } from './FamilyCards';

let entries: CatalogEntry[] = [];
beforeAll(async () => {
  entries = await fixtureEntries();
});

describe('FamilyCards', () => {
  it('cards render rows with intent title, subtitle and link to /algorithms/<id>', () => {
    render(<FamilyCards entries={entries} />);
    const encrypt = screen.getByRole('region', { name: 'Encrypt' });
    expect(within(encrypt).getByRole('heading', { name: 'Encrypt' })).toBeInTheDocument();
    expect(within(encrypt).getByText('encrypt · decrypt')).toBeInTheDocument();
    expect(within(encrypt).getByText('Hide a message with a key.')).toBeInTheDocument();

    const caesar = within(encrypt).getByRole('link', { name: /Shift letters/ });
    expect(caesar).toHaveAttribute('href', '/algorithms/caesar');
    expect(caesar).toHaveTextContent('Caesar');
    expect(within(encrypt).getAllByRole('link')).toHaveLength(4);
  });

  it('extras link to their routes', () => {
    render(<FamilyCards entries={entries} />);
    expect(screen.getByRole('link', { name: /Compare two texts by hash/ })).toHaveAttribute(
      'href',
      '/tools/compare-hash',
    );
    expect(screen.getByRole('link', { name: /Encoding is not encryption/ })).toHaveAttribute(
      'href',
      '/learn/encoding-is-not-encryption',
    );
  });

  it('shows only the families that have entries', () => {
    render(<FamilyCards entries={entries.filter((e) => e.key === 'base64')} />);
    expect(screen.getByRole('region', { name: 'Encode' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Encrypt' })).toBeNull();
    expect(screen.queryByRole('region', { name: 'Hash' })).toBeNull();
  });
});
