'use client';

import Link from 'next/link';
import type { RefObject } from 'react';
import { shell, site } from '@/content';
import { BrandMark, MenuIcon, SidebarIcon } from '@/ui';
import { MOBILE_MENU_ID, SIDEBAR_ID } from './SidebarFrame';
import { useSidebarState } from './useSidebarState';

const iconButton =
  'grid size-8 cursor-pointer place-items-center rounded-sm text-headline text-label transition-colors duration-fast hover:bg-fill';

/** The fixed header: sidebar toggle, brand and nav on desktop; brand and menu button on mobile. */
export function Header({ menuButtonRef }: { menuButtonRef: RefObject<HTMLButtonElement | null> }) {
  const { collapsed, setCollapsed, mobileOpen, setMobileOpen } = useSidebarState();

  return (
    <header className="material-chrome fixed inset-x-0 top-0 z-40 h-header-safe border-b border-separator pt-safe">
      <div className="flex h-header items-center gap-3 px-safe-4">
        <button
          type="button"
          className={`${iconButton} hidden lg:grid`}
          aria-label={collapsed ? shell.showSidebar : shell.hideSidebar}
          aria-expanded={!collapsed}
          aria-controls={SIDEBAR_ID}
          onClick={() => setCollapsed(!collapsed)}
        >
          <SidebarIcon />
        </button>

        <Link
          href="/"
          // Closes the menu here too: on "/" already, the route does not change.
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-2 rounded-sm text-body font-semibold tracking-tight text-label"
        >
          <BrandMark glyph={shell.brandMark} />
          {site.name}
        </Link>

        <nav aria-label={shell.navLabel} className="ml-auto hidden gap-5 lg:flex">
          {shell.nav.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-sm text-footnote text-label-secondary transition-colors duration-fast hover:text-label"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <button
          ref={menuButtonRef}
          type="button"
          className={`${iconButton} ml-auto lg:hidden`}
          aria-label={mobileOpen ? shell.closeMenu : shell.openMenu}
          aria-expanded={mobileOpen}
          aria-controls={MOBILE_MENU_ID}
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          <MenuIcon open={mobileOpen} />
        </button>
      </div>
    </header>
  );
}
