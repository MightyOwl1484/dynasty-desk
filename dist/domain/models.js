/**
 * Host-independent domain factories for Dynasty Desk.
 *
 * These objects intentionally contain plain data only. Browser storage,
 * React, SharePoint, and UI concerns belong outside the domain layer.
 */

const POSITIONS = Object.freeze(['GK', 'DEF', 'MID', 'FWD']);

export function createPlayer(input) {
  if (!input?.id || !input?.name || !POSITIONS.includes(input.position)) {
    throw new Error('A player requires an id, name, and valid position.');
  }

  return {
    id: input.id,
    name: input.name,
    position: input.position,
    age: input.age ?? 18,
    rating: input.rating ?? 50,
    potential: input.potential ?? input.rating ?? 50,
    fitness: input.fitness ?? 100,
    morale: input.morale ?? 70,
    appearances: input.appearances ?? 0,
    goals: input.goals ?? 0
  };
}

export function createClub(input) {
  if (!input?.id || !input?.name) {
    throw new Error('A club requires an id and name.');
  }

  return {
    id: input.id,
    name: input.name,
    reputation: input.reputation ?? 60,
    players: [...(input.players ?? [])],
    stats: {
      played: input.stats?.played ?? 0,
      wins: input.stats?.wins ?? 0,
      draws: input.stats?.draws ?? 0,
      losses: input.stats?.losses ?? 0,
      goalsFor: input.stats?.goalsFor ?? 0,
      goalsAgainst: input.stats?.goalsAgainst ?? 0,
      points: input.stats?.points ?? 0
    }
  };
}

export function createFixture(input) {
  if (!input?.id || !input.homeClubId || !input.awayClubId) {
    throw new Error('A fixture requires an id, home club, and away club.');
  }

  return {
    id: input.id,
    matchWeek: input.matchWeek ?? 1,
    homeClubId: input.homeClubId,
    awayClubId: input.awayClubId,
    status: input.status ?? 'scheduled',
    score: input.score ?? null
  };
}

export function createLeague(input) {
  if (!input?.id || !input?.name) {
    throw new Error('A league requires an id and name.');
  }

  return {
    id: input.id,
    name: input.name,
    season: input.season ?? 1,
    phase: input.phase ?? 'open',
    clubs: [...(input.clubs ?? [])],
    fixtures: [...(input.fixtures ?? [])],
    seed: input.seed ?? 1,
    resolverVersion: input.resolverVersion ?? '0.1.0'
  };
}

export { POSITIONS };
