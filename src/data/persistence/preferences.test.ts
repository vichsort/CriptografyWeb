import { describe, expect, it, vi } from 'vitest';
import { createPreferences } from './preferences';
import { createStorage } from './storage';

function fresh() {
  return createPreferences(createStorage(localStorage));
}

describe('preferences', () => {
  it('starts from the defaults', () => {
    const prefs = fresh();
    expect(prefs.theme()).toBe('system');
    expect(prefs.sidebarCollapsed()).toBe(false);
    expect(prefs.openFamilies()).toEqual(['encryption']);
  });

  it('round-trips each key', () => {
    const prefs = fresh();
    prefs.setTheme('dark');
    prefs.setSidebarCollapsed(true);
    prefs.setOpenFamilies(['hashing', 'encoding']);
    const again = fresh();
    expect(again.theme()).toBe('dark');
    expect(again.sidebarCollapsed()).toBe(true);
    expect(again.openFamilies()).toEqual(['hashing', 'encoding']);
    expect(localStorage.getItem('cw:v1:sidebar.openFamilies')).toBe('["hashing","encoding"]');
  });

  it('falls back when a stored value is invalid', () => {
    localStorage.setItem('cw:v1:theme', '"purple"');
    localStorage.setItem('cw:v1:sidebar.openFamilies', '["encryption","nope"]');
    const prefs = fresh();
    expect(prefs.theme()).toBe('system');
    expect(prefs.openFamilies()).toEqual(['encryption']);
  });

  it('returns the same openFamilies array until it changes', () => {
    const prefs = fresh();
    const first = prefs.openFamilies();
    expect(prefs.openFamilies()).toBe(first);
    prefs.setOpenFamilies(['hashing']);
    expect(prefs.openFamilies()).not.toBe(first);
  });

  it('subscribe fires on set and on storage events', () => {
    const prefs = fresh();
    const listener = vi.fn();
    const unsubscribe = prefs.subscribe(listener);

    prefs.setTheme('light');
    expect(listener).toHaveBeenCalledTimes(1);

    window.dispatchEvent(new StorageEvent('storage', { key: 'cw:v1:theme' }));
    expect(listener).toHaveBeenCalledTimes(2);

    window.dispatchEvent(new StorageEvent('storage', { key: 'unrelated' }));
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
    prefs.setTheme('dark');
    window.dispatchEvent(new StorageEvent('storage', { key: 'cw:v1:theme' }));
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
