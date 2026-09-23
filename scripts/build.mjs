import { cp, mkdir } from 'node:fs/promises';

await mkdir('dist/domain', { recursive: true });
await cp('src/domain/models.js', 'dist/domain/models.js');
await cp('src/domain/simulation.js', 'dist/domain/simulation.js');
console.log('Copied domain modules to dist/domain.');
