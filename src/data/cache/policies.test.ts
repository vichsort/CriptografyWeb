import { describe, expect, it } from 'vitest';
import { AppFailure, type AppError } from '@/domain';
import { PERSIST_MAX_AGE } from './persister';
import { policies } from './query-client';

const failure = (error: AppError) => new AppFailure(error);

describe('policies.catalog.retry', () => {
  it.each<AppError>([
    { kind: 'network' },
    { kind: 'timeout' },
    { kind: 'server', status: 503, message: null },
  ])('retries $kind up to 5 times', (error) => {
    expect(policies.catalog.retry(0, failure(error))).toBe(true);
    expect(policies.catalog.retry(4, failure(error))).toBe(true);
    expect(policies.catalog.retry(5, failure(error))).toBe(false);
  });

  it.each<AppError>([
    { kind: 'contract', issues: 'x' },
    { kind: 'aborted' },
    { kind: 'notFound', message: 'x' },
    { kind: 'server', status: 405, message: null },
    { kind: 'server', status: 403, message: null },
  ])('never retries $kind $status', (error) => {
    expect(policies.catalog.retry(0, failure(error))).toBe(false);
  });

  it('keeps a restored catalog for as long as the persister does', () => {
    expect(policies.catalog.gcTime).toBe(PERSIST_MAX_AGE);
  });
});

describe('policies.operation', () => {
  it('keeps deterministic results for the session without retrying', () => {
    expect(policies.operation).toMatchObject({
      staleTime: Infinity,
      gcTime: 300_000,
      retry: false,
    });
  });
});
