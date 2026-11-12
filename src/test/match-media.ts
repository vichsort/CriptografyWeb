import { vi } from 'vitest';

type Listener = (event: MediaQueryListEvent) => void;

/**
 * jsdom has no matchMedia. This stub answers each query from `matches` and lets a test flip one,
 * notifying the listeners as a browser would.
 */
export function stubMatchMedia(initial: Record<string, boolean> = {}) {
  const matches = new Map(Object.entries(initial));
  const listeners = new Map<string, Set<Listener>>();

  const listFor = (query: string) => {
    let set = listeners.get(query);
    if (!set) listeners.set(query, (set = new Set()));
    return set;
  };

  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      get matches() {
        return matches.get(query) ?? false;
      },
      media: query,
      onchange: null,
      addEventListener: (_: 'change', l: Listener) => listFor(query).add(l),
      removeEventListener: (_: 'change', l: Listener) => listFor(query).delete(l),
      addListener: (l: Listener) => listFor(query).add(l),
      removeListener: (l: Listener) => listFor(query).delete(l),
      dispatchEvent: () => true,
    })),
  );

  return {
    set(query: string, value: boolean) {
      matches.set(query, value);
      listFor(query).forEach((l) => l({ matches: value, media: query } as MediaQueryListEvent));
    },
  };
}
