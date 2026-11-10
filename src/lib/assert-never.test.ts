import { expect, it } from 'vitest';
import { assertNever } from './assert-never';

it('throws when an impossible value reaches it', () => {
  expect(() => assertNever('x' as never)).toThrow(/x/);
});
