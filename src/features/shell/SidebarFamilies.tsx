'use client';

import { AnimatePresence, motion } from 'motion/react';
import { familyContent, type CatalogEntry } from '@/content';
import type { Family } from '@/domain';
import { Accordion, durations, IconTile, ListRow, useReducedMotionSafe } from '@/ui';

interface SidebarFamiliesProps {
  /** Families to show, in display order, each with the rows that match the search. */
  groups: readonly { family: Family; entries: readonly CatalogEntry[] }[];
  isOpen(family: Family): boolean;
  onOpenChange(family: Family, open: boolean): void;
  pathname: string | null;
  iconSize: 'sm' | 'md';
  onPick(): void;
}

/** The family accordions. Families and rows leave and enter as the search filters them. */
export function SidebarFamilies({
  groups,
  isOpen,
  onOpenChange,
  pathname,
  iconSize,
  onPick,
}: SidebarFamiliesProps) {
  const reduced = useReducedMotionSafe();
  const hidden = reduced ? { opacity: 0 } : { opacity: 0, height: 0 };

  return (
    <AnimatePresence initial={false}>
      {groups.map(({ family, entries }) => {
        const copy = familyContent[family];
        return (
          <motion.section
            key={family}
            aria-label={copy.title}
            layout={reduced ? false : 'position'}
            initial={hidden}
            animate={{ opacity: 1, height: 'auto' }}
            exit={hidden}
            transition={{ duration: durations.fast }}
          >
            <Accordion
              title={copy.title}
              count={entries.length}
              open={isOpen(family)}
              onOpenChange={(open) => onOpenChange(family, open)}
            >
              <p className="px-2 pb-2 text-caption text-label-secondary">{copy.description}</p>
              <ul>
                <AnimatePresence initial={false}>
                  {entries.map((entry) => (
                    <ListRow
                      key={entry.key}
                      density="compact"
                      animated
                      icon={<IconTile glyph={entry.glyph} color={entry.color} size={iconSize} />}
                      title={entry.title}
                      subtitle={entry.subtitle}
                      href={entry.href}
                      selected={pathname === entry.href}
                      onSelect={onPick}
                    />
                  ))}
                </AnimatePresence>
              </ul>
            </Accordion>
          </motion.section>
        );
      })}
    </AnimatePresence>
  );
}
