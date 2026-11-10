import type { NextConfig } from 'next';
import { version } from './package.json';

const nextConfig: NextConfig = {
  // The app version busts the persisted catalog after every release.
  env: { NEXT_PUBLIC_APP_VERSION: version },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
};

export default nextConfig;
