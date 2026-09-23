import test from 'node:test';
import assert from 'node:assert/strict';
import { ROLES, canEditClubActions, canManageLeague, canReadLeague, canResolveWeek } from '../src/domain/permissions.js';

test('league visibility is readable while management stays commissioner-only', () => {
  assert.equal(canReadLeague(), true);
  assert.equal(canManageLeague(ROLES.COMMISSIONER), true);
  assert.equal(canManageLeague(ROLES.MANAGER), false);
  assert.equal(canManageLeague(ROLES.VIEWER), false);
});

test('only a commissioner can resolve a locked week', () => {
  assert.equal(canResolveWeek(ROLES.COMMISSIONER, 'locked'), true);
  assert.equal(canResolveWeek(ROLES.COMMISSIONER, 'open'), false);
  assert.equal(canResolveWeek(ROLES.MANAGER, 'locked'), false);
});

test('managers can edit only their assigned club during an editable phase', () => {
  const base = { role: ROLES.MANAGER, clubId: 'npa', assignedClubId: 'npa' };
  assert.equal(canEditClubActions({ ...base, phase: 'open' }), true);
  assert.equal(canEditClubActions({ ...base, phase: 'locked' }), false);
  assert.equal(canEditClubActions({ ...base, clubId: 'ivr', phase: 'open' }), false);
});
