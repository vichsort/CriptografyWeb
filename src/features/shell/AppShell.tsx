'use client';

import { usePathname } from 'next/navigation';
import { Suspense, useEffect, useRef, type ReactNode } from 'react';
import { useInFlight } from '@/data/cache';
import { TopProgressBar } from '@/ui';
import { Header } from './Header';
import { SidebarFrame } from './SidebarFrame';
import { SidebarStateContext, useSidebarStateValue } from './useSidebarState';
import { WarmUp } from './WarmUp';

/** The frame around every screen: header, sidebar, progress bar and the main column. */
export function AppShell({ sidebar, children }: { sidebar: ReactNode; children: ReactNode }) {
  const state = useSidebarStateValue();
  const inFlight = useInFlight();
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const { setMobileOpen } = state;

  return (
    <SidebarStateContext value={state}>
      <TopProgressBar active={inFlight} />
      <Header menuButtonRef={menuButtonRef} />
      <SidebarFrame sidebar={sidebar} menuButtonRef={menuButtonRef} />
      <main
        inert={state.mobileOpen}
        className="flex min-w-0 flex-1 flex-col pt-header-safe transition-padding motion-reduce:transition-none lg:pl-sidebar lg:sidebar-collapsed:pl-0"
      >
        {children}
      </main>
      {/* The URL is unknown while prerendering pages under an unknown dynamic segment. */}
      <Suspense fallback={null}>
        <OnNavigate run={() => setMobileOpen(false)} />
      </Suspense>
      <WarmUp />
    </SidebarStateContext>
  );
}

/** Runs `run` after every route change: the brand link, the back button, a link in the page. */
function OnNavigate({ run }: { run: () => void }) {
  const pathname = usePathname();
  const latest = useRef(run);
  useEffect(() => {
    latest.current = run;
  });
  useEffect(() => {
    latest.current();
  }, [pathname]);
  return null;
}
