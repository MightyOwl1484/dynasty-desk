import { defaultClubActions, lockClubActions, transitionLeague } from '../domain/league.js';
import { appendAuditEvent, createAuditEvent } from '../domain/audit.js';

/**
 * Host-neutral orchestration for a scheduled match week. A SharePoint/SPFx
 * host persists the returned snapshots; it does not reimplement these rules.
 */
export function lockMatchWeek(league, actions, lockedAt, { actorId = 'system', auditEvents = [] } = {}) {
  const nextActions = actions.map((action) => {
    if (action.status === 'submitted') return lockClubActions(action, lockedAt);
    return defaultClubActions(action);
  });
  const nextLeague = transitionLeague(league, 'locked');
  const event = createAuditEvent({
    id: `${league.id}:week-locked:${nextLeague.phaseVersion}`,
    leagueId: league.id,
    type: 'week_locked',
    actorId,
    message: 'Match week locked for resolution.',
    relatedId: String(league.matchWeek ?? ''),
    timestamp: lockedAt
  });
  return { league: nextLeague, actions: nextActions, auditEvents: appendAuditEvent(auditEvents, event) };
}

export function beginResolution(league) {
  return transitionLeague(league, 'resolving');
}

export function publishMatchWeek(league, results, publishedAt, { actorId = 'system', auditEvents = [] } = {}) {
  const nextLeague = transitionLeague(league, 'published');
  const event = createAuditEvent({
    id: `${league.id}:week-published:${nextLeague.phaseVersion}`,
    leagueId: league.id,
    type: 'week_published',
    actorId,
    message: 'Match-week results published.',
    relatedId: String(league.matchWeek ?? ''),
    timestamp: publishedAt
  });
  return {
    league: nextLeague,
    results: results.map((result) => ({ ...result, publishedAt })),
    auditEvents: appendAuditEvent(auditEvents, event)
  };
}
