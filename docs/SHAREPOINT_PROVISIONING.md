# SharePoint provisioning checklist

This is the pilot checklist for a company team-building league. It keeps tenant administration narrow and makes the setup repeatable.

## Site and lists

Create the game on a dedicated modern SharePoint site, then apply [`spfx/sharepoint-schema.json`](../spfx/sharepoint-schema.json). It is the machine-readable version of the lists and columns described in [`SHAREPOINT_MULTIPLAYER.md`](SHAREPOINT_MULTIPLAYER.md):

`src/stores/sharepoint-provisioning.js` converts that schema into a deterministic reviewable plan of list, field, and index operations. A future tenant setup command can execute the plan through the SPFx/Graph client after explicit administrator approval.

- `Leagues`
- `LeagueMembers`
- `Clubs`
- `Players`
- `Fixtures`
- `ClubActions`
- `MatchResults`
- `ResolutionRuns`
- `LeagueEvents`

Index `LeagueId` on every list. Also index `MatchWeek` on `Fixtures` and `Status` on `ClubActions` and `MatchResults`. Views should filter by league before displaying event history so the design remains safe under SharePoint's list-view threshold.

## Roles and permissions

Use a dedicated SharePoint group for commissioners and another for managers. Keep ordinary members read-only for published results, standings, and events. Managers should edit only their own `ClubActions` records; commissioners may create leagues, assign clubs, lock weeks, resolve fixtures, and reopen a week after an audit note.

The web part must still enforce the product policy in `src/domain/permissions.js`; SharePoint permissions are defense in depth, not a substitute for application checks.

The commissioner view should consume `src/application/admin-summary.js`. That keeps the visible status table, deadline, resolver version, allowed controls, and audit history consistent across SharePoint and a local demo host.

## Scheduled match-week runbook

1. Commissioner confirms the league is in `OPEN` and checks the deadline.
2. Managers review their XI and submit actions.
3. The commissioner locks the week; stale writes must be rejected by ETag.
4. The resolver validates the locked snapshot and writes a pending `ResolutionRuns` payload plus `LeagueEvents`.
5. The commissioner publishes the pending run; immutable `MatchResults` are appended before the run is marked published.
6. Any correction creates a new result version and audit event; do not overwrite published history.

The first lock mutation implementation is `src/application/admin-commands.js`. It requires the SharePoint item IDs and ETags for the league and each club action, then appends the generated `week_locked` events only after the state writes are issued.

## Accessibility and support checks

Before publishing the web part, verify keyboard access to club assignment, action submission, lock/resolve controls, and result dialogs. Every state change needs a visible status and an assistive-technology announcement. Do not rely on color alone for club identity or match status. Keep the commissioner view usable at narrow widths and with reduced motion enabled.

Record the resolver version, provisioning date, commissioner, and support contact in the `Leagues` item. This makes the administrative state current and gives a future maintainer enough context to diagnose a match-week issue.
