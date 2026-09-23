import { access, readFile } from 'node:fs/promises';

const requiredSource = [
  'spfx/src/webparts/dynastyDesk/DynastyDeskWebPart.ts',
  'spfx/src/webparts/dynastyDesk/components/DynastyDesk.tsx',
  'spfx/src/webparts/dynastyDesk/components/IDynastyDeskProps.ts',
  'spfx/sharepoint-schema.json'
];

for (const path of requiredSource) await access(path);

const entry = await readFile(requiredSource[0], 'utf8');
for (const token of ['BaseClientSideWebPart', 'createSpfxListClient', 'createResolutionPlan', 'createPublishPlan']) {
  if (!entry.includes(token)) throw new Error(`SPFx entrypoint is missing ${token}.`);
}

try {
  const packageJson = JSON.parse(await readFile('spfx/package.json', 'utf8'));
  const dependencies = { ...(packageJson.dependencies ?? {}), ...(packageJson.devDependencies ?? {}) };
  for (const dependency of ['@microsoft/sp-core-library', '@microsoft/sp-webpart-base', '@microsoft/sp-http', 'gulp']) {
    if (!dependencies[dependency]) throw new Error(`Generated SPFx package is missing ${dependency}.`);
  }
  for (const script of ['build', 'bundle', 'package-solution']) {
    if (!packageJson.scripts?.[script]) throw new Error(`Generated SPFx package is missing the ${script} script.`);
  }
  console.log('SPFx deployment check passed: generated solution manifest detected.');
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
  console.log('SPFx source check passed: generated Microsoft 365 solution is not present; follow spfx/README.md to generate it locally.');
}
