# SharePoint and multiplayer plan

## Why SharePoint

SharePoint provides a practical organization layer for a company edition:

- Existing identity and site permissions
- Tenant-hosted SPFx web parts
- Lists for league configuration and state
- SharePoint and Teams entry points
- Familiar administration for an internal team-building exercise

SPFx is the supported Microsoft 365 extensibility model and can surface the same web part in SharePoint, Teams, and SharePoint/Viva app experiences. The game should use that hosting model without coupling the soccer rules to Microsoft 365 APIs.

## Suggested lists

Create one logical set of lists per game site or provision them with a setup script.

### `Leagues`

League name, season, phase, match-week, deadline, settings, commissioner, resolver version.

### `LeagueMembers`

League, user identifier, club, role, status, joined date.

### `Clubs`

League, club identity, budget, reputation, record, manager, version.

### `Players`

League, club, fictional player data, attributes, position, fitness, morale, contract, version.

### `Fixtures`

League, match week, home club, away club, deadline, status, locked state, result reference.

### `ClubActions`

League, fixture or match week, club, manager, lineup, formation, tactics, training, submitted time, locked time, status.

### `MatchResults`

League, fixture, score, events, statistics, seed, resolver version, published time.

### `LeagueEvents`

League, event type, title, message, related object, actor, timestamp.

## Match-week state machine

```text
SETUP
  ↓
PREPARATION → OPEN
  ↓ deadline
LOCKED
  ↓
RESOLVING
  ↓
PUBLISHED
  ↓
NEXT_WEEK or COMPLETE
```

The first host-independent implementation of these transitions lives in `src/domain/league.js`. It also defines submit/lock behavior and a deterministic balanced fallback for a missed deadline. The initial injected persistence boundary lives in `src/stores/sharepoint.js`, while `src/stores/spfx-client.js` adapts the SPFx `SPHttpClient` surface to that boundary. Reads are scoped by league and club-action updates require an ETag. The future web part should provide the configured client and call these rules rather than reimplementing them in event handlers.

Rules:

- Managers can edit actions during `OPEN`.
- Actions are read-only in `LOCKED`.
- Only the resolver/commissioner can transition `LOCKED` to `RESOLVING`.
- Results are immutable after `PUBLISHED`.
- Any correction creates an audit event and a new result version rather than silently overwriting history.

## Conflict handling

Use SharePoint item versions or ETags for mutable records. If a manager edits an item based on stale data, the write should fail and the UI should reload the current record. Microsoft documents ETag-based protection for SharePoint list and Microsoft Graph list-item updates.

Use indexed columns and league-specific filtering. SharePoint views have a default 5,000-item threshold, so do not design one unfiltered global event or action view for every league.

## Scheduled matches

The product should treat scheduled play as a league cadence, not as a real-time server loop.

Example:

- Monday: match week opens
- Thursday: managers finalize lineups
- Friday: commissioner or scheduled process locks submissions
- Friday evening: fixtures resolve
- Saturday: results and league news publish

Missed action policy should be configurable:

- Use the last valid lineup
- Use the strongest available XI
- Auto-submit a balanced tactic
- Mark the club as unmanaged for the week

## Implementation levels

### Level 1 — casual shared league

SharePoint stores state. A commissioner initiates resolution from the SPFx interface. This is appropriate for an internal team-building pilot with trusted participants.

### Level 2 — scheduled resolution

Use an approved scheduled process to advance eligible locked fixtures. Keep the resolver deterministic and write a complete audit record.

### Level 3 — competitive multiplayer

Move match resolution behind a server-side API or Azure Function. The SPFx client submits actions and reads results, but cannot invent final scores.

## Permissions

Start with the narrowest practical SharePoint site permissions:

- Managers can read league data and edit only their own action records.
- Commissioners can manage league setup and resolve weeks.
- Results and audit events should be read-only to ordinary managers.

If Microsoft Graph permissions are required, document them clearly and request tenant-admin approval during deployment. Avoid broad permissions until a specific feature needs them.

## Deployment shape

1. Package the SPFx solution.
2. Deploy it to the tenant app catalog.
3. Provision or select a game SharePoint site.
4. Create the game lists and indexed columns.
5. Add the web part to a modern SharePoint page.
6. Optionally expose the component as a Teams tab.
7. Assign commissioner and manager permissions.

## Data portability

The product should eventually support exporting a league as a versioned JSON package. This protects the project from being locked to SharePoint and makes test fixtures, demos, backups, and local development much easier.
