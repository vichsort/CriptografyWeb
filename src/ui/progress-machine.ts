/**
 * The top progress bar's estimate (docs/DESIGN.md §6). The API reports no progress, so the bar
 * waits a moment, trickles towards a ceiling, and completes when the last request settles.
 * The machine holds only the phases; the trickle runs outside React (see TopProgressBar).
 */

export const PROGRESS_SHOW_DELAY_MS = 150;
export const PROGRESS_CEILING = 0.85;

/** Time constant of the trickle: about a third of the way after a second, near the ceiling by 10s. */
const TRICKLE_TAU_MS = 2500;

export type ProgressState = {
  phase: 'idle' | 'waiting' | 'running' | 'completing';
  /** Counts the times the bar has appeared; a new run draws a new bar instead of reusing one. */
  run: number;
};

/** `shown` fires once the show delay has passed. */
export type ProgressEvent =
  { type: 'start' } | { type: 'stop' } | { type: 'shown' } | { type: 'faded' };

export const initialProgress: ProgressState = { phase: 'idle', run: 0 };

/**
 * One step of the trickle: it closes a fraction of the gap to the ceiling, so it moves fast at first
 * and slows down. The fraction depends on the elapsed time, so one long frame equals several short
 * ones. It never moves backwards.
 */
export function trickle(value: number, dtMs: number): number {
  const k = 1 - Math.exp(-Math.max(0, dtMs) / TRICKLE_TAU_MS);
  const next = value + (PROGRESS_CEILING - value) * k;
  return Math.max(value, Math.min(PROGRESS_CEILING, next));
}

export function progressStep(s: ProgressState, e: ProgressEvent): ProgressState {
  switch (s.phase) {
    case 'idle':
      return e.type === 'start' ? { ...s, phase: 'waiting' } : s;

    case 'waiting':
      if (e.type === 'stop') return { ...s, phase: 'idle' };
      if (e.type === 'shown') return { phase: 'running', run: s.run + 1 };
      return s;

    case 'running':
      return e.type === 'stop' ? { ...s, phase: 'completing' } : s;

    case 'completing':
      // A request that starts while the bar fades restarts it cleanly: a new bar, from the bottom.
      if (e.type === 'start') return { phase: 'running', run: s.run + 1 };
      if (e.type === 'faded') return { ...s, phase: 'idle' };
      return s;
  }
}

export function isProgressVisible(s: ProgressState): boolean {
  return s.phase === 'running' || s.phase === 'completing';
}
