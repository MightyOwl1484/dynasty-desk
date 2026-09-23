import { readFile } from 'node:fs/promises';

const schema = JSON.parse(await readFile('spfx/sharepoint-schema.json', 'utf8'));
const expected = ['Leagues', 'LeagueMembers', 'Clubs', 'Players', 'Fixtures', 'ClubActions', 'MatchResults', 'LeagueEvents'];
const titles = schema.lists.map((list) => list.title);
const missing = expected.filter((title) => !titles.includes(title));
if (schema.schemaVersion !== 1 || missing.length || !schema.roles?.commissioner || !schema.roles?.manager || !schema.roles?.viewer) {
  throw new Error(`SharePoint schema is incomplete: ${missing.join(', ') || 'roles or version missing'}`);
}
for (const list of schema.lists) {
  if (!list.indexed?.includes('LeagueId')) throw new Error(`${list.title} must index LeagueId.`);
  if (!list.fields.includes('LeagueId')) throw new Error(`${list.title} must contain LeagueId.`);
}
console.log(`SharePoint schema checks passed (${schema.lists.length} lists).`);
