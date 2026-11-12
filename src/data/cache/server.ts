import 'server-only';
import { getApiStatus as fetchApiStatus, type ApiStatus } from '@/data/api/status';
import { isAppFailure } from '@/domain';

/** How long one answer serves every visitor. */
const FRESH_MS = 60_000;

// Every visitor's check comes from this server's IP, and the API limits each IP: one answer a
// minute is plenty for a status line, and a 429 keeps the last answer instead of "asleep".
let last: { at: number; value: ApiStatus } | null = null;

export async function getApiStatus(signal?: AbortSignal): Promise<ApiStatus> {
  if (last && Date.now() - last.at < FRESH_MS) return last.value;
  try {
    const value = await fetchApiStatus(signal);
    last = { at: Date.now(), value };
    return value;
  } catch (e) {
    if (last && isAppFailure(e) && e.error.kind === 'rateLimited') return last.value;
    throw e;
  }
}
