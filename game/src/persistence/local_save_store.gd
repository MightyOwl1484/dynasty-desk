class_name LocalSaveStore
extends RefCounted

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


static func save(envelope: Dictionary) -> Error:
	var error := _validation_error(envelope)
	if not error.is_empty():
		return ERR_INVALID_DATA
	var file := FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if file == null:
		return FileAccess.get_open_error()
	file.store_string(encode(envelope))
	file.close()
	return OK


static func load() -> Dictionary:
	if not FileAccess.file_exists(SAVE_PATH):
		return {"ok": false, "error": "No local career save exists.", "envelope": {}}
	var file := FileAccess.open(SAVE_PATH, FileAccess.READ)
	if file == null:
		return {"ok": false, "error": "The local career save could not be opened.", "envelope": {}}
	var contents := file.get_as_text()
	file.close()
	return decode(contents)


static func clear() -> Error:
	if not FileAccess.file_exists(SAVE_PATH):
		return OK
	return DirAccess.remove_absolute(ProjectSettings.globalize_path(SAVE_PATH))


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
	if int(career["next_week"]) < 1:
		return "Save contains an invalid next week."
	return ""
