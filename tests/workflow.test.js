import test from 'node:test';
import assert from 'node:assert/strict';
import { createClubActions } from '../src/domain/league.js';
import { beginResolution, lockMatchWeek, publishMatchWeek } from '../src/application/league-workflow.js';

const league = { id: 'league-1', phase: 'open', phaseVersion: 2 };
const action = createClubActions({ leagueId: 'league-1', clubId: 'npa', managerId: 'manager-1', status: 'submitted' });

test('locking a week locks submitted actions and creates deterministic fallback actions', () => {
  const result = lockMatchWeek(league, [action, createClubActions({ leagueId: 'league-1', clubId: 'ivr', managerId: 'manager-2' })], '2026-09-23T12:00:00Z');
  assert.equal(result.league.phase, 'locked');
  assert.equal(result.actions[0].status, 'locked');
  assert.equal(result.actions[0].lockedAt, '2026-09-23T12:00:00Z');
  assert.equal(result.actions[1].status, 'auto');
  assert.equal(result.actions[1].tactic, 'balanced');
});

test('resolution and publication are explicit workflow steps', () => {
  const resolving = beginResolution({ ...league, phase: 'locked' });
  assert.equal(resolving.phase, 'resolving');
  const published = publishMatchWeek(resolving, [{ fixtureId: 'f1', homeGoals: 1, awayGoals: 0 }], '2026-09-23T18:00:00Z');
  assert.equal(published.league.phase, 'published');
  assert.equal(published.results[0].publishedAt, '2026-09-23T18:00:00Z');
});
