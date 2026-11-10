// Import resolver for the boundaries rules. It defers to the TypeScript resolver and, when a local
// module does not exist yet, still maps it to its path so the layer it belongs to can be checked.
const path = require('node:path');
const typescript = require('eslint-import-resolver-typescript');

const srcRoot = path.join(__dirname, '..', 'src');

exports.interfaceVersion = 2;

exports.resolve = (source, file, config) => {
  const resolved = typescript.resolve(source, file, config);
  if (resolved.found) return resolved;

  let target = null;
  if (source.startsWith('@/')) target = path.join(srcRoot, source.slice(2));
  else if (source.startsWith('.')) target = path.resolve(path.dirname(file), source);
  if (target === null) return resolved;

  return { found: true, path: path.join(target, 'index.ts') };
};
