/** Pure opponent scouting and squad-depth recommendations. */

const position = (player) => player.position ?? player.pos;
const average = (values) => values.length ? values.reduce((total, value) => total + value, 0) / values.length : 0;
const title = (value) => value.charAt(0).toUpperCase() + value.slice(1);

export function scoutClub(club) {
  if (!club?.players?.length) throw new TypeError('Scouting requires a club with players.');
  const units = {
    defense: average(club.players.filter((player) => ['GK', 'DEF'].includes(position(player))).map((player) => player.rating ?? 50)),
    midfield: average(club.players.filter((player) => position(player) === 'MID').map((player) => player.rating ?? 50)),
    attack: average(club.players.filter((player) => position(player) === 'FWD').map((player) => player.rating ?? 50))
  };
  const strongestUnit = Object.entries(units).sort(([, left], [, right]) => right - left)[0][0];
  const likelyTactic = strongestUnit === 'attack' ? 'counter' : strongestUnit === 'midfield' ? 'control' : 'press';
  const recommendedTactic = { counter: 'control', control: 'press', press: 'counter' }[likelyTactic];
  const descriptions = {
    attack: 'Their forwards are the danger. Deny transition space and make them defend longer possessions.',
    midfield: 'Their midfield sets the rhythm. Pressure their buildup before they can control the match.',
    defense: 'Their back line is their platform. Draw them forward and attack the space they leave.'
  };

  return {
    strongestUnit,
    likelyTactic,
    recommendedTactic,
    summary: descriptions[strongestUnit],
    evidence: `${title(strongestUnit)} ${Math.round(units[strongestUnit])} · likely ${likelyTactic}`,
    units
  };
}

const readiness = (player) => (player.rating ?? 50) + (player.form ?? 0) * 1.5
  + ((player.fitness ?? 100) - 75) * 0.1 + ((player.morale ?? 70) - 70) * 0.04;

export function recommendRotation(club) {
  if (!club?.players?.length) return null;
  const starters = club.players.filter((player) => player.starting);
  const bench = club.players.filter((player) => !player.starting);
  const candidates = [];

  for (const outgoing of starters) {
    for (const incoming of bench.filter((player) => position(player) === position(outgoing))) {
      const gain = readiness(incoming) - readiness(outgoing);
      if (gain >= 1) candidates.push({ outgoing, incoming, gain });
    }
  }

  const best = candidates.sort((left, right) => right.gain - left.gain)[0];
  if (!best) return null;
  const reason = (best.outgoing.fitness ?? 100) < 75
    ? `${best.outgoing.name} is carrying fatigue.`
    : `${best.incoming.name} has the stronger current readiness.`;
  return {
    outgoingId: best.outgoing.id,
    incomingId: best.incoming.id,
    outgoingName: best.outgoing.name,
    incomingName: best.incoming.name,
    position: position(best.outgoing),
    reason
  };
}
