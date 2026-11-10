// @vitest-environment node
import path from 'node:path';
import { Linter } from 'eslint';
import { describe, expect, it } from 'vitest';
import rule from './no-arbitrary-tailwind.mjs';

const root = path.resolve(import.meta.dirname, '..');

function lint(filename: string, cwd: string) {
  const linter = new Linter({ cwd });
  return linter.verify(
    '<div className="p-[13px]" />',
    {
      files: ['**/*.jsx'],
      languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
      plugins: { local: { rules: { 'no-arbitrary-tailwind': rule } } },
      rules: { 'local/no-arbitrary-tailwind': 'error' },
    },
    filename,
  );
}

describe('no-arbitrary-tailwind src/ui exemption', () => {
  it('holds when ESLint runs from a parent folder', () => {
    expect(lint(path.join(root, 'src/ui/x.jsx'), path.dirname(root))).toEqual([]);
  });

  it('still reports outside src/ui when run from a parent folder', () => {
    expect(lint(path.join(root, 'src/features/x.jsx'), path.dirname(root))).toHaveLength(1);
  });
});
