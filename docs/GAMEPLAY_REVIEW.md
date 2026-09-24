# Game-development review

## Design goal

Dynasty Desk should feel like a club story with meaningful decisions, not a spreadsheet with soccer labels. Numbers should explain the world and support decisions, but the player should remember moments, rivalries, breakthroughs, and consequences.

## Core loop

```text
Prepare → Decide → Watch or resolve → React → Improve → Prepare again
```

Each week should give the player:

- A clear opponent and a reason the match matters
- A manageable set of decisions
- Enough information to make an informed choice without perfect information
- A match experience with anticipation and readable consequences
- A result that changes the club story
- A reason to care about the next week

## What to keep from management games

The project can learn from established open-source and classic management-game patterns without copying their data or interfaces:

- Inbox/news as a narrative layer
- Squad depth and role decisions
- Tactics that create tradeoffs rather than a single best setting
- Player development over time
- A league table that makes every result legible
- Transfers and contracts as longer-term club-building choices

The game should use these systems to create decisions, not to maximize the number of fields on a player record.

## What to avoid

- Requiring the player to inspect many tables before every match
- Hidden modifiers that make outcomes feel arbitrary
- Excessive micro-management of low-impact details
- Long unskippable match presentations
- A single optimal formation or tactic
- Punishing new players for not knowing the simulation model
- Live animation that contradicts the final deterministic result

## Fun and accessibility principles

### Make decisions legible

Every important choice should show:

- What it changes
- What it risks
- What information supports it

Example: a high press should improve pressure and chance creation while increasing fatigue and transition risk.

### Reward attention without demanding homework

The game can provide depth through optional detail:

- A short recommendation for new managers
- Expandable analyst notes for experienced managers
- A simple “why this happened” match explanation
- A full event log for players who want it

### Preserve multiple winning styles

Balanced, pressing, counter-attacking, and control approaches should all be viable in different contexts. Balance should come from tradeoffs and opponent context rather than random swings.

### Make progress visible

Show players improving, recovering, losing form, gaining confidence, and earning roles. Club development should be felt through stories and visual state changes, not only through rating numbers.

## Weekly preparation

The match desk now offers one optional weekly training decision instead of a separate management screen. Recovery restores the most fitness, balanced work improves fitness and morale with a small readiness gain, and high intensity sacrifices fitness for the strongest immediate match bonus. Morale contributes to team strength and moves after wins, draws, and losses, with unused substitutes receiving a slightly smaller lift. The default remains balanced so a new manager can still play immediately.

This choice is intentionally compact: its effect and risk appear beside the control, the squad view exposes current morale, and the match report records the selected preparation. AI clubs use the same rules and automatically choose recovery when their average fitness is low.

## Form and leadership

Player form now reacts to participation, results, and goals. Starters gain form after wins, lose it after defeats, and receive an additional lift when they score; unused players drift back toward neutral rather than remaining permanently hot or cold. Form is bounded, visible beside each player, and contributes modestly to match strength without replacing underlying ability.

Managers can also appoint one captain from the existing squad screen. A captain with strong morale provides a small leadership bonus only while selected in the XI, creating a readable lineup tradeoff without adding another page or a large role-management system. Every new club receives a deterministic default captain, while imported careers receive one when the next week is prepared.

## Scouting and squad depth

The match briefing now identifies each opponent's strongest unit and likely tactical approach from the current synthetic roster. Press, control, and counter form a modest matchup cycle, so the suggested response has a real but non-deterministic effect on the simulation. The recommendation is a one-click starting point rather than a mandatory answer; balanced remains neutral and squad quality, fitness, morale, form, and captaincy still matter.

The squad room compares starters with reserves in the same position using rating, fitness, morale, and form. It surfaces only the strongest meaningful swap and can apply it with one action. When no reserve offers a clear readiness gain, the interface says so instead of filling the screen with marginal advice.

## Offseason and career continuity

The solo game now records an end-of-season review with the champions, league top scorer, club player of the season, final position, and each squad member's appearances, goals, rating, and seasonal rating change. The review is saved in career history rather than discarded when a new season begins.

Starting the next season applies deterministic progression. Young players improve when they receive meaningful minutes and still have potential to reach; established players may improve after a strong workload; older players can decline. Ages advance, fitness and morale recover, seasonal statistics reset, and the club keeps the same recognizable squad. This creates a long-term reason to rotate and develop players without introducing transfer-market complexity before the core loop is ready.

## Two-minute live match presentation

The resolver should determine the result first. The live match view then presents that result as a short, optional replay.

## Verified browser playtest

The current HTML build was exercised in the in-app browser on the match desk. Selecting a club and starting a career exposes the next fixture, tactical choice, squad briefing, and starting-XI pitch. `Play match` opens a focused full-time result dialog with score, explanation, and commentary. `Watch short replay` opens a focused replay dialog; Play updates the live replay status and event log, while the speed and skip controls remain available. Starting a career now moves keyboard focus into the active match desk instead of leaving focus on the hidden setup control.

The replay now offers a quick 30-second recap or a two-minute tactical watch. The score remains resolved before either presentation starts; duration changes pacing only. The next design questions are intentionally still open: whether the two-minute presentation should show more tactical context during play, how much replay detail is useful on narrow screens, and whether a team-building league needs a shared “watch party” view in addition to the commissioner workflow.

### Current implementation status

The first presentation slice is now available in the browser prototype. A result dialog offers an optional short replay driven by the resolver's event stream. The replay includes team markers, an event log, play, pause, speed, and skip controls, a live status message, and a reduced-motion path that completes the event list without animation. The match desk also explains the tradeoff behind each tactical approach, and the result dialog explains the chosen approach after full time. These are presentation layers; they do not change the stored result.

### Version 1 scope

- 90 simulated seconds compressed into about two minutes
- Simple pitch and high-contrast player markers
- Formation-aware movement lanes rather than physics-heavy movement
- Event timeline synchronized to key moments
- Possession, pressure, and momentum indicators
- Play, pause, speed, skip, and replay controls
- Reduced-motion mode and text-only event mode
- No impact on the stored result

### Event model

The resolver should eventually emit a sequence like:

```js
{
  minute: 23,
  type: 'chance',
  teamId: 'northport',
  playerId: 'northport-9',
  zone: 'right-channel',
  outcome: 'saved',
  text: 'Mercer drives into the right channel, but the keeper holds the shot.'
}
```

The same event can feed the animated pitch, the accessible event log, the post-match report, and the news generator.

## Onboarding

The first career should teach through action:

1. Pick a club.
2. Review the recommended XI.
3. Make one visible tactical choice.
4. Play or watch the first match.
5. Read the result explanation.
6. Make one squad or training adjustment.

Avoid a long rules tutorial before the player has a reason to care.

The browser build now applies this direction. A recommended club is preselected, each club has one concise identity and challenge description, and the generated default XI is ready to play. After accepting the job, a three-step optional tour explains the match action, squad depth, and season rhythm. It can be skipped or reopened from the club menu. Detailed views remain available without blocking the first match.

## Administrative play

Shared workplace leagues should preserve the fun of the solo loop while reducing burden:

- Default lineup when a manager misses a deadline
- Clear timezone and deadline display
- One-screen weekly submission
- Automatic reminders only when actionable
- Commissioner controls separated from manager decisions
- Human-readable audit events when a week is locked or reopened

## Evaluation checklist

Before accepting a gameplay feature, ask:

- Does it create a meaningful choice?
- Is the result understandable afterward?
- Does it create a story or memorable moment?
- Can a new player use it in under five minutes?
- Does it work with keyboard and reduced motion?
- Can the player skip or recover from it?
- Does it make the next week more interesting?

## Current quality gates

- `node --test` covers deterministic domain rules, workflow transitions, persistence, permissions, and SharePoint adapter behavior.
- `node scripts/check-a11y.mjs` checks the static HTML landmarks, dialogs, live regions, labels, and backup controls used by the solo and future organization experiences.
