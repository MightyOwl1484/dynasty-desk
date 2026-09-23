import test from 'node:test';
import assert from 'node:assert/strict';
import { createClubActions, defaultClubActions, lockClubActions, submitClubActions, transitionLeague } from '../src/domain/league.js';

const baseLeague = { id: 'league-1', name: 'North County League', phase: 'setup', phaseVersion: 0 };

test('allows only explicit league phase transitions', () => {
  const open = transitionLeague(baseLeague, 'open');
  const locked = transitionLeague(open, 'locked');
  assert.equal(locked.phase, 'locked');
  assert.equal(locked.phaseVersion, 2);
  assert.throws(() => transitionLeague(locked, 'published'), /Cannot transition/);
});

test('submitted club actions can be locked but not edited afterward', () => {
  const draft = createClubActions({ leagueId: 'league-1', clubId: 'club-1', managerId: 'user-1', matchWeek: 3 });
  const submitted = submitClubActions(draft, '2026-09-23T20:00:00.000Z');
  const locked = lockClubActions(submitted, '2026-09-23T21:00:00.000Z');
  assert.equal(locked.status, 'locked');
  assert.equal(locked.lockedAt, '2026-09-23T21:00:00.000Z');
  assert.throws(() => submitClubActions(locked), /cannot be edited/);
});

test('default actions give a missed deadline a deterministic fallback', () => {
  const fallback = defaultClubActions({ leagueId: 'league-1', clubId: 'club-2', managerId: 'system', matchWeek: 3 });
  assert.equal(fallback.status, 'auto');
  assert.equal(fallback.tactic, 'balanced');
  assert.equal(fallback.trainingFocus, 'recovery');
});
