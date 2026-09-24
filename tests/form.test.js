import test from 'node:test';
import assert from 'node:assert/strict';
import { applyMatchForm, captaincyBonus, chooseDefaultCaptain } from '../src/domain/form.js';

const club = {
  id: 'north',
  captainId: 'veteran',
  players: [
    { id: 'prospect', name: 'Young Prospect', age: 20, rating: 74, morale: 82, form: 0, starting: true },
    { id: 'veteran', name: 'Club Veteran', age: 31, rating: 72, morale: 82, form: 1, starting: true },
    { id: 'reserve', name: 'Reserve Player', age: 24, rating: 68, morale: 70, form: -2, starting: false }
  ]
};

test('match form rewards results and scorers while unused players regress toward steady', () => {
  const updated = applyMatchForm({ club, goalsFor: 2, goalsAgainst: 1, scorerIds: ['prospect'] });

  assert.deepEqual(updated.players.map((player) => player.form), [2, 2, -1]);
  assert.deepEqual(club.players.map((player) => player.form), [0, 1, -2]);
});

test('form is bounded after repeated positive and negative results', () => {
  const flying = { ...club, players: club.players.map((player) => ({ ...player, form: 3, starting: true })) };
  const struggling = { ...club, players: club.players.map((player) => ({ ...player, form: -3, starting: true })) };

  assert.equal(applyMatchForm({ club: flying, goalsFor: 4, goalsAgainst: 0, scorerIds: ['prospect'] }).players[0].form, 3);
  assert.equal(applyMatchForm({ club: struggling, goalsFor: 0, goalsAgainst: 4 }).players[0].form, -3);
});

test('captaincy rewards selecting a high-morale starter', () => {
  assert.equal(chooseDefaultCaptain(club), 'veteran');
  assert.equal(captaincyBonus(club), 0.64);
  assert.equal(captaincyBonus({ ...club, captainId: 'reserve' }), 0);
});
