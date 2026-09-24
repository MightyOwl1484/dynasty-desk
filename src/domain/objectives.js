/** Pure season-objective and board-confidence rules. */

const clampConfidence = (value) => Math.min(95, Math.max(20, Math.round(value)));

export function createSeasonObjective({ club, clubs, totalMatches }) {
  if (club?.id === undefined || club?.id === null || !Array.isArray(clubs) || !clubs.length || !Number.isInteger(totalMatches) || totalMatches < 1) {
    throw new TypeError('A season objective requires a club, league clubs, and match count.');
  }
  const reputationRank = [...clubs].sort((left, right) => (right.reputation ?? 60) - (left.reputation ?? 60)
    || String(left.name).localeCompare(String(right.name))).findIndex((entry) => String(entry.id) === String(club.id)) + 1;
  if (!reputationRank) throw new Error(`Club ${club.id} was not found in the league.`);

  const tier = reputationRank <= 2
    ? { targetPosition: 2, pointsPerMatch: 1.75, label: 'Challenge for the title' }
    : reputationRank <= Math.ceil(clubs.length * 0.625)
      ? { targetPosition: Math.ceil(clubs.length / 2), pointsPerMatch: 1.35, label: 'Finish in the top half' }
      : { targetPosition: Math.max(clubs.length - 2, 1), pointsPerMatch: 1, label: 'Build a competitive foundation' };

  return {
    ...tier,
    targetPoints: Math.round(totalMatches * tier.pointsPerMatch),
    totalMatches,
    reputationRank
  };
}

export function evaluateBoardConfidence({ objective, position, points, matchesPlayed }) {
  if (!objective || !Number.isInteger(position) || position < 1 || !Number.isFinite(points) || !Number.isInteger(matchesPlayed) || matchesPlayed < 0) {
    throw new TypeError('Board confidence requires an objective and current season progress.');
  }
  const progress = Math.min(1, matchesPlayed / objective.totalMatches);
  const expectedPoints = objective.targetPoints * progress;
  const pointsDelta = points - expectedPoints;
  const positionDelta = (objective.targetPosition - position) * 5 * Math.min(1, matchesPlayed / 4);
  const value = clampConfidence(60 + pointsDelta * 2 + positionDelta);
  const status = value >= 78 ? 'Delighted' : value >= 58 ? 'Supportive' : value >= 40 ? 'Watchful' : 'Concerned';
  const met = matchesPlayed >= objective.totalMatches && position <= objective.targetPosition;

  return { value, status, expectedPoints: Math.round(expectedPoints), met };
}
