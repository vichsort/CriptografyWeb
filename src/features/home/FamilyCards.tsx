'use client';

import { AnimatePresence, motion } from 'motion/react';
import { familyContent, type CatalogEntry } from '@/content';
import { groupByFamily } from '@/features/search';
import { durations, GlassCard, IconTile, ListRow, springs, useReducedMotionSafe } from '@/ui';

/**
 * One glass card per family that has entries: three columns on wide content, two when it is
 * narrower (the sidebar is open), one on phones. Cards and rows leave and enter as `entries`
 * changes, and the grid reflows.
 */
export function FamilyCards({ entries }: { entries: readonly CatalogEntry[] }) {
  const reduced = useReducedMotionSafe();
  const groups = groupByFamily(entries);

  return (
    <div className="@container">
      {/* popLayout takes a leaving card out of flow, positioned against this grid. */}
      <div className="relative grid grid-cols-1 items-start gap-4 @prose:grid-cols-2 @prose:gap-5 @cards:grid-cols-3">
        <AnimatePresence initial={false} mode="popLayout">
          {groups.map(({ family, entries: rows }) => {
            const copy = familyContent[family];
            return (
              <motion.div
                key={family}
                layout={!reduced}
                initial={{ opacity: 0, scale: reduced ? 1 : 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: reduced ? 1 : 0.97 }}
                transition={
                  reduced
                    ? { duration: durations.fast }
                    : { ...springs.gentle, opacity: { duration: durations.fast } }
                }
              >
                <GlassCard title={copy.title} hint={copy.hint} description={copy.description} flush>
                  <ul>
                    <AnimatePresence initial={false}>
                      {rows.map((entry) => (
                        <ListRow
                          key={entry.key}
                          animated
                          chevron
                          icon={<IconTile glyph={entry.glyph} color={entry.color} />}
                          title={entry.title}
                          subtitle={entry.subtitle}
                          href={entry.href}
                        />
                      ))}
                    </AnimatePresence>
                  </ul>
                </GlassCard>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
