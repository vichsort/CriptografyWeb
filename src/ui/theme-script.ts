/** The key the preferences repository writes the theme to (src/data/persistence). */
export const THEME_STORAGE_KEY = 'cw:v1:theme';

/** Browser chrome color per theme: the header material over the background. */
export const THEME_COLORS = { light: '#f2f2f6', dark: '#121217' } as const;

/**
 * Inline script for <head>. It runs before the first paint: reads the stored theme, resolves
 * "system" through matchMedia, and sets data-theme, color-scheme and the theme-color meta, so the
 * page never flashes the wrong theme. Anything unexpected falls back to the system theme.
 */
export function themeScript(): string {
  return `(function(){var d=document.documentElement,t;try{t=JSON.parse(localStorage.getItem(${JSON.stringify(
    THEME_STORAGE_KEY,
  )})||'null')}catch(e){}if(t!=='light'&&t!=='dark'){try{t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}catch(e){t='light'}}d.dataset.theme=t;d.style.colorScheme=t;var c=t==='dark'?${JSON.stringify(
    THEME_COLORS.dark,
  )}:${JSON.stringify(THEME_COLORS.light)};document.querySelectorAll('meta[name="theme-color"]').forEach(function(m){m.removeAttribute('media');m.setAttribute('content',c)})})()`;
}
