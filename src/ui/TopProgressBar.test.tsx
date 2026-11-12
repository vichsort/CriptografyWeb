import { act, render } from '@testing-library/react';
import { Profiler } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const reduced = vi.hoisted(() => ({ value: false }));
vi.mock('./motion', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./motion')>()),
  useReducedMotionSafe: () => reduced.value,
}));

const { TopProgressBar } = await import('./TopProgressBar');

beforeEach(() => {
  vi.useFakeTimers({
    toFake: [
      'setTimeout',
      'clearTimeout',
      'requestAnimationFrame',
      'cancelAnimationFrame',
      'performance',
    ],
  });
});

afterEach(() => {
  vi.useRealTimers();
  reduced.value = false;
});

const bar = (container: HTMLElement) => container.querySelector<HTMLElement>('[data-progress-bar]');

describe('TopProgressBar', () => {
  it('renders nothing visible when inactive', () => {
    const { container } = render(<TopProgressBar active={false} />);
    expect(bar(container)).toBeNull();
  });

  it('appears only after the show delay, then trickles', () => {
    const { container } = render(<TopProgressBar active />);
    act(() => vi.advanceTimersByTime(100));
    expect(bar(container)).toBeNull();
    act(() => vi.advanceTimersByTime(100));
    const shown = bar(container);
    expect(shown).not.toBeNull();
    act(() => vi.advanceTimersByTime(200));
    expect(shown?.style.transform).toMatch(/scaleX\(0\.\d+\)/);
  });

  it('leaves the trickle to the frames, transitioning the transform only to complete', () => {
    // A transition restarted on every frame lags far behind the value it chases.
    const { container, rerender } = render(<TopProgressBar active />);
    act(() => vi.advanceTimersByTime(500));
    expect(bar(container)?.style.transition).not.toMatch(/transform/);
    rerender(<TopProgressBar active={false} />);
    expect(bar(container)?.style.transition).toMatch(/transform/);
  });

  it('completes and fades out when it stops', () => {
    const { container, rerender } = render(<TopProgressBar active />);
    act(() => vi.advanceTimersByTime(500));
    rerender(<TopProgressBar active={false} />);
    expect(bar(container)?.style.transform).toBe('scaleX(1)');
    expect(bar(container)).toHaveClass('opacity-0');
    act(() => vi.advanceTimersByTime(1000));
    expect(bar(container)).toBeNull();
  });

  it('a request starting while the bar fades draws a new bar from the bottom', () => {
    const { container, rerender } = render(<TopProgressBar active />);
    act(() => vi.advanceTimersByTime(500));
    rerender(<TopProgressBar active={false} />);
    const fading = bar(container);
    rerender(<TopProgressBar active />);
    const fresh = bar(container);
    expect(fresh).not.toBe(fading);
    expect(fresh).toHaveClass('opacity-100');
    expect(fresh?.style.transform).toBe('scaleX(0)');
  });

  it('under reduced motion renders a static bar while active', () => {
    reduced.value = true;
    const { container } = render(<TopProgressBar active />);
    act(() => vi.advanceTimersByTime(300));
    const first = bar(container)?.style.transform;
    act(() => vi.advanceTimersByTime(2000));
    expect(bar(container)).not.toBeNull();
    expect(bar(container)?.style.transform).toBe('scaleX(1)');
    expect(bar(container)?.style.transform).toBe(first);
  });

  it('is hidden from assistive tech', () => {
    const { container } = render(<TopProgressBar active />);
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
  });

  it('trickles without re-rendering on every frame', () => {
    const onRender = vi.fn();
    const { container } = render(
      <Profiler id="bar" onRender={onRender}>
        <TopProgressBar active />
      </Profiler>,
    );
    act(() => vi.advanceTimersByTime(300));
    const renders = onRender.mock.calls.length;
    const before = bar(container)?.style.transform;
    act(() => vi.advanceTimersByTime(2000));
    expect(bar(container)?.style.transform).not.toBe(before);
    expect(onRender.mock.calls.length).toBe(renders);
  });
});
