import { ViewTransition, type ReactNode } from 'react';

/**
 * A page's route transition (docs/DESIGN.md §7, styles in transitions.css): the old page fades
 * out, the new one fades in and rises slightly. Only arriving and leaving animate, so content that
 * streams in or resizes later stays put. The header, the sidebar and the progress bar sit outside
 * every page and never move.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter="page" exit="page" default="none">
      {children}
    </ViewTransition>
  );
}
