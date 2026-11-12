import { QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { MotionGlobalConfig } from 'motion/react';
import { createHash } from 'node:crypto';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { createQueryClient } from '@/data/cache';
import { startCooldown } from '@/features/workbench';
import { apiUrl, server } from '@/test/msw/server';
import { CompareHash } from './CompareHash';

beforeAll(() => {
  MotionGlobalConfig.skipAnimations = true;
});
afterAll(() => {
  MotionGlobalConfig.skipAnimations = false;
});

afterEach(() => {
  vi.useRealTimers();
});

const sha256 = (text: string) => createHash('sha256').update(text).digest('hex');

/** A hash endpoint that really hashes, keeping what it received. */
function hashing() {
  const inputs: string[] = [];
  server.use(
    http.post(apiUrl('/api/hash'), async ({ request }) => {
      const body = (await request.json()) as { algorithm: string; input: string };
      inputs.push(body.input);
      return HttpResponse.json({ result: sha256(body.input) });
    }),
  );
  return inputs;
}

function renderCompare() {
  const user = userEvent.setup();
  render(
    <QueryClientProvider client={createQueryClient()}>
      <CompareHash />
    </QueryClientProvider>,
  );
  return user;
}

async function fill(user: ReturnType<typeof userEvent.setup>, label: string, text: string) {
  await user.click(screen.getByRole('textbox', { name: label }));
  await user.paste(text);
}

const title = { selector: 'strong' } as const;

describe('CompareHash', () => {
  it('has its title, two texts and a Compare button', () => {
    renderCompare();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Compare two texts by hash' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Text A' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Text B' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Compare' })).toBeInTheDocument();
  });

  it('equal texts match', async () => {
    const inputs = hashing();
    const user = renderCompare();
    await fill(user, 'Text A', 'hello');
    await fill(user, 'Text B', 'hello');
    await user.click(screen.getByRole('button', { name: 'Compare' }));

    expect(await screen.findByText('Same text: the hashes match.', title)).toBeInTheDocument();
    for (const name of ['SHA-256 of A', 'SHA-256 of B']) {
      const panel = screen.getByRole('region', { name });
      expect(within(panel).getByText(sha256('hello'))).toBeInTheDocument();
    }
    // Hashing is memoized: the same text is sent once and both sides share the answer.
    expect(inputs).toEqual(['hello']);
    expect(screen.getByTestId('compare-announcer')).toHaveTextContent(
      'Same text: the hashes match.',
    );
  });

  it('texts differing only by a trailing space do not match', async () => {
    const inputs = hashing();
    const user = renderCompare();
    await fill(user, 'Text A', 'hello');
    await fill(user, 'Text B', 'hello ');
    await user.click(screen.getByRole('button', { name: 'Compare' }));

    expect(
      await screen.findByText("Different texts: the hashes don't match.", title),
    ).toBeInTheDocument();
    expect(inputs.sort()).toEqual(['hello', 'hello ']);
    expect(
      within(screen.getByRole('region', { name: 'SHA-256 of B' })).getByText(sha256('hello ')),
    ).toBeInTheDocument();
  });

  it('errors use errorCopy', async () => {
    server.use(
      http.post(apiUrl('/api/hash'), () =>
        HttpResponse.json({ message: 'The input field must be a string.' }, { status: 422 }),
      ),
    );
    const user = renderCompare();
    await fill(user, 'Text A', 'a');
    await user.click(screen.getByRole('button', { name: 'Compare' }));

    expect(await screen.findByText("Couldn't generate the hash", title)).toBeInTheDocument();
    expect(screen.getByText('The input field must be a string.')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'SHA-256 of A' })).toBeNull();
  });

  it('forgets the verdict once a text changes', async () => {
    hashing();
    const user = renderCompare();
    await fill(user, 'Text A', 'x');
    await fill(user, 'Text B', 'x');
    await user.click(screen.getByRole('button', { name: 'Compare' }));
    await screen.findByText('Same text: the hashes match.', title);

    await fill(user, 'Text B', 'y');
    expect(screen.queryByText('Same text: the hashes match.', title)).toBeNull();
  });

  it('explains a cooldown that started elsewhere', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    startCooldown(5);
    renderCompare();
    expect(screen.getByRole('button', { name: 'Compare' })).toBeDisabled();
    expect(screen.getByText('Wait a moment', title)).toBeInTheDocument();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5_100);
    });
    expect(screen.getByRole('button', { name: 'Compare' })).toBeEnabled();
    expect(screen.queryByText('Wait a moment', title)).toBeNull();
  });

  it('cancels the other text when one fails', async () => {
    const signals: Record<string, AbortSignal> = {};
    server.use(
      http.post(apiUrl('/api/hash'), async ({ request }) => {
        const { input } = (await request.json()) as { input: string };
        signals[input] = request.signal;
        if (input === 'bad') return HttpResponse.json({ message: 'nope' }, { status: 422 });
        await new Promise(() => {});
        return HttpResponse.json({ result: 'never' });
      }),
    );
    const user = renderCompare();
    await fill(user, 'Text A', 'bad');
    await fill(user, 'Text B', 'slow');
    await user.click(screen.getByRole('button', { name: 'Compare' }));
    await screen.findByText("Couldn't generate the hash", title);
    await waitFor(() => expect(signals.slow?.aborted).toBe(true));
  });
});
