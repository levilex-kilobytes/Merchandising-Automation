import { cp, mkdir, rm, readFile, writeFile } from 'node:fs/promises';
import { execSync } from 'node:child_process';

const ROOT = process.cwd();
const OUT = `${ROOT}/dist`;

const APPS = [
  { name: 'vendor-management-portal', pkg: '@mfa/vendor-management-portal', prefix: 'vendor' },
  { name: 'procurement-dashboard',    pkg: '@mfa/procurement-dashboard',    prefix: 'procurement' },
  { name: 'warehouse-receiving-app',  pkg: '@mfa/warehouse-receiving-app',  prefix: 'receiving' },
  { name: 'inventory-control-center', pkg: '@mfa/inventory-control-center', prefix: 'inventory' },
  { name: 'warehouse-floor-app',      pkg: '@mfa/warehouse-floor-app',      prefix: 'warehouse' },
  { name: 'pos-terminal-app',         pkg: '@mfa/pos-terminal-app',         prefix: 'pos' },
  { name: 'store-manager-dashboard',  pkg: '@mfa/store-manager-dashboard',  prefix: 'audit' },
  { name: 'finance-portal',           pkg: '@mfa/finance-portal',           prefix: 'finance' },
];

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

for (const { name, pkg, prefix } of APPS) {
  console.log(`\n▶ Building ${name} → /${prefix}/`);
  execSync(`npm run build --workspace=${pkg}`, { cwd: ROOT, stdio: 'inherit' });
  await cp(`${ROOT}/frontend/${name}/dist`, `${OUT}/${prefix}`, { recursive: true });
  console.log(`✅ ${name} → dist/${prefix}/`);
}

console.log(`\n▶ Copying hub → /`);
const hub = await readFile(`${ROOT}/hub/index.html`, 'utf8');
await writeFile(`${OUT}/index.html`, hub);
console.log(`✅ hub → dist/index.html`);

console.log(`\n🎉 Done. Output: ${OUT}`);
