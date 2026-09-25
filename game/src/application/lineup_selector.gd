class_name LineupSelector
extends RefCounted

const ArenaMatchResolverScript = preload("res://src/simulation/arena_match_resolver.gd")


static func select(house: Dictionary, strategy_id: String = "balanced") -> Array[Dictionary]:
	assert(ArenaMatchResolverScript.STRATEGIES.has(strategy_id), "Unknown lineup strategy")
	assert(house["roster"].size() >= 3, "A lineup needs at least three competitors")
	var candidates: Array[Dictionary] = []
	for competitor in house["roster"]:
		candidates.append({
			"competitor": competitor.duplicate(true),
			"score": _readiness_score(competitor, strategy_id)
		})
	candidates.sort_custom(func(left: Dictionary, right: Dictionary) -> bool:
		if not is_equal_approx(left["score"], right["score"]):
			return left["score"] > right["score"]
		return left["competitor"]["id"] < right["competitor"]["id"]
	)
	var lineup: Array[Dictionary] = []
	for candidate in candidates.slice(0, 3):
		lineup.append(candidate["competitor"])
	return lineup


static func ids(house: Dictionary, strategy_id: String = "balanced") -> Array[String]:
	var selected_ids: Array[String] = []
	for competitor in select(house, strategy_id):
		selected_ids.append(competitor["id"])
	return selected_ids


static func _readiness_score(competitor: Dictionary, strategy_id: String) -> float:
	var modifiers: Dictionary = ArenaMatchResolverScript.STRATEGIES[strategy_id]
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
	var condition: float = (
		(float(competitor.get("morale", 60)) - 60.0) / 12.0
		- float(competitor.get("fatigue", 12)) / 10.0
		+ float(competitor.get("form", 0)) / 3.0
	)
	return attack * 0.57 + defense * 0.43 + condition
