class_name LocalSaveStore
extends RefCounted

const PrototypeLeagueScript = preload("res://src/data/prototype_league.gd")
const SeasonScheduleScript = preload("res://src/domain/season_schedule.gd")
const SCHEMA_VERSION: int = 1
const GAME_VERSION: String = "0.1.0-dev"
const SAVE_PATH: String = "user://dynasty-desk-arena-save.json"


static func create_envelope(
	career_house: Dictionary,
	season: Dictionary,
	next_week: int,
	next_seed: int,
	season_complete: bool,
	saved_at: String = ""
) -> Dictionary:
	var safe_house := career_house.duplicate(true)
	if safe_house.get("color") is Color:
		safe_house["color"] = safe_house["color"].to_html(false)
	return {
		"schema_version": SCHEMA_VERSION,
		"game_version": GAME_VERSION,
		"saved_at": saved_at,
		"career": {
			"house": safe_house,
			"season": season.duplicate(true),
			"next_week": next_week,
			"next_seed": next_seed,
			"season_complete": season_complete
		}
	}


static func encode(envelope: Dictionary) -> String:
	return JSON.stringify(envelope, "\t")


static func decode(contents: String) -> Dictionary:
	if contents.strip_edges().is_empty():
		return {"ok": false, "error": "Save file is empty.", "envelope": {}}
	var parser := JSON.new()
	if parser.parse(contents) != OK:
		return {"ok": false, "error": "Save file is not valid JSON.", "envelope": {}}
	var parsed = parser.data
	if not parsed is Dictionary:
		return {"ok": false, "error": "Save file is not valid JSON.", "envelope": {}}
	var error := _validation_error(parsed)
	if not error.is_empty():
		return {"ok": false, "error": error, "envelope": {}}
	return {"ok": true, "error": "", "envelope": parsed.duplicate(true)}


static func save(envelope: Dictionary, path: String = SAVE_PATH) -> Error:
	var error := _validation_error(envelope)
	if not error.is_empty():
		return ERR_INVALID_DATA
	var file := FileAccess.open(path, FileAccess.WRITE)
	if file == null:
		return FileAccess.get_open_error()
	file.store_string(encode(envelope))
	file.close()
	return OK


static func load(path: String = SAVE_PATH) -> Dictionary:
	if not FileAccess.file_exists(path):
		return {"ok": false, "error": "No local career save exists.", "envelope": {}}
	var file := FileAccess.open(path, FileAccess.READ)
	if file == null:
		return {"ok": false, "error": "The local career save could not be opened.", "envelope": {}}
	var contents := file.get_as_text()
	file.close()
	return decode(contents)


static func clear(path: String = SAVE_PATH) -> Error:
	if not FileAccess.file_exists(path):
		return OK
	return DirAccess.remove_absolute(ProjectSettings.globalize_path(path))


static func import_text(contents: String, path: String = SAVE_PATH) -> Dictionary:
	var decoded := decode(contents)
	if not decoded["ok"]:
		return decoded
	var write_error := save(decoded["envelope"], path)
	if write_error != OK:
		return {"ok": false, "error": "Could not store the imported career (error %d)." % write_error, "envelope": {}}
	return decoded


static func _validation_error(envelope: Dictionary) -> String:
	if int(envelope.get("schema_version", -1)) != SCHEMA_VERSION:
		return "Unsupported save schema."
	if not envelope.get("career") is Dictionary:
		return "Save is missing career data."
	var career: Dictionary = envelope["career"]
	for required_key in ["house", "season", "next_week", "next_seed", "season_complete"]:
		if not career.has(required_key):
			return "Save is missing %s." % required_key
	if not career["house"] is Dictionary or not career["season"] is Dictionary:
		return "Save career data has an invalid shape."
	if not _is_whole_number(career["next_week"]) or int(career["next_week"]) < 1 or int(career["next_week"]) > 4:
		return "Save contains an invalid next week."
	if not _is_whole_number(career["next_seed"]) or int(career["next_seed"]) < 1:
		return "Save contains an invalid seed."
	if not career["season_complete"] is bool or bool(career["season_complete"]) != (int(career["next_week"]) == 4):
		return "Save has an inconsistent completion state."
	var houses := PrototypeLeagueScript.create_houses()
	var house: Dictionary = career["house"]
	var canonical_house: Dictionary = {}
	for candidate in houses:
		if house.get("id") == candidate["id"]:
			canonical_house = candidate
			break
	if canonical_house.is_empty() or not house.get("roster") is Array or house["roster"].size() != canonical_house["roster"].size():
		return "Save contains an unknown or incomplete House."
	if not house.get("color") is String or not house.get("name") is String:
		return "Save House details are invalid."
	var valid_competitors: Dictionary = {}
	for competitor in canonical_house["roster"]:
		valid_competitors[competitor["id"]] = true
	var seen_competitors: Dictionary = {}
	for competitor in house["roster"]:
		if not competitor is Dictionary or not valid_competitors.has(competitor.get("id")) or seen_competitors.has(competitor.get("id")):
			return "Save contains an invalid roster."
		seen_competitors[competitor["id"]] = true
		for key in ["name", "power", "agility", "guard", "technique", "resolve"]:
			if not competitor.has(key):
				return "Save contains an incomplete competitor."
		for key in ["power", "agility", "guard", "technique", "resolve", "fatigue", "morale", "form"]:
			if competitor.has(key) and not _is_whole_number(competitor[key]):
				return "Save contains an invalid competitor value."
	var season: Dictionary = career["season"]
	for key in ["schedule", "standings", "results", "completed_weeks"]:
		if not season.get(key) is Array:
			return "Save is missing season %s." % key
	var expected_schedule := SeasonScheduleScript.create(houses)
	if season["schedule"].size() != expected_schedule.size():
		return "Save has an incompatible season schedule."
	for fixture_index in range(expected_schedule.size()):
		var fixture: Variant = season["schedule"][fixture_index]
		if not fixture is Dictionary:
			return "Save has an incompatible season schedule."
		if not _is_whole_number(fixture.get("week")) or int(fixture["week"]) != int(expected_schedule[fixture_index]["week"]):
			return "Save has an incompatible season schedule."
		for key in ["id", "home_house_id", "away_house_id"]:
			if str(fixture.get(key)) != str(expected_schedule[fixture_index][key]):
				return "Save has an incompatible season schedule."
	var completed_count: int = int(career["next_week"]) - 1
	if season["completed_weeks"].size() != completed_count or season["results"].size() != completed_count * 2:
		return "Save has an incomplete season history."
	for week_index in range(completed_count):
		if not _is_whole_number(season["completed_weeks"][week_index]) or int(season["completed_weeks"][week_index]) != week_index + 1:
			return "Save has invalid completed weeks."
	if season["standings"].size() != houses.size():
		return "Save has incomplete standings."
	var seen_houses: Dictionary = {}
	for row in season["standings"]:
		if not row is Dictionary or seen_houses.has(row.get("house_id")):
			return "Save has invalid standings."
		var known_house := false
		for candidate in houses:
			if row.get("house_id") == candidate["id"]:
				known_house = true
				break
		if not known_house:
			return "Save has an unknown House in standings."
		seen_houses[row["house_id"]] = true
		if not row.get("house_name") is String:
			return "Save has invalid standings."
		for key in ["played", "wins", "losses", "points", "score_for", "score_against"]:
			if not _is_whole_number(row.get(key)) or int(row[key]) < 0:
				return "Save has invalid standings."
		if int(row["played"]) != completed_count or int(row["wins"]) + int(row["losses"]) != completed_count:
			return "Save has inconsistent standings."
	for result in season["results"]:
		if not result is Dictionary or not result.get("events") is Array:
			return "Save has an invalid bout history."
		for key in ["home_house_id", "away_house_id", "winner_id", "week", "is_player_bout"]:
			if not result.has(key):
				return "Save has an incomplete bout history."
		for event in result["events"]:
			if not event is Dictionary or not event.has("house_id") or not event.has("competitor_id") or not event.has("points"):
				return "Save has an invalid bout event."
	return ""


static func _is_whole_number(value: Variant) -> bool:
	return (value is int or value is float) and float(value) == floorf(float(value))
