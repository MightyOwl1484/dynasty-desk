extends SceneTree

const PrototypeLeague = preload("res://src/data/prototype_league.gd")
const ArenaMatchResolver = preload("res://src/simulation/arena_match_resolver.gd")

var _failures: int = 0


func _init() -> void:
	call_deferred("_run")


func _run() -> void:
	_test_same_seed_repeats_result()
	_test_different_seed_changes_event_stream()
	_test_result_has_one_winner_and_events()

	if _failures == 0:
		print("PASS: 3 arena simulation tests")
	else:
		push_error("FAIL: %d arena simulation assertions" % _failures)
	quit(_failures)


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
	_expect(result["resolver_version"] == "arena-0.1.0", "result records the resolver version")


func _expect(condition: bool, message: String) -> void:
	if condition:
		print("PASS: %s" % message)
	else:
		_failures += 1
		push_error("FAIL: %s" % message)
