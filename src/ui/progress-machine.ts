/**
 * The top progress bar's estimate (docs/DESIGN.md §6). The API reports no progress, so the bar
 * waits a moment, trickles towards a ceiling, and completes when the last request settles.
 */

export const PROGRESS_SHOW_DELAY_MS = 150;
export const PROGRESS_CEILING = 0.85;

/** Time constant of the trickle: about a third of the way after a second, near the ceiling by 10s. */
const TRICKLE_TAU_MS = 2500;

export type ProgressState = {
  phase: 'idle' | 'waiting' | 'running' | 'completing';
  /** How full the bar is, 0..1. */
  value: number;
  /** Time spent waiting before the bar shows. */
  waitedMs: number;
  /** Counts the times the bar has appeared; a new run draws a new bar instead of reusing one. */
  run: number;
};

export type ProgressEvent =
  { type: 'start' } | { type: 'stop' } | { type: 'tick'; dtMs: number } | { type: 'faded' };

export const initialProgress: ProgressState = { phase: 'idle', value: 0, waitedMs: 0, run: 0 };

/**
 * Each step closes a fraction of the gap to the ceiling, so it moves fast at first and slows down.
 * The fraction depends on the elapsed time, so one long frame equals several short ones. It never
 * moves backwards within a run.
 */
function trickle(value: number, dtMs: number): number {
  const k = 1 - Math.exp(-Math.max(0, dtMs) / TRICKLE_TAU_MS);
  const next = value + (PROGRESS_CEILING - value) * k;
  return Math.max(value, Math.min(PROGRESS_CEILING, next));
}

export function progressStep(s: ProgressState, e: ProgressEvent): ProgressState {
  switch (s.phase) {
    case 'idle':
      return e.type === 'start' ? { ...s, phase: 'waiting', value: 0, waitedMs: 0 } : s;

    case 'waiting':
      if (e.type === 'stop') return { ...initialProgress, run: s.run };
      if (e.type !== 'tick') return s;
      {
        const waitedMs = s.waitedMs + e.dtMs;
        if (waitedMs < PROGRESS_SHOW_DELAY_MS) return { ...s, waitedMs };
        const value = trickle(0, waitedMs - PROGRESS_SHOW_DELAY_MS);
        return { phase: 'running', value, waitedMs: PROGRESS_SHOW_DELAY_MS, run: s.run + 1 };
      }

    case 'running':
      if (e.type === 'stop') return { ...s, phase: 'completing', value: 1 };
      if (e.type === 'tick') return { ...s, value: trickle(s.value, e.dtMs) };
      return s;

    case 'completing':
      // A request that starts while the bar fades restarts it cleanly: a new bar, from the bottom.
      if (e.type === 'start') return { ...s, phase: 'running', value: 0, run: s.run + 1 };
      if (e.type === 'faded') return { ...initialProgress, run: s.run };
      return s;
  }
}

export function isProgressVisible(s: ProgressState): boolean {
  return s.phase === 'running' || s.phase === 'completing';
}
