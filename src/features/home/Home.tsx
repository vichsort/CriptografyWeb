'use client';

import { useState } from 'react';
import { ui } from '@/content';
import { SearchField } from '@/ui';
import { CatalogCards } from './CatalogCards';
import { DateLine } from './DateLine';

/** The date, the question, the search and the family cards. "/" focuses the search. */
export function Home() {
  const [query, setQuery] = useState('');
  return (
    <div className="mx-auto w-full max-w-content px-4 pt-6 pb-12 sm:px-8 sm:pt-8 lg:px-10">
      <DateLine />
      <h1 className="mt-1 mb-5 text-large-title text-label">{ui.homeTitle}</h1>
      <div className="max-w-prose">
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder={ui.searchPlaceholder}
          shortcut="/"
        />
      </div>
      <CatalogCards query={query} />
    </div>
  );
}
