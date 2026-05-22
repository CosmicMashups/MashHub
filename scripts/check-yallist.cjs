/**
 * Fail the build early if yallist is missing or broken (vite-plugin-pwa / workbox-build).
 */
const { createRequire } = require('node:module');
const fs = require('node:fs');
const path = require('node:path');

const requireFromRoot = createRequire(path.join(__dirname, '..', 'package.json'));

try {
  const pkgPath = requireFromRoot.resolve('yallist/package.json');
  const mainPath = path.join(path.dirname(pkgPath), 'yallist.js');
  if (!fs.existsSync(mainPath)) {
    console.error('[check-yallist] yallist package found but yallist.js is missing:', mainPath);
    process.exit(1);
  }
  requireFromRoot('yallist');
} catch (err) {
  console.error('[check-yallist] yallist is required for vite-plugin-pwa. Use pnpm install (see vercel.json).');
  console.error(err);
  process.exit(1);
}
