// @vitest-environment node
import { ESLint } from 'eslint';
import { beforeAll, describe, expect, it } from 'vitest';

const eslint = new ESLint();

// The first lint loads the config, parser and plugins. Pay that once here, with room to spare,
// instead of inside the first case's 5s budget, which a busy full run can overrun.
beforeAll(async () => {
  await eslint.lintText('export {};', { filePath: 'src/domain/warmup.ts' });
}, 60_000);

async function ruleIds(code: string, filePath: string): Promise<string[]> {
  const [result] = await eslint.lintText(code, { filePath });
  return (result?.messages ?? []).filter((m) => m.severity === 2).map((m) => m.ruleId ?? 'fatal');
}

describe('layer boundaries', () => {
  it.each([
    [
      "import { useState } from 'react';\nexport const x = useState;",
      'src/domain/x.ts',
      'no-restricted-imports',
    ],
    [
      "import { x } from '@/data/api';\nexport const y = x;",
      'src/ui/x.tsx',
      'boundaries/dependencies',
    ],
    [
      "import { Form } from '@/features/workbench/components/Form';\nexport const y = Form;",
      'src/features/home/x.tsx',
      'boundaries/dependencies',
    ],
    ["export const get = () => fetch('/x');", 'src/features/home/x.ts', 'no-restricted-globals'],
    [
      "export const read = () => localStorage.getItem('k');",
      'src/data/cache/x.ts',
      'no-restricted-globals',
    ],
    [
      "import { x } from '@/data/api';\nexport const y = x;",
      'src/features/home/x.tsx',
      'boundaries/dependencies',
    ],
    [
      "import { x } from '../../data/api';\nexport const y = x;",
      'src/features/home/x.ts',
      'boundaries/dependencies',
    ],
    [
      "export const get = () => window.fetch('/x');",
      'src/features/home/x.ts',
      'no-restricted-properties',
    ],
    ["export const get = () => globalThis.fetch('/x');", 'src/ui/x.ts', 'no-restricted-properties'],
    [
      "export const read = () => globalThis.localStorage.getItem('k');",
      'src/data/cache/x.ts',
      'no-restricted-properties',
    ],
    [
      "export const read = () => window.sessionStorage.getItem('k');",
      'src/data/http/x.ts',
      'no-restricted-properties',
    ],
    [
      "export const get = () => self.fetch('/x');",
      'src/data/persistence/x.ts',
      'no-restricted-properties',
    ],
    [
      "import { x } from '@/data/api';\nexport const y = x;",
      'src/proxy.ts',
      'boundaries/no-unknown-files',
    ],
    ['export const x = 1;', 'src/utils/x.ts', 'boundaries/no-unknown-files'],
    [
      "import { Form } from '@/features/workbench/components/Form';\nexport const y = Form;",
      'src/app/x.tsx',
      'boundaries/dependencies',
    ],
    [
      "import { server } from '@/test/msw/server';\nexport const y = server;",
      'src/features/home/x.ts',
      'boundaries/no-unknown-dependencies',
    ],
    [
      "import { x } from '@/featuers/home';\nexport const y = x;",
      'src/features/home/x.ts',
      'boundaries/no-unknown-dependencies',
    ],
    ['export const r = new XMLHttpRequest();', 'src/features/home/x.ts', 'no-restricted-globals'],
    ["export const s = new EventSource('/x');", 'src/features/home/x.ts', 'no-restricted-globals'],
    ["export const s = new WebSocket('ws://x');", 'src/data/cache/x.ts', 'no-restricted-globals'],
    [
      "export const b = () => navigator.sendBeacon('/x');",
      'src/features/home/x.ts',
      'no-restricted-properties',
    ],
  ])('rejects %j in %s', async (code, filePath, ruleId) => {
    expect(await ruleIds(code, filePath)).toContain(ruleId);
  });

  it.each([
    ["export const get = () => fetch('/x');", 'src/data/http/x.ts'],
    ["export const read = () => localStorage.getItem('k');", 'src/data/persistence/x.ts'],
    [
      "import { Form } from '@/features/workbench';\nexport const y = Form;",
      'src/features/home/x.tsx',
    ],
    [
      "import { Form } from './components/Form';\nexport const y = Form;",
      'src/features/workbench/x.tsx',
    ],
    ["import { client } from '@/data/cache';\nexport const y = client;", 'src/features/home/x.ts'],
    ["import { request } from '@/data/http';\nexport const y = request;", 'src/data/api/x.ts'],
    ["export const get = () => window.fetch('/x');", 'src/data/http/x.ts'],
    ["export const read = () => window.localStorage.getItem('k');", 'src/data/persistence/x.ts'],
    ["import { Form } from '@/features/workbench';\nexport const y = Form;", 'src/app/x.tsx'],
    ["export const s = new EventSource('/x');", 'src/data/http/x.ts'],
    ["export const b = () => navigator.sendBeacon('/x');", 'src/data/http/x.ts'],
  ])('allows %j in %s', async (code, filePath) => {
    expect(await ruleIds(code, filePath)).toEqual([]);
  });
});
