import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ActivityIndicator } from './ActivityIndicator';

describe('ActivityIndicator', () => {
  it('renders 8 spokes', () => {
    render(<ActivityIndicator />);
    const indicator = screen.getByRole('progressbar');
    expect(indicator.querySelectorAll('[data-spoke]')).toHaveLength(8);
  });

  it('is labelled, with a neutral default', () => {
    const { rerender } = render(<ActivityIndicator />);
    expect(screen.getByRole('progressbar', { name: 'Loading' })).toBeInTheDocument();
    rerender(<ActivityIndicator label="Waking the server" />);
    expect(screen.getByRole('progressbar', { name: 'Waking the server' })).toBeInTheDocument();
  });

  it('is smaller at size sm', () => {
    const { rerender } = render(<ActivityIndicator size="md" />);
    const md = screen.getByRole('progressbar').style.width;
    rerender(<ActivityIndicator size="sm" />);
    expect(parseFloat(screen.getByRole('progressbar').style.width)).toBeLessThan(parseFloat(md));
  });
});
