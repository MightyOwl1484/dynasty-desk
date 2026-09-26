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

Current progress: four generated Houses now provide six-person rosters, selectable three-person lineups, opponent choice, compact competitor stats, opponent-relative lineup comparisons, and visible strategy tradeoffs. A three-step first-run tour explains House choice, the one-choice-at-a-time weekly flow, presentation options, and automatic saves; it remains available through a permanent **How to play** action. The result is resolved and locked before presentation; high-contrast markers animate from its event stream; play, pause, speed, skip, replay, reduced-motion, and text-only controls are implemented and covered by headless controller tests. A tested post-bout review identifies the winning side's leading contributor and summarizes strategy, score margin, and exchange shape without mutating the result. Browser playtesting now moves focus and scroll position directly to the arena when a result locks and exposes an in-context **Close Week** action beside the review, removing two implicit scroll steps from the first session.

- Finalize the bout vocabulary and non-graphic fictional sport rules.
- Expand the four-House prototype into the planned eight-House content set after the rules stabilize.
- Refine the implemented lineup comparisons through browser playtesting while preserving the three-slot selection and four visible strategy tradeoffs.
- Expand the event-driven arena presentation toward a two-minute tactical watch while preserving play, pause, speed, skip, and replay.
- Validate text-only and reduced-motion modes with assistive technology and browser builds.
- Expand the implemented post-bout explanation only when new information helps the next manager decision.
- Validate a single-threaded web export in target browsers.
- Browser-test the first-run tour with keyboard and screen-reader navigation, then refine copy from observed confusion.

Exit: a first-time player can use or dismiss the guided tour, choose a House, make one informed decision, watch or skip a bout, and understand the result in under five minutes.

## P2 — Management loop

Status: **in progress**

Current progress: a deterministic, immutable `WeeklyCycle` application service now connects briefing, four training tradeoffs, lineup, strategy, bout resolution, recovery consequences, and a concise result story. The existing one-screen interface guides the player through those phases, locks committed choices, applies recovery after presentation, and carries fatigue, morale, and form into the next week. A condition-aware recommendation preselects a strong legal trio for the player and gives AI Houses the same preparation rule instead of relying on roster order. A deterministic round robin supplies a different opponent in each week of the current three-week mini-season. The player's bout and non-player fixture update live standings together. Headless tests cover the complete week, recommendation purity, schedule uniqueness, all six season fixtures, repeatable resolution, state immutability, and JSON-compatible state. A complete three-week browser playthrough has now verified the connected loop, standings updates, objective tracking, final review, and boundary-save reloads.

- Playtest and tune three connected weeks so fatigue and training choices remain legible and worthwhile.
- Deepen the implemented fatigue, morale, and form consequences; add injuries and relationships only when their choices are readable.
- Add competitor roles and concise comparison cards.
- Add an inbox/story feed that surfaces only actionable events.
- Keep recommendations available without making them mandatory.

Exit: at least three consecutive weeks produce connected decisions and recognizable competitor stories.

## P3 — Season and persistence

Status: **in progress**

Current progress: the four-House prototype has a deterministic three-week round robin, immutable result history, AI resolution through the shared resolver, sorted standings, a top-half objective visible from the start, and a final campaign review naming the champion, House record, objective verdict, and player standout. A schema-versioned local JSON save records each completed week, automatically resumes at the next briefing or final review, rejects malformed or unsupported data safely, and provides explicit reset plus portable export/import. Imports validate the full career before replacement and require confirmation. The content set can expand to eight Houses after the weekly loop is tuned.

- Expand the proven four-House schedule and standings to eight Houses with the content milestone.
- Browser-playtest portable save export/import across the supported desktop browser set and retain fixtures when the schema becomes public.
- Build on the implemented top-half objective and season standout with patron confidence, richer records, awards, and playoffs.
- Add deterministic AI preparation using the same legal actions as the player.
- Test complete seasons and corrupted-save recovery.

Exit: a complete season can be played, closed, resumed, and finished without developer intervention.

## P4 — Offseason and long-term careers

Tooling progress: a deterministic standard-library Python balance sweep now exercises every ordered House and strategy matchup, reports win-rate spreads, and shares a fixed parity fixture with the authoritative GDScript resolver. Its first 19,200-bout baseline exposed dominant strategy bonuses and roster-order AI; the tuned resolver and condition-aware lineup selection reduced strategy spread to 1.48% and House spread to 17.49%, both within documented warning thresholds.

- Add progression, aging, recovery, retirement, and recruitment trials.
- Add simple contracts and House reputation.
- Add constrained roster moves without a spreadsheet-heavy transfer market.
- Add rivalries, traits, and career history.
- Extend the implemented Python bout sweep into complete-season simulation and publish balance summaries.

Exit: finishing a season creates at least three meaningful choices before the next season and long careers remain statistically healthy.

## P5 — Public web release

- Validate a downloadable Godot Web artifact on every branch and pull request.
- Publish builds from `main` through the prepared GitHub Pages workflow.
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

1. Finish cross-browser and assistive-technology validation of the guided tour, arena handoff, and in-context week close.
2. Complete portable-save import replacement validation and add representative migration fixtures before public saves stabilize.
3. Run and tune against the implemented Python balance report; extend it to complete-season simulation after the four-House loop is stable.
4. Expand season review, objectives, and awards without obscuring the weekly loop.
5. Browser-test the continuous-integration Web artifact and enable GitHub Pages when the branch reaches `main`.
6. Decide the final product name after the vertical slice establishes its tone.
