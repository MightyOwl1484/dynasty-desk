# Contributing to Dynasty Desk

Thank you for helping build the game. Contributions are welcome in four areas:

- Game rules and simulation
- Interface and accessibility
- Synthetic data and balancing
- SharePoint, SPFx, and Teams integration

## Before starting

Read:

1. [`README.md`](README.md)
2. [`docs/PRODUCT_PLAN.md`](docs/PRODUCT_PLAN.md)
3. [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
4. [`docs/SHAREPOINT_MULTIPLAYER.md`](docs/SHAREPOINT_MULTIPLAYER.md)

For a substantial feature, open an issue first. Explain the player problem, the proposed behavior, and which milestone it supports.

## Contribution rules

- Keep fictional clubs, players, and assets fictional unless a documented license permits otherwise.
- Contributions are accepted under the Apache License 2.0 unless a separate written agreement says otherwise.
- Keep domain rules independent of browser and SharePoint APIs.
- Prefer small modules and focused pull requests.
- Add or update tests for simulation rules and edge cases.
- Do not commit secrets, tenant URLs, access tokens, or personal data.
- Do not add dependencies without explaining why they are needed.
- Preserve the offline solo experience while shared-play features are being developed.

## Suggested issue areas

### Simulation

Match resolution, tactics, player development, injuries, morale, schedule generation, standings.

### UI

Dashboard layout, squad cards, match center, responsive behavior, keyboard access, visual design.

### Data

Synthetic roster generation, balance passes, fictional naming, test fixtures, save migration.

### Platform

SPFx web part, SharePoint list provisioning, Teams packaging, permissions, scheduled resolution.

## Definition of done

A change is ready when:

- The behavior is described in the issue or pull request.
- The solo mode still loads and plays.
- Relevant tests or manual verification steps are included.
- No unrelated generated files or secrets are committed.
- Documentation is updated when the data model, setup, or user behavior changes.

## Pull request checklist

- [ ] I kept the change focused.
- [ ] I tested the affected flow.
- [ ] I considered save compatibility.
- [ ] I added or updated documentation where needed.
- [ ] I checked keyboard and responsive behavior for UI changes.
- [ ] I did not include unlicensed assets or real personal data.
