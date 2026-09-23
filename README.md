# Dynasty Desk

Dynasty Desk is an HTML-first fictional soccer management game. You run a club, build a squad, set tactics, develop players, and guide the team through a scheduled league season.

The project is designed to work in two modes:

- **Solo mode:** an offline browser game with local saves.
- **Organization mode:** a SharePoint Framework (SPFx) experience where coworkers manage clubs in a shared, scheduled league.

The roster, clubs, competitions, and artwork are fictional. Public soccer data and open-source management games may inform the shape of the simulation, but the project does not copy proprietary databases, player identities, logos, or commercial game assets.

## Current prototype

The current prototype is a static browser build in [`dist/`](dist/). It already includes:

- Fictional clubs and synthetic players
- Squad selection and starting XI management
- Tactical approaches
- A fourteen-matchweek season
- Match simulation and commentary
- Standings, player development, fitness, goals, and club news
- Local browser persistence

Open `dist/index.html` in a browser, or serve the folder with any static HTTP server. No build step is currently required.

## Product direction

The next version will make the game a polished soccer management experience first, then add shared league play through SharePoint. The simulation engine must remain independent of its host so the same rules can run in a local browser, an SPFx web part, or a future server-side resolver.

Read the project plan and architecture documents before making substantial changes:

- [`docs/PRODUCT_PLAN.md`](docs/PRODUCT_PLAN.md) — product goals, modes, milestones, and non-goals
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — game layers, domain model, and persistence boundary
- [`docs/SHAREPOINT_MULTIPLAYER.md`](docs/SHAREPOINT_MULTIPLAYER.md) — SPFx, SharePoint lists, scheduled matches, and multiplayer rules
- [`docs/SHAREPOINT_PROVISIONING.md`](docs/SHAREPOINT_PROVISIONING.md) — pilot setup, roles, match-week runbook, and accessibility checks
- [`docs/DESIGN_REVIEW.md`](docs/DESIGN_REVIEW.md) — initial visual, accessibility, game-feel, and administrative review
- [`docs/GAMEPLAY_REVIEW.md`](docs/GAMEPLAY_REVIEW.md) — fun, accessibility, onboarding, and live-match direction
- [`CONTRIBUTING.md`](CONTRIBUTING.md) — contribution workflow and definition of done

## Development workflow

Use an issue for a meaningful change, create a focused branch, and open a pull request into `main`. GitHub Actions validates the prototype on pushes and pull requests.

The first implementation branch is `feature/domain-model`, which extracts the game state and simulation rules from the current static build.

The validation loop is intentionally small and reproducible:

```powershell
node scripts/build.mjs
node --test
node --check dist/app.js
node scripts/check-a11y.mjs
```

The solo prototype saves through a versioned local-store adapter. That keeps browser persistence replaceable when the SharePoint-backed organization adapter is introduced.

## Design principles

1. Fictional data first. The game should be enjoyable without requiring licensed real-world data.
2. Deterministic simulation. Given the same locked game state and seed, every resolver produces the same result.
3. Local-first development. Contributors should be able to run and test the core game without a Microsoft 365 tenant.
4. SharePoint as collaboration infrastructure. SharePoint stores league state and user actions; it should not contain the core game rules.
5. Accessible information density. The interface should feel like a modern sports operations dashboard, not a spreadsheet dump.
6. Small, reviewable contributions. Domain rules, UI work, data work, and platform work should be separable.

## License and asset policy

Code and documentation are licensed under the [Apache License 2.0](LICENSE). The license permits commercial and non-commercial use, modification, and redistribution, subject to its notice and attribution requirements. See [NOTICE](NOTICE) for project attribution.

Future assets should come from clearly licensed sources such as Kenney, Game-icons.net, or OpenMoji, with attribution retained where required. Do not commit copied club crests, player photos, commercial game data, or unverified web-scraped databases.
