import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useCatalog } from '@/data/cache';
import catalog from '@/test/fixtures/catalog.json';
import { stubMatchMedia } from '@/test/match-media';
import { apiUrl, server } from '@/test/msw/server';
import { AppShell } from './AppShell';
import { Providers } from './Providers';
import { useSidebarPlacement } from './SidebarFrame';

function FakeSidebar() {
  const placement = useSidebarPlacement();
  return (
    <nav aria-label={`fake ${placement}`}>
      <button type="button">first {placement}</button>
      <button type="button">last {placement}</button>
    </nav>
  );
}

function renderShell(children: React.ReactNode = <p>page</p>) {
  return render(
    <Providers>
      <AppShell sidebar={<FakeSidebar />}>{children}</AppShell>
    </Providers>,
  );
}

describe('AppShell', () => {
  beforeEach(() => {
    stubMatchMedia({ '(min-width: 1024px)': false });
  });
  afterEach(() => {
    delete document.documentElement.dataset.sidebar;
    vi.unstubAllGlobals();
  });

  it('header nav links point to /algorithms, /learn, /about', () => {
    renderShell();
    const header = screen.getByRole('banner');
    expect(within(header).getByRole('link', { name: 'Criptografy' })).toHaveAttribute('href', '/');
    const nav = within(header).getByRole('navigation');
    expect(within(nav).getByRole('link', { name: 'Algorithms' })).toHaveAttribute(
      'href',
      '/algorithms',
    );
    expect(within(nav).getByRole('link', { name: 'Learn' })).toHaveAttribute('href', '/learn');
    expect(within(nav).getByRole('link', { name: 'About the API' })).toHaveAttribute(
      'href',
      '/about',
    );
  });

  it('desktop toggle collapses sidebar and persists it', async () => {
    renderShell();
    const toggle = screen.getByRole('button', { name: 'Hide sidebar' });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');

    await userEvent.click(toggle);
    expect(localStorage.getItem('cw:v1:sidebar.collapsed')).toBe('true');
    expect(document.documentElement.dataset.sidebar).toBe('collapsed');
    expect(toggle).toHaveAccessibleName('Show sidebar');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(toggle);
    expect(localStorage.getItem('cw:v1:sidebar.collapsed')).toBe('false');
    expect(document.documentElement.dataset.sidebar).toBeUndefined();
  });

  it('renders the sidebar in the desktop frame', () => {
    renderShell();
    expect(screen.getByRole('navigation', { name: 'fake desktop' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('mobile menu opens a dialog, traps focus, closes on Esc and returns focus to the button', async () => {
    const user = userEvent.setup();
    renderShell();
    const menu = screen.getByRole('button', { name: 'Open menu' });
    expect(menu).toHaveAttribute('aria-expanded', 'false');

    await user.click(menu);
    const dialog = screen.getByRole('dialog', { name: 'Menu' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(menu).toHaveAccessibleName('Close menu');
    expect(menu).toHaveAttribute('aria-expanded', 'true');
    expect(within(dialog).getByRole('navigation', { name: 'fake overlay' })).toBeInTheDocument();
    expect(dialog).toContainElement(document.activeElement as HTMLElement);

    // Tab cycles through the dialog and the close button, never the page behind.
    const first = within(dialog).getByRole('button', { name: 'first overlay' });
    const last = within(dialog).getByRole('button', { name: 'last overlay' });
    await user.tab();
    expect(first).toHaveFocus();
    await user.tab();
    expect(last).toHaveFocus();
    await user.tab();
    expect(menu).toHaveFocus();
    await user.tab();
    expect(first).toHaveFocus();
    await user.tab({ shift: true });
    expect(menu).toHaveFocus();
    await user.tab({ shift: true });
    expect(last).toHaveFocus();

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(menu).toHaveFocus();
    expect(menu).toHaveAccessibleName('Open menu');
  });

  it('the page behind the open overlay is inert', async () => {
    renderShell(<button type="button">page action</button>);
    await userEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    expect(screen.getByRole('main', { hidden: true })).toHaveAttribute('inert');
  });

  it('body scroll is locked while the overlay is open', async () => {
    renderShell();
    const menu = screen.getByRole('button', { name: 'Open menu' });
    await userEvent.click(menu);
    expect(document.body.style.overflow).toBe('hidden');
    await userEvent.click(menu);
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(document.body.style.overflow).toBe('');
  });

  it('closes the overlay when the window grows to desktop width', async () => {
    const media = stubMatchMedia({ '(min-width: 1024px)': false });
    renderShell();
    await userEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    media.set('(min-width: 1024px)', true);
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(document.body.style.overflow).toBe('');
  });

  it('top progress bar is active while a request is in flight', async () => {
    let release: () => void = () => {};
    const released = new Promise<void>((resolve) => (release = resolve));
    server.use(
      http.get(apiUrl('/api/algorithms'), async () => {
        await released;
        return HttpResponse.json(catalog);
      }),
    );
    function LoadsCatalog() {
      useCatalog();
      return null;
    }
    renderShell(<LoadsCatalog />);

    await waitFor(() => expect(document.querySelector('[data-progress-bar]')).not.toBeNull(), {
      timeout: 2000,
    });
    release();
    await waitFor(() => expect(document.querySelector('[data-progress-bar]')).toBeNull(), {
      timeout: 2000,
    });
  });
});
