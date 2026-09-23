/**
 * Deterministic, host-independent match rules.
 *
 * A resolver receives a locked league snapshot and returns a new result. It
 * does not read clocks, storage, browser state, or external services.
 */

const TACTIC_MODIFIERS = Object.freeze({
  balanced: 0,
  press: 0.8,
  counter: 0.35,
  control: 0.6
});

function random(seed) {
  let value = (seed + 0x6d2b79f5) | 0;
  value = Math.imul(value ^ (value >>> 15), value | 1);
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
  return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
}

function poisson(lambda, seed) {
  const limit = Math.exp(-lambda);
  let product = 1;
  let goals = 0;
  let cursor = seed;
  do {
    goals += 1;
    cursor += 1;
    product *= random(cursor);
  } while (product > limit && goals < 8);
  return { goals: goals - 1, seed: cursor };
}

function createEvents(homeClub, awayClub, homeGoals, awayGoals, seed) {
  const events = [];
  const goals = [
    ...Array.from({ length: homeGoals }, (_, index) => ({ teamId: homeClub.id, teamName: homeClub.name, side: 'home', index })),
    ...Array.from({ length: awayGoals }, (_, index) => ({ teamId: awayClub.id, teamName: awayClub.name, side: 'away', index }))
  ];

  goals.forEach((goal, index) => {
    const minute = 5 + Math.floor(random(seed + 100 + index * 17) * 84);
    events.push({
      minute,
      type: 'goal',
      teamId: goal.teamId,
      side: goal.side,
      text: `${goal.teamName} find the breakthrough after a sharp attacking move.`
    });
  });

  events.sort((a, b) => a.minute - b.minute);
  if (!events.length) {
    events.push({
      minute: 45,
      type: 'match-note',
      teamId: null,
      side: null,
      text: 'A tense spell in midfield with neither side giving ground.'
    });
  }
  return events;
}

export function validateLineup(club) {
  const starters = club.players.filter((player) => player.starting);
  const counts = starters.reduce((result, player) => {
    result[player.position] = (result[player.position] ?? 0) + 1;
    return result;
  }, {});

  return {
    valid: starters.length === 11 && (counts.GK ?? 0) === 1 && (counts.DEF ?? 0) >= 3 && (counts.MID ?? 0) >= 2 && (counts.FWD ?? 0) >= 1,
    starters,
    counts
  };
}

export function teamStrength(club, tactic = 'balanced') {
  const lineup = validateLineup(club).starters;
  const active = lineup.length === 11 ? lineup : [...club.players].sort((a, b) => b.rating - a.rating).slice(0, 11);
  const average = active.reduce((total, player) => total + player.rating * (0.76 + player.fitness / 420), 0) / Math.max(active.length, 1);
  return average + (TACTIC_MODIFIERS[tactic] ?? 0) + club.reputation * 0.04;
}

export function resolveFixture({ fixture, homeClub, awayClub, homeTactic = 'balanced', awayTactic = 'balanced', seed = 1 }) {
  if (fixture.status === 'played') {
    throw new Error(`Fixture ${fixture.id} has already been resolved.`);
  }

  const homeStrength = teamStrength(homeClub, homeTactic);
  const awayStrength = teamStrength(awayClub, awayTactic);
  const difference = (homeStrength - awayStrength) / 12;
  const homeExpected = Math.max(0.25, 1.28 + difference);
  const awayExpected = Math.max(0.2, 1.02 - difference);
  const homeGoals = poisson(homeExpected, seed);
  const awayGoals = poisson(awayExpected, homeGoals.seed);
  const finalHomeGoals = Math.min(homeGoals.goals, 6);
  const finalAwayGoals = Math.min(awayGoals.goals, 6);

  return {
    fixtureId: fixture.id,
    resolverVersion: '0.1.0',
    seed,
    homeClubId: homeClub.id,
    awayClubId: awayClub.id,
    homeGoals: finalHomeGoals,
    awayGoals: finalAwayGoals,
    events: createEvents(homeClub, awayClub, finalHomeGoals, finalAwayGoals, seed),
    publishedAt: null
  };
}

export function applyResult(club, goalsFor, goalsAgainst) {
  const result = goalsFor > goalsAgainst ? 'win' : goalsFor === goalsAgainst ? 'draw' : 'loss';
  const points = result === 'win' ? 3 : result === 'draw' ? 1 : 0;
  return {
    ...club,
    stats: {
      ...club.stats,
      played: club.stats.played + 1,
      wins: club.stats.wins + (result === 'win' ? 1 : 0),
      draws: club.stats.draws + (result === 'draw' ? 1 : 0),
      losses: club.stats.losses + (result === 'loss' ? 1 : 0),
      goalsFor: club.stats.goalsFor + goalsFor,
      goalsAgainst: club.stats.goalsAgainst + goalsAgainst,
      points: club.stats.points + points
    }
  };
}
