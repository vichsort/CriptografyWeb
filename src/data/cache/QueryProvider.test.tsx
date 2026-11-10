import { render, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { apiUrl, server } from '@/test/msw/server';
import { persistCatalog } from '@/test/persisted-catalog';
import { useCatalog } from './catalog';
import { QueryProvider } from './QueryProvider';

function Count() {
  const { data, isRestoring } = useCatalog();
  if (isRestoring) return <p>restoring</p>;
  return <p>{data ? `${data.length} algorithms` : 'none'}</p>;
}

describe('QueryProvider', () => {
  it('shows the persisted catalog without asking the API', async () => {
    server.use(http.post(apiUrl('/api/encrypt'), () => HttpResponse.json({ result: 'x' })));
    await persistCatalog();

    let hits = 0;
    server.use(
      http.get(apiUrl('/api/algorithms'), () => {
        hits++;
        return HttpResponse.json({ message: 'asleep' }, { status: 503 });
      }),
    );
    render(
      <QueryProvider>
        <Count />
      </QueryProvider>,
    );
    expect(await screen.findByText('8 algorithms')).toBeInTheDocument();
    expect(hits).toBe(0);
  });
});
