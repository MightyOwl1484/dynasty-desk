import test from 'node:test';
import assert from 'node:assert/strict';
import { generateYouthIntake, recommendedProspect, signAcademyPlayer } from '../src/domain/academy.js';

test('youth intake is deterministic and presents three different positions', () => {
  const first = generateYouthIntake({ clubId: 'north', season: 2, seed: 42 });
  const second = generateYouthIntake({ clubId: 'north', season: 2, seed: 42 });

  assert.deepEqual(first, second);
  assert.deepEqual(first.map((player) => player.position), ['DEF', 'MID', 'FWD']);
  assert.equal(first.every((player) => player.potential > player.rating), true);
});

test('recommended prospect prioritizes potential then current ability', () => {
  const prospects = generateYouthIntake({ clubId: 'north', season: 2, seed: 42 });
  const expected = [...prospects].sort((left, right) => right.potential - left.potential || right.rating - left.rating || left.name.localeCompare(right.name))[0];
  assert.equal(recommendedProspect(prospects).id, expected.id);
});

test('academy signing is immutable and enforces roster limits and duplicates', () => {
  const prospect = generateYouthIntake({ clubId: 'north', season: 2, seed: 42 })[0];
  const club = { id: 'north', players: [{ id: 'senior' }] };
  const signed = signAcademyPlayer({ club, prospect, maximumSquadSize: 2 });

  assert.equal(signed.players.length, 2);
  assert.equal(club.players.length, 1);
  assert.throws(() => signAcademyPlayer({ club: signed, prospect, maximumSquadSize: 3 }), /already registered/);
  assert.throws(() => signAcademyPlayer({ club: signed, prospect: { ...prospect, id: 'other' }, maximumSquadSize: 2 }), /Squad limit/);
});
