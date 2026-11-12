import { QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import catalog from '@/test/fixtures/catalog.json';
import { apiUrl, server } from '@/test/msw/server';
import { catalogQueryOptions, useCatalogWaking } from './catalog';
import { createQueryClient } from './query-client';

function holdCatalog() {
  let release: () => void = () => {};
  const released = new Promise<void>((resolve) => (release = resolve));
  server.use(
    http.get(apiUrl('/api/algorithms'), async () => {
      await released;
      return HttpResponse.json(catalog);
    }),
  );
  return release;
}

function wrap() {
  const client = createQueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, wrapper };
}

describe('useCatalogWaking', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('turns true when the catalog request is slow, and false once it arrives', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const release = holdCatalog();
    const { client, wrapper } = wrap();
    const { result } = renderHook(() => useCatalogWaking(), { wrapper });
    let pending: Promise<unknown> = Promise.resolve();
    act(() => {
      pending = client.fetchQuery(catalogQueryOptions());
    });
    expect(result.current).toBe(false);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3_100);
    });
    expect(result.current).toBe(true);

    release();
    await act(async () => {
      await pending;
    });
    expect(result.current).toBe(false);
  });

  it('a screen mounted after the request started waking says so at once', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const release = holdCatalog();
    const { client, wrapper } = wrap();
    const pending = client.fetchQuery(catalogQueryOptions());
    await vi.advanceTimersByTimeAsync(3_100);

    const { result } = renderHook(() => useCatalogWaking(), { wrapper });
    expect(result.current).toBe(true);

    release();
    await act(async () => {
      await pending;
    });
    expect(result.current).toBe(false);
  });

  it('stays false when the catalog is already in the cache', async () => {
    const { client, wrapper } = wrap();
    await client.fetchQuery(catalogQueryOptions());
    const { result } = renderHook(() => useCatalogWaking(), { wrapper });
    expect(result.current).toBe(false);
  });
});
