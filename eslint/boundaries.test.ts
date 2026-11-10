// @vitest-environment node
import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

const eslint = new ESLint();

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
  ])('allows %j in %s', async (code, filePath) => {
    expect(await ruleIds(code, filePath)).toEqual([]);
  });
});
