extends SceneTree

const PrototypeLeagueScript = preload("res://src/data/prototype_league.gd")
const ArenaMatchResolverScript = preload("res://src/simulation/arena_match_resolver.gd")
const ArenaPresentationScript = preload("res://src/presentation/arena_presentation.gd")
const BoutAnalysisScript = preload("res://src/simulation/bout_analysis.gd")
const WeeklyCycleScript = preload("res://src/application/weekly_cycle.gd")
const LineupSelectorScript = preload("res://src/application/lineup_selector.gd")
const SeasonScheduleScript = preload("res://src/domain/season_schedule.gd")
const SeasonStateScript = preload("res://src/application/season_state.gd")
const LocalSaveStoreScript = preload("res://src/persistence/local_save_store.gd")

var _failures: int = 0


func _init() -> void:
	call_deferred("_run")


func _run() -> void:
	_test_prototype_league_loads_generated_content()
	_test_same_seed_repeats_result()
	_test_different_seed_changes_event_stream()
	_test_result_has_one_winner_and_events()
	_test_presentation_reveals_without_mutating_result()
	_test_presentation_pause_skip_and_replay()
	_test_bout_analysis_explains_locked_result()
	_test_weekly_cycle_connects_management_decisions()
	_test_lineup_recommendation_uses_readiness()
	_test_round_robin_schedule_connects_three_weeks()
	_test_season_standings_resolve_every_fixture()
	_test_completed_season_review()
	_test_versioned_local_save_envelope()

	if _failures == 0:
		print("PASS: 13 arena content, simulation, presentation, analysis, management, season, and persistence tests")
	else:
		push_error("FAIL: %d arena simulation assertions" % _failures)
	quit(_failures)


func _test_prototype_league_loads_generated_content() -> void:
	var houses := PrototypeLeagueScript.create_houses()
	_expect(houses.size() == 4, "prototype league loads four generated Houses")
	_expect(houses.all(func(house: Dictionary) -> bool: return house["roster"].size() == 6), "every House has six generated competitors")
	_expect(houses[0]["color"] is Color, "JSON House colors become Godot colors")


func _test_same_seed_repeats_result() -> void:
	var houses := PrototypeLeagueScript.create_houses()
	var first := ArenaMatchResolverScript.resolve_bout(houses[0], houses[1], 104729, "guarded", "aggressive")
	var second := ArenaMatchResolverScript.resolve_bout(houses[0], houses[1], 104729, "guarded", "aggressive")
	_expect(first == second, "same inputs and seed reproduce the full result")
	_expect(first["winner_id"] == "tidebreak-union" and first["home_score"] == 3 and first["away_score"] == 12, "resolver matches the offline balance parity fixture")


func _test_different_seed_changes_event_stream() -> void:
	var houses := PrototypeLeagueScript.create_houses()
	var first := ArenaMatchResolverScript.resolve_bout(houses[0], houses[1], 104729)
	var second := ArenaMatchResolverScript.resolve_bout(houses[0], houses[1], 112648)
	_expect(first["events"] != second["events"], "different seeds alter the event stream")


func _test_result_has_one_winner_and_events() -> void:
	var houses := PrototypeLeagueScript.create_houses()
	var result := ArenaMatchResolverScript.resolve_bout(houses[0], houses[1], 7)
	_expect(result["home_score"] != result["away_score"], "tied bouts receive a deciding point")
	_expect(result["winner_id"] in [houses[0]["id"], houses[1]["id"]], "winner belongs to the bout")
	_expect(result["events"].size() >= 9, "every scheduled exchange produces an event")
	_expect(result["resolver_version"] == "arena-0.4.0", "result records the resolver version")
	_expect(result["events"].all(func(event: Dictionary) -> bool: return event.has("points") and event.has("margin") and event.has("competitor_name")), "events expose contributor, points, and margin for explanation")


func _test_presentation_reveals_without_mutating_result() -> void:
	var houses := PrototypeLeagueScript.create_houses()
	var result := ArenaMatchResolverScript.resolve_bout(houses[0], houses[1], 104729)
	var original := result.duplicate(true)
	var presentation := ArenaPresentationScript.new()
	presentation.load_result(result)
	presentation.play()
	var first_event := presentation.reveal_next()

	_expect(first_event == result["events"][0], "presentation reveals events in resolver order")
	_expect(result == original, "presentation never mutates the resolved result")
	_expect(
		presentation.progress_text() == "1 of %d moments" % result["events"].size(),
		"presentation exposes readable progress"
	)


func _test_presentation_pause_skip_and_replay() -> void:
	var houses := PrototypeLeagueScript.create_houses()
	var result := ArenaMatchResolverScript.resolve_bout(houses[0], houses[1], 7)
	var presentation := ArenaPresentationScript.new()
	presentation.load_result(result)
	presentation.play()
	presentation.pause()
	_expect(presentation.reveal_next().is_empty(), "paused presentation does not reveal a moment")
	var remaining := presentation.skip()
	_expect(remaining.size() == result["events"].size(), "skip returns every unrevealed moment")
	_expect(presentation.is_complete(), "skip completes the presentation")
	presentation.replay()
	_expect(presentation.progress_text().begins_with("0 of"), "replay resets presentation progress")
	presentation.set_speed(4.0)
	_expect(is_equal_approx(presentation.event_interval_seconds(), 0.4), "speed changes pacing without changing events")


func _test_bout_analysis_explains_locked_result() -> void:
	var houses := PrototypeLeagueScript.create_houses()
	var selected_house: Dictionary = houses[0].duplicate(true)
	selected_house["roster"] = houses[0]["roster"].slice(3, 6)
	var result := ArenaMatchResolverScript.resolve_bout(selected_house, houses[1], 104729, "aggressive", "guarded")
	var original := result.duplicate(true)
	var analysis := BoutAnalysisScript.summarize(result, selected_house, houses[1])
	_expect(not str(analysis["leader_name"]).is_empty(), "post-bout analysis identifies a leading competitor")
	_expect(int(analysis["leader_points"]) > 0, "post-bout analysis counts the leader's exchange points")
	if result["winner_id"] == selected_house["id"]:
		var selected_ids: Array = selected_house["roster"].map(func(competitor: Dictionary) -> String: return competitor["id"])
		_expect(analysis["leader_id"] in selected_ids, "post-bout analysis respects a manager-selected lineup")
	_expect(str(analysis["detail"]).contains("Final margin"), "post-bout analysis explains the tactical shape and margin")
	_expect(result == original, "post-bout analysis does not mutate the locked result")


func _test_weekly_cycle_connects_management_decisions() -> void:
	var houses := PrototypeLeagueScript.create_houses()
	var source_house: Dictionary = houses[0].duplicate(true)
	var lineup_ids: Array = source_house["roster"].slice(0, 3).map(func(competitor: Dictionary) -> String: return competitor["id"])
	var week := WeeklyCycleScript.start_week(source_house, houses[1], 1, 104729)
	var original_week := week.duplicate(true)
	_expect(week["house"]["color"] is String and not JSON.stringify(week).is_empty(), "weekly state is JSON-compatible for future saves")
	week = WeeklyCycleScript.acknowledge_briefing(week)
	week = WeeklyCycleScript.choose_training(week, "technique")
	_expect(week["house"]["roster"][0]["fatigue"] == 17 and week["house"]["roster"][0]["morale"] == 61, "training creates a visible fatigue and morale tradeoff")
	week = WeeklyCycleScript.choose_lineup(week, lineup_ids)
	week = WeeklyCycleScript.choose_strategy(week, "guarded")
	var ready_week := week.duplicate(true)
	week = WeeklyCycleScript.resolve_bout(week)
	var repeated := WeeklyCycleScript.resolve_bout(ready_week)
	_expect(week["result"] == repeated["result"], "weekly bout resolution is deterministic from locked choices")
	_expect(original_week["phase"] == "briefing" and original_week["training_plan"].is_empty(), "weekly transitions do not mutate earlier state")
	week = WeeklyCycleScript.apply_recovery(week)
	_expect(week["phase"] == "news" and week["news"].size() == 2, "recovery creates one concise result story")
	_expect(week["house"]["roster"].all(func(competitor: Dictionary) -> bool: return competitor.has("fatigue") and competitor.has("morale") and competitor.has("form")), "weekly state carries fatigue, morale, and form")
	week = WeeklyCycleScript.acknowledge_news(week)
	_expect(week["phase"] == "complete", "briefing, training, lineup, strategy, bout, recovery, and news form a complete week")


func _test_round_robin_schedule_connects_three_weeks() -> void:
	var houses := PrototypeLeagueScript.create_houses()
	var schedule := SeasonScheduleScript.create(houses)
	var pair_keys: Dictionary = {}
	var appearances: Dictionary = {}
	for fixture in schedule:
		var pair: Array[String] = [fixture["home_house_id"], fixture["away_house_id"]]
		pair.sort()
		pair_keys["%s:%s" % pair] = true
		appearances[fixture["home_house_id"]] = int(appearances.get(fixture["home_house_id"], 0)) + 1
		appearances[fixture["away_house_id"]] = int(appearances.get(fixture["away_house_id"], 0)) + 1
	_expect(schedule.size() == 6 and pair_keys.size() == 6, "four Houses receive six unique round-robin fixtures")
	_expect(appearances.values().all(func(count: int) -> bool: return count == 3), "every House plays once in each of three weeks")
	var opponents: Dictionary = {}
	for week_number in range(1, 4):
		opponents[SeasonScheduleScript.opponent_for(schedule, houses[0]["id"], week_number)] = true
	_expect(opponents.size() == 3 and not opponents.has(""), "the player receives a different scheduled opponent each week")


func _test_lineup_recommendation_uses_readiness() -> void:
	var houses := PrototypeLeagueScript.create_houses()
	var source: Dictionary = houses[0].duplicate(true)
	var original := source.duplicate(true)
	var selected := LineupSelectorScript.select(source)
	_expect(selected.size() == 3 and selected.map(func(competitor: Dictionary) -> String: return competitor["id"]).duplicate().all(func(competitor_id: String) -> bool: return competitor_id in LineupSelectorScript.ids(source)), "lineup recommendation returns three legal competitors")
	_expect(selected[0]["name"] == "Xara Gale" and selected[1]["name"] == "Yori Ash", "lineup recommendation surfaces the strongest ready competitors")
	for competitor in source["roster"]:
		if competitor["id"] == selected[0]["id"]:
			competitor["fatigue"] = 100
	_expect(LineupSelectorScript.ids(source) != LineupSelectorScript.ids(original), "lineup recommendation responds to competitor condition")
	_expect(houses[0] == original, "lineup recommendation does not mutate source content")


func _test_season_standings_resolve_every_fixture() -> void:
	var houses := PrototypeLeagueScript.create_houses()
	var schedule := SeasonScheduleScript.create(houses)
	var season := SeasonStateScript.start(houses, schedule, 104729)
	for week_number in range(1, 4):
		season = SeasonStateScript.resolve_week(season, houses, week_number)
	var table := SeasonStateScript.table(season)
	_expect(season["results"].size() == 6 and season["completed_weeks"].size() == 3, "three weeks resolve all six league fixtures exactly once")
	_expect(table.all(func(row: Dictionary) -> bool: return row["played"] == 3), "standings record three bouts for every House")
	_expect(table.map(func(row: Dictionary) -> int: return row["wins"]).reduce(func(total: int, wins: int) -> int: return total + wins, 0) == 6, "every resolved bout contributes one standings win")
	_expect(table[0]["points"] >= table[-1]["points"], "standings sort by points and score difference")


func _test_versioned_local_save_envelope() -> void:
	var houses := PrototypeLeagueScript.create_houses()
	var schedule := SeasonScheduleScript.create(houses)
	var season := SeasonStateScript.start(houses, schedule, 104729)
	var envelope := LocalSaveStoreScript.create_envelope(houses[0], season, 2, 112648, false, "2026-09-25T00:00:00Z")
	var decoded := LocalSaveStoreScript.decode(LocalSaveStoreScript.encode(envelope))
	_expect(decoded["ok"] and decoded["envelope"]["career"]["next_week"] == 2 and decoded["envelope"]["career"]["season"]["standings"].size() == 4, "versioned career saves survive a JSON round trip")
	_expect(decoded["envelope"]["career"]["house"]["color"] is String, "save envelopes normalize presentation colors for JSON")
	_expect(not LocalSaveStoreScript.decode("{broken")["ok"], "corrupt save JSON fails safely")
	var future_save := envelope.duplicate(true)
	future_save["schema_version"] = 99
	_expect(not LocalSaveStoreScript.decode(LocalSaveStoreScript.encode(future_save))["ok"], "unknown future save schemas are rejected")


func _test_completed_season_review() -> void:
	var houses := PrototypeLeagueScript.create_houses()
	var schedule := SeasonScheduleScript.create(houses)
	var season := SeasonStateScript.start(houses, schedule, 104729)
	for week_number in range(1, 4):
		var opponent_id := SeasonScheduleScript.opponent_for(schedule, houses[0]["id"], week_number)
		var opponent: Dictionary = houses.filter(func(house: Dictionary) -> bool: return house["id"] == opponent_id)[0]
		var player_result := ArenaMatchResolverScript.resolve_bout(houses[0], opponent, 104729 + week_number)
		season = SeasonStateScript.resolve_week(season, houses, week_number, player_result)
	var review := SeasonStateScript.review(season, houses[0])
	_expect(review["player_position"] >= 1 and review["player_position"] <= 4, "season review records the player's final position")
	_expect(review["wins"] + review["losses"] == 3, "season review records the complete player campaign")
	_expect(not str(review["champion_name"]).is_empty() and not str(review["standout_name"]).is_empty(), "season review names a champion and player standout")
	_expect(review["objective_achieved"] == (review["player_position"] <= 2), "top-half objective verdict follows the final table")


func _expect(condition: bool, message: String) -> void:
	if condition:
		print("PASS: %s" % message)
	else:
		_failures += 1
		push_error("FAIL: %s" % message)
