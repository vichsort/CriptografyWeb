import { describe, expect, it } from 'vitest';
import {
  PROGRESS_CEILING,
  PROGRESS_SHOW_DELAY_MS,
  initialProgress,
  isProgressVisible,
  progressStep,
  type ProgressState,
} from './progress-machine';

const tick = (dtMs: number) => ({ type: 'tick', dtMs }) as const;

function run(s: ProgressState, ticks: number, dtMs = 16): ProgressState {
  let next = s;
  for (let i = 0; i < ticks; i++) next = progressStep(next, tick(dtMs));
  return next;
}

const running = () => run(progressStep(initialProgress, { type: 'start' }), 20, 10);

describe('progressStep', () => {
  it('start → waiting; invisible until 150ms of ticks', () => {
    let s = progressStep(initialProgress, { type: 'start' });
    expect(s.phase).toBe('waiting');
    expect(isProgressVisible(s)).toBe(false);
    s = progressStep(s, tick(PROGRESS_SHOW_DELAY_MS - 1));
    expect(s.phase).toBe('waiting');
    expect(isProgressVisible(s)).toBe(false);
    s = progressStep(s, tick(1));
    expect(s.phase).toBe('running');
    expect(isProgressVisible(s)).toBe(true);
  });

  it('a request that stops while waiting never shows', () => {
    let s = progressStep(initialProgress, { type: 'start' });
    s = progressStep(s, tick(100));
    s = progressStep(s, { type: 'stop' });
    expect(s).toEqual(initialProgress);
  });

  it('running approaches but never exceeds 0.85', () => {
    let s = running();
    for (let i = 0; i < 10_000; i++) {
      s = progressStep(s, tick(50));
      expect(s.value).toBeLessThanOrEqual(PROGRESS_CEILING);
    }
    expect(s.value).toBeGreaterThan(PROGRESS_CEILING - 0.01);
  });

  it('moves quickly at first', () => {
    const s = run(running(), 60, 16); // about a second
    expect(s.value).toBeGreaterThan(0.25);
  });

  it('increments shrink as value grows', () => {
    let s = running();
    let previous = Infinity;
    for (let i = 0; i < 50; i++) {
      const next = progressStep(s, tick(16));
      const increment = next.value - s.value;
      expect(increment).toBeGreaterThan(0);
      expect(increment).toBeLessThan(previous);
      previous = increment;
      s = next;
    }
  });

  it('a long frame advances as far as the short frames it replaces', () => {
    const long = progressStep(running(), tick(160));
    const short = run(running(), 10, 16);
    expect(long.value).toBeCloseTo(short.value, 6);
  });

  it('stop → completing at 1, then faded → idle', () => {
    let s = progressStep(running(), { type: 'stop' });
    expect(s).toMatchObject({ phase: 'completing', value: 1 });
    expect(isProgressVisible(s)).toBe(true);
    s = progressStep(s, tick(500));
    expect(s).toMatchObject({ phase: 'completing', value: 1 });
    s = progressStep(s, { type: 'faded' });
    expect(s).toMatchObject({ phase: 'idle', value: 0 });
  });

  it('start during completing restarts cleanly as a new run, from the bottom', () => {
    const before = running();
    let s = progressStep(before, { type: 'stop' });
    s = progressStep(s, { type: 'start' });
    expect(s).toMatchObject({ phase: 'running', value: 0 });
    // A new run: the bar is drawn afresh (fading in) rather than sweeping back from full.
    expect(s.run).toBe(before.run + 1);
    s = run(s, 30);
    expect(s.value).toBeGreaterThan(0);
    expect(s.value).toBeLessThan(PROGRESS_CEILING);
    s = progressStep(s, { type: 'stop' });
    expect(s).toMatchObject({ phase: 'completing', value: 1 });
    s = progressStep(s, { type: 'faded' });
    expect(s).toMatchObject({ phase: 'idle', value: 0 });
    s = progressStep(s, { type: 'start' });
    expect(s).toMatchObject({ phase: 'waiting', value: 0 });
  });

  it('ignores events that do not apply', () => {
    expect(progressStep(initialProgress, { type: 'stop' })).toEqual(initialProgress);
    expect(progressStep(initialProgress, tick(1000))).toEqual(initialProgress);
    expect(progressStep(initialProgress, { type: 'faded' })).toEqual(initialProgress);
    const r = running();
    expect(progressStep(r, { type: 'start' })).toEqual(r);
    expect(progressStep(r, { type: 'faded' })).toEqual(r);
  });
});
