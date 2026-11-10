import { QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { apiUrl, server } from '@/test/msw/server';
import type { OperationRequest } from '@/domain';
import { useInFlight } from './in-flight';
import { executeOperation } from './operations';
import { createQueryClient } from './query-client';

function gate() {
  let open: () => void = () => {};
  const opened = new Promise<void>((resolve) => {
    open = resolve;
  });
  return { open, opened };
}

describe('useInFlight', () => {
  it.each<[string, OperationRequest]>([
    [
      'deterministic',
      { algorithmId: 'caesar', operation: 'encrypt', input: 'a', options: { shift: 1 } },
    ],
    [
      'not deterministic',
      { algorithmId: 'aes-256-gcm', operation: 'encrypt', input: 'a', options: { key: 'k' } },
    ],
  ])('is true while a %s request is pending and false after it settles', async (_, req) => {
    const { open, opened } = gate();
    server.use(
      http.post(apiUrl('/api/encrypt'), async () => {
        await opened;
        return HttpResponse.json({ result: 'x' });
      }),
    );
    const client = createQueryClient();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useInFlight(), { wrapper });
    expect(result.current).toBe(false);

    let pending: Promise<string> = Promise.resolve('');
    act(() => {
      pending = executeOperation(client, req, {
        signal: new AbortController().signal,
        onWaking: () => {},
      });
    });
    await waitFor(() => expect(result.current).toBe(true));

    open();
    await act(async () => {
      await pending;
    });
    await waitFor(() => expect(result.current).toBe(false));
  });
});
