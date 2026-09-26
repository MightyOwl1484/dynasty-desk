# Godot architecture

## Core rule

The resolver determines truth. Scenes communicate and present that truth.

```text
Godot Control scenes
        ↓ commands / view models
Application services
        ↓ locked decisions
Deterministic domain and simulation
        ↓ immutable result + event log
Presentation player / text commentary / save store
```

No animation callback, frame rate, physics tick, or wall-clock time may affect a competitive result.

## Runtime choices

- **Godot 4.7:** editor, UI, audio, animation, input, and export pipeline.
- **Typed GDScript:** production gameplay code. It has first-class Godot integration and exports to the web without an additional runtime.
- **Compatibility renderer:** required for Godot 4 web exports and suitable for the planned 2D presentation.
- **Single-threaded Web export:** maximizes compatibility and avoids cross-origin-isolation requirements during the first release.
- **Python:** offline generators, validators, and balance simulations only. A future hosted service is a separate deployment boundary.

## Source layout

```text
game/
  project.godot
  export_presets.cfg
  main.tscn
  src/
    domain/          data definitions and invariant checks
    simulation/      deterministic rules and event production
    application/     use cases such as start career and play week
    presentation/    arena playback and commentary adapters
    persistence/     versioned local save envelopes and migrations
    ui/              reusable Control scenes and accessibility behavior
  data/              original fictional content
  tests/             dependency-free headless tests
tools/               Python generation, validation, and balancing tools
build/web/           ignored generated web export
```

The current `src/`, `tests/`, `dist/`, and `spfx/` directories contain the preserved HTML generation. They are legacy references, not dependencies of the Godot runtime.

Prototype content is committed as JSON under `game/data/` and generated deterministically by the standard-library Python tools under `tools/`. CI verifies that the committed league exactly matches its recorded generator version, seed, House count, and roster size. Godot validates the schema again at runtime and converts presentation-only values such as colors after parsing.

## Deterministic match contract

A resolver accepts only serializable values:

```gdscript
{
  "fixture_id": "week-1-ember-tide",
  "seed": 104729,
  "home_house": { ...locked snapshot... },
  "away_house": { ...locked snapshot... },
  "home_strategy": "guarded",
  "away_strategy": "aggressive",
  "resolver_version": "arena-0.4.0"
}
```

It returns a serializable result:

```gdscript
{
  "winner_id": "ember",
  "home_score": 11,
  "away_score": 8,
  "events": [ ...chronological immutable events... ],
  "seed": 104729,
  "resolver_version": "arena-0.4.0"
}
```

The event stream is the common input for animation, text commentary, post-bout reports, news, replay, and future multiplayer verification.

## Randomness

Gameplay must use the project-owned deterministic random generator rather than global `rand*` functions. Every resolving operation records its seed and resolver version. A saved result is never silently re-resolved under a newer rules version.

## Presentation boundary

`ArenaPresentation` consumes one immutable event at a time and owns only playback state. `BoutAnalysis` reads the same locked result to produce the post-bout explanation. Presentation may interpolate positions and timing, but neither layer may call the resolver or mutate the result.

Accessibility variants are equal presentation clients:

- Standard animation
- Reduced-motion presentation
- Text-only event log
- Quick result

## Weekly application flow

`WeeklyCycle` is a pure application service over JSON-compatible dictionaries. It advances one copied state through briefing, training, lineup, strategy, bout, recovery, news, and completion. Training exposes a small, readable fatigue/morale/stat tradeoff; lineup and strategy lock before the service invokes the resolver; recovery applies consequences and creates one concise result story. Earlier states remain unchanged, making later undo, save migration, and audit behavior explicit rather than scene-dependent.

The weekly service has no scene or animation dependency. The one-screen interface adapts its existing controls to the current phase: choices unlock one at a time, become read-only when committed, and return to the same page for recovery and news. This keeps the flow guided without turning every phase into another menu.

`SeasonSchedule` creates a deterministic single round robin from House identifiers. With the current four-House content set, every House receives one distinct opponent in each of three weeks and every pairing occurs exactly once. The UI reads this schedule instead of allowing manual opponent selection; standings can therefore be added without changing the weekly decision contract.

`SeasonState` owns standings and immutable completed results. When the player's result is available, it records that bout and deterministically resolves the other scheduled fixture using the same resolver and legal balanced strategy. The resulting table sorts by points, score difference, score for, and House name. Presentation never writes standings directly.

## Persistence

Solo saves use `user://dynasty-desk-arena-save.json` and a versioned JSON envelope. The game writes only at a completed-week boundary, so a restored career always resumes at a valid briefing rather than halfway through a locked decision or presentation. The save contains the selected House, competitor condition, deterministic seed, next week, completed results, and standings. Visible reset, export, and import actions support recovery without exposing internal storage.

The decoder validates the complete envelope before state enters the application. Empty, malformed, incomplete, internally inconsistent, unknown-House, and unknown future-schema data fail safely without replacing the existing career. Import is limited to two megabytes, requires explicit replacement confirmation, and uses the same decoder as local loading. On Web, export uses a browser download and import uses a local file picker; the file contents remain client-side. This recovery path matters because browser IndexedDB may be unavailable or cleared.

```json
{
  "schema_version": 1,
  "game_version": "0.1.0-dev",
  "saved_at": "ISO-8601 timestamp",
  "career": {}
}
```

Future migrations will be explicit functions from one schema version to the next. Tests will retain representative old save fixtures once public saves exist; the current tests cover JSON round trips, presentation-value normalization, malformed and inconsistent data, future-schema rejection, valid portable import, and preservation of the existing save after a rejected import.

## Future organization mode

Clients submit intended decisions, not results. A commissioner-controlled process or service locks inputs, resolves the fixture once, and publishes the immutable result. The initial service candidate is Python with HTTP/WebSocket endpoints, but it will consume the same serializable resolver contract rather than embedding business rules in SharePoint.

## Web constraints

- Web output must be served over HTTP or HTTPS.
- The game renders in a canvas; focus order, keyboard operation, labels, scaling, contrast, reduced motion, and textual alternatives require explicit testing.
- Browser tabs may pause background processing, so deadlines and authoritative scheduling cannot depend on an open client.
- Native extensions must be compiled specifically for WebAssembly and increase hosting complexity. They are prohibited until profiling demonstrates a need.

## License boundary

This implementation is Apache-2.0 and clean-room. AGPL reference projects may inform concepts and evaluation criteria, but their source and assets may not be copied. See [`REFERENCE_PROJECTS.md`](REFERENCE_PROJECTS.md).
