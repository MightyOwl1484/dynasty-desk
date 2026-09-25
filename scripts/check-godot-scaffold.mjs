import { readFileSync, existsSync } from 'node:fs';

const requiredFiles = [
  'game/project.godot',
  'game/export_presets.cfg',
  'game/main.tscn',
  'game/data/prototype_league.json',
  'game/src/main.gd',
  'game/src/data/prototype_league.gd',
  'game/src/simulation/deterministic_rng.gd',
  'game/src/simulation/arena_match_resolver.gd',
  'game/src/simulation/bout_analysis.gd',
  'game/src/application/weekly_cycle.gd',
  'game/src/application/lineup_selector.gd',
  'game/src/application/season_state.gd',
  'game/src/domain/season_schedule.gd',
  'game/src/persistence/local_save_store.gd',
  'game/src/presentation/arena_presentation.gd',
  'game/src/presentation/arena_view.gd',
  'game/tests/run_tests.gd'
];

const missing = requiredFiles.filter((file) => !existsSync(file));
if (missing.length) {
  throw new Error(`Missing Godot foundation files:\n${missing.join('\n')}`);
}

const project = readFileSync('game/project.godot', 'utf8');
const exportPreset = readFileSync('game/export_presets.cfg', 'utf8');
const resolver = readFileSync('game/src/simulation/arena_match_resolver.gd', 'utf8');

const expectations = [
  [project.includes('run/main_scene="res://main.tscn"'), 'Godot main scene is configured'],
  [project.includes('gl_compatibility'), 'Compatibility renderer is configured'],
  [project.includes('gdscript/warnings/shadowed_global_identifier=2'), 'Global identifier shadowing fails validation'],
  [project.includes('gdscript/warnings/shadowed_variable=2'), 'Local variable shadowing fails validation'],
  [project.includes('gdscript/warnings/shadowed_variable_base_class=2'), 'Base-class property shadowing fails validation'],
  [exportPreset.includes('platform="Web"'), 'Web export preset exists'],
  [exportPreset.includes('variant/thread_support=false'), 'Initial Web export is single-threaded'],
  [exportPreset.includes('variant/extensions_support=false'), 'Initial Web export avoids native extensions'],
  [resolver.includes('RESOLVER_VERSION'), 'Resolver records a version'],
  [resolver.includes('DeterministicRng'), 'Resolver uses the project-owned deterministic RNG'],
  [resolver.includes('"events"'), 'Resolver emits presentation events']
];

const failures = expectations.filter(([passed]) => !passed).map(([, message]) => message);
if (failures.length) {
  throw new Error(`Godot scaffold validation failed:\n${failures.join('\n')}`);
}

console.log(`Godot scaffold validated (${requiredFiles.length} required files).`);
