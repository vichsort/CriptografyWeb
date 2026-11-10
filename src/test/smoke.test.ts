import { describe, expect, it } from 'vitest';
import { apiUrl } from '@/test/msw/server';

describe('test harness', () => {
  it('resolves api urls against the test base', () => {
    expect(apiUrl('/api/algorithms')).toBe('http://api.test/api/algorithms');
  });

  it('has jest-dom matchers', () => {
    document.body.innerHTML = '<p>x</p>';
    expect(document.querySelector('p')).toBeInTheDocument();
  });
});
