# Dynasty Desk product plan

## Vision

Dynasty Desk is a fictional soccer management game that turns a league into a shared story. A solo player can enjoy a complete career locally. A group of coworkers can each manage a club, prepare for scheduled fixtures, and see the league resolve together through SharePoint and Teams.

## Target experiences

### Solo career

- Start a fictional club career without an account.
- Manage a squad, tactics, training, development, and transfers.
- Simulate a season at the player's pace.
- Save and resume in the browser.
- Export and import a league save when practical.

### Workplace league

- An organizer creates a league and assigns one club to each participant.
- Managers submit lineups and tactics before a match-week deadline.
- The league locks submitted actions and resolves fixtures together.
- Results, standings, news, and next deadlines are visible to everyone.
- The organizer can pause, reopen, or advance a match week.

## Initial game scope

The first shared league should be intentionally small:

- 8–12 fictional clubs
- 18–22 players per club
- 14–18 match weeks
- One scheduled match round per week
- Starting XI, formation, tactical approach, fitness, morale, and development
- Simple transfers and contracts after the core loop is stable
- League table, match reports, player statistics, and news

## Milestones

### M0 — project foundation

- Document the domain model and contribution workflow.
- Establish the source layout and test strategy.
- Define the fictional data and asset licensing policy.
- Create GitHub-ready issue templates and project labels.

### M1 — HTML game foundation

- Extract game state from the current single-file prototype.
- Create typed domain models for clubs, players, fixtures, actions, and results.
- Move simulation rules into a pure TypeScript module.
- Add deterministic seeds and repeatable simulation tests.
- Keep the existing static prototype playable during the refactor.

### M2 — refreshed solo experience

- Update the visual system and navigation for a modern sports operations dashboard.
- Add squad depth planning, player cards, form, morale, and clearer match reports.
- Improve save versioning and add a safe reset/export path.
- Add onboarding and a new-career flow.

Current progress: onboarding, safe local startup, squad fitness, weekly training, morale, match explanations, export/import, and multi-season progression are playable. Player form and deeper role planning remain open.

### M3 — shared league model

- Add league phases: setup, preparation, locked, resolving, published.
- Add a commissioner role and club assignment flow.
- Add scheduled fixtures and action deadlines.
- Add append-only match results and audit-friendly events.
- Test conflicts, missed submissions, and late changes.

### M4 — SPFx integration

- Create a React-based SPFx web part shell.
- Add SharePoint persistence behind the same `GameStore` interface.
- Use tenant identity for participant mapping.
- Add SharePoint-hosted commissioner and manager views.
- Make the component available as a Teams tab.

### M5 — organization polish

- Add league announcements and optional notifications.
- Improve Teams and SharePoint dashboard entry points.
- Add accessibility and keyboard-navigation checks.
- Add tenant setup documentation and sample list provisioning.
- Package a small demo league for evaluation by a company team.

## Non-goals for the first release

- Real player names, club logos, or licensed player ratings
- Live 2D or 3D match visuals
- Real-time multiplayer during a match
- A global public matchmaking service
- Full financial accounting or complex transfer regulations
- A SharePoint-only implementation of the entire simulation engine

## Success criteria

The first meaningful release is successful when:

1. A new player can start a solo career and understand the next decision without instructions.
2. A match week can be completed in a few minutes.
3. An 8–12 person league can run one scheduled match week without manual database repair.
4. The same fixture produces the same result from the same locked state and seed.
5. A contributor can work on the simulation, UI, data, or SPFx adapter without needing to understand the entire codebase.
