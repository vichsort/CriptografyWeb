// @vitest-environment node
import { afterAll, it } from 'vitest';

// Node 25+ exposes a localStorage global without working methods unless --localstorage-file is set.
afterAll(() => {
  Reflect.deleteProperty(globalThis, 'localStorage');
});

it('tolerates a localStorage global without working methods', () => {
  Object.defineProperty(globalThis, 'localStorage', { value: {}, configurable: true });
});
