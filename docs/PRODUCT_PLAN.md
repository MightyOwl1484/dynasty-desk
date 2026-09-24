# Dynasty Desk: Arena product plan

## Vision

Dynasty Desk: Arena is an approachable management game about building a fictional Arena House and watching its competitors become legends. The experience should create memorable rivalries and career stories without requiring players to operate a spreadsheet.

The primary release is a Godot game exported to the web. Native desktop builds remain possible, but every core feature must be designed for browser performance, keyboard operation, and short play sessions.

## Product promises

1. **A meaningful decision in minutes.** A new player can choose a House, understand a recommendation, and complete a bout without studying a manual.
2. **The result is fair and explainable.** Identical locked inputs and a seed produce the same result and event log.
3. **The presentation never changes the outcome.** Watching, accelerating, skipping, or using text-only mode cannot alter a resolved bout.
4. **Depth arrives through stories and tradeoffs.** Training, fatigue, morale, injuries, contracts, rivalries, and development interact without exposing unnecessary accounting.
5. **Fictional content is a strength.** Synthetic competitors and Houses let the game build its own identity and avoid licensed sports data.

## Initial game

- 8 fictional Arena Houses
- 8–12 competitors per House
- Three active competitors per bout
- A short regular season and playoff event
- Four readable strategies: balanced, aggressive, guarded, and elusive
- Competitor attributes centered on power, agility, guard, technique, and resolve
- Training, fatigue, morale, injuries, development, recruitment, and retirement
- A deterministic event stream supporting quick resolve, text commentary, and an optional two-minute arena presentation
- Local solo saves and export/import

Violence is stylized and non-graphic. Defeat means points, submission, or knockout; permanent death is not part of the default game. This keeps the game suitable for a broad audience and future workplace leagues.

## Technology direction

- Godot 4.7 Compatibility renderer
- Typed GDScript for runtime and gameplay
- Pure, deterministic simulation code independent of scenes and animation
- Python standard-library tools for data generation and large balance runs
- JSON-compatible content and save boundaries
- Single-threaded web export first; native extensions only after a proven need
- GitHub Actions for validation and, after browser acceptance, GitHub Pages deployment

## Modes

### Solo career — active priority

The player controls one House through repeated preparation, bout, reaction, and offseason loops. The game works without an account or network connection after loading.

### Organization league — deferred

Scheduled company leagues remain a product possibility. Managers would submit choices before a deadline and receive synchronized results from locked inputs. SharePoint, Teams, or a small API may host this mode later, but organization integration must not constrain the first playable game.

## Non-goals for the first Godot release

- Historical gladiator simulation or graphic violence
- Real athletes, leagues, ratings, logos, or scraped databases
- A Python runtime embedded in the web build
- Physics determining competitive results
- Real-time player-versus-player networking
- Native C++ extensions or multithreaded web requirements
- SharePoint or SPFx deployment before the solo loop is proven
- A full economy or equipment-crafting simulator

## Success criteria

The first public Godot release succeeds when:

1. A new player completes a meaningful decision and bout in under five minutes.
2. The same seed and locked choices reproduce the same result.
3. A full season can be completed, saved, resumed, and advanced into an offseason.
4. Quick resolve, animated presentation, reduced-motion presentation, and text-only presentation agree on the outcome.
5. The web build loads from GitHub Pages in current Chromium, Firefox, and Safari-class browsers targeted by Godot.
6. Contributors can modify simulation, presentation, content, or tooling without understanding the entire project.

See [`ROADMAP.md`](ROADMAP.md) for milestone order and exit criteria.
