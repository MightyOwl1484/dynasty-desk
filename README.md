# Dynasty Desk: Arena

Dynasty Desk is pivoting into a Godot-first fictional arena management game. You lead an Arena House, recruit and develop competitors, choose a match strategy, and watch short deterministic bouts turn a season into a shared story.

`Dynasty Desk: Arena` is a working title. The project remains intentionally fictional so its competitors, Houses, competitions, and artwork can be distributed without sports-data or trademark dependencies.

## Current status

The new implementation lives in [`game/`](game/) and targets Godot 4.7 with typed GDScript. The first vertical slice contains:

- A playable House and tactic selection screen
- Four synthetic Arena Houses with six-person rosters and selectable active trios
- Compact competitor stats and lineup advantages compared with the opponent
- A deterministic, seeded three-round bout resolver
- An event-driven arena view with moving high-contrast markers
- Play, pause, 1×/2×/4× speed, skip, and replay controls
- Reduced-motion and text-only presentation paths using the same event log
- A post-bout review naming the leading competitor and explaining the tactical shape
- A guided one-screen week connecting briefing, training, lineup, strategy, bout, recovery, and news
- A deterministic three-week round-robin mini-season with a different scheduled opponent each week
- Live standings updated from the player bout and a deterministic non-player fixture each week
- A browser export preset using the Compatibility renderer
- A dependency-free headless test entry point

The prior HTML soccer prototype remains in [`dist/`](dist/) and its source remains under [`src/`](src/). It is preserved as a playable product and UX reference during migration; new gameplay development should target Godot unless an issue explicitly concerns the legacy build.

## Run the Godot prototype

Install Godot 4.7, then open `game/project.godot` in the editor and press **F6** or **F5**.

From a command line with `godot` available:

```powershell
godot --path game --editor
godot --headless --path game --script res://tests/run_tests.gd
```

To create the web build after installing the Godot 4.7 export templates:

```powershell
godot --headless --path game --export-release Web ../build/web/index.html
```

Godot web exports must be served over HTTP or HTTPS; opening the generated `index.html` directly with `file://` is not supported. Every GitHub validation run now produces a downloadable browser artifact, and the Pages workflow is ready to publish changes from `main` after the repository setting is enabled.

## Architecture in one sentence

The deterministic simulation produces an immutable result and event log; Godot scenes present those events without changing the outcome.

```text
Manager decisions → deterministic resolver → result + event log → short arena presentation
```

Python is reserved for offline tooling such as roster generation, content validation, and large balance simulations. It is not part of the browser runtime. A future Python service may coordinate scheduled organization leagues without becoming authoritative over solo saves.

The committed prototype league is reproducible with:

```powershell
python tools/generate_rosters.py --seed 104729 --houses 4 --roster-size 6 --output game/data/prototype_league.json
```

## Project documentation

- [`docs/PRODUCT_PLAN.md`](docs/PRODUCT_PLAN.md) — vision, scope, and product boundaries
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — ordered delivery plan and milestone exit criteria
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — Godot layers, determinism, persistence, and web constraints
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — CI artifacts, local web testing, and GitHub Pages setup
- [`docs/adr/0001-godot-pivot.md`](docs/adr/0001-godot-pivot.md) — recorded pivot decision and consequences
- [`docs/REFERENCE_PROJECTS.md`](docs/REFERENCE_PROJECTS.md) — clean-room use of open-source inspiration
- [`docs/GAMEPLAY_REVIEW.md`](docs/GAMEPLAY_REVIEW.md) — accessibility, game-feel, and management-loop principles
- [`CONTRIBUTING.md`](CONTRIBUTING.md) — contribution workflow and definition of done

The SharePoint and SPFx documents are retained as future organization-mode research. That work is paused while the solo game proves its core loop.

## Validation

The repository currently validates both generations of the project:

```powershell
node scripts/check-godot-scaffold.mjs
node scripts/build.mjs
node --test
node scripts/check-a11y.mjs
python -m unittest discover -s tools/tests
```

Once Godot is installed, also run the headless game tests shown above.

## License and reference policy

Original project code and documentation are licensed under the [Apache License 2.0](LICENSE). Third-party assets must retain their own attribution and compatible license notices.

[99Managers Futsal Edition](https://codeberg.org/dulvui/99managers-futsal-edition) informs high-level architectural research. Its AGPL-licensed code, CC BY-SA assets, trademark, and implementation are not included or copied into this repository. Contributors must independently implement ideas and must not paste source or assets from that project.
