import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { articles } from '@/content';
import { Article } from './Article';

describe('Article', () => {
  it('article page renders the body and its links', () => {
    render(<Article slug="encoding-is-not-encryption" />);
    expect(
      screen.getByRole('heading', { level: 1, name: 'Encoding is not encryption' }),
    ).toBeInTheDocument();
    expect(screen.getByText('2 min read')).toBeInTheDocument();
    for (const level2 of [
      'Encoding changes the form',
      'Encryption needs a key',
      'Hashing is one-way',
    ]) {
      expect(screen.getByRole('heading', { level: 2, name: level2 })).toBeInTheDocument();
    }
    expect(screen.getByRole('link', { name: /Base64/ })).toHaveAttribute(
      'href',
      '/algorithms/base64',
    );
    expect(screen.getByRole('link', { name: /AES-256-GCM/ })).toHaveAttribute(
      'href',
      '/algorithms/aes-256-gcm',
    );
  });

  it('unknown slug is not found', () => {
    let thrown: unknown;
    try {
      Article({ slug: 'nope' });
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toMatchObject({ digest: expect.stringContaining('404') });
  });

  it('keeps every article slug unique, since each one is a static route', () => {
    const slugs = articles.map((a) => a.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs.length).toBeGreaterThan(0);
  });
});
