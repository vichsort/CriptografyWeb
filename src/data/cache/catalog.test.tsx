import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import catalog from '@/test/fixtures/catalog.json';
import { apiUrl, server } from '@/test/msw/server';
import { catalogQueryOptions, useCatalogWaking } from './catalog';
import { createQueryClient } from './query-client';

function wrap() {
  const client = createQueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, wrapper };
}

describe('useCatalogWaking', () => {
  it('turns true when the catalog takes longer than the threshold, and false once it arrives', async () => {
    let release: () => void = () => {};
    const released = new Promise<void>((resolve) => (release = resolve));
    server.use(
      http.get(apiUrl('/api/algorithms'), async () => {
        await released;
        return HttpResponse.json(catalog);
      }),
    );
    const { wrapper } = wrap();
    const { result } = renderHook(() => useCatalogWaking(40), { wrapper });
    expect(result.current).toBe(false);
    await waitFor(() => expect(result.current).toBe(true));
    release();
    await waitFor(() => expect(result.current).toBe(false));
  });

  it('stays false when the catalog is already in the cache', async () => {
    const { client, wrapper } = wrap();
    await client.fetchQuery(catalogQueryOptions());
    const { result } = renderHook(() => useCatalogWaking(1), { wrapper });
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(result.current).toBe(false);
  });
});
