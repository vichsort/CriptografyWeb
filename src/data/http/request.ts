import { getConfig } from '@/config/env';
import { AppFailure } from '@/domain';
import { normalizeHttpError } from './normalize';

export interface RequestOptions {
  method: 'GET' | 'POST';
  path: string;
  body?: unknown;
  signal?: AbortSignal;
  /** Long enough to outlast a cold start of the free backend. */
  timeoutMs?: number;
  /** After this long without an answer, the server is probably waking up. */
  wakingAfterMs?: number;
  onWaking?: () => void;
}

const DEFAULT_TIMEOUT_MS = 75_000;
const DEFAULT_WAKING_AFTER_MS = 3_000;
const NETWORK_RETRIES = 1;

function parseJson(text: string): { ok: true; value: unknown } | { ok: false } {
  if (text === '') return { ok: false };
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false };
  }
}

function fail(error: ConstructorParameters<typeof AppFailure>[0]): never {
  throw new AppFailure(error);
}

/**
 * Sends one JSON request to the API. Resolves with the parsed body of a 2xx response and throws
 * an AppFailure for everything else. A request that got an HTTP response is never retried; a
 * pure network failure is retried once.
 */
export async function request(opts: RequestOptions): Promise<unknown> {
  const timeout = new AbortController();
  const signal = opts.signal ? AbortSignal.any([opts.signal, timeout.signal]) : timeout.signal;
  const timer = setTimeout(() => timeout.abort(), opts.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  const waking = opts.onWaking
    ? setTimeout(opts.onWaking, opts.wakingAfterMs ?? DEFAULT_WAKING_AFTER_MS)
    : undefined;

  const init: RequestInit = {
    method: opts.method,
    credentials: 'omit',
    headers:
      opts.body === undefined
        ? { Accept: 'application/json' }
        : { Accept: 'application/json', 'Content-Type': 'application/json' },
    signal,
  };
  if (opts.body !== undefined) init.body = JSON.stringify(opts.body);

  try {
    const response = await send(`${getConfig().apiUrl}${opts.path}`, init, signal);
    const parsed = parseJson(await response.text());
    if (!response.ok) {
      fail(normalizeHttpError(response.status, parsed.ok ? parsed.value : null, response.headers));
    }
    if (!parsed.ok) fail({ kind: 'contract', issues: 'The response body is not JSON.' });
    return parsed.value;
  } catch (e) {
    if (e instanceof AppFailure) throw e;
    if (timeout.signal.aborted) fail({ kind: 'timeout' });
    if (signal.aborted) fail({ kind: 'aborted' });
    fail({ kind: 'network' });
  } finally {
    clearTimeout(timer);
    clearTimeout(waking);
  }
}

async function send(url: string, init: RequestInit, signal: AbortSignal): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fetch(url, init);
    } catch (e) {
      if (signal.aborted || attempt >= NETWORK_RETRIES) throw e;
    }
  }
}

/** Starts waking the backend on first load. The response is opaque and ignored. */
export function pingApi(): void {
  try {
    fetch(`${getConfig().apiUrl}/`, { mode: 'no-cors', credentials: 'omit' }).catch(() => {});
  } catch {
    // Missing config or no fetch: warming up is best effort.
  }
}
