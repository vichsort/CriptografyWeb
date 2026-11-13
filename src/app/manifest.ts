import type { MetadataRoute } from 'next';
import { site } from '@/content/ui';
import { THEME_COLORS } from '@/ui/theme-script';

/** The web manifest, for installing the app on a home screen (docs/DESIGN.md §10). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.name,
    short_name: site.name,
    description: site.description,
    start_url: '/',
    display: 'standalone',
    theme_color: THEME_COLORS.light,
    background_color: THEME_COLORS.light,
    // The files next to this one: app/icon.png and app/apple-icon.png.
    icons: [
      { src: '/icon.png', sizes: '512x512', type: 'image/png' },
      { src: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  };
}
