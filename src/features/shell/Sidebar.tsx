'use client';

import { usePathname } from 'next/navigation';
import { Suspense, useMemo, useState, useSyncExternalStore } from 'react';
import { errorCopy, joinCatalog, shell, ui } from '@/content';
import { useCatalog, useCatalogWaking } from '@/data/cache';
import { preferences } from '@/data/persistence';
import { FAMILIES, type Family } from '@/domain';
import { buildSearchIndex, normalizeText, searchEntries } from '@/features/search';
import { HomeIcon, InlineMessage, ListRow, SearchField, Skeleton, ThemeToggle } from '@/ui';
import { useSidebarPlacement } from './SidebarFrame';
import { SidebarFamilies } from './SidebarFamilies';
import { useTheme } from './ThemeProvider';
import { useSidebarState } from './useSidebarState';

/**
 * Search, Home, the family accordions and the theme toggle. The current route comes from the URL,
 * which a prerendered page under an unknown dynamic segment cannot read: until it can, the sidebar
 * renders with nothing selected.
 */
export function Sidebar() {
  return (
    <Suspense fallback={<SidebarContent pathname={null} />}>
      <RoutedSidebar />
    </Suspense>
  );
}

function RoutedSidebar() {
  return <SidebarContent pathname={usePathname()} />;
}

function SidebarContent({ pathname }: { pathname: string | null }) {
  const placement = useSidebarPlacement();
  const overlay = placement === 'overlay';
  const { setMobileOpen } = useSidebarState();
  const theme = useTheme();
  const catalog = useCatalog();
  const waking = useCatalogWaking();
  const savedOpen = useSyncExternalStore(
    preferences.subscribe,
    preferences.openFamilies,
    preferences.openFamilies,
  );

  const [query, setQuery] = useState('');
  // Opened or closed by hand during a search. Dropped when the search clears, so the saved state
  // comes back untouched.
  const [searchOpen, setSearchOpen] = useState<Partial<Record<Family, boolean>>>({});
  const searching = normalizeText(query) !== '';

  const index = useMemo(() => buildSearchIndex(joinCatalog(catalog.data ?? [])), [catalog.data]);
  const groups = useMemo(() => {
    const matches = searchEntries(index, query);
    return FAMILIES.map((family) => ({
      family,
      entries: matches.filter((e) => e.family === family),
    })).filter((g) => !searching || g.entries.length > 0);
  }, [index, query, searching]);

  const onQuery = (next: string) => {
    setQuery(next);
    if (normalizeText(next) === '') setSearchOpen({});
  };
  const isOpen = (family: Family) =>
    searching ? (searchOpen[family] ?? true) : savedOpen.includes(family);
  const onOpenChange = (family: Family, open: boolean) => {
    if (searching) {
      setSearchOpen((current) => ({ ...current, [family]: open }));
      return;
    }
    preferences.setOpenFamilies(
      FAMILIES.filter((f) => (f === family ? open : savedOpen.includes(f))),
    );
  };
  const onPick = () => {
    if (overlay) setMobileOpen(false);
  };

  const hasCatalog = catalog.data !== undefined;
  const failed = !hasCatalog && catalog.isError;
  const failure = failed ? errorCopy(catalog.error.error) : null;

  return (
    <div className="flex min-h-full flex-col gap-3">
      <SearchField
        value={query}
        onChange={onQuery}
        placeholder={ui.sidebarSearchPlaceholder}
        size="sm"
      />

      <ul>
        <ListRow
          density="compact"
          icon={<HomeIcon className="shrink-0 text-headline" />}
          title={shell.home}
          href="/"
          selected={pathname === '/'}
          onSelect={onPick}
        />
      </ul>

      {hasCatalog && (
        <div className="flex flex-col gap-2">
          <SidebarFamilies
            groups={groups}
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            pathname={pathname}
            iconSize={overlay ? 'md' : 'sm'}
            onPick={onPick}
          />
          {searching && groups.length === 0 && (
            <p className="px-2 text-footnote text-label-secondary">
              {shell.noMatches(query.trim())}
            </p>
          )}
        </div>
      )}

      {!hasCatalog && !failed && (
        <div className="flex flex-col gap-2">
          <Skeleton rows={4} />
          <p aria-live="polite" className="px-2 text-footnote text-label-secondary">
            {waking ? ui.waking.title : null}
          </p>
        </div>
      )}

      {failure && <InlineMessage tone="error" title={failure.title} body={failure.body} />}

      {overlay && (
        <nav aria-label={shell.navLabel}>
          <ul>
            {shell.nav.map((link) => (
              <ListRow
                key={link.href}
                density="compact"
                title={link.label}
                href={link.href}
                selected={pathname === link.href}
                onSelect={onPick}
              />
            ))}
          </ul>
        </nav>
      )}

      <footer className="mt-auto px-2 pt-4">
        <ThemeToggle
          resolved={theme.resolved}
          explicit={theme.preference !== 'system'}
          onToggle={theme.toggle}
          onUseSystem={theme.useSystem}
          labels={shell.theme}
        />
      </footer>
    </div>
  );
}
