extends Control

const PrototypeLeague = preload("res://src/data/prototype_league.gd")
const ArenaMatchResolver = preload("res://src/simulation/arena_match_resolver.gd")

var _houses: Array[Dictionary] = []
var _house_picker: OptionButton
var _strategy_picker: OptionButton
var _house_summary: RichTextLabel
var _result_heading: Label
var _score_label: Label
var _event_log: RichTextLabel
var _seed: int = 104729


func _ready() -> void:
	_houses = PrototypeLeague.create_houses()
	_build_theme()
	_build_interface()
	_update_house_summary(0)


func _build_theme() -> void:
	var app_theme := Theme.new()
	app_theme.default_font_size = 18
	app_theme.set_color("font_color", "Label", Color("e8edf5"))
	app_theme.set_color("font_color", "Button", Color("f7f9fc"))
	app_theme.set_color("font_color", "OptionButton", Color("f7f9fc"))
	theme = app_theme


func _build_interface() -> void:
	var background := ColorRect.new()
	background.color = Color("09111f")
	background.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(background)

	var margin := MarginContainer.new()
	margin.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	margin.add_theme_constant_override("margin_left", 48)
	margin.add_theme_constant_override("margin_right", 48)
	margin.add_theme_constant_override("margin_top", 36)
	margin.add_theme_constant_override("margin_bottom", 36)
	add_child(margin)

	var page := VBoxContainer.new()
	page.add_theme_constant_override("separation", 16)
	margin.add_child(page)

	var eyebrow := Label.new()
	eyebrow.text = "GODOT PIVOT · FIRST PLAYABLE SLICE"
	eyebrow.add_theme_color_override("font_color", Color("69d3c5"))
	page.add_child(eyebrow)

	var title := Label.new()
	title.text = "DYNASTY DESK: ARENA"
	title.add_theme_font_size_override("font_size", 38)
	page.add_child(title)

	var introduction := Label.new()
	introduction.text = "Choose an Arena House, set one clear strategy, and resolve a deterministic three-round bout."
	introduction.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	page.add_child(introduction)

	var setup := HBoxContainer.new()
	setup.add_theme_constant_override("separation", 20)
	page.add_child(setup)

	var house_column := VBoxContainer.new()
	house_column.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	setup.add_child(house_column)
	var house_label := Label.new()
	house_label.text = "Your House"
	house_column.add_child(house_label)
	_house_picker = OptionButton.new()
	_house_picker.accessibility_name = "Choose your Arena House"
	for house in _houses:
		_house_picker.add_item(house["name"])
	_house_picker.item_selected.connect(_update_house_summary)
	house_column.add_child(_house_picker)

	var strategy_column := VBoxContainer.new()
	strategy_column.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	setup.add_child(strategy_column)
	var strategy_label := Label.new()
	strategy_label.text = "Bout strategy"
	strategy_column.add_child(strategy_label)
	_strategy_picker = OptionButton.new()
	_strategy_picker.accessibility_name = "Choose a bout strategy"
	for strategy in ["Balanced", "Aggressive", "Guarded", "Elusive"]:
		_strategy_picker.add_item(strategy)
	strategy_column.add_child(_strategy_picker)

	_house_summary = RichTextLabel.new()
	_house_summary.fit_content = true
	_house_summary.custom_minimum_size = Vector2(0, 118)
	_house_summary.bbcode_enabled = true
	_house_summary.accessibility_name = "Selected House summary"
	page.add_child(_house_summary)

	var play_button := Button.new()
	play_button.text = "Resolve exhibition bout"
	play_button.accessibility_name = "Resolve the exhibition bout"
	play_button.pressed.connect(_resolve_exhibition)
	page.add_child(play_button)

	var divider := HSeparator.new()
	page.add_child(divider)

	_result_heading = Label.new()
	_result_heading.text = "The arena is waiting"
	_result_heading.add_theme_font_size_override("font_size", 25)
	page.add_child(_result_heading)

	_score_label = Label.new()
	_score_label.text = "Your locked decisions will produce one reproducible result."
	_score_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	page.add_child(_score_label)

	_event_log = RichTextLabel.new()
	_event_log.bbcode_enabled = true
	_event_log.custom_minimum_size = Vector2(0, 230)
	_event_log.size_flags_vertical = Control.SIZE_EXPAND_FILL
	_event_log.accessibility_name = "Bout event commentary"
	_event_log.text = "[color=#92a1b7]Event commentary will appear here. The next slice will animate these same events without changing the score.[/color]"
	page.add_child(_event_log)


func _update_house_summary(index: int) -> void:
	var house: Dictionary = _houses[index]
	var opponent: Dictionary = _houses[1 - index]
	var roster_lines: Array[String] = []
	for competitor in house["roster"]:
		roster_lines.append(
			"%s · POW %d · AGI %d · GRD %d · TEC %d · RES %d" % [
				competitor["name"],
				competitor["power"],
				competitor["agility"],
				competitor["guard"],
				competitor["technique"],
				competitor["resolve"]
			]
		)
	_house_summary.text = "[b]%s[/b]\n%s\n%s\n\nNext opponent: [b]%s[/b]" % [
		house["name"],
		house["identity"],
		"\n".join(roster_lines),
		opponent["name"]
	]


func _resolve_exhibition() -> void:
	var selected_index: int = _house_picker.selected
	var opponent_index: int = 1 - selected_index
	var player_house: Dictionary = _houses[selected_index]
	var opponent_house: Dictionary = _houses[opponent_index]
	var strategy: String = _strategy_picker.get_item_text(_strategy_picker.selected).to_lower()
	var result: Dictionary = ArenaMatchResolver.resolve_bout(
		player_house,
		opponent_house,
		_seed,
		strategy,
		"balanced"
	)

	_result_heading.text = "%s wins" % result["winner_name"]
	_score_label.text = "%s %d — %d %s · Seed %d · Resolver %s" % [
		player_house["name"],
		result["home_score"],
		result["away_score"],
		opponent_house["name"],
		result["seed"],
		result["resolver_version"]
	]
	var event_lines: Array[String] = []
	for event in result["events"]:
		event_lines.append(
			"[color=#69d3c5]Round %d · %d–%d[/color]  %s" % [
				event["round"], event["home_score"], event["away_score"], event["text"]
			]
		)
	_event_log.text = "\n".join(event_lines)
	_event_log.grab_focus()
	_seed += 7919
