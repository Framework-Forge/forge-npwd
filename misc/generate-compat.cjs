const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const voice = path.dirname(root);
const ts = require(require.resolve('typescript', { paths: [path.join(root, 'apps/game')] }));
const js = ts.transpileModule(fs.readFileSync(path.join(root, 'compat/names.ts'), 'utf8'), {
  compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020}
}).outputText;
const context = {exports: {}};
vm.runInNewContext(js, context);
const aliases = {resources: context.exports.resourceAliases, exports: context.exports.exportAliases};
fs.writeFileSync(path.join(root, 'compat/aliases.json'), JSON.stringify(aliases, null, 2) + '\n');

function methods(directory) {
  const result = new Set();
  if (!fs.existsSync(directory)) return [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
      if (['node_modules', 'tests', '__tests__', 'dist'].includes(entry.name)) continue;
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(file);
      else if (/\.(ts|lua)$/.test(file)) {
        for (const match of fs.readFileSync(file, 'utf8').matchAll(/\b(?:exports|exps|exp)\s*\(\s*['"]([^'"]+)['"]/g)) result.add(match[1]);
      }
    }
  }
  walk(directory);
  return [...result].sort();
}
const catalog = {'forge-npwd': {
  client: methods(path.join(root, 'apps/game/client')),
  server: methods(path.join(root, 'apps/game/server')),
}};
catalog['forge-npwd'].client.push('compatGetNuiCallbacks', 'compatInvokeNui');
for (const current of Object.values(aliases.resources)) {
  if (catalog[current]) continue;
  const directory = current === 'forge-npwd-shop'
    ? path.resolve(root, '../../[forge]/[forge-scripts]', current)
    : path.join(voice, current);
  if (!fs.existsSync(directory)) continue;
  catalog[current] = {
    client: [...new Set([...methods(path.join(directory, 'client')), 'compatGetNuiCallbacks', 'compatInvokeNui'])],
    server: methods(path.join(directory, 'server')),
  };
}
for (const sides of Object.values(catalog)) {
  for (const side of ['client', 'server']) sides[side] = [...new Set(sides[side])].sort();
}
fs.writeFileSync(path.join(root, 'compat/exports.json'), JSON.stringify(catalog, null, 2) + '\n');
console.log('Internal compatibility catalogs generated for ' + Object.keys(catalog).length + ' providers (no proxy resources).');
