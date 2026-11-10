import { z } from 'zod';

export interface Config {
  apiUrl: string;
}

const apiUrlSchema = z.url({ protocol: /^https?$/ });

let cached: Config | null = null;

export function getConfig(): Config {
  if (cached) return cached;

  // Referenced literally so Next.js inlines it into the client bundle.
  const raw = process.env.NEXT_PUBLIC_API_URL;
  const parsed = apiUrlSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      `NEXT_PUBLIC_API_URL must be an http(s) URL, got ${raw === undefined ? 'nothing' : JSON.stringify(raw)}. ` +
        'Set it in .env.local (see .env.example).',
    );
  }

  cached = { apiUrl: parsed.data.replace(/\/+$/, '') };
  return cached;
}

/** Version from package.json, injected by next.config.ts. */
export const APP_VERSION: string = process.env.NEXT_PUBLIC_APP_VERSION ?? 'dev';
