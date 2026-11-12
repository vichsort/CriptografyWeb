import { afterEach, describe, expect, it } from 'vitest';
import { STORAGE_PREFIX } from '@/data/persistence';
import { SIDEBAR_STORAGE_KEY, sidebarScript } from './sidebar-script';
import { themeScript } from './theme-script';

const run = () => new Function(sidebarScript())();
const state = () => document.documentElement.dataset.sidebar;

afterEach(() => {
  delete document.documentElement.dataset.sidebar;
});

describe('sidebarScript', () => {
  it('reads the key the preferences repository writes', () => {
    expect(SIDEBAR_STORAGE_KEY).toBe(`${STORAGE_PREFIX}sidebar.collapsed`);
  });

  it('marks the document collapsed before paint when stored collapsed', () => {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, 'true');
    run();
    expect(state()).toBe('collapsed');
  });

  it.each([null, 'false', '"yes"', '{bad json'])('leaves the sidebar open for %s', (stored) => {
    if (stored !== null) localStorage.setItem(SIDEBAR_STORAGE_KEY, stored);
    run();
    expect(state()).toBeUndefined();
  });

  it('still runs when it follows the theme script in the same tag', () => {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, 'true');
    expect(() => new Function(themeScript() + sidebarScript())()).not.toThrow();
    expect(state()).toBe('collapsed');
  });

  it('survives a storage that throws', () => {
    const original = Object.getOwnPropertyDescriptor(window, 'localStorage');
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('blocked');
      },
    });
    try {
      expect(run).not.toThrow();
      expect(state()).toBeUndefined();
    } finally {
      if (original) Object.defineProperty(window, 'localStorage', original);
    }
  });
});
