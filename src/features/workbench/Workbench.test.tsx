import { QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { MotionGlobalConfig } from 'motion/react';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { createQueryClient } from '@/data/cache';
import { messages } from '@/test/fixtures/messages';
import { apiUrl, server } from '@/test/msw/server';
import { setUrl } from '@/test/next-navigation';
import { Workbench } from './Workbench';

vi.mock('next/navigation', async () => (await import('@/test/next-navigation')).navigationMock);

// Reveals and exits finish at once, so a test reads the settled screen.
beforeAll(() => {
  MotionGlobalConfig.skipAnimations = true;
});
afterAll(() => {
  MotionGlobalConfig.skipAnimations = false;
});

afterEach(() => {
  vi.useRealTimers();
});

interface Sent {
  algorithm: string;
  input: string;
  options?: Record<string, unknown>;
}

/** Answers one endpoint with `reply`, keeping every body it received. */
function answer(path: string, reply: (body: Sent, hit: number) => Response | Promise<Response>) {
  const bodies: Sent[] = [];
  const signals: AbortSignal[] = [];
  server.use(
    http.post(apiUrl(path), async ({ request }) => {
      const body = (await request.json()) as Sent;
      bodies.push(body);
      signals.push(request.signal);
      return reply(body, bodies.length);
    }),
  );
  return { bodies, signals };
}

/** A promise the test resolves by hand, to hold a response open. */
function gate() {
  let open = () => {};
  const opened = new Promise<void>((resolve) => (open = resolve));
  return { opened, open };
}

async function renderWorkbench(id: string, url = `/algorithms/${id}`, timers = false) {
  setUrl(url);
  const user = userEvent.setup(timers ? { advanceTimers: vi.advanceTimersByTime } : {});
  render(
    <QueryClientProvider client={createQueryClient()}>
      <Workbench id={id} />
    </QueryClientProvider>,
  );
  await screen.findByRole('heading', { level: 1 });
  return user;
}

const input = () => screen.getByRole('textbox', { name: 'Input' });
const runButton = (name: RegExp | string) => screen.getByRole('button', { name });
const modes = () => screen.queryByRole('radiogroup', { name: 'Mode' });
const result = () => screen.queryByRole('region', { name: 'Result' });
/** Message titles, not the copy of them in the screen's live region. */
const title = { selector: 'strong' } as const;
/** The button once its loading label has finished leaving. */
const settledButton = (name: string) => screen.findByRole('button', { name });

async function type(user: ReturnType<typeof userEvent.setup>, text: string) {
  await user.clear(input());
  // Typing "{" or "[" means a key descriptor to user-event; paste keeps the text as is.
  await user.click(input());
  await user.paste(text);
}

describe('Workbench', () => {
  it('renders encrypt/decrypt switch for caesar, none for sha-256, encode/decode for hex', async () => {
    await renderWorkbench('caesar');
    expect(screen.getByRole('heading', { level: 1, name: 'Shift letters' })).toBeInTheDocument();
    expect(screen.getByText('Caesar · educational · Key required')).toBeInTheDocument();
    expect(
      within(modes()!)
        .getAllByRole('radio')
        .map((r) => r.textContent),
    ).toEqual(['Encrypt', 'Decrypt']);
    expect(screen.getByRole('region', { name: 'Options' })).toBeInTheDocument();
  });

  it('shows no mode switch and no options card for sha-256', async () => {
    await renderWorkbench('sha-256');
    expect(modes()).toBeNull();
    expect(screen.queryByRole('region', { name: 'Options' })).toBeNull();
    expect(runButton('Generate hash')).toBeEnabled();
  });

  it('offers encode and decode for hex, with its note at the end', async () => {
    await renderWorkbench('hex');
    expect(
      within(modes()!)
        .getAllByRole('radio')
        .map((r) => r.textContent),
    ).toEqual(['Encode', 'Decode']);
    expect(screen.getByText(/To decode, use an even number/)).toBeInTheDocument();
  });

  it('runs caesar shift 3 on "Veni, vidi, vici." and shows "Yhql, ylgl, ylfl."', async () => {
    const sent = answer('/api/encrypt', () => HttpResponse.json({ result: 'Yhql, ylgl, ylfl.' }));
    const user = await renderWorkbench('caesar');
    await user.type(screen.getByLabelText('Shift'), '3');
    await type(user, 'Veni, vidi, vici.');
    await user.click(runButton('Encrypt'));

    const panel = await screen.findByRole('region', { name: 'Result' });
    expect(within(panel).getByText('Yhql, ylgl, ylfl.')).toBeInTheDocument();
    expect(within(panel).getByText('17 characters')).toBeInTheDocument();
    expect(sent.bodies).toEqual([
      { algorithm: 'caesar', input: 'Veni, vidi, vici.', options: { shift: 3 } },
    ]);
    expect(screen.getByTestId('workbench-announcer')).toHaveTextContent('Result ready');
  });

  it('runs with ⌘/Ctrl+Enter from the input', async () => {
    const sent = answer('/api/hash', () => HttpResponse.json({ result: 'abc' }));
    const user = await renderWorkbench('sha-256');
    await type(user, 'x');
    await user.keyboard('{Control>}{Enter}{/Control}');
    await screen.findByRole('region', { name: 'Result' });
    expect(sent.bodies).toHaveLength(1);
  });

  it('workbench sends whitespace-padded input untouched', async () => {
    const sent = answer('/api/hash', () => HttpResponse.json({ result: 'h' }));
    const user = await renderWorkbench('sha-256');
    await type(user, '  padded \n\t ');
    await user.click(runButton('Generate hash'));
    await screen.findByRole('region', { name: 'Result' });
    expect(sent.bodies[0]?.input).toBe('  padded \n\t ');
    expect(sent.bodies[0]).not.toHaveProperty('options');
  });

  it('?mode=decrypt preselects Decrypt and changing mode updates the URL', async () => {
    const user = await renderWorkbench('caesar', '/algorithms/caesar?mode=decrypt');
    expect(screen.getByRole('radio', { name: 'Decrypt' })).toHaveAttribute('aria-checked', 'true');
    expect(runButton('Decrypt')).toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: 'Encrypt' }));
    expect(window.location.search).toBe('?mode=encrypt');
    expect(window.location.pathname).toBe('/algorithms/caesar');
    expect(runButton('Encrypt')).toBeInTheDocument();
  });

  it('ignores a ?mode= the algorithm does not support', async () => {
    await renderWorkbench('sha-256', '/algorithms/sha-256?mode=decrypt');
    expect(runButton('Generate hash')).toBeInTheDocument();
  });

  it('switching mode while running aborts and never shows the stale result', async () => {
    const held = gate();
    const enc = answer('/api/encode', async () => {
      await held.opened;
      return HttpResponse.json({ result: 'stale' });
    });
    const user = await renderWorkbench('hex');
    await type(user, 'hi');
    await user.click(runButton('Encode'));
    await waitFor(() => expect(enc.signals).toHaveLength(1));

    await user.click(screen.getByRole('radio', { name: 'Decode' }));
    expect(enc.signals[0]?.aborted).toBe(true);
    held.open();
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
    expect(screen.queryByText('stale')).toBeNull();
    expect(result()).toBeNull();
    expect(await settledButton('Decode')).not.toHaveAttribute('aria-busy');
  });

  it('⌘/Ctrl+Enter while running does not send it again', async () => {
    const held = gate();
    const sent = answer('/api/encrypt', async () => {
      await held.opened;
      return HttpResponse.json({ result: 'once' });
    });
    const user = await renderWorkbench('aes-256-gcm');
    await user.type(screen.getByLabelText('Password'), 'pw');
    await type(user, 'secret');
    await user.click(runButton('Encrypt'));
    await waitFor(() => expect(sent.signals).toHaveLength(1));

    await user.keyboard('{Control>}{Enter}{/Control}');
    await user.keyboard('{Control>}{Enter}{/Control}');
    held.open();
    expect(await screen.findByText('once')).toBeInTheDocument();
    expect(sent.signals).toHaveLength(1);
    expect(sent.signals[0]?.aborted).toBe(false);
  });

  it('keeps the last result on screen while the next run is pending', async () => {
    const held = gate();
    answer('/api/encode', async (body) => {
      if (body.input === 'ho') await held.opened;
      return HttpResponse.json({ result: body.input === 'hi' ? '6869' : '686f' });
    });
    const user = await renderWorkbench('hex');
    await type(user, 'hi');
    await user.click(runButton('Encode'));
    await screen.findByText('6869');

    await type(user, 'ho');
    await user.click(runButton('Encode'));
    expect(screen.getByText('6869')).toBeInTheDocument();
    held.open();
    expect(await screen.findByText('686f')).toBeInTheDocument();
  });

  it('identical deterministic re-run hits the API once', async () => {
    const sent = answer('/api/encode', () => HttpResponse.json({ result: '6869' }));
    const user = await renderWorkbench('hex');
    await type(user, 'hi');
    await user.click(runButton('Encode'));
    await screen.findByText('6869');
    await user.click(await settledButton('Encode'));
    await screen.findByText('6869');
    expect(sent.bodies).toHaveLength(1);
  });

  it('hill [[2,4],[1,3]] shows the form feedback, and on run shows the API message', async () => {
    answer('/api/encrypt', () =>
      HttpResponse.json({ message: messages.hillNotInvertible }, { status: 422 }),
    );
    const user = await renderWorkbench('hill');
    for (const [label, value] of [
      ['Row 1, column 1', '2'],
      ['Row 1, column 2', '4'],
      ['Row 2, column 1', '1'],
      ['Row 2, column 2', '3'],
    ] as const) {
      await user.clear(screen.getByLabelText(label));
      await user.type(screen.getByLabelText(label), value);
    }
    expect(screen.getByText('det(K) = 2 · gcd(2, 26) = 2')).toBeInTheDocument();

    await type(user, 'Hello');
    await user.click(runButton('Encrypt'));
    expect(await screen.findByText("Couldn't encrypt", title)).toBeInTheDocument();
    expect(screen.getByText(messages.hillNotInvertible)).toBeInTheDocument();
    expect(screen.getByTestId('workbench-announcer')).toHaveTextContent("Couldn't encrypt");
  });

  it('hex decode "ff" shows "The result is binary data" as info', async () => {
    answer('/api/decode', () =>
      HttpResponse.json({ message: messages.nonTextResult }, { status: 422 }),
    );
    const user = await renderWorkbench('hex', '/algorithms/hex?mode=decode');
    await type(user, 'ff');
    await user.click(runButton('Decode'));
    expect(await screen.findByText('The result is binary data', title)).toBeInTheDocument();
    expect(screen.queryByText("Couldn't decode")).toBeNull();
  });

  it('429 shows "Wait a moment" and re-enables Run after the cooldown', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    answer('/api/hash', () =>
      HttpResponse.json({ message: 'Too Many Attempts.' }, { status: 429 }),
    );
    const user = await renderWorkbench('sha-256', undefined, true);
    await user.click(runButton('Generate hash'));
    expect(await screen.findByText('Wait a moment', title)).toBeInTheDocument();
    expect(runButton('Generate hash')).toBeDisabled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(59_000);
    });
    expect(runButton('Generate hash')).toBeDisabled();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_100);
    });
    expect(runButton('Generate hash')).toBeEnabled();
  });

  it('uses Retry-After for the cooldown when the API sends it', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    answer('/api/hash', () =>
      HttpResponse.json(
        { message: 'Too Many Attempts.' },
        { status: 429, headers: { 'Retry-After': '5' } },
      ),
    );
    const user = await renderWorkbench('sha-256', undefined, true);
    await user.click(runButton('Generate hash'));
    await screen.findByText('Wait a moment', title);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5_100);
    });
    expect(runButton('Generate hash')).toBeEnabled();
  });

  it('keeps the rate-limit message and the cooldown across a mode switch', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    answer('/api/encode', () =>
      HttpResponse.json({ message: 'Too Many Attempts.' }, { status: 429 }),
    );
    const user = await renderWorkbench('hex', undefined, true);
    await user.click(runButton('Encode'));
    await screen.findByText('Wait a moment', title);

    await user.click(screen.getByRole('radio', { name: 'Decode' }));
    expect(screen.getByText('Wait a moment', title)).toBeInTheDocument();
    expect(runButton('Decode')).toBeDisabled();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_100);
    });
    expect(runButton('Decode')).toBeEnabled();
  });

  it('keeps the cooldown on another algorithm, since the limit is per client', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    answer('/api/hash', () =>
      HttpResponse.json({ message: 'Too Many Attempts.' }, { status: 429 }),
    );
    const user = await renderWorkbench('sha-256', undefined, true);
    await user.click(runButton('Generate hash'));
    await screen.findByText('Wait a moment', title);
    cleanup();

    await renderWorkbench('hex', undefined, true);
    expect(runButton('Encode')).toBeDisabled();
    expect(screen.getByText('Wait a moment', title)).toBeInTheDocument();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_100);
    });
    expect(runButton('Encode')).toBeEnabled();
  });

  it('a 404 from the API shows the not-found screen', async () => {
    answer('/api/hash', () =>
      HttpResponse.json({ message: messages.algorithmNotFound }, { status: 404 }),
    );
    const user = await renderWorkbench('sha-256');
    await user.click(runButton('Generate hash'));
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Algorithm not found' }),
    ).toBeInTheDocument();
  });

  it('marks the input when the API rejects it, and the options card for options', async () => {
    answer('/api/encrypt', (body) =>
      HttpResponse.json(
        {
          message: 'The given data was invalid.',
          errors: body.input === 'bad'
            ? { input: ['The input field must be a string.'] }
            : { options: ['The options field must be an array.'] },
        },
        { status: 422 },
      ),
    );
    const user = await renderWorkbench('caesar');
    await user.type(screen.getByLabelText('Shift'), '3');
    await type(user, 'bad');
    await user.click(runButton('Encrypt'));
    await waitFor(() => expect(input()).toHaveAttribute('aria-invalid', 'true'));
    expect(input()).toHaveAccessibleDescription('The input field must be a string.');

    await type(user, 'other');
    await user.click(await settledButton('Encrypt'));
    const options = screen.getByRole('region', { name: 'Options' });
    expect(
      await within(options).findByText('The options field must be an array.'),
    ).toBeInTheDocument();
  });

  it('slow response shows waking copy after 3s', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const held = gate();
    answer('/api/hash', async () => {
      await held.opened;
      return HttpResponse.json({ result: 'done' });
    });
    const user = await renderWorkbench('sha-256', undefined, true);
    await user.click(runButton(/Generate hash/));
    expect(screen.queryByText('Waking up the server…', title)).toBeNull();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3_100);
    });
    expect(screen.getByText('Waking up the server…', title)).toBeInTheDocument();
    expect(screen.getByTestId('workbench-announcer')).toHaveTextContent('Waking up the server…');

    held.open();
    expect(await screen.findByText('done')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText('Waking up the server…', title)).toBeNull());
  });

  it('Use as input moves the result and flips the mode', async () => {
    answer('/api/encode', () => HttpResponse.json({ result: '6869' }));
    const user = await renderWorkbench('hex');
    await type(user, 'hi');
    await user.click(runButton('Encode'));
    await screen.findByText('6869');

    await user.click(screen.getByRole('button', { name: 'Use as input' }));
    expect(input()).toHaveValue('6869');
    expect(screen.getByRole('radio', { name: 'Decode' })).toHaveAttribute('aria-checked', 'true');
    expect(window.location.search).toBe('?mode=decode');
    expect(screen.getByTestId('workbench-announcer')).not.toHaveTextContent('Result ready');
    await waitFor(() => expect(result()).toBeNull());
  });

  it('offers no Use as input with a single operation', async () => {
    answer('/api/hash', () => HttpResponse.json({ result: 'abc' }));
    const user = await renderWorkbench('sha-256');
    await user.click(runButton('Generate hash'));
    await screen.findByRole('region', { name: 'Result' });
    expect(screen.queryByRole('button', { name: 'Use as input' })).toBeNull();
  });

  it('Copy writes to the clipboard and confirms', async () => {
    answer('/api/encode', () => HttpResponse.json({ result: '6869' }));
    const user = await renderWorkbench('hex');
    await type(user, 'hi');
    await user.click(runButton('Encode'));
    await screen.findByText('6869');

    await user.click(screen.getByRole('button', { name: 'Copy' }));
    expect(await navigator.clipboard.readText()).toBe('6869');
    expect(screen.getByRole('button', { name: 'Copied ✓' })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument(), {
      timeout: 2_000,
    });
  });

  it('secret option is masked', async () => {
    await renderWorkbench('aes-256-gcm');
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
  });

  it('keeps Run disabled while an option is invalid, and says why once edited', async () => {
    const user = await renderWorkbench('caesar');
    expect(runButton('Encrypt')).toBeDisabled();
    expect(screen.queryByText('Enter a whole number, like 3 or -1.')).toBeNull();

    await user.type(screen.getByLabelText('Shift'), '-');
    expect(screen.getByText('Enter a whole number, like 3 or -1.')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Shift'), '1');
    expect(runButton('Encrypt')).toBeEnabled();
  });

  it('says why Run is off once the input is edited, even for an untouched option', async () => {
    const user = await renderWorkbench('caesar');
    await type(user, 'Veni');
    expect(screen.getByText('Enter a whole number, like 3 or -1.')).toBeInTheDocument();
    expect(runButton('Encrypt')).toBeDisabled();
  });

  it('unknown id after catalog loads renders not-found', async () => {
    setUrl('/algorithms/nope');
    render(
      <QueryClientProvider client={createQueryClient()}>
        <Workbench id="nope" />
      </QueryClientProvider>,
    );
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Algorithm not found' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'See all algorithms' })).toHaveAttribute(
      'href',
      '/algorithms',
    );
  });

  it('counts the characters of the input', async () => {
    const user = await renderWorkbench('sha-256');
    await type(user, 'héllo');
    expect(screen.getByText('5 characters')).toBeInTheDocument();
    fireEvent.change(input(), { target: { value: '' } });
    expect(screen.getByText('0 characters')).toBeInTheDocument();
  });
});
