import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import catalog from '@/test/fixtures/catalog.json';
import { stubMatchMedia } from '@/test/match-media';
import { apiUrl, server } from '@/test/msw/server';
import { AppShell } from './AppShell';
import { Providers } from './Providers';
import { Sidebar } from './Sidebar';

const navigation = vi.hoisted(() => ({ pathname: '/' }));
vi.mock('next/navigation', () => ({ usePathname: () => navigation.pathname }));

function renderSidebar() {
  render(
    <Providers>
      <AppShell sidebar={<Sidebar />}>
        <p>page</p>
      </AppShell>
    </Providers>,
  );
  return screen.getByRole('complementary', { name: 'Sidebar' });
}

const family = (scope: HTMLElement, name: string) =>
  within(scope).queryByRole('button', { name: new RegExp(`^${name}`) });

async function loaded(scope: HTMLElement) {
  await within(scope).findByRole('link', { name: /Shift letters/ });
}

describe('Sidebar', () => {
  beforeEach(() => {
    navigation.pathname = '/';
    stubMatchMedia({ '(min-width: 1024px)': true });
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('renders the three families with counts from the joined catalog', async () => {
    const aside = renderSidebar();
    await loaded(aside);
    expect(family(aside, 'Encrypt')).toHaveAccessibleName('Encrypt 4');
    expect(family(aside, 'Hash')).toHaveAccessibleName('Hash 3');
    expect(family(aside, 'Encode')).toHaveAccessibleName('Encode 3');
    // Encryption starts open; the others start closed.
    expect(family(aside, 'Encrypt')).toHaveAttribute('aria-expanded', 'true');
    expect(family(aside, 'Hash')).toHaveAttribute('aria-expanded', 'false');
    expect(within(aside).getByRole('link', { name: /Shift letters/ })).toHaveAttribute(
      'href',
      '/algorithms/caesar',
    );
  });

  it('persists the families opened by hand', async () => {
    const aside = renderSidebar();
    await loaded(aside);
    await userEvent.click(family(aside, 'Hash')!);
    expect(family(aside, 'Hash')).toHaveAttribute('aria-expanded', 'true');
    expect(JSON.parse(localStorage.getItem('cw:v1:sidebar.openFamilies') ?? '[]')).toEqual([
      'encryption',
      'hashing',
    ]);
  });

  it('search hides non-matching rows and families and opens matching families', async () => {
    const aside = renderSidebar();
    await loaded(aside);
    await userEvent.type(within(aside).getByRole('searchbox', { name: 'Search' }), 'base');

    expect(family(aside, 'Encode')).toHaveAttribute('aria-expanded', 'true');
    expect(family(aside, 'Encode')).toHaveAccessibleName('Encode 1');
    expect(within(aside).getByRole('link', { name: /Read or write Base64/ })).toBeInTheDocument();
    await waitFor(() => {
      expect(family(aside, 'Encrypt')).toBeNull();
      expect(family(aside, 'Hash')).toBeNull();
      expect(within(aside).queryByRole('link', { name: /See the bytes in hex/ })).toBeNull();
    });
  });

  it('says so when nothing matches', async () => {
    const aside = renderSidebar();
    await loaded(aside);
    await userEvent.type(within(aside).getByRole('searchbox', { name: 'Search' }), 'zzz');
    const message = await within(aside).findByText(/Nothing for/);
    expect(message).toHaveTextContent('Nothing for “zzz”.');
    expect(message.closest('[aria-live="polite"]')).not.toBeNull();
  });

  it('clearing search restores the previous open state', async () => {
    const aside = renderSidebar();
    await loaded(aside);
    const search = within(aside).getByRole('searchbox', { name: 'Search' });
    await userEvent.type(search, 'sha');
    expect(family(aside, 'Hash')).toHaveAttribute('aria-expanded', 'true');

    await userEvent.clear(search);
    await waitFor(() => expect(family(aside, 'Encrypt')).toHaveAttribute('aria-expanded', 'true'));
    expect(family(aside, 'Hash')).toHaveAttribute('aria-expanded', 'false');
    expect(family(aside, 'Encode')).toHaveAttribute('aria-expanded', 'false');
    // Searching never rewrites the saved state.
    expect(localStorage.getItem('cw:v1:sidebar.openFamilies')).toBeNull();
  });

  it('current route row is selected', async () => {
    navigation.pathname = '/algorithms/caesar';
    const aside = renderSidebar();
    await loaded(aside);
    expect(within(aside).getByRole('link', { name: /Shift letters/ })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(within(aside).getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current');
  });

  it('home is selected on the home route', async () => {
    const aside = renderSidebar();
    await loaded(aside);
    expect(within(aside).getByRole('link', { name: 'Home' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('choosing a row on mobile closes the overlay', async () => {
    stubMatchMedia({ '(min-width: 1024px)': false });
    renderSidebar();
    await userEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    const dialog = screen.getByRole('dialog', { name: 'Menu' });
    await userEvent.click(await within(dialog).findByRole('link', { name: /Shift letters/ }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('nav rows render only in the mobile overlay', async () => {
    stubMatchMedia({ '(min-width: 1024px)': false });
    const aside = renderSidebar();
    expect(within(aside).queryByRole('link', { name: 'Learn' })).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    const dialog = screen.getByRole('dialog', { name: 'Menu' });
    expect(within(dialog).getByRole('link', { name: 'Algorithms' })).toHaveAttribute(
      'href',
      '/algorithms',
    );
    expect(within(dialog).getByRole('link', { name: 'Learn' })).toHaveAttribute('href', '/learn');
    expect(within(dialog).getByRole('link', { name: 'About the API' })).toHaveAttribute(
      'href',
      '/about',
    );
  });

  it('shows skeleton rows and the waking copy while the catalog loads slowly', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    let release: () => void = () => {};
    const released = new Promise<void>((resolve) => (release = resolve));
    server.use(
      http.get(apiUrl('/api/algorithms'), async () => {
        await released;
        return HttpResponse.json(catalog);
      }),
    );
    const aside = renderSidebar();
    expect(await within(aside).findByRole('status', { name: 'Loading' })).toBeInTheDocument();
    expect(within(aside).queryByText('Waking up the server…')).toBeNull();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3_000);
    });
    expect(within(aside).getByText('Waking up the server…')).toBeInTheDocument();

    release();
    await loaded(aside);
    expect(within(aside).queryByRole('status', { name: 'Loading' })).toBeNull();
    expect(within(aside).queryByText('Waking up the server…')).toBeNull();
  });

  it('has the theme toggle in its footer', async () => {
    const aside = renderSidebar();
    expect(within(aside).getByRole('switch', { name: 'Dark' })).toBeInTheDocument();
  });
});
