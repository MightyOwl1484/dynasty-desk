class_name ArenaMatchResolver
extends RefCounted

const DeterministicRng = preload("res://src/simulation/deterministic_rng.gd")
const RESOLVER_VERSION: String = "arena-0.2.0"
const STRATEGIES: Dictionary = {
	"balanced": {"attack": 1.0, "defense": 1.0, "tempo": 0},
	"aggressive": {"attack": 1.13, "defense": 0.90, "tempo": 3},
	"guarded": {"attack": 0.91, "defense": 1.14, "tempo": -2},
	"elusive": {"attack": 1.04, "defense": 1.04, "tempo": 2}
}


static func resolve_bout(
	home_house: Dictionary,
	away_house: Dictionary,
	seed_value: int,
	home_strategy: String = "balanced",
	away_strategy: String = "balanced"
) -> Dictionary:
	_assert_house(home_house)
	_assert_house(away_house)
	assert(STRATEGIES.has(home_strategy), "Unknown home strategy")
	assert(STRATEGIES.has(away_strategy), "Unknown away strategy")

	var rng := DeterministicRng.new(seed_value)
	var home_score: int = 0
	var away_score: int = 0
	var events: Array[Dictionary] = []
	var home_modifiers: Dictionary = STRATEGIES[home_strategy]
	var away_modifiers: Dictionary = STRATEGIES[away_strategy]

	for round_number in range(1, 4):
		for position in range(3):
			var home_competitor: Dictionary = home_house["roster"][position]
			var away_competitor: Dictionary = away_house["roster"][position]
			var home_total := _exchange_total(home_competitor, home_modifiers, round_number, rng)
			var away_total := _exchange_total(away_competitor, away_modifiers, round_number, rng)
			var margin: float = home_total - away_total
			var points: int = 2 if absf(margin) >= 7.5 else 1
			var event_house: Dictionary
			var event_competitor: Dictionary

			if margin >= 0.0:
				home_score += points
				event_house = home_house
				event_competitor = home_competitor
			else:
				away_score += points
				event_house = away_house
				event_competitor = away_competitor

			events.append({
				"sequence": events.size(),
				"round": round_number,
				"type": "decisive_exchange" if points == 2 else "narrow_exchange",
				"house_id": event_house["id"],
				"competitor_id": event_competitor["id"],
				"competitor_name": event_competitor["name"],
				"points": points,
				"margin": absf(margin),
				"home_score": home_score,
				"away_score": away_score,
				"text": _event_text(event_competitor["name"], event_house["name"], points)
			})

	if home_score == away_score:
		var home_resolve: int = _lineup_attribute(home_house["roster"], "resolve")
		var away_resolve: int = _lineup_attribute(away_house["roster"], "resolve")
		if home_resolve + rng.range_int(0, 4) >= away_resolve + rng.range_int(0, 4):
			home_score += 1
			events.append(_tiebreak_event(events.size(), home_house, home_score, away_score))
		else:
			away_score += 1
			events.append(_tiebreak_event(events.size(), away_house, home_score, away_score))

	var winner: Dictionary = home_house if home_score > away_score else away_house
	return {
		"resolver_version": RESOLVER_VERSION,
		"seed": seed_value,
		"home_house_id": home_house["id"],
		"away_house_id": away_house["id"],
		"home_strategy": home_strategy,
		"away_strategy": away_strategy,
		"home_score": home_score,
		"away_score": away_score,
		"winner_id": winner["id"],
		"winner_name": winner["name"],
		"events": events
	}


static func _exchange_total(
	competitor: Dictionary,
	modifiers: Dictionary,
	round_number: int,
	rng: DeterministicRng
) -> float:
	var attack: float = (
		float(competitor["power"]) * 0.35
		+ float(competitor["agility"]) * 0.20
		+ float(competitor["technique"]) * 0.30
		+ float(competitor["resolve"]) * 0.15
	) * float(modifiers["attack"])
	var defense: float = (
		float(competitor["guard"]) * 0.45
		+ float(competitor["agility"]) * 0.25
		+ float(competitor["resolve"]) * 0.30
	) * float(modifiers["defense"])
	var late_round_resolve: float = float(competitor["resolve"]) * float(round_number - 1) * 0.025
	var controlled_variance: float = float(rng.range_int(-6, 6))
	return attack * 0.57 + defense * 0.43 + late_round_resolve + controlled_variance + float(modifiers["tempo"])


static func _lineup_attribute(roster: Array, attribute: String) -> int:
	var total: int = 0
	for competitor in roster.slice(0, 3):
		total += int(competitor[attribute])
	return total


static func _event_text(competitor_name: String, house_name: String, points: int) -> String:
	if points == 2:
		return "%s creates a decisive exchange for %s." % [competitor_name, house_name]
	return "%s edges a close exchange for %s." % [competitor_name, house_name]


static func _tiebreak_event(
	sequence: int,
	house: Dictionary,
	home_score: int,
	away_score: int
) -> Dictionary:
	return {
		"sequence": sequence,
		"round": 4,
		"type": "resolve_tiebreak",
		"house_id": house["id"],
		"competitor_id": "",
		"competitor_name": "",
		"points": 1,
		"margin": 0.0,
		"home_score": home_score,
		"away_score": away_score,
		"text": "%s holds its nerve and claims the deciding point." % house["name"]
	}


static func _assert_house(house: Dictionary) -> void:
	assert(house.has("id") and house.has("name") and house.has("roster"), "Invalid House")
	assert(house["roster"] is Array and house["roster"].size() >= 3, "A House needs three competitors")
