import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ArticleList } from './ArticleList';

describe('ArticleList', () => {
  it('list shows the article with title, summary and minutes', () => {
    render(<ArticleList />);
    expect(screen.getByRole('heading', { level: 1, name: 'Learn' })).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /Encoding is not encryption/ });
    expect(link).toHaveAttribute('href', '/learn/encoding-is-not-encryption');
    expect(within(link).getByText('2 min read')).toBeInTheDocument();
    expect(within(link).getByText(/Base64 hides nothing/)).toBeInTheDocument();
  });
});
