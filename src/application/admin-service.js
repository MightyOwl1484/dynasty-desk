import { createAdminSummary } from './admin-summary.js';

/** Load the commissioner view model from any store implementing the shared read contract. */
export async function loadAdminSummary(store, viewerRole) {
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
  return createAdminSummary({
    league: normalizedLeague,
    members: members.map((member) => ({
      ...member,
      userId: member.userId ?? member.UserId,
      displayName: member.displayName ?? member.DisplayName,
      clubId: member.clubId ?? member.ClubId,
      role: member.role ?? member.Role
    })),
    actions: actions.map((action) => ({
      ...action,
      clubId: action.clubId ?? action.ClubId,
      status: action.status ?? action.Status,
      submittedAt: action.submittedAt ?? action.SubmittedAt,
      lockedAt: action.lockedAt ?? action.LockedAt
    })),
    auditEvents: auditEvents.map((event) => ({
      ...event,
      id: event.id ?? event.EventId,
      type: event.type ?? event.Type,
      actorId: event.actorId ?? event.ActorId,
      message: event.message ?? event.Message,
      relatedId: event.relatedId ?? event.RelatedId,
      timestamp: event.timestamp ?? event.Timestamp
    })),
    viewerRole
  });
}
