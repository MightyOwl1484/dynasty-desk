/** Pure weekly preparation and morale rules. */

export const TRAINING_FOCUSES = Object.freeze({
  recovery: Object.freeze({ fitness: 8, morale: 1, preparationBonus: 0 }),
  balanced: Object.freeze({ fitness: 3, morale: 2, preparationBonus: 0.3 }),
  intensity: Object.freeze({ fitness: -3, morale: 0, preparationBonus: 0.9 })
});

const clampTrainingValue = (value, min, max) => Math.min(max, Math.max(min, value));

export function applyTrainingPlan({ club, focus = 'balanced' }) {
  if (!club?.players?.length) throw new TypeError('Training requires a club with players.');
  const plan = TRAINING_FOCUSES[focus];
  if (!plan) throw new Error(`Unknown training focus: ${focus}`);

  return {
    ...club,
    preparationFocus: focus,
    preparationBonus: plan.preparationBonus,
    players: club.players.map((player) => ({
      ...player,
      fitness: clampTrainingValue((player.fitness ?? 100) + plan.fitness, 50, 100),
      morale: clampTrainingValue((player.morale ?? 70) + plan.morale, 35, 90)
    }))
  };
}

export function applyMatchMorale({ club, goalsFor, goalsAgainst }) {
  if (!club?.players?.length) throw new TypeError('Morale updates require a club with players.');
  if (![goalsFor, goalsAgainst].every(Number.isFinite)) throw new TypeError('Morale updates require a valid score.');
  const resultDelta = goalsFor > goalsAgainst ? 3 : goalsFor === goalsAgainst ? 1 : -2;

  return {
    ...club,
    preparationBonus: 0,
    players: club.players.map((player) => ({
      ...player,
      morale: clampTrainingValue((player.morale ?? 70) + resultDelta + (player.starting ? 0 : -1), 35, 90)
    }))
  };
}

export function recommendTrainingFocus(club) {
  if (!club?.players?.length) return 'balanced';
  const averageFitness = club.players.reduce((total, player) => total + (player.fitness ?? 100), 0) / club.players.length;
  return averageFitness < 76 ? 'recovery' : 'balanced';
}
