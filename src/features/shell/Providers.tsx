'use client';

import type { ReactNode } from 'react';
import { QueryProvider } from '@/data/cache';
import { ThemeProvider } from './ThemeProvider';

/** Client-side state for the whole app: the query cache and the theme. */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <ThemeProvider>{children}</ThemeProvider>
    </QueryProvider>
  );
}
