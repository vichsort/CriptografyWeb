import type { Metadata, Viewport } from 'next';
import { site } from '@/content/ui';
import { AppShell, Providers } from '@/features/shell';
import { fontVariables } from '@/ui/fonts';
import { sidebarScript } from '@/ui/sidebar-script';
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
        {/* Sets the theme and the sidebar state before the first paint, so neither flashes. */}
        <script dangerouslySetInnerHTML={{ __html: themeScript() + sidebarScript() }} />
      </head>
      <body className="app-background flex flex-col">
        <Providers>
          <AppShell sidebar={null}>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
