import { render, screen } from '@testing-library/react';
import { delay, http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiUrl, server } from '@/test/msw/server';

// The real module throws outside a React Server Components build.
vi.mock('server-only', () => ({}));
// Outside a request there is no request scope; on the server it marks the read as runtime data.
vi.mock('next/server', () => ({ connection: async () => {} }));

/** A fresh module per test: the status is memoized at module scope on the server. */
const load = async () => (await import('./ApiStatus')).ApiStatus;

beforeEach(() => {
  vi.resetModules();
});

describe('ApiStatus', () => {
  it('ApiStatus renders version on success', async () => {
    const ApiStatus = await load();
    render(await ApiStatus({}));
    expect(screen.getByText('Criptografy API')).toBeInTheDocument();
    expect(screen.getByText('healthy')).toBeInTheDocument();
    expect(screen.getByText('1.0.0')).toBeInTheDocument();
  });

  it('ApiStatus renders unavailable on timeout or error', async () => {
    server.use(http.get(apiUrl('/'), () => new HttpResponse(null, { status: 500 })));
    const ApiStatus = await load();
    const failed = render(await ApiStatus({}));
    expect(
      screen.getByText('Unavailable right now. The server may be asleep.'),
    ).toBeInTheDocument();
    failed.unmount();

    server.use(
      http.get(apiUrl('/'), async () => {
        await delay(500);
        return HttpResponse.json({ name: 'late', status: 'healthy', version: '9' });
      }),
    );
    render(await ApiStatus({ timeoutMs: 30 }));
    expect(
      screen.getByText('Unavailable right now. The server may be asleep.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('late')).toBeNull();
  });
});
