import { fileURLToPath } from 'node:url';
import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import boundaries from 'eslint-plugin-boundaries';
import noArbitraryTailwind from './eslint/no-arbitrary-tailwind.mjs';

const importResolver = fileURLToPath(new URL('./eslint/import-resolver.cjs', import.meta.url));

const SOURCE = ['src/**/*.{js,jsx,ts,tsx,mjs,cjs}'];
const TESTS = ['src/**/*.test.{ts,tsx}', 'src/test/**'];
const HTTP = ['src/data/http/**'];
const PERSISTENCE = ['src/data/persistence/**'];

// Layers (docs/ARCHITECTURE.md §3) and what each one may import (§4).
const elements = [
  { type: 'app', pattern: 'src/app' },
  { type: 'features', pattern: 'src/features/*', capture: ['feature'] },
  { type: 'domain', pattern: 'src/domain' },
  { type: 'data-http', pattern: 'src/data/http' },
  { type: 'data-api', pattern: 'src/data/api' },
  { type: 'data-cache', pattern: 'src/data/cache' },
  { type: 'data-persistence', pattern: 'src/data/persistence' },
  { type: 'content', pattern: 'src/content' },
  { type: 'ui', pattern: 'src/ui' },
  { type: 'config', pattern: 'src/config' },
  { type: 'lib', pattern: 'src/lib' },
];

const DATA_BASE = ['domain', 'config', 'lib'];

const allowed = {
  app: ['app', 'features', 'ui', 'content', 'config', 'lib'],
  features: ['ui', 'content', 'domain', 'config', 'lib', 'data-cache', 'data-persistence'],
  'data-http': ['data-http', ...DATA_BASE],
  'data-api': ['data-api', 'data-http', ...DATA_BASE],
  'data-persistence': ['data-persistence', ...DATA_BASE],
  'data-cache': ['data-cache', 'data-api', 'data-http', 'data-persistence', ...DATA_BASE],
  content: ['content', 'domain'],
  ui: ['ui', 'lib'],
  domain: ['domain'],
  config: ['config'],
  lib: ['lib'],
};

const layerPolicies = Object.entries(allowed).map(([from, to]) => ({
  from: { element: { type: from } },
  allow: { to: { element: { types: to } } },
}));

// A feature reaches another feature only through its public index.ts.
const featurePolicies = [
  {
    from: { element: { type: 'features' } },
    allow: {
      to: {
        element: { type: 'features', captured: { feature: '{{ from.element.captured.feature }}' } },
      },
    },
  },
  {
    from: { element: { type: 'features' } },
    allow: { to: { element: { type: 'features', fileInternalPath: 'index.{ts,tsx}' } } },
  },
];

const restrictedGlobal = {
  fetch: { name: 'fetch', message: 'Only src/data/http may call fetch.' },
  localStorage: {
    name: 'localStorage',
    message: 'Only src/data/persistence may use localStorage.',
  },
  sessionStorage: {
    name: 'sessionStorage',
    message: 'Only src/data/persistence may use sessionStorage.',
  },
};

const restrictGlobals = (...names) => ['error', ...names.map((name) => restrictedGlobal[name])];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: SOURCE,
    plugins: { boundaries },
    settings: {
      'import/resolver': { [importResolver]: {} },
      'boundaries/elements': elements,
    },
    rules: {
      'boundaries/dependencies': [
        'error',
        { default: 'disallow', policies: [...layerPolicies, ...featurePolicies] },
      ],
    },
  },
  {
    files: SOURCE,
    ignores: [...HTTP, ...PERSISTENCE, ...TESTS],
    rules: { 'no-restricted-globals': restrictGlobals('fetch', 'localStorage', 'sessionStorage') },
  },
  {
    files: HTTP,
    ignores: TESTS,
    rules: { 'no-restricted-globals': restrictGlobals('localStorage', 'sessionStorage') },
  },
  {
    files: PERSISTENCE,
    ignores: TESTS,
    rules: { 'no-restricted-globals': restrictGlobals('fetch') },
  },
  {
    files: ['src/domain/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react', 'react/*', 'react-dom', 'react-dom/*', 'next', 'next/*'],
              message: 'src/domain is pure: no React or Next.js.',
            },
          ],
        },
      ],
    },
  },
  {
    files: SOURCE,
    plugins: { local: { rules: { 'no-arbitrary-tailwind': noArbitraryTailwind } } },
    rules: { 'local/no-arbitrary-tailwind': 'error' },
  },
  {
    files: TESTS,
    rules: { 'boundaries/dependencies': 'off' },
  },
  {
    // Import resolvers are loaded with require(), so they stay CommonJS.
    files: ['eslint/**/*.cjs'],
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
]);

export default eslintConfig;
