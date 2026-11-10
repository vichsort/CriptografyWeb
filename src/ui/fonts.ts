import { Inter, JetBrains_Mono } from 'next/font/google';

// Fallbacks behind the Apple system fonts (docs/DESIGN.md §3). tokens.css puts them in the stacks.
const text = Inter({ subsets: ['latin'], variable: '--font-text-fallback', display: 'swap' });
const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono-fallback',
  display: 'swap',
});

/** Class names that define the font variables; set on <html>. */
export const fontVariables = `${text.variable} ${mono.variable}`;
