class_name SeasonState
extends RefCounted

const ArenaMatchResolverScript = preload("res://src/simulation/arena_match_resolver.gd")
const LineupSelectorScript = preload("res://src/application/lineup_selector.gd")


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
		home_house["roster"] = LineupSelectorScript.select(home_house)
		away_house["roster"] = LineupSelectorScript.select(away_house)
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


static func review(season: Dictionary, player_house: Dictionary) -> Dictionary:
	var standings := table(season)
	assert(not standings.is_empty(), "A season review needs standings")
	assert(season["completed_weeks"].size() == _week_count(season["schedule"]), "A season review needs every week completed")
	var player_row: Dictionary = {}
	var player_position: int = 0
	for row_index in range(standings.size()):
		if standings[row_index]["house_id"] == player_house["id"]:
			player_row = standings[row_index]
			player_position = row_index + 1
			break
	assert(not player_row.is_empty(), "Player House must exist in standings")

	var points_by_competitor: Dictionary = {}
	for bout in season["results"]:
		if not bool(bout.get("is_player_bout", false)):
			continue
		for event in bout["events"]:
			if event["house_id"] != player_house["id"] or str(event["competitor_id"]).is_empty():
				continue
			var competitor_id: String = str(event["competitor_id"])
			points_by_competitor[competitor_id] = int(points_by_competitor.get(competitor_id, 0)) + int(event["points"])

	var standout_name: String = "No individual standout"
	var standout_points: int = 0
	for competitor in player_house["roster"]:
		var event_points: int = int(points_by_competitor.get(competitor["id"], 0))
		if event_points > standout_points:
			standout_name = competitor["name"]
			standout_points = event_points

	var objective_target: int = ceili(float(standings.size()) / 2.0)
	var objective_achieved: bool = player_position <= objective_target
	return {
		"champion_id": standings[0]["house_id"],
		"champion_name": standings[0]["house_name"],
		"player_position": player_position,
		"house_count": standings.size(),
		"wins": player_row["wins"],
		"losses": player_row["losses"],
		"points": player_row["points"],
		"score_difference": player_row["score_difference"],
		"objective": "Finish in the top half",
		"objective_achieved": objective_achieved,
		"standout_name": standout_name,
		"standout_points": standout_points,
		"headline": "%s are arena champions." % standings[0]["house_name"]
	}


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


static func _week_count(schedule: Array) -> int:
	var weeks: Dictionary = {}
	for fixture in schedule:
		weeks[int(fixture["week"])] = true
	return weeks.size()
