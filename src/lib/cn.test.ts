import { expect, it } from 'vitest';
import { cn } from './cn';

it('joins class names and skips falsy values', () => {
  expect(cn('a', false, 'b', null, undefined, '', 'c')).toBe('a b c');
});
