# Architecture

## Core rule

The game engine is the product. HTML, SharePoint, and Teams are hosts for the engine.

```text
React or plain HTML UI
          |
     application layer
          |
  pure soccer domain engine
          |
       GameStore
       /       \
 local browser  SharePoint / future API
```

## Layers

### Domain layer

Contains rules that should work in any host:

- Player attributes and development
- Club strength and tactical modifiers
- Squad selection and lineup validation
- Fixture generation
- Match resolution
- Standings and statistics
- League phase transitions
- Role-based action permissions
- Append-only audit events

The domain layer should be deterministic and free of browser, SharePoint, React, Graph, and date-time UI dependencies. `src/domain/permissions.js` defines the shared commissioner, manager, and viewer policy; `src/domain/audit.js` defines immutable support-friendly events. Host permissions must reinforce these rules rather than replace them.

### Application layer

Coordinates user actions and domain operations:

- Load a league
- Submit or update club actions
- Lock a match week
- Resolve fixtures
- Publish results
- Create news and audit events

The first scheduled-week orchestration lives in `src/application/league-workflow.js`. It turns submitted actions into locked snapshots, applies deterministic fallback actions for missed deadlines, and requires explicit resolving and publishing phases.

`src/application/admin-summary.js` is the first commissioner-shell view model. It exposes phase, deadline, resolver version, per-club submission status, role-aware actions, and audit history without leaking SharePoint response shapes into a React/SPFx component.

The first React/SPFx host source is under `spfx/src/webparts/dynastyDesk`. It consumes that view model through props; it is intentionally scaffolded separately from the offline HTML build until a generated SPFx solution supplies the Microsoft dependencies and packaging configuration.

This layer owns validation and permissions at the product level, but it should not assume that the client is trusted in shared play.

### Persistence layer

Use an adapter interface rather than calling `localStorage` or SharePoint directly from UI components. The current browser build uses `src/stores/local.js`, which wraps browser storage behind the contract and version-tags saved envelopes so future migrations have an explicit home. `src/stores/game-store.js` documents the contract while the JavaScript prototype remains lightweight.

```ts
interface GameStore {
  loadLeague(leagueId: string): Promise<LeagueState>;
  saveClubActions(actions: ClubActions): Promise<void>;
  getFixtures(leagueId: string, matchWeek?: number): Promise<Fixture[]>;
  saveMatchResults(results: MatchResult[]): Promise<void>;
}
```

Initial adapters:

- `LocalGameStore` for solo mode (implemented first)
- `SharePointGameStore` for organization mode

Possible later adapter:

- `ApiGameStore` for a server-authoritative resolver

## Core entities

- `League`: identity, season, phase, schedule, settings, commissioner
- `Club`: identity, reputation, budget, squad, staff, current record
- `Player`: fictional identity, position, attributes, potential, fitness, morale, contract
- `Fixture`: home club, away club, match week, status, locked state
- `ClubActions`: lineup, formation, tactics, training, transfer decisions, submission metadata
- `MatchResult`: immutable score, events, player statistics, seed, resolver version
- `LeagueEvent`: append-only news or audit record

## Determinism

Every match resolution must record:

- League ID
- Fixture ID
- Match-week state version
- Resolver version
- Random seed
- Locked club actions

This makes results reproducible and gives the commissioner a useful audit trail.

## Source layout target

The current prototype is a static build. The target layout is:

```text
src/
  domain/
    models/
    league.js
    simulation/
    standings/
    schedule/
  application/
  stores/
    local/
    sharepoint/
  ui/
  data/
spfx/
docs/
tests/
dist/
```

The exact bundler can be selected during M1. The important boundary is that `domain/` must remain host-independent.

## Security boundary

In solo mode, the browser is trusted because the save is local.

In shared mode, the browser is not authoritative. A client should submit intended actions, but the final match result should be resolved from locked actions by a commissioner-controlled process or future server-side service. The first casual workplace release may use a trusted commissioner flow, but the architecture must leave room for a server-authoritative resolver.
