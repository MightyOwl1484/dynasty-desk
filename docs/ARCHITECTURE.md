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
  "resolver_version": "arena-0.1.0"
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
  "resolver_version": "arena-0.1.0"
}
```

The event stream is the common input for animation, text commentary, post-bout reports, news, replay, and future multiplayer verification.

## Randomness

Gameplay must use the project-owned deterministic random generator rather than global `rand*` functions. Every resolving operation records its seed and resolver version. A saved result is never silently re-resolved under a newer rules version.

## Presentation boundary

The first prototype presents the complete result immediately. The next slice will add an `ArenaPresentation` that consumes one event at a time. Presentation may interpolate positions and timing, but it may not call the resolver or mutate the result.

Accessibility variants are equal presentation clients:

- Standard animation
- Reduced-motion presentation
- Text-only event log
- Quick result

## Persistence

Solo saves will use `user://` and a versioned JSON envelope. Web persistence depends on browser IndexedDB and may be unavailable in private browsing, so export/import remains a planned recovery path.

```json
{
  "schemaVersion": 1,
  "gameVersion": "0.1.0",
  "savedAt": "ISO-8601 timestamp",
  "career": {}
}
```

Migrations are explicit functions from one schema version to the next. Tests retain representative old save fixtures once public saves exist.

## Future organization mode

Clients submit intended decisions, not results. A commissioner-controlled process or service locks inputs, resolves the fixture once, and publishes the immutable result. The initial service candidate is Python with HTTP/WebSocket endpoints, but it will consume the same serializable resolver contract rather than embedding business rules in SharePoint.

## Web constraints

- Web output must be served over HTTP or HTTPS.
- The game renders in a canvas; focus order, keyboard operation, labels, scaling, contrast, reduced motion, and textual alternatives require explicit testing.
- Browser tabs may pause background processing, so deadlines and authoritative scheduling cannot depend on an open client.
- Native extensions must be compiled specifically for WebAssembly and increase hosting complexity. They are prohibited until profiling demonstrates a need.

## License boundary

This implementation is Apache-2.0 and clean-room. AGPL reference projects may inform concepts and evaluation criteria, but their source and assets may not be copied. See [`REFERENCE_PROJECTS.md`](REFERENCE_PROJECTS.md).
