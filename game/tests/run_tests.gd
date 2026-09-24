extends SceneTree

const PrototypeLeague = preload("res://src/data/prototype_league.gd")
const ArenaMatchResolver = preload("res://src/simulation/arena_match_resolver.gd")
const ArenaPresentation = preload("res://src/presentation/arena_presentation.gd")
const BoutAnalysis = preload("res://src/simulation/bout_analysis.gd")

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

	if _failures == 0:
		print("PASS: 7 arena content, simulation, presentation, and analysis tests")
	else:
		push_error("FAIL: %d arena simulation assertions" % _failures)
	quit(_failures)


func _test_prototype_league_loads_generated_content() -> void:
	var houses := PrototypeLeague.create_houses()
	_expect(houses.size() == 4, "prototype league loads four generated Houses")
	_expect(houses.all(func(house: Dictionary) -> bool: return house["roster"].size() == 6), "every House has six generated competitors")
	_expect(houses[0]["color"] is Color, "JSON House colors become Godot colors")


func _test_same_seed_repeats_result() -> void:
	var houses := PrototypeLeague.create_houses()
	var first := ArenaMatchResolver.resolve_bout(houses[0], houses[1], 104729, "guarded", "aggressive")
	var second := ArenaMatchResolver.resolve_bout(houses[0], houses[1], 104729, "guarded", "aggressive")
	_expect(first == second, "same inputs and seed reproduce the full result")


func _test_different_seed_changes_event_stream() -> void:
	var houses := PrototypeLeague.create_houses()
	var first := ArenaMatchResolver.resolve_bout(houses[0], houses[1], 104729)
	var second := ArenaMatchResolver.resolve_bout(houses[0], houses[1], 112648)
	_expect(first["events"] != second["events"], "different seeds alter the event stream")


func _test_result_has_one_winner_and_events() -> void:
	var houses := PrototypeLeague.create_houses()
	var result := ArenaMatchResolver.resolve_bout(houses[0], houses[1], 7)
	_expect(result["home_score"] != result["away_score"], "tied bouts receive a deciding point")
	_expect(result["winner_id"] in [houses[0]["id"], houses[1]["id"]], "winner belongs to the bout")
	_expect(result["events"].size() >= 9, "every scheduled exchange produces an event")
	_expect(result["resolver_version"] == "arena-0.2.0", "result records the resolver version")
	_expect(result["events"].all(func(event: Dictionary) -> bool: return event.has("points") and event.has("margin") and event.has("competitor_name")), "events expose contributor, points, and margin for explanation")


func _test_presentation_reveals_without_mutating_result() -> void:
	var houses := PrototypeLeague.create_houses()
	var result := ArenaMatchResolver.resolve_bout(houses[0], houses[1], 104729)
	var original := result.duplicate(true)
	var presentation := ArenaPresentation.new()
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
	var houses := PrototypeLeague.create_houses()
	var result := ArenaMatchResolver.resolve_bout(houses[0], houses[1], 7)
	var presentation := ArenaPresentation.new()
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
	var houses := PrototypeLeague.create_houses()
	var selected_house: Dictionary = houses[0].duplicate(true)
	selected_house["roster"] = houses[0]["roster"].slice(3, 6)
	var result := ArenaMatchResolver.resolve_bout(selected_house, houses[1], 104729, "aggressive", "guarded")
	var original := result.duplicate(true)
	var analysis := BoutAnalysis.summarize(result, selected_house, houses[1])
	_expect(not str(analysis["leader_name"]).is_empty(), "post-bout analysis identifies a leading competitor")
	_expect(int(analysis["leader_points"]) > 0, "post-bout analysis counts the leader's exchange points")
	if result["winner_id"] == selected_house["id"]:
		var selected_ids: Array = selected_house["roster"].map(func(competitor: Dictionary) -> String: return competitor["id"])
		_expect(analysis["leader_id"] in selected_ids, "post-bout analysis respects a manager-selected lineup")
	_expect(str(analysis["detail"]).contains("Final margin"), "post-bout analysis explains the tactical shape and margin")
	_expect(result == original, "post-bout analysis does not mutate the locked result")


func _expect(condition: bool, message: String) -> void:
	if condition:
		print("PASS: %s" % message)
	else:
		_failures += 1
		push_error("FAIL: %s" % message)
