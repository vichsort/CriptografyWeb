import { describe, expect, it } from 'vitest';
import {
  PROGRESS_CEILING,
  initialProgress,
  isProgressVisible,
  progressStep,
  trickle,
  type ProgressState,
} from './progress-machine';

function frames(value: number, count: number, dtMs = 16): number {
  let next = value;
  for (let i = 0; i < count; i++) next = trickle(next, dtMs);
  return next;
}

const running = (): ProgressState =>
  progressStep(progressStep(initialProgress, { type: 'start' }), { type: 'shown' });

describe('trickle', () => {
  it('approaches but never exceeds 0.85', () => {
    let value = 0;
    for (let i = 0; i < 10_000; i++) {
      value = trickle(value, 50);
      expect(value).toBeLessThanOrEqual(PROGRESS_CEILING);
    }
    expect(value).toBeGreaterThan(PROGRESS_CEILING - 0.01);
  });

  it('moves quickly at first', () => {
    expect(frames(0, 60)).toBeGreaterThan(0.25); // about a second
  });

  it('increments shrink as value grows', () => {
    let value = 0;
    let previous = Infinity;
    for (let i = 0; i < 50; i++) {
      const next = trickle(value, 16);
      const increment = next - value;
      expect(increment).toBeGreaterThan(0);
      expect(increment).toBeLessThan(previous);
      previous = increment;
      value = next;
    }
  });

  it('a long frame advances as far as the short frames it replaces', () => {
    expect(trickle(0.2, 160)).toBeCloseTo(frames(0.2, 10, 16), 6);
  });

  it('never moves backwards', () => {
    expect(trickle(0.5, -100)).toBe(0.5);
    expect(trickle(0.9, 100)).toBe(0.9);
  });
});

describe('progressStep', () => {
  it('start → waiting, invisible until shown → running', () => {
    let s = progressStep(initialProgress, { type: 'start' });
    expect(s.phase).toBe('waiting');
    expect(isProgressVisible(s)).toBe(false);
    s = progressStep(s, { type: 'shown' });
    expect(s).toEqual({ phase: 'running', run: 1 });
    expect(isProgressVisible(s)).toBe(true);
  });

  it('a request that stops while waiting never shows', () => {
    let s = progressStep(initialProgress, { type: 'start' });
    s = progressStep(s, { type: 'stop' });
    expect(s).toEqual(initialProgress);
  });

  it('stop → completing, then faded → idle', () => {
    let s = progressStep(running(), { type: 'stop' });
    expect(s.phase).toBe('completing');
    expect(isProgressVisible(s)).toBe(true);
    s = progressStep(s, { type: 'shown' });
    expect(s.phase).toBe('completing');
    s = progressStep(s, { type: 'faded' });
    expect(s.phase).toBe('idle');
  });

  it('start during completing restarts cleanly as a new run', () => {
    const before = running();
    let s = progressStep(before, { type: 'stop' });
    s = progressStep(s, { type: 'start' });
    // A new run: the bar is drawn afresh (fading in) rather than sweeping back from full.
    expect(s).toEqual({ phase: 'running', run: before.run + 1 });
    s = progressStep(progressStep(s, { type: 'stop' }), { type: 'faded' });
    expect(s.phase).toBe('idle');
    s = progressStep(s, { type: 'start' });
    expect(s.phase).toBe('waiting');
  });

  it('ignores events that do not apply', () => {
    expect(progressStep(initialProgress, { type: 'stop' })).toEqual(initialProgress);
    expect(progressStep(initialProgress, { type: 'shown' })).toEqual(initialProgress);
    expect(progressStep(initialProgress, { type: 'faded' })).toEqual(initialProgress);
    const r = running();
    expect(progressStep(r, { type: 'start' })).toEqual(r);
    expect(progressStep(r, { type: 'shown' })).toEqual(r);
    expect(progressStep(r, { type: 'faded' })).toEqual(r);
  });
});
