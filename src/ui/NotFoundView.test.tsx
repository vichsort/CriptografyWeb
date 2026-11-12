import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { NotFoundView } from './NotFoundView';

describe('NotFoundView', () => {
  it('shows a title, an explanation and a way back', () => {
    render(<NotFoundView title="Gone" body="Nothing here." linkLabel="Go home" href="/" />);
    expect(screen.getByRole('heading', { level: 1, name: 'Gone' })).toBeInTheDocument();
    expect(screen.getByText('Nothing here.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go home' })).toHaveAttribute('href', '/');
  });
});
