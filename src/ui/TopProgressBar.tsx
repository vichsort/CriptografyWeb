'use client';

import { useEffect, useReducer } from 'react';
import { cn } from './cn';
import { useReducedMotionSafe } from './motion';
import { initialProgress, isProgressVisible, progressStep } from './progress-machine';

const FILL_MS = 200;
const FADE_MS = 220;

/**
 * A thin tint bar under the fixed header while anything is in flight, like a browser's loading bar.
 * Decorative: buttons and messages announce progress themselves.
 */
export function TopProgressBar({ active }: { active: boolean }) {
  const [state, dispatch] = useReducer(progressStep, initialProgress);
  const reduced = useReducedMotionSafe();

  useEffect(() => {
    dispatch({ type: active ? 'start' : 'stop' });
  }, [active]);

  // Frames drive the show delay and the trickle; a static bar (reduced motion) needs only the delay.
  const ticking = state.phase === 'waiting' || (state.phase === 'running' && !reduced);
  useEffect(() => {
    if (!ticking) return;
    let last = performance.now();
    let frame = requestAnimationFrame(function loop(now) {
      dispatch({ type: 'tick', dtMs: now - last });
      last = now;
      frame = requestAnimationFrame(loop);
    });
    return () => cancelAnimationFrame(frame);
  }, [ticking]);

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
      className="pointer-events-none fixed inset-x-0 z-50 h-[2.5px]"
      style={{ top: 'calc(var(--spacing-header) + env(safe-area-inset-top, 0px))' }}
    >
      {isProgressVisible(state) && (
        <div
          data-progress-bar=""
          className={cn(
            'h-full origin-left bg-tint starting:opacity-0',
            completing ? 'opacity-0' : 'opacity-100',
          )}
          style={{
            transform: `scaleX(${reduced ? 1 : state.value})`,
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
