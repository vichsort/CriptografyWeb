import { act, render, screen } from '@testing-library/react';
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

  it('keeps turning the day on every midnight while the page stays open', () => {
    vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] });
    vi.setSystemTime(new Date(2026, 10, 10, 9, 30));
    render(<DateLine />);
    act(() => vi.advanceTimersByTime(24 * 60 * 60 * 1000));
    expect(screen.getByText('Wednesday, November 11')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(24 * 60 * 60 * 1000));
    expect(screen.getByText('Thursday, November 12')).toBeInTheDocument();
  });

  it('checks the date again when the page becomes visible, since timers stall in sleep', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 10, 23, 0));
    render(<DateLine />);
    // The laptop slept through midnight; its timer has not fired.
    vi.setSystemTime(new Date(2026, 10, 11, 9, 0));
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(screen.getByText('Wednesday, November 11')).toBeInTheDocument();
  });
});
