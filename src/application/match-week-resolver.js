import { beginResolution } from './league-workflow.js';
import { createAuditEvent } from '../domain/audit.js';
import { resolveFixture } from '../domain/simulation.js';

/**
 * Resolve one locked match week without depending on a browser, SharePoint,
 * or a clock. The returned snapshot is suitable for a replay UI and for the
 * immutable MatchResults list used by the SharePoint adapter.
 */
export function createResolutionPlan({
  league,
  fixtures,
  clubsById,
  actions = [],
  actorId = 'system',
  resolvedAt,
  resolver = resolveFixture
}) {
  if (league.phase !== 'locked') {
    throw new Error(`A match week must be locked before resolution; received ${league.phase}.`);
  }

  const matchWeek = league.matchWeek ?? 1;
  const weekFixtures = fixtures.filter((fixture) => fixture.matchWeek === matchWeek && fixture.status !== 'played');
  if (!weekFixtures.length) {
    throw new Error(`No scheduled fixtures found for match week ${matchWeek}.`);
  }

  const tacticsByClubId = new Map(actions.map((action) => [action.clubId, action.tactic ?? 'balanced']));
  const results = weekFixtures.map((fixture, index) => {
    const homeClub = clubsById[fixture.homeClubId];
    const awayClub = clubsById[fixture.awayClubId];
    if (!homeClub || !awayClub) {
      throw new Error(`Fixture ${fixture.id} references a missing club.`);
    }

    const result = resolver({
      fixture,
      homeClub,
      awayClub,
      homeTactic: tacticsByClubId.get(homeClub.id) ?? 'balanced',
      awayTactic: tacticsByClubId.get(awayClub.id) ?? 'balanced',
      seed: league.seed + matchWeek * 100 + index
    });
    return { ...result, leagueId: league.id, matchWeek };
  });

  const nextLeague = beginResolution(league);
  const auditEvent = createAuditEvent({
    id: `${league.id}:week-resolving:${nextLeague.phaseVersion}`,
    leagueId: league.id,
    type: 'week_resolving',
    actorId,
    message: `Match week ${matchWeek} resolved into ${results.length} fixture result${results.length === 1 ? '' : 's'}.`,
    relatedId: String(matchWeek),
    timestamp: resolvedAt
  });

  const runId = `${league.id}:week:${matchWeek}:run:${nextLeague.phaseVersion}`;
  return {
    league: nextLeague,
    results,
    resolutionRun: {
      id: runId,
      leagueId: league.id,
      matchWeek,
      status: 'pending',
      results,
      resolverVersion: league.resolverVersion ?? '0.1.0',
      createdAt: resolvedAt,
      createdBy: actorId,
      publishedAt: null
    },
    auditEvents: [auditEvent]
  };
}
