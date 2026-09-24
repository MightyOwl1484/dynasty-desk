class_name PrototypeLeague
extends RefCounted

const DATA_PATH: String = "res://data/prototype_league.json"
const SUPPORTED_SCHEMA_VERSION: int = 1


static func create_houses() -> Array[Dictionary]:
	assert(FileAccess.file_exists(DATA_PATH), "Prototype league data is missing")
	var parsed: Variant = JSON.parse_string(FileAccess.get_file_as_string(DATA_PATH))
	assert(parsed is Dictionary, "Prototype league data must be a JSON object")
	assert(parsed.get("schema_version", 0) == SUPPORTED_SCHEMA_VERSION, "Unsupported league data schema")
	assert(parsed.get("houses", []) is Array, "Prototype league data must include Houses")

	var houses: Array[Dictionary] = []
	for raw_house in parsed["houses"]:
		assert(raw_house is Dictionary, "Each House must be a JSON object")
		var house: Dictionary = raw_house.duplicate(true)
		_assert_house(house)
		house["color"] = Color(str(house["color"]))
		houses.append(house)
	assert(houses.size() >= 2, "A prototype league needs at least two Houses")
	return houses


static func _assert_house(house: Dictionary) -> void:
	for required_key in ["id", "name", "identity", "color", "roster"]:
		assert(house.has(required_key), "House is missing %s" % required_key)
	assert(house["roster"] is Array and house["roster"].size() >= 3, "A House needs three competitors")
	var competitor_ids: Dictionary = {}
	for competitor in house["roster"]:
		assert(competitor is Dictionary, "Each competitor must be a JSON object")
		for required_key in ["id", "name", "power", "agility", "guard", "technique", "resolve"]:
			assert(competitor.has(required_key), "Competitor is missing %s" % required_key)
		assert(not competitor_ids.has(competitor["id"]), "Competitor ids must be unique inside a House")
		competitor_ids[competitor["id"]] = true
