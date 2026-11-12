import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Providers } from '@/features/shell';
import catalog from '@/test/fixtures/catalog.json';
import { apiUrl, server } from '@/test/msw/server';
import { persistCatalog } from '@/test/persisted-catalog';
import { AlgorithmsScreen } from './AlgorithmsScreen';
import { Home } from './Home';

function holdCatalog() {
  let release: () => void = () => {};
  const released = new Promise<void>((resolve) => (release = resolve));
  server.use(
    http.get(apiUrl('/api/algorithms'), async () => {
      await released;
      return HttpResponse.json(catalog);
    }),
  );
  return release;
}

const renderHome = () =>
  render(
    <Providers>
      <Home />
    </Providers>,
  );

const card = (name: string) => screen.queryByRole('region', { name });

describe('Home', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows the large title and the search field', async () => {
    renderHome();
    expect(
      screen.getByRole('heading', { level: 1, name: 'What are we doing today?' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: /Search/ })).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: /Shift letters/ })).toBeInTheDocument();
  });

  it('search filters cards and shows the count', async () => {
    renderHome();
    await screen.findByRole('link', { name: /Shift letters/ });
    await userEvent.type(screen.getByRole('searchbox', { name: /Search/ }), 'sha');

    expect(screen.getByText('3 options for “sha”')).toBeInTheDocument();
    expect(card('Hash')).toBeInTheDocument();
    await waitFor(() => {
      expect(card('Encrypt')).toBeNull();
      expect(card('Encode')).toBeNull();
    });
  });

  it('counts a single option in the singular', async () => {
    renderHome();
    await screen.findByRole('link', { name: /Shift letters/ });
    await userEvent.type(screen.getByRole('searchbox', { name: /Search/ }), 'vigenere');
    expect(screen.getByText('1 option for “vigenere”')).toBeInTheDocument();
  });

  it('no match lists available algorithms', async () => {
    renderHome();
    await screen.findByRole('link', { name: /Shift letters/ });
    await userEvent.type(screen.getByRole('searchbox', { name: /Search/ }), 'zzz');

    expect(
      await screen.findByText(
        'Nothing for “zzz” yet. The available algorithms are Caesar, Vigenère, Hill, AES-256-GCM, SHA-256, SHA-512, Base64 and Hexadecimal.',
      ),
    ).toBeInTheDocument();
    await waitFor(() => expect(card('Encrypt')).toBeNull());
    expect(screen.queryByText(/options? for/)).toBeNull();
  });

  it('/ focuses the main search', async () => {
    renderHome();
    await userEvent.keyboard('/');
    expect(screen.getByRole('searchbox', { name: /Search/ })).toHaveFocus();
  });

  it('skeleton while catalog loads', async () => {
    const release = holdCatalog();
    renderHome();
    expect(await screen.findByRole('status', { name: 'Loading' })).toBeInTheDocument();
    release();
    await screen.findByRole('link', { name: /Shift letters/ });
    expect(screen.queryByRole('status', { name: 'Loading' })).toBeNull();
  });

  it('persisted catalog renders instantly', async () => {
    server.use(http.post(apiUrl('/api/encrypt'), () => HttpResponse.json({ result: 'x' })));
    await persistCatalog();
    // The network never answers: rows can only come from the persisted catalog.
    holdCatalog();
    renderHome();
    expect(await screen.findByRole('link', { name: /Shift letters/ })).toBeInTheDocument();
    expect(screen.queryByRole('status', { name: 'Loading' })).toBeNull();
  });

  it('tells the visitor the server is waking up when the catalog is slow', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const release = holdCatalog();
    renderHome();
    await screen.findByRole('status', { name: 'Loading' });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3_000);
    });
    expect(screen.getByText('Waking up the server…')).toBeInTheDocument();
    release();
    await screen.findByRole('link', { name: /Shift letters/ });
    expect(screen.queryByText('Waking up the server…')).toBeNull();
  });
});

describe('AlgorithmsScreen', () => {
  it('renders the large title and every family, without the date or search', async () => {
    render(
      <Providers>
        <AlgorithmsScreen />
      </Providers>,
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Algorithms' })).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: /Shift letters/ })).toBeInTheDocument();
    expect(card('Encrypt')).toBeInTheDocument();
    expect(card('Hash')).toBeInTheDocument();
    expect(card('Encode')).toBeInTheDocument();
    expect(screen.queryByRole('searchbox')).toBeNull();
    expect(screen.queryByText(/day,/)).toBeNull();
  });
});
