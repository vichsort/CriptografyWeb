'use client';

import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { useState, type ReactNode } from 'react';
import { createCatalogPersister, persistOptions } from './persister';
import { createQueryClient } from './query-client';

export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(createQueryClient);
  const [options] = useState(() => persistOptions(createCatalogPersister()));
  return (
    <PersistQueryClientProvider client={client} persistOptions={options}>
      {children}
    </PersistQueryClientProvider>
  );
}
