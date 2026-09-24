/** Deterministic fictional youth intake and signing rules. */

const FIRST_NAMES = ['Avery', 'Cameron', 'Dani', 'Emery', 'Frankie', 'Harper', 'Jules', 'Kit', 'Micah', 'Remy', 'Shay', 'Toni'];
const LAST_NAMES = ['Adebayo', 'Bauer', 'Costa', 'Dawes', 'Farrell', 'Ito', 'Mensah', 'Navarro', 'Quinn', 'Rahman', 'Santos', 'Vega'];
const PROFILES = [
  { position: 'DEF', archetype: 'Composed defender' },
  { position: 'MID', archetype: 'Creative midfielder' },
  { position: 'FWD', archetype: 'Direct forward' }
];

function stableNumber(seed, salt) {
  let value = Number(seed) || 1;
  for (const character of String(salt)) value = Math.imul(value ^ character.charCodeAt(0), 2654435761);
  value ^= value >>> 16;
  return value >>> 0;
}

export function generateYouthIntake({ clubId, season, seed = 1 }) {
  if (clubId === undefined || clubId === null || !Number.isInteger(season) || season < 1) {
    throw new TypeError('A youth intake requires a club id and season.');
  }
  return PROFILES.map((profile, index) => {
    const value = stableNumber(seed + index * 97, `${clubId}-${season}-${profile.position}`);
    const rating = 54 + value % 10;
    const potential = Math.min(88, rating + 12 + ((value >>> 7) % 14));
    return {
      id: `academy-${season}-${clubId}-${index + 1}`,
      name: `${FIRST_NAMES[value % FIRST_NAMES.length]} ${LAST_NAMES[(value >>> 5) % LAST_NAMES.length]}`,
      position: profile.position,
      archetype: profile.archetype,
      age: 17 + ((value >>> 11) % 3),
      rating,
      potential,
      fitness: 96,
      morale: 76,
      form: 0,
      appearances: 0,
      goals: 0,
      starting: false,
      seasonStartRating: rating
    };
  });
}

export function signAcademyPlayer({ club, prospect, maximumSquadSize = 22 }) {
  if (!club?.players || !prospect?.id) throw new TypeError('Signing requires a club and prospect.');
  if (club.players.length >= maximumSquadSize) throw new Error(`Squad limit of ${maximumSquadSize} reached.`);
  if (club.players.some((player) => String(player.id) === String(prospect.id))) throw new Error(`Player ${prospect.id} is already registered.`);
  return { ...club, players: [...club.players, { ...prospect }] };
}

export function recommendedProspect(prospects) {
  if (!Array.isArray(prospects) || !prospects.length) return null;
  return [...prospects].sort((left, right) => right.potential - left.potential || right.rating - left.rating || left.name.localeCompare(right.name))[0];
}
