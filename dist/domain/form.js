/** Pure player-form and captaincy rules. */

const clampForm = (value) => Math.min(3, Math.max(-3, value));

export function applyMatchForm({ club, goalsFor, goalsAgainst, scorerIds = [] }) {
  if (!club?.players?.length) throw new TypeError('Form updates require a club with players.');
  if (![goalsFor, goalsAgainst].every(Number.isFinite)) throw new TypeError('Form updates require a valid score.');
  const resultDelta = goalsFor > goalsAgainst ? 1 : goalsFor === goalsAgainst ? 0 : -1;
  const scorers = new Set(scorerIds.map(String));

  return {
    ...club,
    players: club.players.map((player) => {
      const current = player.form ?? 0;
      if (!player.starting) return { ...player, form: current === 0 ? 0 : current - Math.sign(current) };
      const scoringDelta = scorers.has(String(player.id)) ? 1 : 0;
      return { ...player, form: clampForm(current + resultDelta + scoringDelta) };
    })
  };
}

export function chooseDefaultCaptain(club) {
  if (!club?.players?.length) return null;
  const ranked = [...club.players].sort((a, b) => (b.morale ?? 70) - (a.morale ?? 70)
    || (b.age ?? 18) - (a.age ?? 18)
    || (b.rating ?? 50) - (a.rating ?? 50)
    || String(a.name).localeCompare(String(b.name)));
  return ranked[0].id;
}

export function captaincyBonus(club, activePlayers = club?.players?.filter((player) => player.starting) ?? []) {
  const captain = activePlayers.find((player) => String(player.id) === String(club?.captainId));
  return captain ? Math.max(0, ((captain.morale ?? 70) - 50) / 50) : 0;
}
