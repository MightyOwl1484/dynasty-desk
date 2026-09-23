import test from 'node:test';
import assert from 'node:assert/strict';
import { createAdminSummary } from '../src/application/admin-summary.js';
import { ROLES } from '../src/domain/permissions.js';

const members = [
  { role: ROLES.MANAGER, clubId: 'npa', userId: 'u1', displayName: 'Avery' },
  { role: ROLES.MANAGER, clubId: 'ivr', userId: 'u2', displayName: 'Jordan' }
];

test('admin summary exposes actionable status without exposing storage details', () => {
  const summary = createAdminSummary({
    league: { id: 'league-1', phase: 'locked', matchWeek: 3, deadline: '2026-09-23T17:00:00Z', resolverVersion: '0.1.0' },
    members,
    actions: [{ clubId: 'npa', status: 'locked', lockedAt: '2026-09-23T12:00:00Z' }],
    auditEvents: [{ id: 'e1', timestamp: '2026-09-23T12:00:00Z' }],
    viewerRole: ROLES.COMMISSIONER
  });
  assert.equal(summary.canManage, true);
  assert.equal(summary.canResolve, true);
  assert.equal(summary.submittedCount, 1);
  assert.deepEqual(summary.clubs.map((club) => club.status), ['locked', 'missing']);
  assert.equal(summary.auditEvents[0].id, 'e1');
});

test('manager summary cannot expose commissioner actions', () => {
  const summary = createAdminSummary({ league: { id: 'league-1', phase: 'open' }, members, viewerRole: ROLES.MANAGER });
  assert.equal(summary.canManage, false);
  assert.equal(summary.canResolve, false);
});
