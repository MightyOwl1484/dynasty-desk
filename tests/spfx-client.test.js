import test from 'node:test';
import assert from 'node:assert/strict';
import { createSpfxListClient } from '../src/stores/spfx-client.js';

test('SPFx client builds scoped list queries', async () => {
  let request;
  const client = createSpfxListClient({
    spHttpClient: { fetch: async (...args) => { request = args; return { ok: true, json: async () => ({ value: [{ Id: 4 }] }) }; } },
    configuration: 'v1', webAbsoluteUrl: 'https://tenant/sites/game'
  });
  assert.deepEqual(await client.query('LeagueMembers', { LeagueId: 'league-1', Status: 'active' }), [{ Id: 4 }]);
  assert.match(request[0], /LeagueMembers/);
  assert.match(request[0], /LeagueId%20eq%20'league-1'/);
});

test('SPFx client sends ETag-protected MERGE updates', async () => {
  let request;
  const client = createSpfxListClient({
    spHttpClient: { fetch: async (...args) => { request = args; return { ok: true, status: 204 }; } },
    configuration: 'v1', webAbsoluteUrl: 'https://tenant/sites/game'
  });
  await client.update('ClubActions', 14, { Tactic: 'counter' }, { etag: '"5"' });
  assert.equal(request[2].method, 'POST');
  assert.equal(request[2].headers['IF-MATCH'], '"5"');
  assert.equal(request[2].headers['X-HTTP-Method'], 'MERGE');
  assert.equal(request[2].body, JSON.stringify({ Tactic: 'counter' }));
});
