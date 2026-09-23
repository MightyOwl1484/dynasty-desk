/** Append-only administrative events for commissioner and support workflows. */
export function createAuditEvent({ id, leagueId, type, actorId, message, relatedId = null, timestamp }) {
  if (!id || !leagueId || !type || !actorId || !message || !timestamp) {
    throw new Error('Audit events require an id, league, type, actor, message, and timestamp.');
  }
  return Object.freeze({ id, leagueId, type, actorId, message, relatedId, timestamp });
}

export function appendAuditEvent(events, event) {
  if (events.some((existing) => existing.id === event.id)) {
    throw new Error(`Audit event ${event.id} already exists.`);
  }
  return [...events, event];
}
