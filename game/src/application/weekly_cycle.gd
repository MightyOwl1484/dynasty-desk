class_name WeeklyCycle
extends RefCounted

const ArenaMatchResolverScript = preload("res://src/simulation/arena_match_resolver.gd")
const BoutAnalysisScript = preload("res://src/simulation/bout_analysis.gd")

const PHASES: Array[String] = ["briefing", "training", "lineup", "strategy", "bout", "recovery", "news", "complete"]
const TRAINING_PLANS: Dictionary = {
	"balanced": {
		"label": "Balanced session",
		"description": "Small gains across the trio with moderate fatigue.",
		"fatigue": 4,
		"morale": 1,
		"power": 1,
		"guard": 1,
		"technique": 1
	},
	"power": {
		"label": "Power drills",
		"description": "More force in exchanges at the cost of fatigue and a little guard.",
		"fatigue": 7,
		"morale": 0,
		"power": 4,
		"guard": -1,
		"technique": 0
	},
	"technique": {
		"label": "Technique lab",
		"description": "Sharper execution with a moderate workload.",
		"fatigue": 5,
		"morale": 1,
		"power": 0,
		"guard": 0,
		"technique": 4
	},
	"recovery": {
		"label": "Recovery day",
		"description": "Restore energy and morale without a temporary skill bonus.",
		"fatigue": -10,
		"morale": 2,
		"power": 0,
		"guard": 0,
		"technique": 0
	}
}


static func start_week(player_house: Dictionary, opponent_house: Dictionary, week_number: int, seed_value: int) -> Dictionary:
	assert(week_number > 0, "Week number must be positive")
	return {
		"schema_version": 1,
		"week": week_number,
		"seed": seed_value,
		"phase": "briefing",
		"house": _normalized_house(player_house),
		"opponent": _normalized_house(opponent_house),
		"training_plan": "",
		"lineup_ids": [],
		"strategy": "",
		"result": {},
		"news": [{
			"kind": "briefing",
			"headline": "Week %d: %s awaits" % [week_number, opponent_house["name"]],
			"body": opponent_house["identity"]
		}]
	}


static func acknowledge_briefing(week_state: Dictionary) -> Dictionary:
	return _advance_phase(week_state, "briefing", "training")


static func choose_training(week_state: Dictionary, plan_id: String) -> Dictionary:
	assert(week_state["phase"] == "training", "Training can only be chosen during the training phase")
	assert(TRAINING_PLANS.has(plan_id), "Unknown training plan")
	var next_state := week_state.duplicate(true)
	next_state["training_plan"] = plan_id
	var plan: Dictionary = TRAINING_PLANS[plan_id]
	for competitor in next_state["house"]["roster"]:
		competitor["fatigue"] = clampi(int(competitor["fatigue"]) + int(plan["fatigue"]), 0, 100)
		competitor["morale"] = clampi(int(competitor["morale"]) + int(plan["morale"]), 0, 100)
	next_state["phase"] = "lineup"
	return next_state


static func choose_lineup(week_state: Dictionary, lineup_ids: Array) -> Dictionary:
	assert(week_state["phase"] == "lineup", "A lineup can only be chosen during the lineup phase")
	assert(lineup_ids.size() == 3, "A lineup needs exactly three competitors")
	var unique_ids: Dictionary = {}
	var roster_ids: Dictionary = {}
	for competitor in week_state["house"]["roster"]:
		roster_ids[competitor["id"]] = true
	for competitor_id in lineup_ids:
		assert(roster_ids.has(competitor_id), "Lineup competitor must belong to the House")
		unique_ids[competitor_id] = true
	assert(unique_ids.size() == 3, "A lineup cannot contain duplicate competitors")
	var next_state := week_state.duplicate(true)
	next_state["lineup_ids"] = lineup_ids.duplicate()
	next_state["phase"] = "strategy"
	return next_state


static func choose_strategy(week_state: Dictionary, strategy_id: String) -> Dictionary:
	assert(week_state["phase"] == "strategy", "Strategy can only be chosen during the strategy phase")
	assert(ArenaMatchResolverScript.STRATEGIES.has(strategy_id), "Unknown bout strategy")
	var next_state := week_state.duplicate(true)
	next_state["strategy"] = strategy_id
	next_state["phase"] = "bout"
	return next_state


static func resolve_bout(week_state: Dictionary) -> Dictionary:
	assert(week_state["phase"] == "bout", "The bout can only resolve during the bout phase")
	var next_state := week_state.duplicate(true)
	var prepared_house := _prepared_house(next_state)
	var opponent_house: Dictionary = next_state["opponent"].duplicate(true)
	var opponent_lineup: Array[Dictionary] = []
	for competitor in opponent_house["roster"].slice(0, 3):
		opponent_lineup.append(_prepared_competitor(competitor, "balanced"))
	opponent_house["roster"] = opponent_lineup
	next_state["result"] = ArenaMatchResolverScript.resolve_bout(
		prepared_house,
		opponent_house,
		int(next_state["seed"]),
		str(next_state["strategy"]),
		"balanced"
	)
	next_state["phase"] = "recovery"
	return next_state


static func apply_recovery(week_state: Dictionary) -> Dictionary:
	assert(week_state["phase"] == "recovery", "Recovery follows a resolved bout")
	var next_state := week_state.duplicate(true)
	var won: bool = next_state["result"]["winner_id"] == next_state["house"]["id"]
	for competitor in next_state["house"]["roster"]:
		var selected: bool = competitor["id"] in next_state["lineup_ids"]
		var fatigue_delta: int = 5 if selected else -6
		var morale_delta: int = (4 if won else -3) if selected else (1 if won else 0)
		competitor["fatigue"] = clampi(int(competitor["fatigue"]) + fatigue_delta, 0, 100)
		competitor["morale"] = clampi(int(competitor["morale"]) + morale_delta, 0, 100)
		competitor["form"] = clampi(int(competitor["form"]) + (2 if won and selected else -1 if selected else 0), -10, 10)

	var analysis := BoutAnalysisScript.summarize(next_state["result"], next_state["house"], next_state["opponent"])
	next_state["news"].append({
		"kind": "result",
		"headline": "%s: %s" % ["Victory" if won else "Defeat", analysis["headline"]],
		"body": analysis["detail"]
	})
	next_state["phase"] = "news"
	return next_state


static func acknowledge_news(week_state: Dictionary) -> Dictionary:
	return _advance_phase(week_state, "news", "complete")


static func training_options() -> Array[Dictionary]:
	var options: Array[Dictionary] = []
	for plan_id in TRAINING_PLANS:
		var option: Dictionary = TRAINING_PLANS[plan_id].duplicate(true)
		option["id"] = plan_id
		options.append(option)
	return options


static func _advance_phase(week_state: Dictionary, expected_phase: String, next_phase: String) -> Dictionary:
	assert(week_state["phase"] == expected_phase, "Expected %s phase" % expected_phase)
	assert(next_phase in PHASES, "Unknown weekly phase")
	var next_state := week_state.duplicate(true)
	next_state["phase"] = next_phase
	return next_state


static func _normalized_house(house: Dictionary) -> Dictionary:
	var normalized := house.duplicate(true)
	if normalized.get("color") is Color:
		normalized["color"] = normalized["color"].to_html(false)
	for competitor in normalized["roster"]:
		competitor["fatigue"] = int(competitor.get("fatigue", 12))
		competitor["morale"] = int(competitor.get("morale", 60))
		competitor["form"] = int(competitor.get("form", 0))
	return normalized


static func _prepared_house(week_state: Dictionary) -> Dictionary:
	var prepared_house: Dictionary = week_state["house"].duplicate(true)
	var selected: Array[Dictionary] = []
	for competitor_id in week_state["lineup_ids"]:
		for competitor in prepared_house["roster"]:
			if competitor["id"] == competitor_id:
				selected.append(_prepared_competitor(competitor, str(week_state["training_plan"])))
				break
	prepared_house["roster"] = selected
	return prepared_house


static func _prepared_competitor(competitor: Dictionary, plan_id: String) -> Dictionary:
	var prepared := competitor.duplicate(true)
	var plan: Dictionary = TRAINING_PLANS[plan_id]
	var condition_adjustment: int = roundi(
		(float(prepared["morale"]) - 60.0) / 12.0
		- float(prepared["fatigue"]) / 10.0
		+ float(prepared["form"]) / 3.0
	)
	for attribute in ["power", "guard", "technique"]:
		prepared[attribute] = clampi(
			int(prepared[attribute]) + int(plan[attribute]) + condition_adjustment,
			1,
			99
		)
	return prepared
