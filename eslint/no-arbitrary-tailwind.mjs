import path from 'node:path';

const UI_DIR = path.resolve(import.meta.dirname, '..', 'src', 'ui');
const CLASS_HELPERS = new Set(['cn', 'clsx', 'cx', 'cva', 'twMerge']);

function isInsideUi(context) {
  const file = path.resolve(context.cwd, context.filename);
  return file.startsWith(UI_DIR + path.sep);
}

function isClassAttribute(name) {
  return name === 'className' || name.endsWith('ClassName');
}

function arbitraryClass(text) {
  return text.split(/\s+/).find((token) => token.includes('[')) ?? null;
}

/** @type {import('eslint').Rule.RuleModule} */
const rule = {
  meta: {
    type: 'problem',
    docs: { description: 'Disallow arbitrary Tailwind values outside src/ui/' },
    schema: [],
    messages: {
      arbitrary:
        'Arbitrary Tailwind value "{{ value }}" outside src/ui/. Use a design token instead.',
    },
  },
  create(context) {
    if (isInsideUi(context)) return {};

    const reported = new Set();

    function report(node, text) {
      const value = arbitraryClass(text);
      if (value === null || reported.has(node)) return;
      reported.add(node);
      context.report({ node, messageId: 'arbitrary', data: { value } });
    }

    function check(node) {
      if (!node || typeof node.type !== 'string') return;
      if (node.type === 'Literal' && typeof node.value === 'string')
        return report(node, node.value);
      if (node.type === 'TemplateElement') return report(node, node.value.cooked ?? node.value.raw);
      for (const [key, child] of Object.entries(node)) {
        if (key === 'parent') continue;
        if (Array.isArray(child)) child.forEach(check);
        else if (child && typeof child === 'object') check(child);
      }
    }

    return {
      JSXAttribute(node) {
        if (node.name.type === 'JSXIdentifier' && isClassAttribute(node.name.name))
          check(node.value);
      },
      CallExpression(node) {
        if (node.callee.type === 'Identifier' && CLASS_HELPERS.has(node.callee.name)) {
          node.arguments.forEach(check);
        }
      },
    };
  },
};

export default rule;
