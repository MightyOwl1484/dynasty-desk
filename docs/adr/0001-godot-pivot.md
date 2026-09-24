# ADR 0001: Pivot the primary game to Godot

- Status: Accepted
- Date: 2026-09-24
- Decision owners: Dynasty Desk maintainers

## Context

The HTML prototype proved deterministic soccer simulation, onboarding, weekly choices, short match presentation, season progression, and local persistence. It also demonstrated that a DOM-first dashboard naturally pulls the product toward forms and tables while making an animated, game-like presentation expensive to evolve.

The intended product now emphasizes a fictional arena sport, compact rosters, visible competitors, short animated bouts, and a deeper management career. Browser delivery remains important.

## Decision

The primary implementation will use Godot 4.7 and typed GDScript. The first distribution target is Godot's single-threaded Web export using the Compatibility renderer.

Python will be used for offline data generation, validation, and high-volume balance simulation. Python is not embedded in the browser build. A future Python service may coordinate organization leagues behind a serialized resolver contract.

The existing HTML soccer prototype remains in the repository as a playable legacy reference until the Godot vertical slice reaches feature parity for its intended scope. SharePoint and SPFx work is deferred rather than deleted.

99Managers Futsal Edition may be studied for general architecture and product patterns. Its AGPL source and separately licensed assets will not be copied into this Apache-2.0 project.

## Consequences

### Benefits

- Godot supplies a purpose-built 2D scene, animation, audio, input, and export workflow.
- GDScript keeps browser export straightforward and resembles Python enough to lower onboarding cost.
- A resolver/presentation boundary supports replays, testing, accessibility alternatives, and future synchronized leagues.
- The project can ship native desktop builds from the same source later.

### Costs

- Contributors need the pinned Godot editor and export templates.
- Godot web builds require HTTP/HTTPS and cannot be played by double-clicking the exported HTML file.
- Canvas-based UI requires more deliberate accessibility engineering than semantic HTML.
- Existing JavaScript gameplay code becomes a behavioral reference rather than directly reusable runtime code.
- The repository temporarily validates two generations of the application.

## Guardrails

- No result may depend on frame timing or physics.
- No native extension enters the critical path without profiling and a web-export proof.
- Every strategy must express an understandable benefit and risk.
- Every visual match feature must have a text equivalent and skip path.
- Legacy code is removed only after its replacement is playable, tested, and documented.
