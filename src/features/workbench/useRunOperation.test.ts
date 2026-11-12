import { QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { createElement, type ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { createQueryClient } from '@/data/cache';
import type { OperationRequest } from '@/domain';
import { apiUrl, server } from '@/test/msw/server';
import { useRunOperation } from './useRunOperation';

const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(QueryClientProvider, { client: createQueryClient() }, children);

const aes = (input: string): OperationRequest => ({
  algorithmId: 'aes-256-gcm',
  operation: 'encrypt',
  input,
  options: { key: 'k' },
});

function holdEncrypt() {
  let open = () => {};
  const opened = new Promise<void>((resolve) => (open = resolve));
  const signals: AbortSignal[] = [];
  server.use(
    http.post(apiUrl('/api/encrypt'), async ({ request }) => {
      signals.push(request.signal);
      const { input } = (await request.json()) as { input: string };
      await opened;
      return HttpResponse.json({ result: `out:${input}` });
    }),
  );
  return Object.assign(open, { signals });
}

describe('useRunOperation', () => {
  it('goes from idle to running to success, keyed by the request', async () => {
    server.use(http.post(apiUrl('/api/encrypt'), () => HttpResponse.json({ result: 'ok' })));
    const { result } = renderHook(() => useRunOperation(), { wrapper });
    expect(result.current.status).toBe('idle');

    let done: Promise<void> = Promise.resolve();
    act(() => {
      done = result.current.run(aes('a'));
    });
    expect(result.current.status).toBe('running');
    await act(() => done);
    expect(result.current).toMatchObject({ status: 'success', result: 'ok', error: null });
    expect(result.current.requestKey).toEqual(expect.any(String));
  });

  it('surfaces an API error, never an aborted one', async () => {
    server.use(
      http.post(apiUrl('/api/encrypt'), () =>
        HttpResponse.json({ message: 'nope' }, { status: 422 }),
      ),
    );
    const { result } = renderHook(() => useRunOperation(), { wrapper });
    await act(() => result.current.run(aes('a')));
    expect(result.current.status).toBe('error');
    expect(result.current.error).toEqual({ kind: 'operation', message: 'nope' });

    const open = holdEncrypt();
    let pending: Promise<void> = Promise.resolve();
    act(() => {
      pending = result.current.run(aes('b'));
    });
    act(() => result.current.cancel());
    open();
    await act(() => pending);
    expect(result.current).toMatchObject({ status: 'idle', error: null, result: null });
  });

  it('running twice quickly aborts the first, and ignores its settlement', async () => {
    const open = holdEncrypt();
    const { result } = renderHook(() => useRunOperation(), { wrapper });
    let first: Promise<void> = Promise.resolve();
    let second: Promise<void> = Promise.resolve();
    act(() => {
      first = result.current.run(aes('one'));
    });
    await waitFor(() => expect(open.signals).toHaveLength(1));
    act(() => {
      second = result.current.run(aes('two'));
    });
    const keyOfSecond = result.current.requestKey;
    await waitFor(() => expect(open.signals).toHaveLength(2));
    expect(open.signals[0]?.aborted).toBe(true);
    open();
    await act(() => Promise.all([first, second]));
    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.result).toBe('out:two');
    expect(result.current.requestKey).toBe(keyOfSecond);
  });
});
