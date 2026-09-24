class_name PrototypeLeague
extends RefCounted


static func create_houses() -> Array[Dictionary]:
	return [
		{
			"id": "ember",
			"name": "Ember Crown",
			"identity": "Patient veterans who turn resolve into late-round pressure.",
			"color": Color("ef8354"),
			"roster": [
				_competitor("ember-1", "Mara Venn", 74, 62, 76, 68, 84),
				_competitor("ember-2", "Oren Pike", 81, 58, 70, 66, 78),
				_competitor("ember-3", "Sable Ro", 65, 79, 64, 76, 73)
			]
		},
		{
			"id": "tide",
			"name": "Tidebreak Union",
			"identity": "Quick technicians who create openings through movement.",
			"color": Color("45b7d1"),
			"roster": [
				_competitor("tide-1", "Ilya Fen", 66, 84, 63, 80, 72),
				_competitor("tide-2", "Niko Vale", 70, 76, 72, 79, 69),
				_competitor("tide-3", "Tamsin Quill", 62, 88, 60, 77, 75)
			]
		}
	]


static func _competitor(
	id: String,
	name: String,
	power: int,
	agility: int,
	guard: int,
	technique: int,
	resolve: int
) -> Dictionary:
	return {
		"id": id,
		"name": name,
		"power": power,
		"agility": agility,
		"guard": guard,
		"technique": technique,
		"resolve": resolve
	}
