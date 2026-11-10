import { describe, expect, it } from 'vitest';
import { AppFailure, type AppError } from '@/domain';
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
  ])('never retries $kind', (error) => {
    expect(policies.catalog.retry(0, failure(error))).toBe(false);
  });

  it('backs off between retries', () => {
    expect(policies.catalog.retryDelay(1)).toBeGreaterThan(policies.catalog.retryDelay(0));
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
