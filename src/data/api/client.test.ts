import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import catalog from '@/test/fixtures/catalog.json';
import { messages } from '@/test/fixtures/messages';
import { apiUrl, server } from '@/test/msw/server';
import { isAppFailure, type AppError } from '@/domain';
import { getApiStatus, getCatalog, NON_TEXT_RESULT_MESSAGE, runOperation } from './client';

async function failureOf(promise: Promise<unknown>): Promise<AppError> {
  try {
    await promise;
  } catch (e) {
    if (isAppFailure(e)) return e.error;
    throw e;
  }
  throw new Error('expected the call to fail');
}

describe('getCatalog', () => {
  it('reports a slow answer through onWaking, as operations do', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      let release: () => void = () => {};
      const released = new Promise<void>((resolve) => (release = resolve));
      server.use(
        http.get(apiUrl('/api/algorithms'), async () => {
          await released;
          return HttpResponse.json(catalog);
        }),
      );
      const onWaking = vi.fn();
      const pending = getCatalog(undefined, { onWaking });
      await vi.advanceTimersByTimeAsync(2_900);
      expect(onWaking).not.toHaveBeenCalled();
      await vi.advanceTimersByTimeAsync(200);
      expect(onWaking).toHaveBeenCalledOnce();
      release();
      expect(await pending).toHaveLength(8);
    } finally {
      vi.useRealTimers();
    }
  });

  it('maps the fixture to 8 algorithms with derived operations', async () => {
    const algorithms = await getCatalog();
    const byId = Object.fromEntries(algorithms.map((a) => [a.id, a]));
    expect(algorithms).toHaveLength(8);
    expect(byId.base64?.operations).toEqual(['encode', 'decode']);
    expect(byId['sha-256']?.operations).toEqual(['hash']);
    expect(byId.caesar?.operations).toEqual(['encrypt', 'decrypt']);
    expect(byId.hill?.optionsSchema.required).toEqual(['key']);
    expect(byId.hill?.family).toBe('encryption');
    expect(byId['aes-256-gcm']?.securityLevel).toBe('modern');
  });

  it('skips an algorithm with an unknown category or security level', async () => {
    const [first] = catalog.data;
    const extended = {
      data: [
        ...catalog.data,
        { ...first, id: 'signature', category: 'signing' },
        { ...first, id: 'legacy', securityLevel: 'legacy' },
      ],
    };
    server.use(http.get(apiUrl('/api/algorithms'), () => HttpResponse.json(extended)));
    const ids = (await getCatalog()).map((a) => a.id);
    expect(ids).toHaveLength(8);
    expect(ids).not.toContain('signature');
    expect(ids).not.toContain('legacy');
  });

  it('throws contract when the envelope is not a catalog', async () => {
    server.use(http.get(apiUrl('/api/algorithms'), () => HttpResponse.json({ items: [] })));
    expect((await failureOf(getCatalog())).kind).toBe('contract');
  });

  it('throws contract when a field is missing', async () => {
    const broken = {
      data: catalog.data.map((entry) => {
        const copy: Record<string, unknown> = { ...entry };
        delete copy.category;
        return copy;
      }),
    };
    server.use(http.get(apiUrl('/api/algorithms'), () => HttpResponse.json(broken)));
    expect((await failureOf(getCatalog())).kind).toBe('contract');
  });
});

describe('runOperation', () => {
  it('posts {algorithm, input, options} to the endpoint of the operation', async () => {
    let body: unknown = null;
    server.use(
      http.post(apiUrl('/api/encrypt'), async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ result: 'khoor' });
      }),
    );
    await expect(
      runOperation({
        algorithmId: 'caesar',
        operation: 'encrypt',
        input: 'hello',
        options: { shift: 3 },
      }),
    ).resolves.toBe('khoor');
    expect(body).toEqual({ algorithm: 'caesar', input: 'hello', options: { shift: 3 } });
  });

  it('sends input and options verbatim', async () => {
    let raw = '';
    server.use(
      http.post(apiUrl('/api/encrypt'), async ({ request }) => {
        raw = await request.text();
        return HttpResponse.json({ result: 'x' });
      }),
    );
    const input = '  a\r\n\tb 😀 ';
    await runOperation({
      algorithmId: 'aes-256-gcm',
      operation: 'encrypt',
      input,
      options: { key: ' pass ' },
    });
    expect(JSON.parse(raw)).toEqual({
      algorithm: 'aes-256-gcm',
      input,
      options: { key: ' pass ' },
    });
  });

  it('omits options when undefined', async () => {
    let body: unknown = null;
    server.use(
      http.post(apiUrl('/api/hash'), async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ result: 'abc' });
      }),
    );
    await runOperation({ algorithmId: 'sha-256', operation: 'hash', input: '' });
    expect(body).toEqual({ algorithm: 'sha-256', input: '' });
  });

  it('maps the non-UTF-8 422 to binaryResult', async () => {
    expect(NON_TEXT_RESULT_MESSAGE).toBe(messages.nonTextResult);
    server.use(
      http.post(apiUrl('/api/decode'), () =>
        HttpResponse.json({ message: messages.nonTextResult }, { status: 422 }),
      ),
    );
    expect(
      await failureOf(runOperation({ algorithmId: 'hex', operation: 'decode', input: 'ff' })),
    ).toEqual({ kind: 'binaryResult', message: messages.nonTextResult });
  });

  it('keeps any other 422 message as operation', async () => {
    server.use(
      http.post(apiUrl('/api/decode'), () =>
        HttpResponse.json({ message: messages.invalidHex }, { status: 422 }),
      ),
    );
    expect(
      await failureOf(runOperation({ algorithmId: 'hex', operation: 'decode', input: 'abc' })),
    ).toEqual({ kind: 'operation', message: messages.invalidHex });
  });

  it('throws contract when the result is missing', async () => {
    server.use(http.post(apiUrl('/api/encode'), () => HttpResponse.json({ data: 'x' })));
    expect(
      (await failureOf(runOperation({ algorithmId: 'hex', operation: 'encode', input: 'a' }))).kind,
    ).toBe('contract');
  });
});

describe('getApiStatus', () => {
  it('parses name/status/version', async () => {
    await expect(getApiStatus()).resolves.toEqual({
      name: 'Criptografy API',
      status: 'healthy',
      version: '1.0.0',
    });
  });
});
