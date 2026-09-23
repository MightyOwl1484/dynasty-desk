/**
 * Small host-neutral SharePoint persistence adapter.
 *
 * The adapter deliberately accepts an injected list client instead of importing
 * SPFx or Microsoft Graph. The SPFx web part can provide that client later,
 * while domain and adapter tests remain runnable offline.
 */
export function createSharePointGameStore(client, leagueId) {
  if (!client || typeof client.query !== 'function' || typeof client.update !== 'function') {
    throw new TypeError('A SharePoint list client with query() and update() is required.');
  }
  if (!leagueId) throw new TypeError('leagueId is required.');

  return {
    async loadLeague() {
      const rows = await client.query('Leagues', { LeagueId: leagueId });
      return rows[0] ?? null;
    },
    async getFixtures(matchWeek) {
      const filter = { LeagueId: leagueId };
      if (matchWeek !== undefined) filter.MatchWeek = matchWeek;
      return client.query('Fixtures', filter);
    },
    async getMembers() {
      return client.query('LeagueMembers', { LeagueId: leagueId });
    },
    async getClubActions(matchWeek) {
      const filter = { LeagueId: leagueId };
      if (matchWeek !== undefined) filter.MatchWeek = matchWeek;
      return client.query('ClubActions', filter);
    },
    async getLeagueEvents() {
      return client.query('LeagueEvents', { LeagueId: leagueId });
    },
    async saveClubActions(actions, { itemId, etag } = {}) {
      if (!itemId || !etag) throw new TypeError('itemId and etag are required for optimistic updates.');
      return client.update('ClubActions', itemId, actions, { etag });
    },
    async updateLeague(itemId, league, { etag } = {}) {
      if (!itemId || !etag) throw new TypeError('itemId and etag are required for optimistic updates.');
      return client.update('Leagues', itemId, league, { etag });
    },
    async appendLeagueEvent(event) {
      if (typeof client.create !== 'function') throw new TypeError('The SharePoint client must support creates for audit events.');
      return client.create('LeagueEvents', event);
    }
  };
}
