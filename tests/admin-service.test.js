import test from 'node:test';
import assert from 'node:assert/strict';
import { loadAdminContext, loadAdminSummary } from '../src/application/admin-service.js';
import { ROLES } from '../src/domain/permissions.js';

test('admin service composes store reads into the commissioner view model', async () => {
  const store = {
    loadLeague: async () => ({ LeagueId: 'league-1', Phase: 'open', MatchWeek: 4, Deadline: '2026-09-24T17:00:00Z' }),
    getMembers: async () => [{ Role: 'manager', ClubId: 'npa', UserId: 'u1', DisplayName: 'Avery' }],
    getClubActions: async () => [{ ClubId: 'npa', Status: 'submitted', SubmittedAt: '2026-09-24T12:00:00Z' }],
    getLeagueEvents: async () => []
  };
  const summary = await loadAdminSummary(store, ROLES.COMMISSIONER);
  assert.equal(summary.leagueId, 'league-1');
  assert.equal(summary.matchWeek, 4);
  assert.equal(summary.submittedCount, 1);
  assert.equal(summary.canManage, true);
});

test('admin service returns null for a missing league', async () => {
  const empty = { loadLeague: async () => null };
  await assert.rejects(() => loadAdminSummary(empty, ROLES.VIEWER), /requires league/);
});

test('admin context preserves SharePoint item identity for commands', async () => {
  const context = await loadAdminContext({
    loadLeague: async () => ({ Id: 12, LeagueId: 'league-1', Phase: 'open', MatchWeek: 4, '@odata.etag': '"3"' }),
    getMembers: async () => [],
    getClubActions: async () => [{ Id: 13, ClubId: 'npa', Status: 'submitted', ETag: '"8"' }],
    getLeagueEvents: async () => []
  }, ROLES.COMMISSIONER);
  assert.deepEqual(context.leagueRecord, { itemId: 12, etag: '"3"' });
  assert.deepEqual(context.actionRecords, [{ itemId: 13, etag: '"8"', clubId: 'npa' }]);
});

test('admin context loads normalized resolution data when the host provides it', async () => {
  const context = await loadAdminContext({
    loadLeague: async () => ({ Id: 12, LeagueId: 'league-1', Phase: 'locked', MatchWeek: 4, '@odata.etag': '"3"' }),
    getMembers: async () => [],
    getClubActions: async () => [],
    getLeagueEvents: async () => [],
    getFixtures: async () => [{ FixtureId: 'f1', MatchWeek: 4, HomeClubId: 'npa', AwayClubId: 'ivr', Status: 'scheduled' }],
    getClubs: async () => [{ ClubId: 'npa', Title: 'North' }, { ClubId: 'ivr', Title: 'Ivory' }],
    getPlayers: async () => [{ PlayerId: 'p1', ClubId: 'npa', Title: 'Keeper', Position: 'GK', Rating: 72 }]
  }, ROLES.COMMISSIONER);
  assert.equal(context.fixtures[0].homeClubId, 'npa');
  assert.equal(context.clubsById.npa.name, 'North');
  assert.equal(context.clubsById.npa.players[0].rating, 72);
});
