import test from 'node:test';
import assert from 'node:assert/strict';
import { createSeasonObjective, evaluateBoardConfidence } from '../src/domain/objectives.js';

const clubs = Array.from({ length: 8 }, (_, index) => ({ id: `club-${index + 1}`, name: `Club ${index + 1}`, reputation: 80 - index * 3 }));

test('season objectives scale with club expectations', () => {
  const contender = createSeasonObjective({ club: clubs[0], clubs, totalMatches: 14 });
  const project = createSeasonObjective({ club: clubs[7], clubs, totalMatches: 14 });

  assert.equal(contender.targetPosition, 2);
  assert.equal(contender.targetPoints, 25);
  assert.equal(project.targetPosition, 6);
  assert.equal(project.targetPoints, 14);
});

test('numeric zero is accepted as a valid club id', () => {
  const numericClubs = [{ id: 0, name: 'Zero FC', reputation: 70 }, { id: 1, name: 'One FC', reputation: 60 }];
  assert.equal(createSeasonObjective({ club: numericClubs[0], clubs: numericClubs, totalMatches: 2 }).reputationRank, 1);
});

test('board confidence reflects points pace and table position', () => {
  const objective = createSeasonObjective({ club: clubs[3], clubs, totalMatches: 14 });
  const ahead = evaluateBoardConfidence({ objective, position: 2, points: 16, matchesPlayed: 7 });
  const behind = evaluateBoardConfidence({ objective, position: 8, points: 3, matchesPlayed: 7 });

  assert.ok(ahead.value > behind.value);
  assert.equal(ahead.status, 'Delighted');
  assert.equal(behind.status, 'Concerned');
});

test('final position determines whether the board objective is met', () => {
  const objective = createSeasonObjective({ club: clubs[3], clubs, totalMatches: 14 });
  assert.equal(evaluateBoardConfidence({ objective, position: 4, points: 20, matchesPlayed: 14 }).met, true);
  assert.equal(evaluateBoardConfidence({ objective, position: 5, points: 24, matchesPlayed: 14 }).met, false);
});
