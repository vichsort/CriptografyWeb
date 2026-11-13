'use client';

import { useCallback, useEffect, useRef, type FocusEvent } from 'react';
import { useReducedMotionSafe } from './motion';

/** Roughly how long the on-screen keyboard takes to slide up, so this scroll lands after it. */
const KEYBOARD_DELAY_MS = 300;

/** Inputs that never open the on-screen keyboard. */
const NO_KEYBOARD = new Set(['button', 'checkbox', 'color', 'file', 'radio', 'range', 'submit']);

function opensKeyboard(target: EventTarget): target is HTMLInputElement | HTMLTextAreaElement {
  if (target instanceof HTMLTextAreaElement) return true;
  return target instanceof HTMLInputElement && !NO_KEYBOARD.has(target.type);
}

const touchScreen = () =>
  typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;

/**
 * A focus handler for a screen's container (docs/DESIGN.md §10). On a touch screen, the field that
 * takes focus scrolls to the top of the page, under the header, once the keyboard is up: the
 * keyboard covers the bottom of the screen, so what follows the field (the Run button, the
 * result) stays above it. With a mouse and a physical keyboard nothing moves.
 */
export function useKeepFieldInView(): (event: FocusEvent<HTMLElement>) => void {
  const reduced = useReducedMotionSafe();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  return useCallback(
    (event: FocusEvent<HTMLElement>) => {
      const field = event.target;
      if (!opensKeyboard(field) || !touchScreen()) return;
      clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        if (document.activeElement !== field) return;
        field.scrollIntoView({ block: 'start', behavior: reduced ? 'auto' : 'smooth' });
      }, KEYBOARD_DELAY_MS);
    },
    [reduced],
  );
}
