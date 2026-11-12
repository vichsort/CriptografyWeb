import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AlgorithmNotFound } from './AlgorithmNotFound';

describe('AlgorithmNotFound', () => {
  it('asks search engines not to index it, and names itself in the title', () => {
    render(<AlgorithmNotFound />);
    expect(document.head.querySelector('meta[name="robots"]')).toHaveAttribute(
      'content',
      'noindex',
    );
    expect(document.title).toBe('Algorithm not found · Criptografy');
  });
});
