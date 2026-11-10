import { delay, http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { apiUrl, server } from '@/test/msw/server';
import { isAppFailure, type AppError } from '@/domain';
import { pingApi, request } from './request';

async function failureOf(promise: Promise<unknown>): Promise<AppError> {
  try {
    await promise;
  } catch (e) {
    if (isAppFailure(e)) return e.error;
    throw e;
  }
  throw new Error('expected the request to fail');
}

describe('request', () => {
  it('posts JSON with content-type and no credentials', async () => {
    let seen: { body: unknown; type: string | null; credentials: string } | null = null;
    server.use(
      http.post(apiUrl('/api/encrypt'), async ({ request: req }) => {
        seen = {
          body: await req.json(),
          type: req.headers.get('content-type'),
          credentials: req.credentials,
        };
        return HttpResponse.json({ result: 'ok' });
      }),
    );
    await request({ method: 'POST', path: '/api/encrypt', body: { input: ' a ' } });
    expect(seen).toEqual({
      body: { input: ' a ' },
      type: 'application/json',
      credentials: expect.not.stringMatching(/^include$/),
    });
  });

  it('resolves parsed body on 200', async () => {
    server.use(http.get(apiUrl('/api/algorithms'), () => HttpResponse.json({ data: [1] })));
    await expect(request({ method: 'GET', path: '/api/algorithms' })).resolves.toEqual({
      data: [1],
    });
  });

  it('throws AppFailure(operation) on 422', async () => {
    server.use(
      http.post(apiUrl('/api/decrypt'), () =>
        HttpResponse.json({ message: 'Decryption failed.' }, { status: 422 }),
      ),
    );
    expect(await failureOf(request({ method: 'POST', path: '/api/decrypt', body: {} }))).toEqual({
      kind: 'operation',
      message: 'Decryption failed.',
    });
  });

  it('throws contract when a 2xx body is not JSON', async () => {
    server.use(http.get(apiUrl('/api/algorithms'), () => new HttpResponse('<html>')));
    expect((await failureOf(request({ method: 'GET', path: '/api/algorithms' }))).kind).toBe(
      'contract',
    );
  });

  it('throws network on fetch rejection', async () => {
    server.use(http.get(apiUrl('/api/algorithms'), () => HttpResponse.error()));
    expect(await failureOf(request({ method: 'GET', path: '/api/algorithms' }))).toEqual({
      kind: 'network',
    });
  });

  it('throws timeout after timeoutMs', async () => {
    server.use(
      http.get(apiUrl('/api/algorithms'), async () => {
        await delay('infinite');
        return HttpResponse.json({});
      }),
    );
    expect(
      await failureOf(request({ method: 'GET', path: '/api/algorithms', timeoutMs: 50 })),
    ).toEqual({ kind: 'timeout' });
  });

  it('throws aborted when the caller aborts', async () => {
    server.use(
      http.get(apiUrl('/api/algorithms'), async () => {
        await delay('infinite');
        return HttpResponse.json({});
      }),
    );
    const controller = new AbortController();
    const pending = request({ method: 'GET', path: '/api/algorithms', signal: controller.signal });
    setTimeout(() => controller.abort(), 20);
    expect(await failureOf(pending)).toEqual({ kind: 'aborted' });
  });

  it('throws aborted at once when the signal is already aborted', async () => {
    const controller = new AbortController();
    controller.abort();
    expect(
      await failureOf(
        request({ method: 'GET', path: '/api/algorithms', signal: controller.signal }),
      ),
    ).toEqual({ kind: 'aborted' });
  });

  it('calls onWaking once after wakingAfterMs', async () => {
    server.use(
      http.get(apiUrl('/api/algorithms'), async () => {
        await delay(120);
        return HttpResponse.json({});
      }),
    );
    const onWaking = vi.fn();
    await request({ method: 'GET', path: '/api/algorithms', wakingAfterMs: 30, onWaking });
    expect(onWaking).toHaveBeenCalledTimes(1);
  });

  it('never calls onWaking when the response is faster', async () => {
    server.use(http.get(apiUrl('/api/algorithms'), () => HttpResponse.json({})));
    const onWaking = vi.fn();
    await request({ method: 'GET', path: '/api/algorithms', wakingAfterMs: 50, onWaking });
    await new Promise((r) => setTimeout(r, 80));
    expect(onWaking).not.toHaveBeenCalled();
  });

  it('does not retry a POST that got a response', async () => {
    let calls = 0;
    server.use(
      http.post(apiUrl('/api/encrypt'), () => {
        calls++;
        return HttpResponse.json({ message: 'm' }, { status: 500 });
      }),
    );
    await failureOf(request({ method: 'POST', path: '/api/encrypt', body: {} }));
    expect(calls).toBe(1);
  });

  it('retries once on network failure', async () => {
    let calls = 0;
    server.use(
      http.post(apiUrl('/api/encrypt'), () => {
        calls++;
        return calls === 1 ? HttpResponse.error() : HttpResponse.json({ result: 'ok' });
      }),
    );
    await expect(request({ method: 'POST', path: '/api/encrypt', body: {} })).resolves.toEqual({
      result: 'ok',
    });
    expect(calls).toBe(2);
  });

  it('gives up after one retry', async () => {
    let calls = 0;
    server.use(
      http.get(apiUrl('/api/algorithms'), () => {
        calls++;
        return HttpResponse.error();
      }),
    );
    await failureOf(request({ method: 'GET', path: '/api/algorithms' }));
    expect(calls).toBe(2);
  });
});

describe('request edge cases', () => {
  it('surfaces a missing API URL as a configuration error', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', undefined);
    vi.resetModules();
    try {
      const fresh = await import('./request');
      await expect(fresh.request({ method: 'GET', path: '/api/algorithms' })).rejects.toThrow(
        /NEXT_PUBLIC_API_URL/,
      );
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it('works where AbortSignal.any is missing', async () => {
    const original = AbortSignal.any;
    Object.defineProperty(AbortSignal, 'any', { value: undefined, configurable: true });
    try {
      server.use(
        http.get(apiUrl('/api/algorithms'), async () => {
          await delay('infinite');
          return HttpResponse.json({});
        }),
      );
      const controller = new AbortController();
      const pending = request({
        method: 'GET',
        path: '/api/algorithms',
        signal: controller.signal,
      });
      setTimeout(() => controller.abort(), 20);
      expect(await failureOf(pending)).toEqual({ kind: 'aborted' });
      expect(
        await failureOf(
          request({
            method: 'GET',
            path: '/api/algorithms',
            signal: new AbortController().signal,
            timeoutMs: 30,
          }),
        ),
      ).toEqual({ kind: 'timeout' });
    } finally {
      Object.defineProperty(AbortSignal, 'any', { value: original, configurable: true });
    }
  });
});

describe('pingApi', () => {
  it('sends GET / and swallows failures', async () => {
    let calls = 0;
    server.use(
      http.get(apiUrl('/'), () => {
        calls++;
        return HttpResponse.error();
      }),
    );
    expect(() => pingApi()).not.toThrow();
    await vi.waitFor(() => expect(calls).toBe(1));
  });
});
