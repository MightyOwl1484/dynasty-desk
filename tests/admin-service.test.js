import test from 'node:test';
import assert from 'node:assert/strict';
import { loadAdminSummary } from '../src/application/admin-service.js';
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
