import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiUrl, server } from '@/test/msw/server';

vi.mock('server-only', () => ({}));

/** A fresh module per test: the memo lives at module scope. */
const load = async () => (await import('./server')).getApiStatus;

function statusEndpoint() {
  const hits = { count: 0 };
  server.use(
    http.get(apiUrl('/'), () => {
      hits.count++;
      return hits.count === 1
        ? HttpResponse.json({ name: 'Criptografy API', status: 'healthy', version: '1.0.0' })
        : HttpResponse.json({ message: 'Too Many Attempts.' }, { status: 429 });
    }),
  );
  return hits;
}

describe('getApiStatus (server memo)', () => {
  beforeEach(() => {
    vi.resetModules();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('asks the API at most once a minute, since every visitor shares one rate limit', async () => {
    const hits = statusEndpoint();
    const getApiStatus = await load();
    await getApiStatus();
    await expect(getApiStatus()).resolves.toMatchObject({ version: '1.0.0' });
    expect(hits.count).toBe(1);
  });

  it('keeps the last answer when the API rate-limits the next check', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const hits = statusEndpoint();
    const getApiStatus = await load();
    await getApiStatus();
    vi.advanceTimersByTime(61_000);
    await expect(getApiStatus()).resolves.toMatchObject({ version: '1.0.0' });
    expect(hits.count).toBe(2);
  });

  it('still fails when there is nothing to fall back on', async () => {
    server.use(http.get(apiUrl('/'), () => new HttpResponse(null, { status: 500 })));
    const getApiStatus = await load();
    await expect(getApiStatus()).rejects.toThrow();
  });
});
