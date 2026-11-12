import { describe, expect, it, vi } from 'vitest';
import * as api from './index';
import { getApiStatus } from './status';

// The real module throws outside a React Server Components build.
vi.mock('server-only', () => ({}));

describe('getApiStatus', () => {
  it('parses name/status/version', async () => {
    await expect(getApiStatus()).resolves.toEqual({
      name: 'Criptografy API',
      status: 'healthy',
      version: '1.0.0',
    });
  });

  it('is not offered to the browser through the api index', () => {
    expect(api).not.toHaveProperty('getApiStatus');
  });
});
