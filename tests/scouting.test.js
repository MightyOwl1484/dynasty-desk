import test from 'node:test';
import assert from 'node:assert/strict';
import { recommendRotation, scoutClub } from '../src/domain/scouting.js';

test('scouting identifies the strongest unit and a readable tactical response', () => {
  const report = scoutClub({ players: [
    { position: 'GK', rating: 65 }, { position: 'DEF', rating: 66 },
    { position: 'MID', rating: 70 }, { position: 'MID', rating: 71 },
    { position: 'FWD', rating: 80 }, { position: 'FWD', rating: 78 }
  ] });

  assert.equal(report.strongestUnit, 'attack');
  assert.equal(report.likelyTactic, 'counter');
  assert.equal(report.recommendedTactic, 'control');
  assert.match(report.summary, /forwards/);
});

test('rotation advice compares players in the same position', () => {
  const report = recommendRotation({ players: [
    { id: 'starter', name: 'Tired Starter', position: 'MID', rating: 73, fitness: 60, morale: 68, form: -1, starting: true },
    { id: 'bench', name: 'Ready Reserve', position: 'MID', rating: 71, fitness: 96, morale: 74, form: 2, starting: false },
    { id: 'forward', name: 'Forward Reserve', position: 'FWD', rating: 85, fitness: 100, starting: false }
  ] });

  assert.equal(report.outgoingId, 'starter');
  assert.equal(report.incomingId, 'bench');
  assert.equal(report.position, 'MID');
  assert.match(report.reason, /fatigue/);
});

test('rotation advice stays quiet when there is no meaningful gain', () => {
  assert.equal(recommendRotation({ players: [
    { id: 'starter', name: 'Starter', position: 'DEF', rating: 75, fitness: 90, form: 1, starting: true },
    { id: 'bench', name: 'Reserve', position: 'DEF', rating: 67, fitness: 95, form: 0, starting: false }
  ] }), null);
});
