import { readFile } from 'node:fs/promises';

const required = [
  ['spfx README', 'spfx/README.md'],
  ['SPFx web part entrypoint', 'spfx/src/webparts/dynastyDesk/DynastyDeskWebPart.ts'],
  ['React commissioner component', 'spfx/src/webparts/dynastyDesk/components/DynastyDesk.tsx'],
  ['React props contract', 'spfx/src/webparts/dynastyDesk/components/IDynastyDeskProps.ts']
];
for (const [label, path] of required) { try { await readFile(path, 'utf8'); } catch { throw new Error(`Missing ${label}: ${path}`); } }
const entry = await readFile(required[1][1], 'utf8');
const component = await readFile(required[2][1], 'utf8');
if (!entry.includes('BaseClientSideWebPart') || !entry.includes('ReactDom.render') || !entry.includes('this.context.spHttpClient') || !entry.includes('loadAdminSummary')) throw new Error('SPFx entrypoint is missing the SharePoint data-service boundary.');
if (!component.includes('aria-labelledby') || !component.includes('scope="col"') || !component.includes('onPhaseAction') || !component.includes('role="status"')) throw new Error('SPFx component is missing accessible controls, action handling, or status recovery.');
console.log('SPFx source scaffold checks passed (4 files).');
