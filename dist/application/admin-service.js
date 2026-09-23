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
  return {
    summary: createAdminSummary({
    league: normalizedLeague,
      members: normalizedMembers, actions: normalizedActions, auditEvents: normalizedEvents, viewerRole
    }),
    league: normalizedLeague,
    actions: normalizedActions,
    leagueRecord: { itemId: league.Id ?? league.id, etag: league['@odata.etag'] ?? league.ETag },
    actionRecords: actions.map((action) => ({ itemId: action.Id ?? action.id, etag: action['@odata.etag'] ?? action.ETag, clubId: action.ClubId ?? action.clubId }))
  };
}

/** Backward-compatible summary-only helper for non-mutating hosts. */
export async function loadAdminSummary(store, viewerRole) {
  const context = await loadAdminContext(store, viewerRole);
  return context?.summary ?? null;
}
