'use client';

import { useEffect, useReducer, useRef } from 'react';
import { cn } from './cn';
import { useReducedMotionSafe } from './motion';
import {
  PROGRESS_SHOW_DELAY_MS,
  initialProgress,
  isProgressVisible,
  progressStep,
  trickle,
} from './progress-machine';

const FILL_MS = 200;
const FADE_MS = 220;

/**
 * A thin tint bar under the fixed header while anything is in flight, like a browser's loading bar.
 * Decorative: buttons and messages announce progress themselves.
 */
export function TopProgressBar({ active }: { active: boolean }) {
  const [state, dispatch] = useReducer(progressStep, initialProgress);
  const reduced = useReducedMotionSafe();
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dispatch({ type: active ? 'start' : 'stop' });
  }, [active]);

  const waiting = state.phase === 'waiting';
  useEffect(() => {
    if (!waiting) return;
    const timer = setTimeout(() => dispatch({ type: 'shown' }), PROGRESS_SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, [waiting]);

  // Each frame writes the trickle straight to the bar, so React renders only when the phase
  // changes. A static bar (reduced motion) needs no frames.
  const trickling = state.phase === 'running' && !reduced;
  useEffect(() => {
    if (!trickling) return;
    let value = 0;
    let last = performance.now();
    let frame = requestAnimationFrame(function loop(now) {
      value = trickle(value, now - last);
      last = now;
      if (barRef.current) barRef.current.style.transform = `scaleX(${value})`;
      frame = requestAnimationFrame(loop);
    });
    return () => cancelAnimationFrame(frame);
  }, [trickling]);

  const completing = state.phase === 'completing';
  useEffect(() => {
    if (!completing) return;
    const timer = setTimeout(
      () => dispatch({ type: 'faded' }),
      reduced ? FADE_MS : FILL_MS + FADE_MS,
    );
    return () => clearTimeout(timer);
  }, [completing, reduced]);

  return (
    <div
      aria-hidden="true"
      className="vt-progress pointer-events-none fixed inset-x-0 z-50 h-[2.5px]"
      style={{ top: 'calc(var(--spacing-header) + env(safe-area-inset-top, 0px))' }}
    >
      {isProgressVisible(state) && (
        <div
          key={state.run}
          ref={barRef}
          data-progress-bar=""
          className={cn(
            'h-full origin-left bg-tint starting:opacity-0',
            completing ? 'opacity-0' : 'opacity-100',
          )}
          style={{
            // Running, the frames own the transform; React sets only the start and the end.
            transform: `scaleX(${reduced || completing ? 1 : 0})`,
            // Frames move the trickle; only the final fill to 100% is a transition, since a
            // transition restarted on every frame lags far behind the value it chases.
            transition:
              reduced || !completing
                ? `opacity ${FADE_MS}ms`
                : `transform ${FILL_MS}ms var(--ease-standard), opacity ${FADE_MS}ms ${FILL_MS}ms`,
          }}
        />
      )}
    </div>
  );
}
