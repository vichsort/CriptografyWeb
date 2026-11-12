import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { About } from './About';

// The live status is an async Server Component, tested on its own.
vi.mock('./ApiStatus', () => ({ ApiStatus: () => <p>live status</p> }));

describe('About', () => {
  it('About lists every endpoint', () => {
    render(<About />);
    expect(screen.getByRole('heading', { level: 1, name: 'About the API' })).toBeInTheDocument();
    const contract = screen.getByRole('region', { name: 'Contract' });
    const rows = within(contract)
      .getAllByRole('row')
      .slice(1)
      .map((row) =>
        within(row)
          .getAllByRole('cell')
          .slice(0, 2)
          .map((cell) => cell.textContent)
          .join(' '),
      );
    expect(rows).toEqual([
      'GET /api/algorithms',
      'POST /api/encrypt',
      'POST /api/decrypt',
      'POST /api/hash',
      'POST /api/encode',
      'POST /api/decode',
      'GET /',
      'GET /up',
    ]);
  });

  it('has the description, the quality bar, the sources and the live status', () => {
    render(<About />);
    for (const name of ['What it is', 'Quality bar', 'Source', 'Live status']) {
      expect(screen.getByRole('region', { name })).toBeInTheDocument();
    }
    expect(screen.getByRole('link', { name: /vichsort\/Criptografy$/ })).toHaveAttribute(
      'href',
      'https://github.com/vichsort/Criptografy',
    );
    expect(screen.getByRole('link', { name: /vichsort\/CriptografyWeb/ })).toHaveAttribute(
      'href',
      'https://github.com/vichsort/CriptografyWeb',
    );
    expect(screen.getByText('live status')).toBeInTheDocument();
  });
});
