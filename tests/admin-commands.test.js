import test from 'node:test';
import assert from 'node:assert/strict';
import { createLockPlan, persistLockPlan } from '../src/application/admin-commands.js';
import { createClubActions } from '../src/domain/league.js';

test('lock command creates a complete league/action/audit plan', () => {
  const plan = createLockPlan({
    league: { id: 'league-1', phase: 'open', phaseVersion: 1, matchWeek: 3 },
    actions: [createClubActions({ leagueId: 'league-1', clubId: 'npa', managerId: 'u1', status: 'submitted' })],
    leagueRecord: { itemId: 10, etag: '"4"' },
    actionRecords: [{ itemId: 11, etag: '"7"', clubId: 'npa' }],
    actorId: 'commissioner-1', lockedAt: '2026-09-24T12:00:00Z'
  });
  assert.equal(plan.league.phase, 'locked');
  assert.equal(plan.actionUpdates[0].action.status, 'locked');
  assert.equal(plan.auditEvents[0].type, 'week_locked');
});

test('lock command persists league, action, and audit writes', async () => {
  const calls = [];
  const plan = {
    leagueRecord: { itemId: 10, etag: '"4"' }, league: { phase: 'locked' },
    actionUpdates: [{ itemId: 11, etag: '"7"', action: { status: 'locked' } }],
    auditEvents: [{ id: 'event-1' }]
  };
  await persistLockPlan({
    updateLeague: async (...args) => calls.push(['league', ...args]),
    saveClubActions: async (...args) => calls.push(['action', ...args]),
    appendLeagueEvent: async (...args) => calls.push(['event', ...args])
  }, plan);
  assert.deepEqual(calls.map(([kind]) => kind).sort(), ['action', 'event', 'league']);
});
