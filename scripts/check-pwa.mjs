import { readFile } from 'node:fs/promises';

const serviceWorker = await readFile('dist/sw.js', 'utf8');
const assetsMatch = serviceWorker.match(/ASSETS=\[(.*?)\]/);
if (!assetsMatch) throw new Error('Service worker asset manifest is missing.');
const assets = [...assetsMatch[1].matchAll(/'([^']+)'/g)].map((match) => match[1]);
const missing = [];
for (const asset of assets) {
  if (asset === './') continue;
  try { await readFile(`dist/${asset.slice(2)}`); } catch { missing.push(asset); }
}
if (missing.length) throw new Error(`PWA cache references missing assets: ${missing.join(', ')}`);
console.log(`PWA cache checks passed (${assets.length} assets).`);
