import test from 'node:test';
import assert from 'node:assert/strict';
import { createResolutionPlan } from '../src/application/match-week-resolver.js';
import { persistResolutionPlan } from '../src/application/admin-commands.js';
import { createClub, createFixture, createPlayer } from '../src/domain/models.js';
import { createClubActions } from '../src/domain/league.js';

const playerSet = (prefix) => [
  createPlayer({ id: `${prefix}-gk`, name: `${prefix} Keeper`, position: 'GK', rating: 70 }),
  ...Array.from({ length: 4 }, (_, index) => createPlayer({ id: `${prefix}-def-${index}`, name: `${prefix} Defender ${index}`, position: 'DEF', rating: 65, starting: true })),
  ...Array.from({ length: 4 }, (_, index) => createPlayer({ id: `${prefix}-mid-${index}`, name: `${prefix} Midfielder ${index}`, position: 'MID', rating: 65, starting: true })),
  ...Array.from({ length: 2 }, (_, index) => createPlayer({ id: `${prefix}-fwd-${index}`, name: `${prefix} Forward ${index}`, position: 'FWD', rating: 65, starting: true }))
].map((player, index) => ({ ...player, starting: index < 11 }));

const clubsById = {
  north: createClub({ id: 'north', name: 'North', players: playerSet('N') }),
  south: createClub({ id: 'south', name: 'South', players: playerSet('S') })
};

test('resolution plan applies locked tactics and is deterministic', () => {
  const input = {
    league: { id: 'league-1', phase: 'locked', phaseVersion: 2, matchWeek: 3, seed: 9 },
    fixtures: [createFixture({ id: 'fixture-1', matchWeek: 3, homeClubId: 'north', awayClubId: 'south' })],
    clubsById,
    actions: [createClubActions({ leagueId: 'league-1', clubId: 'north', managerId: 'u1', tactic: 'press', status: 'locked' })],
    actorId: 'commissioner-1',
    resolvedAt: '2026-09-24T18:00:00Z'
  };
  const first = createResolutionPlan(input);
  const second = createResolutionPlan(input);
  assert.equal(first.league.phase, 'resolving');
  assert.deepEqual(first.results, second.results);
  assert.equal(first.results[0].matchWeek, 3);
  assert.equal(first.results[0].leagueId, 'league-1');
  assert.equal(first.auditEvents[0].type, 'week_resolving');
});

test('resolution plan rejects an unlocked league or missing fixture club', () => {
  assert.throws(() => createResolutionPlan({ league: { phase: 'open' }, fixtures: [], clubsById }), /locked before resolution/);
  assert.throws(() => createResolutionPlan({ league: { id: 'l', phase: 'locked', matchWeek: 1, seed: 1 }, fixtures: [createFixture({ id: 'f', homeClubId: 'north', awayClubId: 'missing' })], clubsById }), /missing club/);
});

test('resolution persistence updates the league before its audit event', async () => {
  const calls = [];
  await persistResolutionPlan({
    updateLeague: async (...args) => calls.push(['league', ...args]),
    appendLeagueEvent: async (...args) => calls.push(['event', ...args])
  }, { leagueRecord: { itemId: 10, etag: '"5"' }, league: { phase: 'resolving' }, auditEvents: [{ id: 'event-1' }] });
  assert.deepEqual(calls.map(([kind]) => kind), ['league', 'event']);
});
