import test from 'node:test';
import assert from 'node:assert/strict';
import { advanceOffseason, createSeasonReview } from '../src/domain/offseason.js';

const clubs = [
  {
    id: 'north', name: 'Northport', stats: { points: 28, goalsFor: 24, goalsAgainst: 12 },
    players: [
      { id: 'n1', name: 'Young Star', position: 'FWD', age: 20, rating: 68, potential: 80, appearances: 14, goals: 9, seasonStartRating: 67, fitness: 76, morale: 72 },
      { id: 'n2', name: 'Veteran', position: 'DEF', age: 35, rating: 72, potential: 72, appearances: 4, goals: 0, seasonStartRating: 72, fitness: 70, morale: 66 }
    ]
  },
  {
    id: 'south', name: 'Southbank', stats: { points: 31, goalsFor: 22, goalsAgainst: 8 },
    players: [{ id: 's1', name: 'League Scorer', position: 'FWD', age: 27, rating: 75, potential: 77, appearances: 14, goals: 12, seasonStartRating: 75 }]
  }
];

test('season review captures standings, awards, and player deltas', () => {
  const review = createSeasonReview({ season: 1, clubs, userClubId: 'north' });
  assert.equal(review.champion.clubId, 'south');
  assert.equal(review.userClub.position, 2);
  assert.equal(review.topScorer.name, 'League Scorer');
  assert.equal(review.clubPlayerOfSeason.name, 'Young Star');
  assert.equal(review.squad[0].ratingChange, 1);
});

test('offseason progression is deterministic and resets seasonal statistics', () => {
  const first = advanceOffseason({ clubs, seed: 42 });
  const second = advanceOffseason({ clubs, seed: 42 });
  assert.deepEqual(first, second);
  const young = first.clubs[0].players[0];
  const veteran = first.clubs[0].players[1];
  assert.equal(young.age, 21);
  assert.equal(young.rating > 68, true);
  assert.equal(young.appearances, 0);
  assert.equal(young.goals, 0);
  assert.equal(veteran.age, 36);
  assert.equal(veteran.rating, 70);
  assert.equal(first.clubs[0].stats.points, 0);
});

test('season review rejects missing clubs and unknown user clubs', () => {
  assert.throws(() => createSeasonReview({ season: 1, clubs: [], userClubId: 'north' }), /requires a season/);
  assert.throws(() => createSeasonReview({ season: 1, clubs, userClubId: 'missing' }), /was not found/);
});
