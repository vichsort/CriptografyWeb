'use client';

import { AnimatePresence, motion } from 'motion/react';
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
  type RefObject,
} from 'react';
import { shell } from '@/content';
import { durations, useReducedMotionSafe } from '@/ui';
import { useSidebarState } from './useSidebarState';

export type SidebarPlacement = 'desktop' | 'overlay';

const PlacementContext = createContext<SidebarPlacement>('desktop');

/** Where the sidebar content is rendered: the desktop column or the mobile overlay. */
export function useSidebarPlacement(): SidebarPlacement {
  return useContext(PlacementContext);
}

export const SIDEBAR_ID = 'sidebar';
export const MOBILE_MENU_ID = 'mobile-menu';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface SidebarFrameProps {
  sidebar: ReactNode;
  /** The header's menu button: it stays reachable while the overlay is open, and gets focus back. */
  menuButtonRef: RefObject<HTMLButtonElement | null>;
}

export function SidebarFrame({ sidebar, menuButtonRef }: SidebarFrameProps) {
  return (
    <>
      <aside
        id={SIDEBAR_ID}
        aria-label={shell.sidebarLabel}
        className="material-chrome fixed top-header-safe bottom-0 left-0 z-20 hidden w-sidebar overflow-y-auto overscroll-contain border-r border-separator px-3 pt-4 pb-6 transition-slide motion-reduce:transition-none lg:block sidebar-collapsed:invisible sidebar-collapsed:-translate-x-full"
      >
        <PlacementContext value="desktop">{sidebar}</PlacementContext>
      </aside>
      <MobileOverlay menuButtonRef={menuButtonRef}>
        <PlacementContext value="overlay">{sidebar}</PlacementContext>
      </MobileOverlay>
    </>
  );
}

function MobileOverlay({
  children,
  menuButtonRef,
}: {
  children: ReactNode;
  menuButtonRef: RefObject<HTMLButtonElement | null>;
}) {
  const { mobileOpen, setMobileOpen } = useSidebarState();
  const reduced = useReducedMotionSafe();
  const dialogRef = useRef<HTMLDivElement>(null);
  const wasOpen = useRef(false);

  // Focus moves into the dialog on open and back to the menu button on close.
  useEffect(() => {
    if (mobileOpen) dialogRef.current?.focus();
    else if (wasOpen.current) menuButtonRef.current?.focus();
    wasOpen.current = mobileOpen;
  }, [mobileOpen, menuButtonRef]);

  // The page behind does not scroll while the overlay covers it.
  useEffect(() => {
    if (!mobileOpen) return;
    const body = document.body;
    const previous = body.style.overflow;
    body.style.overflow = 'hidden';
    return () => {
      body.style.overflow = previous;
    };
  }, [mobileOpen]);

  // Esc closes. Tab cycles through the dialog and the menu button, which closes it.
  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setMobileOpen(false);
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const inside = [...dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
      const items = [menuButtonRef.current, ...inside].filter((el): el is HTMLElement => !!el);
      if (items.length === 0) return;
      event.preventDefault();
      const index = items.indexOf(document.activeElement as HTMLElement);
      const step = event.shiftKey ? -1 : 1;
      const next =
        index === -1
          ? items[event.shiftKey ? items.length - 1 : Math.min(1, items.length - 1)]
          : items[(index + step + items.length) % items.length];
      next?.focus();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [mobileOpen, setMobileOpen, menuButtonRef]);

  return (
    <AnimatePresence>
      {mobileOpen && (
        <motion.div
          key="overlay"
          ref={dialogRef}
          id={MOBILE_MENU_ID}
          role="dialog"
          aria-modal="true"
          aria-label={shell.menuLabel}
          tabIndex={-1}
          className="material-glass-thick fixed inset-x-0 top-header-safe bottom-0 z-30 overflow-y-auto overscroll-contain px-safe-4 pt-4 pb-safe-8 outline-none lg:hidden"
          initial={{ opacity: 0, scale: reduced ? 1 : 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: reduced ? 1 : 0.98 }}
          transition={{ duration: durations.fast }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
