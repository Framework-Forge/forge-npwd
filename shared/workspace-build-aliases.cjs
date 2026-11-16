const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

function workspacePackages() {
  const packages = new Map();
  for (const entry of fs.readdirSync(path.join(root, 'packages'), { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const directory = path.join(root, 'packages', entry.name);
    const manifestPath = path.join(directory, 'package.json');
    if (!fs.existsSync(manifestPath)) continue;
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    if (manifest.name?.startsWith('@forge-npwd/')) packages.set(manifest.name, { directory, manifest });
  }
  return packages;
}
function resolveEntry(base) {
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`, `${base}.js`, `${base}.mjs`, `${base}.json`,
    path.join(base, 'index.ts'), path.join(base, 'index.tsx'), path.join(base, 'index.js')]) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  }
  throw new Error(`Forge NPWD workspace entry not found: ${base}`);
}
function packageEntry({ directory, manifest }) {
  for (const candidate of [manifest.module, manifest.main, 'src/index.ts', 'index.ts']) {
    if (!candidate) continue;
    try { return resolveEntry(path.join(directory, candidate)); } catch {}
  }
  return directory;
}
function esbuildWorkspacePlugin() {
  const packages = workspacePackages();
  return {
    name: 'forge-npwd-workspace',
    setup(build) {
      build.onResolve({ filter: /^@forge-npwd\// }, ({ path: importName }) => {
        const pieces = importName.split('/');
        const name = pieces.slice(0, 2).join('/');
        const info = packages.get(name);
        if (!info) return undefined;
        const subpath = pieces.slice(2).join('/');
        return { path: subpath ? resolveEntry(path.join(info.directory, subpath)) : packageEntry(info) };
      });
    },
  };
}
function viteWorkspaceAliases() {
  return [...workspacePackages()].flatMap(([name, info]) => {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return [
      { find: new RegExp(`^${escaped}$`), replacement: packageEntry(info) },
      { find: new RegExp(`^${escaped}/(.*)$`), replacement: `${info.directory.replace(/\\/g, '/')}/$1` },
    ];
  });
}
module.exports = { esbuildWorkspacePlugin, viteWorkspaceAliases };
