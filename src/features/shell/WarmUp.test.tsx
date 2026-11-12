import { render } from '@testing-library/react';
import { StrictMode } from 'react';
import { describe, expect, it } from 'vitest';
import { apiUrl, server } from '@/test/msw/server';
import { WarmUp } from './WarmUp';

describe('WarmUp', () => {
  it('warm-up pings once', async () => {
    const pings: string[] = [];
    const onRequest = ({ request }: { request: Request }) => {
      if (request.url === apiUrl('/')) pings.push(request.method);
    };
    server.events.on('request:start', onRequest);
    try {
      const { rerender } = render(
        <StrictMode>
          <WarmUp />
        </StrictMode>,
      );
      rerender(
        <StrictMode>
          <WarmUp />
        </StrictMode>,
      );
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(pings).toEqual(['GET']);
    } finally {
      server.events.removeListener('request:start', onRequest);
    }
  });
});
