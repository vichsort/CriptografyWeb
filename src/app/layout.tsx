import type { Metadata, Viewport } from 'next';
import { site } from '@/content/ui';
import { fontVariables } from '@/ui/fonts';
import { THEME_COLORS, themeScript } from '@/ui/theme-script';
import './globals.css';

export const metadata: Metadata = {
  title: site.name,
  description: site.description,
};

export const viewport: Viewport = {
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: THEME_COLORS.light },
    { media: '(prefers-color-scheme: dark)', color: THEME_COLORS.dark },
  ],
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={fontVariables} suppressHydrationWarning>
      <head>
        {/* Sets the theme before the first paint, so it never flashes. */}
        <script dangerouslySetInnerHTML={{ __html: themeScript() }} />
      </head>
      <body className="app-background">{children}</body>
    </html>
  );
}
