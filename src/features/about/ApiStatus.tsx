import { connection } from 'next/server';
import { about } from '@/content';
import { getApiStatus } from '@/data/cache/server';

/** How long the page waits for a sleeping server before saying so. */
const STATUS_TIMEOUT_MS = 4_000;

/**
 * The API's name, status and version, read on the server at request time. A sleeping or
 * unreachable server is reported, never thrown: the page around it must still render.
 */
export async function ApiStatus({ timeoutMs = STATUS_TIMEOUT_MS }: { timeoutMs?: number }) {
  // Read per request, never at build: the clock and the API are runtime data.
  await connection();
  let status: Awaited<ReturnType<typeof getApiStatus>> | null = null;
  try {
    status = await getApiStatus(AbortSignal.timeout(timeoutMs));
  } catch {
    status = null;
  }

  if (!status)
    return <p className="text-callout text-label-secondary">{about.status.unavailable}</p>;
  const rows = [
    [about.status.name, status.name],
    [about.status.state, status.status],
    [about.status.version, status.version],
  ] as const;
  return (
    <dl className="space-y-1 text-callout">
      {rows.map(([label, value]) => (
        <div key={label} className="flex gap-4">
          <dt className="w-16 shrink-0 text-label-secondary">{label}</dt>
          <dd className="font-mono text-label">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
