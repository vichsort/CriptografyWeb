import { render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DateLine } from './DateLine';

describe('DateLine', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('DateLine renders the current date after mount', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 10, 9, 30));
    render(<DateLine />);
    expect(screen.getByText('Tuesday, November 10')).toBeInTheDocument();
  });

  it('the server render has no date, only a placeholder of the same line height', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 10, 9, 30));
    const html = renderToString(<DateLine />);
    expect(html).not.toMatch(/Tuesday|November/);
    expect(html).toContain('aria-hidden="true"');
  });

  it('a later visit shows the later date, not a baked one', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2027, 0, 1, 9, 30));
    render(<DateLine />);
    expect(screen.getByText('Friday, January 1')).toBeInTheDocument();
  });
});
