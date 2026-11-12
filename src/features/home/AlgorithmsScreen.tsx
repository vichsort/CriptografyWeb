'use client';

import { ui } from '@/content';
import { CatalogCards } from './CatalogCards';

/** Every algorithm, as the home cards, under a large title: no date and no search. */
export function AlgorithmsScreen() {
  return (
    <div className="mx-auto w-full max-w-content px-4 pt-6 pb-12 sm:px-8 sm:pt-8 lg:px-10">
      <h1 className="mt-1 text-large-title text-label">{ui.algorithmsTitle}</h1>
      <div className="mt-4">
        <CatalogCards />
      </div>
    </div>
  );
}
