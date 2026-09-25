class_name SeasonState
extends RefCounted

const ArenaMatchResolverScript = preload("res://src/simulation/arena_match_resolver.gd")


static func start(houses: Array, schedule: Array[Dictionary], seed_value: int) -> Dictionary:
	var standings: Array[Dictionary] = []
	for house in houses:
		standings.append({
			"house_id": house["id"],
			"house_name": house["name"],
			"played": 0,
			"wins": 0,
			"losses": 0,
			"points": 0,
			"score_for": 0,
			"score_against": 0
		})
	return {
		"schema_version": 1,
		"seed": seed_value,
		"schedule": schedule.duplicate(true),
		"standings": standings,
		"results": [],
		"completed_weeks": []
	}


static func resolve_week(
	season: Dictionary,
	houses: Array,
	week_number: int,
	player_result: Dictionary = {}
) -> Dictionary:
	assert(week_number not in season["completed_weeks"], "A season week cannot resolve twice")
	var next_season := season.duplicate(true)
	var resolved_pairs: Dictionary = {}
	if not player_result.is_empty():
		next_season = _record_result(next_season, player_result, week_number, true)
		resolved_pairs[_pair_key(player_result["home_house_id"], player_result["away_house_id"])] = true

	var fixture_index: int = 0
	for fixture in next_season["schedule"]:
		if fixture["week"] != week_number:
			continue
		var pair_key := _pair_key(fixture["home_house_id"], fixture["away_house_id"])
		if resolved_pairs.has(pair_key):
			continue
		var home_house := _house_by_id(houses, fixture["home_house_id"])
		var away_house := _house_by_id(houses, fixture["away_house_id"])
		home_house["roster"] = home_house["roster"].slice(0, 3)
		away_house["roster"] = away_house["roster"].slice(0, 3)
		var fixture_seed: int = int(next_season["seed"]) + week_number * 1009 + fixture_index * 101
		var result := ArenaMatchResolverScript.resolve_bout(home_house, away_house, fixture_seed)
		next_season = _record_result(next_season, result, week_number, false)
		fixture_index += 1

	next_season["completed_weeks"].append(week_number)
	return next_season


static func table(season: Dictionary) -> Array[Dictionary]:
	var rows: Array[Dictionary] = []
	for standing in season["standings"]:
		var row: Dictionary = standing.duplicate(true)
		row["score_difference"] = int(row["score_for"]) - int(row["score_against"])
		rows.append(row)
	rows.sort_custom(func(left: Dictionary, right: Dictionary) -> bool:
		if left["points"] != right["points"]:
			return left["points"] > right["points"]
		if left["score_difference"] != right["score_difference"]:
			return left["score_difference"] > right["score_difference"]
		if left["score_for"] != right["score_for"]:
			return left["score_for"] > right["score_for"]
		return left["house_name"] < right["house_name"]
	)
	return rows


static func _record_result(season: Dictionary, result: Dictionary, week_number: int, is_player_bout: bool) -> Dictionary:
	var next_season := season.duplicate(true)
	for standing in next_season["standings"]:
		var is_home: bool = standing["house_id"] == result["home_house_id"]
		var is_away: bool = standing["house_id"] == result["away_house_id"]
		if not is_home and not is_away:
			continue
		standing["played"] += 1
		standing["score_for"] += int(result["home_score"] if is_home else result["away_score"])
		standing["score_against"] += int(result["away_score"] if is_home else result["home_score"])
		if standing["house_id"] == result["winner_id"]:
			standing["wins"] += 1
			standing["points"] += 3
		else:
			standing["losses"] += 1
	var recorded_result: Dictionary = result.duplicate(true)
	recorded_result["week"] = week_number
	recorded_result["is_player_bout"] = is_player_bout
	next_season["results"].append(recorded_result)
	return next_season


static func _house_by_id(houses: Array, house_id: String) -> Dictionary:
	for house in houses:
		if house["id"] == house_id:
			return house.duplicate(true)
	assert(false, "Unknown House id in schedule")
	return {}


static func _pair_key(first_id: String, second_id: String) -> String:
	var pair: Array[String] = [first_id, second_id]
	pair.sort()
	return "%s:%s" % pair
