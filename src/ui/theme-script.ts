/** The key the preferences repository writes the theme to (src/data/persistence). */
export const THEME_STORAGE_KEY = 'cw:v1:theme';

/** Browser chrome color per theme: the header material over the background. */
export const THEME_COLORS = { light: '#f2f2f6', dark: '#121217' } as const;

/**
 * Inline script for <head>. It runs before the first paint, so the page never flashes the wrong
 * theme. An explicit light or dark theme sets data-theme, color-scheme and the theme-color metas
 * (keeping their media queries, so going back to the system theme only rewrites their content).
 * The system theme, and anything unexpected, sets nothing: CSS follows prefers-color-scheme and
 * keeps following it when the system switches while the page is open.
 */
export function themeScript(): string {
  return `(function(){var d=document.documentElement,t;try{t=JSON.parse(localStorage.getItem(${JSON.stringify(
    THEME_STORAGE_KEY,
  )})||'null')}catch(e){}if(t!=='light'&&t!=='dark')return;d.dataset.theme=t;d.style.colorScheme=t;var c=t==='dark'?${JSON.stringify(
    THEME_COLORS.dark,
  )}:${JSON.stringify(THEME_COLORS.light)};document.querySelectorAll('meta[name="theme-color"]').forEach(function(m){m.setAttribute('content',c)})})()`;
}
