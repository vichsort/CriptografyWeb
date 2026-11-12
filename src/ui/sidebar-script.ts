/** The key the preferences repository writes the desktop sidebar state to (src/data/persistence). */
export const SIDEBAR_STORAGE_KEY = 'cw:v1:sidebar.collapsed';

/**
 * Inline script for <head>. A collapsed sidebar is marked on <html> before the first paint, so the
 * page never draws the sidebar open and then slides it away. The `sidebar-collapsed:` variant
 * (src/ui/shell.css) reads the mark.
 */
export function sidebarScript(): string {
  // The leading semicolon keeps it a statement of its own when it follows another script.
  return `;(function(){try{if(JSON.parse(localStorage.getItem(${JSON.stringify(
    SIDEBAR_STORAGE_KEY,
  )})||'false')===true)document.documentElement.dataset.sidebar='collapsed'}catch(e){}})()`;
}
