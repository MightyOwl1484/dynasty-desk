# Contributing to Dynasty Desk: Arena

Thank you for helping build the game. New gameplay work targets the Godot project under `game/`. The previous JavaScript and SPFx code remains supported as a legacy reference but should change only for a specifically scoped issue.

## Start here

Read:

1. [`README.md`](README.md)
2. [`docs/PRODUCT_PLAN.md`](docs/PRODUCT_PLAN.md)
3. [`docs/ROADMAP.md`](docs/ROADMAP.md)
4. [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
5. [`docs/REFERENCE_PROJECTS.md`](docs/REFERENCE_PROJECTS.md)

For a substantial feature, open an issue describing the player problem, intended behavior, accessibility impact, and roadmap milestone.

## Development rules

- Use Godot 4.7 and typed GDScript for runtime gameplay.
- Keep simulation independent of scenes, animation, wall-clock time, physics, network calls, and global randomness.
- Pass an explicit seed into every resolving operation and record the resolver version.
- Treat result events as immutable presentation input.
- Use Python only in `tools/` or in a separately documented future service.
- Keep competitors, Houses, settings, and artwork fictional.
- Do not copy code or assets from AGPL or otherwise incompatible reference projects.
- Add dependencies only when the pull request explains their license, web-export impact, and maintenance value.
- Never commit credentials, tokens, tenant URLs, or personal data.

## Validation

Run the repository-level checks:

```powershell
node scripts/check-godot-scaffold.mjs
node scripts/build.mjs
node --test
python -m unittest discover -s tools/tests
```

When Godot is installed, run:

```powershell
godot --headless --path game --script res://tests/run_tests.gd
```

UI changes also require manual keyboard, focus, text-scale, narrow-window, and reduced-motion checks. Web-facing changes require an exported build served over HTTP.

## Definition of done

A change is ready when:

- Its player-facing behavior is documented.
- The same inputs and seed reproduce the same simulation output.
- Relevant headless tests pass.
- Presentation changes do not mutate the resolved result.
- Keyboard and accessibility alternatives were considered and tested.
- Save compatibility was preserved or migrated explicitly.
- No incompatible source, asset, trademark, or personal data was introduced.
- The roadmap or architecture documentation changed when the project contract changed.
