import { cp, mkdir } from 'node:fs/promises';

await mkdir('dist/domain', { recursive: true });
await mkdir('dist/application', { recursive: true });
await mkdir('dist/stores', { recursive: true });
await cp('src/domain/models.js', 'dist/domain/models.js');
await cp('src/domain/simulation.js', 'dist/domain/simulation.js');
await cp('src/domain/permissions.js', 'dist/domain/permissions.js');
await cp('src/application/league-workflow.js', 'dist/application/league-workflow.js');
await cp('src/stores/local.js', 'dist/stores/local.js');
await cp('src/stores/game-store.js', 'dist/stores/game-store.js');
await cp('src/stores/sharepoint.js', 'dist/stores/sharepoint.js');
console.log('Copied domain modules to dist/domain.');
