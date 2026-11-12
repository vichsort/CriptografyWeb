'use client';

import { AnimatePresence, motion } from 'motion/react';
import { errorCopy, ui } from '@/content';
import { useCatalog, useCatalogWaking } from '@/data/cache';
import { useCatalogSearch } from '@/features/search';
import { durations, InlineMessage, Skeleton, useReducedMotionSafe } from '@/ui';
import { FamilyCards } from './FamilyCards';

/**
 * The catalog as family cards, filtered by `query`: skeletons and the waking message while it
 * loads, the match count while searching, and the list of algorithms when nothing matches.
 * Without a `query` there is no search, and no room is kept for its count.
 */
export function CatalogCards({ query }: { query?: string }) {
  const catalog = useCatalog();
  const waking = useCatalogWaking();
  const reduced = useReducedMotionSafe();

  const { entries, matches, searching } = useCatalogSearch(query ?? '');
  const shown = (query ?? '').trim();

  if (catalog.data === undefined) {
    if (catalog.isError) {
      const copy = errorCopy(catalog.error.error);
      return (
        <div className="mt-6">
          <InlineMessage tone="error" title={copy.title} body={copy.body} />
        </div>
      );
    }
    return (
      <div className="mt-6 space-y-4">
        {waking && <InlineMessage tone="info" title={ui.waking.title} body={ui.waking.body} />}
        <div className="@container">
          <div className="grid grid-cols-1 items-start gap-4 @prose:grid-cols-2 @prose:gap-5 @cards:grid-cols-3">
            <Skeleton rows={4} />
            <div aria-hidden="true" className="hidden @prose:block">
              <Skeleton rows={3} />
            </div>
            <div aria-hidden="true" className="hidden @cards:block">
              <Skeleton rows={3} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const names = entries.flatMap((e) => (e.algorithm ? [e.algorithm.name] : []));
  const empty = searching && matches.length === 0;

  return (
    <div>
      {query !== undefined && (
        // One polite region, mounted before any search, announces the count or the empty state.
        <div aria-live="polite">
          <p className="mt-2 ml-1 min-h-5 text-footnote text-label-tertiary">
            {searching && !empty && ui.resultsCount(matches.length, shown)}
          </p>
          <AnimatePresence initial={false}>
            {empty && (
              <motion.p
                key="empty"
                className="material-glass-regular mt-4 max-w-prose rounded-xl px-5 py-4 text-callout text-label-secondary"
                initial={{ opacity: 0, y: reduced ? 0 : 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: durations.base }}
              >
                {ui.noResults(shown, names)}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      )}
      <div className="mt-4">
        <FamilyCards entries={matches} />
      </div>
    </div>
  );
}
