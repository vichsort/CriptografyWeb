import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ArticleNotFound } from './ArticleNotFound';

describe('ArticleNotFound', () => {
  it('styles an unknown slug like the app, with a link back to the articles', () => {
    render(<ArticleNotFound />);
    expect(
      screen.getByRole('heading', { level: 1, name: 'Article not found' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'All articles' })).toHaveAttribute('href', '/learn');
  });
});
