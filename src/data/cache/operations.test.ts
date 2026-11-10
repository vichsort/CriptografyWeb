import { delay, http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { apiUrl, server } from '@/test/msw/server';
import type { OperationRequest } from '@/domain';
import { queryKeys } from './keys';
import { executeOperation } from './operations';
import { createQueryClient } from './query-client';

function countHits(path: string): { hits: number } {
  const counter = { hits: 0 };
  server.use(
    http.post(apiUrl(path), () => {
      counter.hits++;
      return HttpResponse.json({ result: `r${counter.hits}` });
    }),
  );
  return counter;
}

const opts = () => ({ signal: new AbortController().signal, onWaking: () => {} });

describe('executeOperation', () => {
  it('memoizes deterministic results', async () => {
    const counter = countHits('/api/encrypt');
    const client = createQueryClient();
    const req: OperationRequest = {
      algorithmId: 'caesar',
      operation: 'encrypt',
      input: 'abc',
      options: { shift: 3 },
    };
    expect(await executeOperation(client, req, opts())).toBe('r1');
    expect(await executeOperation(client, req, opts())).toBe('r1');
    expect(counter.hits).toBe(1);
  });

  it('never memoizes aes encrypt', async () => {
    const counter = countHits('/api/encrypt');
    const client = createQueryClient();
    const req: OperationRequest = {
      algorithmId: 'aes-256-gcm',
      operation: 'encrypt',
      input: 'abc',
      options: { key: 'k' },
    };
    expect(await executeOperation(client, req, opts())).toBe('r1');
    expect(await executeOperation(client, req, opts())).toBe('r2');
    expect(counter.hits).toBe(2);
    expect(client.getQueryCache().findAll({ queryKey: ['operation'] })).toHaveLength(0);
  });

  it('does not keep a failed run, so the next run asks again', async () => {
    let hits = 0;
    server.use(
      http.post(apiUrl('/api/hash'), () => {
        hits++;
        return hits === 1
          ? HttpResponse.json({ message: 'm' }, { status: 500 })
          : HttpResponse.json({ result: 'ok' });
      }),
    );
    const client = createQueryClient();
    const req: OperationRequest = { algorithmId: 'sha-256', operation: 'hash', input: 'a' };
    await expect(executeOperation(client, req, opts())).rejects.toThrow();
    expect(await executeOperation(client, req, opts())).toBe('ok');
  });
});

describe('executeOperation with overlapping runs', () => {
  const req: OperationRequest = {
    algorithmId: 'caesar',
    operation: 'encrypt',
    input: 'abc',
    options: { shift: 3 },
  };

  function gate() {
    let open: () => void = () => {};
    const opened = new Promise<void>((resolve) => {
      open = resolve;
    });
    return { open, opened };
  }

  it('a re-run while the same request is pending gets its result', async () => {
    const { open, opened } = gate();
    let hits = 0;
    server.use(
      http.post(apiUrl('/api/encrypt'), async () => {
        hits++;
        await opened;
        return HttpResponse.json({ result: 'r' });
      }),
    );
    const client = createQueryClient();
    const first = new AbortController();
    const a = executeOperation(client, req, { signal: first.signal, onWaking: () => {} });
    const b = executeOperation(client, req, opts());
    first.abort();
    await expect(a).rejects.toMatchObject({ error: { kind: 'aborted' } });
    open();
    await expect(b).resolves.toBe('r');
    expect(hits).toBe(1);
  });

  it('aborting the only run cancels its request', async () => {
    let started = false;
    let cancelled = false;
    server.use(
      http.post(apiUrl('/api/encrypt'), async ({ request }) => {
        started = true;
        request.signal.addEventListener('abort', () => {
          cancelled = true;
        });
        await delay('infinite');
        return HttpResponse.json({ result: 'never' });
      }),
    );
    const client = createQueryClient();
    const controller = new AbortController();
    const run = executeOperation(client, req, { signal: controller.signal, onWaking: () => {} });
    await vi.waitFor(() => expect(started).toBe(true));
    controller.abort();
    await expect(run).rejects.toMatchObject({ error: { kind: 'aborted' } });
    await vi.waitFor(() => expect(cancelled).toBe(true));
  });

  it('tells a run that joins a pending request that the server is waking', async () => {
    const { open, opened } = gate();
    server.use(
      http.post(apiUrl('/api/encrypt'), async () => {
        await opened;
        return HttpResponse.json({ result: 'r' });
      }),
    );
    const client = createQueryClient();
    const first = new AbortController();
    const firstWaking = vi.fn();
    const a = executeOperation(client, req, { signal: first.signal, onWaking: firstWaking });
    await vi.waitFor(() => expect(firstWaking).toHaveBeenCalled(), { timeout: 4000 });

    const joinerWaking = vi.fn();
    const b = executeOperation(client, req, {
      signal: new AbortController().signal,
      onWaking: joinerWaking,
    });
    first.abort();
    await expect(a).rejects.toMatchObject({ error: { kind: 'aborted' } });
    expect(joinerWaking).toHaveBeenCalledTimes(1);
    open();
    await expect(b).resolves.toBe('r');
  }, 8000);

  it('rejects at once when the signal is already aborted', async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(
      executeOperation(createQueryClient(), req, { signal: controller.signal, onWaking: () => {} }),
    ).rejects.toMatchObject({ error: { kind: 'aborted' } });
  });
});

describe('queryKeys.operation', () => {
  const base: OperationRequest = {
    algorithmId: 'caesar',
    operation: 'encrypt',
    input: 'abc',
    options: { shift: 3 },
  };
  const hash = (r: OperationRequest) => JSON.stringify(queryKeys.operation(r));

  it('different input or options make different keys', () => {
    expect(hash(base)).not.toBe(hash({ ...base, input: 'abc ' }));
    expect(hash(base)).not.toBe(hash({ ...base, options: { shift: 4 } }));
    expect(hash(base)).not.toBe(hash({ ...base, operation: 'decrypt' }));
    expect(hash(base)).not.toBe(hash({ ...base, algorithmId: 'vigenere' }));
    expect(hash(base)).toBe(hash({ ...base }));
  });

  it('treats missing options as an empty object', () => {
    const noOptions: OperationRequest = {
      algorithmId: 'caesar',
      operation: 'encrypt',
      input: 'abc',
    };
    expect(queryKeys.operation(noOptions)[4]).toEqual({});
  });
});
