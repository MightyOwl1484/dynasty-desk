import test from 'node:test';
import assert from 'node:assert/strict';
import { createClub, createFixture, createPlayer } from '../src/domain/models.js';
import { applyResult, resolveFixture, teamStrength, validateLineup } from '../src/domain/simulation.js';

function makeClub(id, rating = 70) {
  const positions = ['GK', 'DEF', 'DEF', 'DEF', 'MID', 'MID', 'MID', 'MID', 'FWD', 'FWD', 'FWD'];
  return createClub({
    id,
    name: id,
    players: positions.map((position, index) => ({
      ...createPlayer({ id: `${id}-${index}`, name: `${id} ${index}`, position, rating }),
      starting: true
    }) )
  });
}

test('validates a complete starting XI', () => {
  const club = makeClub('Northport');
  assert.equal(validateLineup(club).valid, true);
  assert.equal(validateLineup(club).starters.length, 11);
});

test('uses stronger players when a lineup is incomplete', () => {
  const club = makeClub('Northport');
  club.players.forEach((player) => { player.starting = false; });
  assert.equal(teamStrength(club) > 0, true);
});

test('resolves the same fixture deterministically', () => {
  const fixture = createFixture({ id: 'fixture-1', homeClubId: 'home', awayClubId: 'away' });
  const homeClub = makeClub('home', 75);
  const awayClub = makeClub('away', 65);
  const first = resolveFixture({ fixture, homeClub, awayClub, seed: 42 });
  const second = resolveFixture({ fixture, homeClub, awayClub, seed: 42 });
  assert.deepEqual(first, second);
});

test('applies a result to standings without mutating the source club', () => {
  const club = makeClub('Northport');
  const updated = applyResult(club, 2, 1);
  assert.equal(updated.stats.points, 3);
  assert.equal(club.stats.points, 0);
});
