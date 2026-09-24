import test from 'node:test';
import assert from 'node:assert/strict';
import { applyMatchMorale, applyTrainingPlan, recommendTrainingFocus } from '../src/domain/training.js';

const club = {
  id: 'north',
  players: [
    { id: 'a', fitness: 72, morale: 70, starting: true },
    { id: 'b', fitness: 99, morale: 89, starting: false }
  ]
};

test('training plans expose clear fitness and match-readiness tradeoffs', () => {
  const recovery = applyTrainingPlan({ club, focus: 'recovery' });
  const intensity = applyTrainingPlan({ club, focus: 'intensity' });

  assert.deepEqual(recovery.players.map((player) => player.fitness), [80, 100]);
  assert.equal(recovery.preparationBonus, 0);
  assert.deepEqual(intensity.players.map((player) => player.fitness), [69, 96]);
  assert.equal(intensity.preparationBonus, 0.9);
  assert.equal(club.players[0].fitness, 72);
});

test('results change morale while respecting starters, substitutes, and bounds', () => {
  const winners = applyMatchMorale({ club, goalsFor: 2, goalsAgainst: 0 });
  const losers = applyMatchMorale({ club, goalsFor: 0, goalsAgainst: 2 });

  assert.deepEqual(winners.players.map((player) => player.morale), [73, 90]);
  assert.deepEqual(losers.players.map((player) => player.morale), [68, 86]);
  assert.equal(winners.preparationBonus, 0);
});

test('low fitness recommends recovery and invalid plans are rejected', () => {
  assert.equal(recommendTrainingFocus(club), 'balanced');
  assert.equal(recommendTrainingFocus({ players: [{ fitness: 60 }, { fitness: 70 }] }), 'recovery');
  assert.throws(() => applyTrainingPlan({ club, focus: 'beach-day' }), /Unknown training focus/);
});
