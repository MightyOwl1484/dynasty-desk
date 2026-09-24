# Godot pivot roadmap

Roadmap items are ordered by player value and technical dependency. A milestone is complete only when its exit criteria are demonstrated, not merely when files exist.

## P0 — Preserve and pivot

Status: **in progress**

- Preserve the working HTML soccer prototype and its automated checks.
- Record the Godot, GDScript, Python-tooling, web-export, and licensing decisions.
- Create a Godot 4.7 project with a deterministic prototype resolver.
- Add a Web export preset and headless test entry point.
- Establish a clean-room reference policy for 99Managers.

Exit: the Godot project opens, a player can resolve a prototype bout, the same seed repeats exactly, and documentation tells a contributor where new work belongs.

## P1 — Playable arena vertical slice

Status: **in progress**

Current progress: four generated Houses now provide six-person rosters, selectable three-person lineups, opponent choice, and visible strategy tradeoffs. The result is resolved and locked before presentation; high-contrast markers animate from its event stream; play, pause, speed, skip, replay, reduced-motion, and text-only controls are implemented and covered by headless controller tests.

- Finalize the bout vocabulary and non-graphic fictional sport rules.
- Expand the four-House prototype into the planned eight-House content set after the rules stabilize.
- Improve lineup comparisons while preserving the current three-slot selection and four visible strategy tradeoffs.
- Expand the event-driven arena presentation toward a two-minute tactical watch while preserving play, pause, speed, skip, and replay.
- Validate text-only and reduced-motion modes with assistive technology and browser builds.
- Add a post-bout explanation identifying decisive competitors and choices.
- Validate a single-threaded web export in target browsers.

Exit: a first-time player can choose a House, make one informed decision, watch or skip a bout, and understand the result in under five minutes.

## P2 — Management loop

- Build the weekly loop: briefing, training, lineup, strategy, bout, recovery, news.
- Add fatigue, morale, form, injury, and relationship consequences.
- Add competitor roles and concise comparison cards.
- Add an inbox/story feed that surfaces only actionable events.
- Keep recommendations available without making them mandatory.

Exit: at least three consecutive weeks produce connected decisions and recognizable competitor stories.

## P3 — Season and persistence

- Generate an eight-House schedule and standings.
- Add local versioned saves, reset, export, and import.
- Add season objectives, patron confidence, records, awards, and playoffs.
- Add deterministic AI preparation using the same legal actions as the player.
- Test complete seasons and corrupted-save recovery.

Exit: a complete season can be played, closed, resumed, and finished without developer intervention.

## P4 — Offseason and long-term careers

- Add progression, aging, recovery, retirement, and recruitment trials.
- Add simple contracts and House reputation.
- Add constrained roster moves without a spreadsheet-heavy transfer market.
- Add rivalries, traits, and career history.
- Use Python balance tooling to simulate thousands of seasons and publish balance summaries.

Exit: finishing a season creates at least three meaningful choices before the next season and long careers remain statistically healthy.

## P5 — Public web release

- Automate Godot headless tests and Web export in GitHub Actions.
- Publish versioned builds through GitHub Pages.
- Add loading, compatibility, offline/PWA, and save-persistence guidance.
- Complete keyboard, contrast, text scale, reduced-motion, and browser accessibility passes.
- Add contributor-ready issues, screenshots, and first-release notes.

Exit: a tagged release is playable from a public HTTPS URL and its source can be rebuilt from documented steps.

## P6 — Organization league research

- Validate whether SharePoint, Teams, or a small API is the right host.
- Define identity, deadline, locking, audit, and recovery requirements.
- Prototype server-authoritative scheduled resolution with the serialized match contract.
- Preserve the complete solo experience without an account.

Exit: a small invited group can complete a scheduled league week without manual database repair. This milestone remains optional until the solo game demonstrates retention and fun.

## Current first-slice backlog

1. Run the scaffold under an installed Godot 4.7 editor and fix any parser issues.
2. Add actual animated marker playback driven exclusively by result events.
3. Add Python Monte Carlo balance reports against the committed generated content.
4. Add concise competitor comparison cards to the lineup decision.
5. Add Web export templates and artifact generation to continuous integration.
6. Decide the final product name after the vertical slice establishes its tone.
