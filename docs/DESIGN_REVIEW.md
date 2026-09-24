# Initial design and game-feel review

> Historical review: this evaluates the preserved HTML soccer prototype. Its accessibility and progressive-disclosure lessons remain requirements for the Godot arena interface; its visual recommendations are not the new art direction.

This is the first review of the current static prototype at the start of the HTML-first rebuild. It is a product-direction document, not a final visual specification.

## Current overview

The current experience opens on a dark, card-based club selection screen. It uses a compact sports-operations visual language with bright club accents, serif display typography, a left navigation rail, match desk, squad view, league table, and inbox.

The strongest current qualities are:

- The fictional world is immediately understandable.
- Club colors make the selection grid easy to scan.
- The next fixture is treated as the primary decision.
- Local-only play keeps onboarding simple.
- The interface has a recognizable identity instead of looking like a default CRUD application.

The main risk is that the game currently communicates administration more strongly than anticipation, drama, or player attachment.

## Keep

- Fictional clubs and synthetic players
- Dark operations-room palette with bright club accents
- Club selection as the first meaningful choice
- Match desk as the home screen
- Squad, table, and inbox as separate destinations
- Local browser play without account requirements
- Short seasonal structure
- Text commentary and match reports

## Update

### Make the next decision more obvious

The match desk should answer three questions immediately:

1. What is happening now?
2. What decision do I need to make?
3. What might happen if I make it?

Add a compact “manager decision” panel with lineup warnings, opponent tendencies, player form, and a clear consequence preview.

### Create emotional rhythm

Introduce a recurring weekly rhythm:

- Monday: preparation and news
- Midweek: training and squad decisions
- Match day: lineup lock and live match option
- Next day: result, reactions, table movement, and player development

The player should feel a season moving forward, not merely click through a database of screens.

### Improve visual hierarchy

- Reduce the number of small all-caps labels competing for attention.
- Reserve the brightest accent for actionable or consequential information.
- Give scorelines, form, injuries, and deadlines stronger visual weight.
- Use progressive disclosure for detailed statistics.
- Add a persistent “season pulse” showing match week, next deadline, and club momentum.

### Improve accessibility

- Maintain visible keyboard focus for every control.
- Do not rely on club color alone to identify a club or state.
- Add text labels to icon-only controls.
- Verify color contrast for muted text and disabled buttons.
- Support reduced motion for the future live-match presentation.
- Provide an accessible event log alongside any animated pitch view.
- Use semantic headings, landmarks, labels, and live-region announcements carefully.
- Make the starting XI state understandable without visual pitch positioning.

### Improve small-screen behavior

The current mobile layout is functional but tall and scroll-heavy. The next pass should:

- Keep the current match and primary action visible together.
- Collapse secondary cards behind disclosure controls.
- Preserve the club identity and match-week context while navigating.
- Avoid making the user hunt for the next action after a match resolves.

## Remove or relocate

- Move “No accounts, timers, adverts, or purchases” out of the primary onboarding headline. Keep it in an About or trust panel.
- Replace “Fictional Football Association” with the actual league or competition name once the world model is defined.
- Avoid generic “VS” as the only fixture context. Show venue, form, table position, and match-week stakes.
- Avoid displaying every available statistic at once. A fun game should reveal useful information at the moment it matters.
- Do not make a live-match animation mandatory. It should be an optional replay/presentation layer after the result is known.

The first-run implementation now uses progressive disclosure: one club choice, one compact club preview, and one primary action. A short optional tour appears only after the career begins, while the match desk remains the hub for the next decision. Squad, table, inbox, replay, and season review details stay one action away instead of appearing in the initial setup.

## Live match concept

The simulation engine remains authoritative. The live match is a two-minute presentation of the already-resolved result.

It should include:

- A simple pitch with high-contrast placeholder player markers
- Team colors plus player numbers or initials
- Possession and momentum pulses
- A readable event timeline
- Play, pause, speed, and skip controls
- A reduced-motion mode
- The ability to jump directly to key events
- A final result screen that never contradicts the simulation result

The first version does not need sophisticated physics. Timing, anticipation, readable events, and the relationship between tactics and visible events matter more than visual fidelity.

## Game-development review questions

Every feature should be evaluated against these questions:

- Does this create a meaningful decision?
- Does the player understand the consequence of the decision?
- Does this create a memorable story or merely add data?
- Can a new player use it without reading a manual?
- Can an experienced player find deeper control when they want it?
- Does it respect the time available for a short workplace match week?
- Can it be used with keyboard, screen reader, reduced motion, and high zoom?

## Administrative experience

The organization mode needs its own accessible experience rather than exposing raw lists:

- League status and current phase
- Match-week deadline and timezone
- Clubs and assigned managers
- Submission status per club
- Lock, resolve, publish, and reopen controls
- Audit history
- Announcements
- Export and backup status

The first reviewable commissioner console is available at `dist/commissioner.html`. It is intentionally a no-tenant demo, but it exercises the intended hierarchy: league phase and deadline first, manager readiness second, explicit phase actions third, and an audit trail alongside the controls.

Administrative controls should use explicit labels, confirmation for irreversible transitions, clear error recovery, and a visible audit trail.

The HTML shell now exposes mobile navigation state through `aria-expanded` and `aria-hidden`, moves focus into an opened menu, returns focus on close, and closes on Escape. A narrow-device smoke test remains part of the browser/SPFx release checklist because the local in-app browser reports a desktop-width viewport during automated review.

## Priority order

1. Preserve the current playable solo loop.
2. Make the match desk decision-oriented.
3. Improve semantic structure, focus states, contrast, and reduced-motion behavior.
4. Add stronger match reports and season rhythm.
5. Add optional live-match presentation.
6. Add shared league administration and scheduled play.
