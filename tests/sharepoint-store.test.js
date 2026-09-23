import test from 'node:test';
import assert from 'node:assert/strict';
import { createSharePointGameStore } from '../src/stores/sharepoint.js';

test('SharePoint store scopes league reads and optional match week', async () => {
  const calls = [];
  const store = createSharePointGameStore({
    query: async (...args) => { calls.push(args); return [{ id: 1 }]; },
    update: async () => ({})
  }, 'league-7');
  assert.deepEqual(await store.loadLeague(), { id: 1 });
  assert.deepEqual(await store.getFixtures(3), [{ id: 1 }]);
  assert.deepEqual(calls, [
    ['Leagues', { LeagueId: 'league-7' }],
    ['Fixtures', { LeagueId: 'league-7', MatchWeek: 3 }]
  ]);
});

test('SharePoint store forwards ETags for action writes', async () => {
  let updateArgs;
  const store = createSharePointGameStore({
    query: async () => [],
    update: async (...args) => { updateArgs = args; return { ok: true }; }
  }, 'league-7');
  await store.saveClubActions({ tactic: 'counter' }, { itemId: 14, etag: '"5"' });
  assert.deepEqual(updateArgs, ['ClubActions', 14, { tactic: 'counter' }, { etag: '"5"' }]);
});

test('SharePoint store rejects unsafe action writes without an ETag', async () => {
  const store = createSharePointGameStore({ query: async () => [], update: async () => ({}) }, 'league-7');
  await assert.rejects(() => store.saveClubActions({ tactic: 'balanced' }, { itemId: 14 }), /etag/);
});
