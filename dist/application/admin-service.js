import { createAdminSummary } from './admin-summary.js';

/** Load the commissioner view model and its write metadata from a shared store. */
export async function loadAdminContext(store, viewerRole) {
  if (!store || typeof store.loadLeague !== 'function' || typeof store.getMembers !== 'function'
    || typeof store.getClubActions !== 'function' || typeof store.getLeagueEvents !== 'function') {
    throw new TypeError('The admin service requires league, member, action, and event reads.');
  }
  const league = await store.loadLeague();
  if (!league) return null;
  const [members, actions, auditEvents] = await Promise.all([
    store.getMembers(),
    store.getClubActions(league.MatchWeek ?? league.matchWeek),
    store.getLeagueEvents()
  ]);
  const [fixtures, clubs, players] = await Promise.all([
    typeof store.getFixtures === 'function' ? store.getFixtures(league.MatchWeek ?? league.matchWeek) : [],
    typeof store.getClubs === 'function' ? store.getClubs() : [],
    typeof store.getPlayers === 'function' ? store.getPlayers() : []
  ]);
  const resolutionRuns = typeof store.getResolutionRuns === 'function'
    ? await store.getResolutionRuns(league.MatchWeek ?? league.matchWeek)
    : [];
  const normalizedLeague = {
    ...league,
    id: league.id ?? league.LeagueId,
    phase: league.phase ?? league.Phase,
    matchWeek: league.matchWeek ?? league.MatchWeek,
    deadline: league.deadline ?? league.Deadline,
    resolverVersion: league.resolverVersion ?? league.ResolverVersion
  };
  const normalizedMembers = members.map((member) => ({
    ...member,
    userId: member.userId ?? member.UserId,
    displayName: member.displayName ?? member.DisplayName,
    clubId: member.clubId ?? member.ClubId,
    role: member.role ?? member.Role
  }));
  const normalizedActions = actions.map((action) => ({
    ...action,
    clubId: action.clubId ?? action.ClubId,
    status: action.status ?? action.Status,
    submittedAt: action.submittedAt ?? action.SubmittedAt,
    lockedAt: action.lockedAt ?? action.LockedAt
  }));
  const normalizedEvents = auditEvents.map((event) => ({
    ...event,
    id: event.id ?? event.EventId,
    type: event.type ?? event.Type,
    actorId: event.actorId ?? event.ActorId,
    message: event.message ?? event.Message,
    relatedId: event.relatedId ?? event.RelatedId,
    timestamp: event.timestamp ?? event.Timestamp
  }));
  const normalizedFixtures = fixtures.map((fixture) => ({
    ...fixture,
    id: fixture.id ?? fixture.FixtureId,
    matchWeek: fixture.matchWeek ?? fixture.MatchWeek,
    homeClubId: fixture.homeClubId ?? fixture.HomeClubId,
    awayClubId: fixture.awayClubId ?? fixture.AwayClubId,
    status: fixture.status ?? fixture.Status ?? 'scheduled'
  }));
  const playersByClubId = players.reduce((result, player) => {
    const clubId = player.clubId ?? player.ClubId;
    if (!clubId) return result;
    result[clubId] ??= [];
    result[clubId].push({
      id: player.id ?? player.PlayerId,
      name: player.name ?? player.Title,
      position: player.position ?? player.Position,
      age: player.age ?? player.Age ?? 18,
      rating: player.rating ?? player.Rating ?? 50,
      potential: player.potential ?? player.Potential ?? player.Rating ?? 50,
      fitness: player.fitness ?? player.Fitness ?? 100,
      morale: player.morale ?? player.Morale ?? 70,
      starting: Boolean(player.starting ?? player.Starting)
    });
    return result;
  }, {});
  const clubsById = clubs.reduce((result, club) => {
    const id = club.id ?? club.ClubId;
    if (!id) return result;
    result[id] = {
      id,
      name: club.name ?? club.Title ?? id,
      reputation: club.reputation ?? club.Reputation ?? 60,
      players: playersByClubId[id] ?? [],
      stats: club.stats ?? { played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, points: 0 }
    };
    return result;
  }, {});
  const pendingRun = resolutionRuns
    .map((run) => ({
      ...run,
      id: run.id ?? run.RunId,
      leagueId: run.leagueId ?? run.LeagueId,
      matchWeek: run.matchWeek ?? run.MatchWeek,
      status: run.status ?? run.Status,
      results: typeof (run.results ?? run.Results) === 'string'
        ? JSON.parse(run.results ?? run.Results)
        : (run.results ?? run.Results ?? []),
      resolverVersion: run.resolverVersion ?? run.ResolverVersion,
      publishedAt: run.publishedAt ?? run.PublishedAt
    }))
    .find((run) => run.status === 'pending');
  return {
    summary: createAdminSummary({
    league: normalizedLeague,
      members: normalizedMembers, actions: normalizedActions, auditEvents: normalizedEvents, viewerRole
    }),
    league: normalizedLeague,
    actions: normalizedActions,
    fixtures: normalizedFixtures,
    clubsById,
    pendingRun,
    resolutionRunRecord: pendingRun ? { itemId: pendingRun.Id ?? pendingRun.id, etag: pendingRun['@odata.etag'] ?? pendingRun.ETag } : undefined,
    leagueRecord: { itemId: league.Id ?? league.id, etag: league['@odata.etag'] ?? league.ETag },
    actionRecords: actions.map((action) => ({ itemId: action.Id ?? action.id, etag: action['@odata.etag'] ?? action.ETag, clubId: action.ClubId ?? action.clubId }))
  };
}

/** Backward-compatible summary-only helper for non-mutating hosts. */
export async function loadAdminSummary(store, viewerRole) {
  const context = await loadAdminContext(store, viewerRole);
  return context?.summary ?? null;
}
