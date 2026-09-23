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

## Two-minute live match presentation

The resolver should determine the result first. The live match view then presents that result as a short, optional replay.

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
