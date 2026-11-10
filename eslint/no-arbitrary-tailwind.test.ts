// @vitest-environment node
import { RuleTester } from 'eslint';
import { describe, it } from 'vitest';
import rule from './no-arbitrary-tailwind.mjs';

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const tester = new RuleTester({
  languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
});

const error = { messageId: 'arbitrary' };

tester.run('no-arbitrary-tailwind', rule, {
  valid: [
    { code: '<div className="p-4" />', filename: 'src/features/home/x.jsx' },
    { code: '<div className="text-label" />', filename: 'src/features/home/x.jsx' },
    { code: "cn('p-4', 'text-label')", filename: 'src/features/home/x.js' },
    { code: '<div className="p-[13px]" />', filename: 'src/ui/x.jsx' },
    { code: "cn('text-[#fff]')", filename: 'src/ui/button/x.js' },
    { code: "const label = 'array-[0]';", filename: 'src/features/home/x.js' },
  ],
  invalid: [
    { code: '<div className="p-[13px]" />', filename: 'src/features/home/x.jsx', errors: [error] },
    { code: "cn('text-[#fff]')", filename: 'src/features/home/x.js', errors: [error] },
    {
      code: '<div className={`mt-[2px]`} />',
      filename: 'src/features/home/x.jsx',
      errors: [error],
    },
    {
      code: "<div className={cn('p-4', active && 'w-[3px]')} />",
      filename: 'src/app/x.jsx',
      errors: [error],
    },
    {
      code: '<div className="bg-black/[.06]" />',
      filename: 'src/features/home/x.jsx',
      errors: [error],
    },
    {
      code: '<div className="[mask-type:luminance]" />',
      filename: 'src/features/home/x.jsx',
      errors: [error],
    },
  ],
});
