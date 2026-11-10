import { afterEach, describe, expect, it, vi } from 'vitest';

async function loadConfig() {
  vi.resetModules();
  const { getConfig } = await import('./env');
  return getConfig;
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('getConfig', () => {
  it('returns apiUrl without trailing slash', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'http://api.test/');
    const getConfig = await loadConfig();
    expect(getConfig()).toEqual({ apiUrl: 'http://api.test' });
  });

  it('throws a readable error when missing', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', undefined);
    const getConfig = await loadConfig();
    expect(() => getConfig()).toThrow(/NEXT_PUBLIC_API_URL/);
  });

  it('throws on a non-url value', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'not a url');
    const getConfig = await loadConfig();
    expect(() => getConfig()).toThrow(/NEXT_PUBLIC_API_URL/);
  });

  it('memoizes the parsed config', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'http://api.test');
    const getConfig = await loadConfig();
    const first = getConfig();
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'http://other.test');
    expect(getConfig()).toBe(first);
  });
});
