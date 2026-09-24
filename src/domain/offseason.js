/** Host-independent season review and player progression rules. */

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const appearances = (player) => player.appearances ?? player.apps ?? 0;
const goals = (player) => player.goals ?? 0;
const points = (club) => club.stats?.points ?? club.stats?.pts ?? 0;
const goalDifference = (club) => (club.stats?.goalsFor ?? club.stats?.gf ?? 0) - (club.stats?.goalsAgainst ?? club.stats?.ga ?? 0);

function stableRoll(seed, id) {
  let value = Number(seed) || 1;
  for (const character of String(id)) value = Math.imul(value ^ character.charCodeAt(0), 2654435761);
  value ^= value >>> 16;
  return (value >>> 0) / 4294967296;
}

function rankClubs(clubs) {
  return [...clubs].sort((a, b) => points(b) - points(a) || goalDifference(b) - goalDifference(a) || String(a.name).localeCompare(String(b.name)));
}

function playerSummary(player) {
  return {
    id: player.id,
    name: player.name,
    position: player.position ?? player.pos,
    age: player.age,
    appearances: appearances(player),
    goals: goals(player),
    rating: player.rating,
    ratingChange: player.rating - (player.seasonStartRating ?? player.rating)
  };
}

export function createSeasonReview({ season, clubs, userClubId }) {
  if (!Number.isInteger(season) || season < 1 || !Array.isArray(clubs) || !clubs.length) {
    throw new TypeError('A season review requires a season number and clubs.');
  }
  const standings = rankClubs(clubs);
  const userClub = clubs.find((club) => String(club.id) === String(userClubId));
  if (!userClub) throw new Error(`User club ${userClubId} was not found.`);
  const allPlayers = clubs.flatMap((club) => club.players.map((player) => ({ ...playerSummary(player), clubId: club.id, clubName: club.name })));
  const scorerOrder = (a, b) => b.goals - a.goals || b.appearances - a.appearances || b.rating - a.rating || a.name.localeCompare(b.name);
  const squad = userClub.players.map(playerSummary).sort(scorerOrder);
  const champion = standings[0];
  const topScorer = [...allPlayers].sort(scorerOrder)[0];
  return {
    season,
    champion: { clubId: champion.id, clubName: champion.name, points: points(champion) },
    userClub: { clubId: userClub.id, clubName: userClub.name, position: standings.indexOf(userClub) + 1, points: points(userClub) },
    topScorer,
    clubPlayerOfSeason: squad[0],
    squad
  };
}

function playerProgression(player, seed) {
  const age = player.age ?? 18;
  const rating = player.rating ?? 50;
  const potential = Math.max(rating, player.potential ?? rating);
  const played = appearances(player);
  const roll = stableRoll(seed, player.id);
  let delta = 0;

  if (age <= 23 && played >= 5 && rating < potential) delta = 1 + (roll > 0.72 ? 1 : 0);
  else if (age <= 29 && played >= 10 && rating < potential && roll > 0.55) delta = 1;
  else if (age >= 35) delta = -2;
  else if (age >= 32 && (played < 10 || roll > 0.35)) delta = -1;
  else if (age >= 30 && played < 5 && roll > 0.5) delta = -1;

  const nextRating = clamp(rating + delta, 40, potential);
  return {
    ...player,
    age: age + 1,
    rating: nextRating,
    fitness: Math.max(92, player.fitness ?? 92),
    morale: clamp((player.morale ?? 70) + 5, 40, 85),
    appearances: 0,
    apps: 0,
    goals: 0,
    seasonStartRating: nextRating
  };
}

export function advanceOffseason({ clubs, seed = 1 }) {
  if (!Array.isArray(clubs) || !clubs.length) throw new TypeError('Offseason progression requires clubs.');
  const changes = [];
  const nextClubs = clubs.map((club, clubIndex) => ({
    ...club,
    players: club.players.map((player, playerIndex) => {
      const progressed = playerProgression(player, seed + clubIndex * 101 + playerIndex * 17);
      const delta = progressed.rating - player.rating;
      if (delta) changes.push({ clubId: club.id, playerId: player.id, playerName: player.name, delta, previousRating: player.rating, rating: progressed.rating });
      return progressed;
    }),
    stats: { played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, points: 0 }
  }));
  return { clubs: nextClubs, changes, seed: (Number(seed) + 1) >>> 0 };
}
