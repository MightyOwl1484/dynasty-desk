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

test('SharePoint store exposes the reads required by the commissioner service', async () => {
  const calls = [];
  const store = createSharePointGameStore({
    query: async (...args) => { calls.push(args); return []; },
    update: async () => ({})
  }, 'league-7');
  await store.getMembers();
  await store.getClubActions(4);
  await store.getLeagueEvents();
  assert.deepEqual(calls, [
    ['LeagueMembers', { LeagueId: 'league-7' }],
    ['ClubActions', { LeagueId: 'league-7', MatchWeek: 4 }],
    ['LeagueEvents', { LeagueId: 'league-7' }]
  ]);
});

test('SharePoint store exposes clubs and players for resolution', async () => {
  const calls = [];
  const store = createSharePointGameStore({
    query: async (...args) => { calls.push(args); return []; },
    update: async () => ({})
  }, 'league-7');
  await store.getClubs();
  await store.getPlayers();
  assert.deepEqual(calls, [
    ['Clubs', { LeagueId: 'league-7' }],
    ['Players', { LeagueId: 'league-7' }]
  ]);
});

test('SharePoint store persists and updates pending resolution runs with ETags', async () => {
  const calls = [];
  const store = createSharePointGameStore({
    query: async (...args) => { calls.push(['query', ...args]); return []; },
    update: async (...args) => { calls.push(['update', ...args]); return null; },
    create: async (...args) => { calls.push(['create', ...args]); return null; }
  }, 'league-7');
  await store.getResolutionRuns(4);
  await store.appendResolutionRun({ id: 'run-1', leagueId: 'league-7', matchWeek: 4, status: 'pending', results: [{ fixtureId: 'f1' }], resolverVersion: '0.1.0', createdAt: '2026-09-24T18:00:00Z', createdBy: 'u1', publishedAt: null });
  await store.updateResolutionRun(22, { Status: 'published' }, { etag: '"3"' });
  assert.deepEqual(calls, [
    ['query', 'ResolutionRuns', { LeagueId: 'league-7', MatchWeek: 4 }],
    ['create', 'ResolutionRuns', { LeagueId: 'league-7', RunId: 'run-1', MatchWeek: 4, Status: 'pending', Results: '[{"fixtureId":"f1"}]', ResolverVersion: '0.1.0', CreatedAt: '2026-09-24T18:00:00Z', CreatedBy: 'u1', PublishedAt: null }],
    ['update', 'ResolutionRuns', 22, { Status: 'published' }, { etag: '"3"' }]
  ]);
});

test('SharePoint store exposes ETag league updates and append-only events', async () => {
  const calls = [];
  const store = createSharePointGameStore({
    query: async () => [],
    update: async (...args) => { calls.push(['update', ...args]); return null; },
    create: async (...args) => { calls.push(['create', ...args]); return null; }
  }, 'league-7');
  await store.updateLeague(3, { Phase: 'locked' }, { etag: '"2"' });
  await store.appendLeagueEvent({ LeagueId: 'league-7', Type: 'week_locked' });
  assert.deepEqual(calls, [
    ['update', 'Leagues', 3, { Phase: 'locked' }, { etag: '"2"' }],
    ['create', 'LeagueEvents', { LeagueId: 'league-7', Type: 'week_locked' }]
  ]);
});

test('SharePoint store appends immutable match results', async () => {
  let call;
  const store = createSharePointGameStore({ query: async () => [], update: async () => null, create: async (...args) => { call = args; return null; } }, 'league-7');
  await store.appendMatchResult({ LeagueId: 'league-7', FixtureId: 'f1' });
  assert.deepEqual(call, ['MatchResults', { LeagueId: 'league-7', FixtureId: 'f1' }]);
});
