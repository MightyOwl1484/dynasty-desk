import test from 'node:test';
import assert from 'node:assert/strict';
import { createLockPlan, createPublishPlan, persistLockPlan, persistPublishPlan, persistResolutionPlan } from '../src/application/admin-commands.js';
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

test('publish command persists immutable results before its audit event', async () => {
  const calls = [];
  const plan = createPublishPlan({ league: { id: 'league-1', phase: 'resolving', phaseVersion: 3, matchWeek: 3 }, results: [{ fixtureId: 'f1', homeGoals: 2, awayGoals: 1 }], leagueRecord: { itemId: 10, etag: '"9"' }, actorId: 'commissioner-1', publishedAt: '2026-09-24T18:00:00Z' });
  await persistPublishPlan({
    updateLeague: async (...args) => calls.push(['league', ...args]),
    appendMatchResult: async (...args) => calls.push(['result', ...args]),
    appendLeagueEvent: async (...args) => calls.push(['event', ...args])
  }, plan);
  assert.equal(plan.league.phase, 'published');
  assert.deepEqual(calls.map(([kind]) => kind).sort(), ['event', 'league', 'result']);
});

test('resolution command persists the pending run before its audit event', async () => {
  const calls = [];
  await persistResolutionPlan({
    updateLeague: async (...args) => calls.push(['league', ...args]),
    appendResolutionRun: async (...args) => calls.push(['run', ...args]),
    appendLeagueEvent: async (...args) => calls.push(['event', ...args])
  }, { leagueRecord: { itemId: 10, etag: '"4"' }, league: { phase: 'resolving' }, resolutionRun: { id: 'run-1' }, auditEvents: [{ id: 'event-1' }] });
  assert.deepEqual(calls.map(([kind]) => kind), ['league', 'run', 'event']);
});

test('publish command marks the pending run after immutable results', async () => {
  const calls = [];
  const plan = createPublishPlan({ league: { id: 'league-1', phase: 'resolving', phaseVersion: 3, matchWeek: 3 }, results: [{ fixtureId: 'f1', homeGoals: 2, awayGoals: 1 }], leagueRecord: { itemId: 10, etag: '"9"' }, resolutionRunRecord: { itemId: 12, etag: '"2"' }, actorId: 'commissioner-1', publishedAt: '2026-09-24T18:00:00Z' });
  await persistPublishPlan({
    updateLeague: async (...args) => calls.push(['league', ...args]),
    appendMatchResult: async (...args) => calls.push(['result', ...args]),
    updateResolutionRun: async (...args) => calls.push(['run', ...args]),
    appendLeagueEvent: async (...args) => calls.push(['event', ...args])
  }, plan);
  assert.deepEqual(calls.map(([kind]) => kind), ['league', 'result', 'run', 'event']);
});
