import { render, screen } from '@testing-library/react';
import { delay, http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { apiUrl, server } from '@/test/msw/server';
import { ApiStatus } from './ApiStatus';

// The real module throws outside a React Server Components build.
vi.mock('server-only', () => ({}));

describe('ApiStatus', () => {
  it('ApiStatus renders version on success', async () => {
    render(await ApiStatus({}));
    expect(screen.getByText('Criptografy API')).toBeInTheDocument();
    expect(screen.getByText('healthy')).toBeInTheDocument();
    expect(screen.getByText('1.0.0')).toBeInTheDocument();
  });

  it('ApiStatus renders unavailable on timeout or error', async () => {
    server.use(http.get(apiUrl('/'), () => new HttpResponse(null, { status: 500 })));
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
