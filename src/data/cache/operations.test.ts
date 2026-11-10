import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
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
