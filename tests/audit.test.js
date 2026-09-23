import test from 'node:test';
import assert from 'node:assert/strict';
import { appendAuditEvent, createAuditEvent } from '../src/domain/audit.js';

const event = createAuditEvent({
  id: 'event-1', leagueId: 'league-1', type: 'week_locked', actorId: 'commissioner-1',
  message: 'Match week 3 locked.', relatedId: 'week-3', timestamp: '2026-09-23T12:00:00Z'
});

test('audit events have an explicit support-friendly shape', () => {
  assert.equal(Object.isFrozen(event), true);
  assert.equal(event.relatedId, 'week-3');
  assert.throws(() => createAuditEvent({}), /Audit events require/);
});

test('audit history appends without mutating and rejects duplicate ids', () => {
  const history = [];
  const next = appendAuditEvent(history, event);
  assert.deepEqual(history, []);
  assert.deepEqual(next, [event]);
  assert.throws(() => appendAuditEvent(next, event), /already exists/);
});
