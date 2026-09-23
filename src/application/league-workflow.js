import { defaultClubActions, lockClubActions, transitionLeague } from '../domain/league.js';

/**
 * Host-neutral orchestration for a scheduled match week. A SharePoint/SPFx
 * host persists the returned snapshots; it does not reimplement these rules.
 */
export function lockMatchWeek(league, actions, lockedAt) {
  const nextActions = actions.map((action) => {
    if (action.status === 'submitted') return lockClubActions(action, lockedAt);
    return defaultClubActions(action);
  });
  return { league: transitionLeague(league, 'locked'), actions: nextActions };
}

export function beginResolution(league) {
  return transitionLeague(league, 'resolving');
}

export function publishMatchWeek(league, results, publishedAt) {
  return {
    league: transitionLeague(league, 'published'),
    results: results.map((result) => ({ ...result, publishedAt }))
  };
}
