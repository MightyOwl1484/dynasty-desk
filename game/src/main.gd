extends Control

const PrototypeLeague = preload("res://src/data/prototype_league.gd")
const ArenaMatchResolver = preload("res://src/simulation/arena_match_resolver.gd")
const BoutAnalysis = preload("res://src/simulation/bout_analysis.gd")
const ArenaPresentation = preload("res://src/presentation/arena_presentation.gd")
const ArenaView = preload("res://src/presentation/arena_view.gd")

const SPEEDS: Array[float] = [1.0, 2.0, 4.0]

var _houses: Array[Dictionary] = []
var _presentation := ArenaPresentation.new()
var _last_result: Dictionary = {}
var _revealed_events: Array[Dictionary] = []
var _seed: int = 104729
var _speed_index: int = 0

var _house_picker: OptionButton
var _opponent_picker: OptionButton
var _opponent_summary: Label
var _strategy_picker: OptionButton
var _lineup_pickers: Array[OptionButton] = []
var _strategy_summary: Label
var _house_summary: RichTextLabel
var _lineup_summary: Label
var _result_heading: Label
var _score_label: Label
var _explanation_label: RichTextLabel
var _status_label: Label
var _event_log: RichTextLabel
var _arena_view: ArenaView
var _play_button: Button
var _speed_button: Button
var _skip_button: Button
var _replay_button: Button
var _reduced_motion: CheckButton
var _text_only: CheckButton
var _presentation_timer: Timer


func _ready() -> void:
	_houses = PrototypeLeague.create_houses()
	_build_theme()
	_build_interface()
	_update_house_summary(0)
	_update_strategy_summary(0)


func _build_theme() -> void:
	var app_theme := Theme.new()
	app_theme.default_font_size = 18
	app_theme.set_color("font_color", "Label", Color("e8edf5"))
	app_theme.set_color("font_color", "Button", Color("f7f9fc"))
	app_theme.set_color("font_hover_color", "Button", Color("ffffff"))
	app_theme.set_color("font_color", "OptionButton", Color("f7f9fc"))
	app_theme.set_color("font_color", "CheckButton", Color("e8edf5"))
	theme = app_theme


func _build_interface() -> void:
	var background := ColorRect.new()
	background.color = Color("09111f")
	background.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(background)

	var margin := MarginContainer.new()
	margin.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	margin.add_theme_constant_override("margin_left", 40)
	margin.add_theme_constant_override("margin_right", 40)
	margin.add_theme_constant_override("margin_top", 28)
	margin.add_theme_constant_override("margin_bottom", 28)
	add_child(margin)

	var page := VBoxContainer.new()
	page.add_theme_constant_override("separation", 12)
	margin.add_child(page)

	var eyebrow := Label.new()
	eyebrow.text = "GODOT PIVOT · PLAYABLE ARENA PRESENTATION"
	eyebrow.add_theme_color_override("font_color", Color("69d3c5"))
	page.add_child(eyebrow)

	var title := Label.new()
	title.text = "DYNASTY DESK: ARENA"
	title.add_theme_font_size_override("font_size", 34)
	page.add_child(title)

	var introduction := Label.new()
	introduction.text = "Choose a House and strategy. The result locks first; the presentation only reveals its moments."
	introduction.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	page.add_child(introduction)

	var setup := HBoxContainer.new()
	setup.add_theme_constant_override("separation", 20)
	page.add_child(setup)
	_build_house_picker(setup)
	_build_opponent_picker(setup)
	_build_strategy_picker(setup)

	_house_summary = RichTextLabel.new()
	_house_summary.fit_content = true
	_house_summary.custom_minimum_size = Vector2(0, 76)
	_house_summary.bbcode_enabled = true
	_house_summary.accessibility_name = "Selected House summary"
	page.add_child(_house_summary)
	_build_lineup_picker(page)

	var resolve_button := Button.new()
	resolve_button.text = "Lock result and enter the arena"
	resolve_button.accessibility_name = "Resolve the exhibition bout and prepare its presentation"
	resolve_button.pressed.connect(_resolve_exhibition)
	page.add_child(resolve_button)

	var match_area := HBoxContainer.new()
	match_area.add_theme_constant_override("separation", 24)
	match_area.size_flags_vertical = Control.SIZE_EXPAND_FILL
	page.add_child(match_area)
	_build_arena_column(match_area)
	_build_commentary_column(match_area)

	_presentation_timer = Timer.new()
	_presentation_timer.one_shot = false
	_presentation_timer.timeout.connect(_reveal_next_event)
	add_child(_presentation_timer)


func _build_house_picker(parent: HBoxContainer) -> void:
	var column := VBoxContainer.new()
	column.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	parent.add_child(column)
	var label := Label.new()
	label.text = "Your House"
	column.add_child(label)
	_house_picker = OptionButton.new()
	_house_picker.accessibility_name = "Choose your Arena House"
	for house in _houses:
		_house_picker.add_item(house["name"])
	_house_picker.item_selected.connect(_update_house_summary)
	column.add_child(_house_picker)


func _build_opponent_picker(parent: HBoxContainer) -> void:
	var column := VBoxContainer.new()
	column.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	parent.add_child(column)
	var label := Label.new()
	label.text = "Opponent"
	column.add_child(label)
	_opponent_picker = OptionButton.new()
	_opponent_picker.accessibility_name = "Choose an opposing Arena House"
	_opponent_picker.item_selected.connect(_update_opponent_summary)
	column.add_child(_opponent_picker)
	_opponent_summary = Label.new()
	_opponent_summary.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_opponent_summary.add_theme_font_size_override("font_size", 15)
	column.add_child(_opponent_summary)


func _build_strategy_picker(parent: HBoxContainer) -> void:
	var column := VBoxContainer.new()
	column.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	parent.add_child(column)
	var label := Label.new()
	label.text = "Bout strategy"
	column.add_child(label)
	_strategy_picker = OptionButton.new()
	_strategy_picker.accessibility_name = "Choose a bout strategy"
	for strategy in ["Balanced", "Aggressive", "Guarded", "Elusive"]:
		_strategy_picker.add_item(strategy)
	_strategy_picker.item_selected.connect(_update_strategy_summary)
	column.add_child(_strategy_picker)
	_strategy_summary = Label.new()
	_strategy_summary.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_strategy_summary.add_theme_font_size_override("font_size", 15)
	column.add_child(_strategy_summary)


func _build_lineup_picker(parent: VBoxContainer) -> void:
	var lineup_row := HBoxContainer.new()
	lineup_row.add_theme_constant_override("separation", 12)
	parent.add_child(lineup_row)
	var label := Label.new()
	label.text = "Active trio"
	label.custom_minimum_size = Vector2(110, 0)
	lineup_row.add_child(label)
	for slot in range(3):
		var picker := OptionButton.new()
		picker.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		picker.accessibility_name = "Choose competitor for lineup slot %d" % (slot + 1)
		picker.item_selected.connect(_update_lineup_summary)
		lineup_row.add_child(picker)
		_lineup_pickers.append(picker)
	_lineup_summary = Label.new()
	_lineup_summary.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_lineup_summary.add_theme_font_size_override("font_size", 14)
	parent.add_child(_lineup_summary)


func _build_arena_column(parent: HBoxContainer) -> void:
	var column := VBoxContainer.new()
	column.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	column.size_flags_stretch_ratio = 1.35
	parent.add_child(column)

	_arena_view = ArenaView.new()
	_arena_view.size_flags_vertical = Control.SIZE_EXPAND_FILL
	column.add_child(_arena_view)

	_status_label = Label.new()
	_status_label.text = "Resolve a bout to prepare its replay."
	_status_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_status_label.accessibility_live = AccessibilityServer.LIVE_POLITE
	column.add_child(_status_label)

	var controls := HBoxContainer.new()
	controls.add_theme_constant_override("separation", 8)
	column.add_child(controls)
	_play_button = _control_button("Play", "Play the arena presentation", _toggle_playback)
	_speed_button = _control_button("Speed 1x", "Change presentation speed", _cycle_speed)
	_skip_button = _control_button("Skip", "Skip to the completed bout", _skip_presentation)
	_replay_button = _control_button("Replay", "Replay the locked arena presentation", _replay_presentation)
	controls.add_child(_play_button)
	controls.add_child(_speed_button)
	controls.add_child(_skip_button)
	controls.add_child(_replay_button)

	var accessibility_controls := HBoxContainer.new()
	column.add_child(accessibility_controls)
	_reduced_motion = CheckButton.new()
	_reduced_motion.text = "Reduced motion"
	_reduced_motion.accessibility_name = "Reduce arena marker movement"
	accessibility_controls.add_child(_reduced_motion)
	_text_only = CheckButton.new()
	_text_only.text = "Text only"
	_text_only.accessibility_name = "Hide the arena graphic and use commentary only"
	_text_only.toggled.connect(_set_text_only)
	accessibility_controls.add_child(_text_only)
	_set_presentation_controls_enabled(false)


func _build_commentary_column(parent: HBoxContainer) -> void:
	var column := VBoxContainer.new()
	column.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	column.size_flags_stretch_ratio = 1.0
	parent.add_child(column)

	_result_heading = Label.new()
	_result_heading.text = "The arena is waiting"
	_result_heading.add_theme_font_size_override("font_size", 24)
	column.add_child(_result_heading)

	_score_label = Label.new()
	_score_label.text = "The same locked choices and seed always produce the same bout."
	_score_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	column.add_child(_score_label)

	_explanation_label = RichTextLabel.new()
	_explanation_label.bbcode_enabled = true
	_explanation_label.fit_content = true
	_explanation_label.custom_minimum_size = Vector2(320, 72)
	_explanation_label.accessibility_name = "Post-bout explanation"
	_explanation_label.text = "[color=#92a1b7]After the bout, a short review will explain the key contributor and tactical shape.[/color]"
	column.add_child(_explanation_label)

	_event_log = RichTextLabel.new()
	_event_log.bbcode_enabled = true
	_event_log.custom_minimum_size = Vector2(320, 240)
	_event_log.size_flags_vertical = Control.SIZE_EXPAND_FILL
	_event_log.focus_mode = Control.FOCUS_ALL
	_event_log.accessibility_name = "Bout event commentary"
	_event_log.text = "[color=#92a1b7]Every visual moment also appears here as text.[/color]"
	column.add_child(_event_log)


func _control_button(label: String, accessible_label: String, callback: Callable) -> Button:
	var button := Button.new()
	button.text = label
	button.accessibility_name = accessible_label
	button.pressed.connect(callback)
	return button


func _update_house_summary(index: int) -> void:
	var house: Dictionary = _houses[index]
	_populate_opponents(house["id"])
	_populate_lineup(house)
	_house_summary.text = "[b]%s[/b] — %s\n%d competitors available. Choose the three who enter the arena." % [
		house["name"], house["identity"], house["roster"].size()
	]


func _populate_opponents(player_house_id: String) -> void:
	_opponent_picker.clear()
	for house in _houses:
		if house["id"] == player_house_id:
			continue
		_opponent_picker.add_item(house["name"])
		_opponent_picker.set_item_metadata(_opponent_picker.item_count - 1, house["id"])
	_opponent_picker.select(0)
	_update_opponent_summary(0)


func _populate_lineup(house: Dictionary) -> void:
	for slot in range(_lineup_pickers.size()):
		var picker := _lineup_pickers[slot]
		picker.clear()
		for competitor in house["roster"]:
			picker.add_item("%s · %s · P%d G%d T%d" % [
				competitor["name"], str(competitor.get("archetype", "competitor")).capitalize(),
				competitor["power"], competitor["guard"], competitor["technique"]
			])
			picker.set_item_metadata(picker.item_count - 1, competitor["id"])
		picker.select(mini(slot, picker.item_count - 1))
	_update_lineup_summary()


func _update_opponent_summary(_index: int = 0) -> void:
	if not _house_summary or _opponent_picker.item_count == 0:
		return
	var opponent := _selected_opponent()
	var profile := _lineup_profile(opponent["roster"].slice(0, 3))
	_opponent_summary.text = "%s · Active trio P%d G%d T%d" % [
		opponent["identity"], profile["power"], profile["guard"], profile["technique"]
	]
	_house_summary.accessibility_description = "Selected opponent: %s. %s" % [opponent["name"], opponent["identity"]]
	if _lineup_pickers.all(func(picker: OptionButton) -> bool: return picker.item_count > 0):
		_update_lineup_summary()


func _update_lineup_summary(_index: int = 0) -> void:
	if not _lineup_summary or _lineup_pickers.is_empty():
		return
	var house: Dictionary = _houses[_house_picker.selected]
	var selected: Array[Dictionary] = _selected_lineup(house)
	var names: Array[String] = []
	for competitor in selected:
		names.append(competitor["name"])
	var profile := _lineup_profile(selected)
	var opponent_profile := _lineup_profile(_selected_opponent()["roster"].slice(0, 3))
	var duplicate_warning := " · Choose three different competitors." if _lineup_has_duplicates(selected) else ""
	_lineup_summary.text = "%s\nTeam profile vs opponent: POW %d (%+d) · GRD %d (%+d) · TEC %d (%+d)%s" % [
		", ".join(names),
		profile["power"], profile["power"] - opponent_profile["power"],
		profile["guard"], profile["guard"] - opponent_profile["guard"],
		profile["technique"], profile["technique"] - opponent_profile["technique"],
		duplicate_warning
	]
	_lineup_summary.accessibility_description = _lineup_summary.text


func _update_strategy_summary(index: int) -> void:
	var descriptions := [
		"Reliable attack and defense with no major exposure.",
		"More pressure and decisive exchanges, but weaker protection.",
		"Stronger protection and patience, but fewer attacking openings.",
		"Movement creates openings while keeping risk moderate."
	]
	_strategy_summary.text = descriptions[index]


func _resolve_exhibition() -> void:
	_presentation_timer.stop()
	var selected_index: int = _house_picker.selected
	var source_house: Dictionary = _houses[selected_index]
	var selected_lineup := _selected_lineup(source_house)
	if _lineup_has_duplicates(selected_lineup):
		_status_label.text = "Choose three different competitors before entering the arena."
		return
	var player_house: Dictionary = source_house.duplicate(true)
	player_house["roster"] = selected_lineup
	var opponent_house: Dictionary = _selected_opponent()
	var strategy: String = _strategy_picker.get_item_text(_strategy_picker.selected).to_lower()
	_last_result = ArenaMatchResolver.resolve_bout(player_house, opponent_house, _seed, strategy, "balanced")
	_presentation.load_result(_last_result)
	_arena_view.configure(player_house, opponent_house)
	_revealed_events.clear()
	_event_log.text = "[color=#92a1b7]Result locked. Press Play, choose Skip, or use Text only.[/color]"
	_explanation_label.text = "[color=#92a1b7]The post-bout review appears when the presentation completes.[/color]"
	_result_heading.text = "Bout ready"
	_score_label.text = "%s 0 — 0 %s · Seed %d" % [player_house["name"], opponent_house["name"], _last_result["seed"]]
	_status_label.text = "Ready · %s" % _presentation.progress_text()
	_play_button.text = "Play"
	_set_presentation_controls_enabled(true)
	_replay_button.disabled = true
	_seed += 7919


func _toggle_playback() -> void:
	if _presentation.is_playing():
		_presentation.pause()
		_presentation_timer.stop()
		_play_button.text = "Play"
		_status_label.text = "Paused · %s" % _presentation.progress_text()
		return

	if _presentation.is_complete():
		_replay_presentation()
	_presentation.play()
	_presentation_timer.wait_time = _presentation.event_interval_seconds()
	_presentation_timer.start()
	_play_button.text = "Pause"
	_status_label.text = "Playing · %s" % _presentation.progress_text()
	_reveal_next_event()


func _reveal_next_event() -> void:
	var event := _presentation.reveal_next()
	if event.is_empty():
		if _presentation.is_complete():
			_finish_presentation()
		return
	_revealed_events.append(event)
	_arena_view.show_event(event, not _reduced_motion.button_pressed and not _text_only.button_pressed)
	_render_revealed_events()
	_score_label.text = "%s · %d—%d" % [event["text"], event["home_score"], event["away_score"]]
	_status_label.text = "Playing · %s" % _presentation.progress_text()
	if _presentation.is_complete():
		_finish_presentation()


func _cycle_speed() -> void:
	_speed_index = (_speed_index + 1) % SPEEDS.size()
	var speed := SPEEDS[_speed_index]
	_presentation.set_speed(speed)
	_speed_button.text = "Speed %sx" % str(speed).trim_suffix(".0")
	if _presentation.is_playing():
		_presentation_timer.wait_time = _presentation.event_interval_seconds()
		_presentation_timer.start()


func _skip_presentation() -> void:
	_presentation_timer.stop()
	for event in _presentation.skip():
		_revealed_events.append(event)
	if not _revealed_events.is_empty():
		_arena_view.show_event(_revealed_events[-1], false)
	_render_revealed_events()
	_finish_presentation()


func _replay_presentation() -> void:
	_presentation_timer.stop()
	_presentation.replay()
	_revealed_events.clear()
	_arena_view.reset_view()
	_event_log.text = "[color=#92a1b7]Replay ready. The locked result and event order are unchanged.[/color]"
	_explanation_label.text = "[color=#92a1b7]The post-bout review will return at the end of this replay.[/color]"
	_result_heading.text = "Replay ready"
	var home_house := _house_by_id(_last_result["home_house_id"])
	var away_house := _house_by_id(_last_result["away_house_id"])
	_score_label.text = "%s 0 — 0 %s · Seed %d" % [home_house["name"], away_house["name"], _last_result["seed"]]
	_status_label.text = "Ready · %s" % _presentation.progress_text()
	_play_button.text = "Play"
	_play_button.disabled = false
	_skip_button.disabled = false
	_replay_button.disabled = true


func _finish_presentation() -> void:
	_presentation_timer.stop()
	_result_heading.text = "%s wins" % _last_result["winner_name"]
	var home_house := _house_by_id(_last_result["home_house_id"])
	var away_house := _house_by_id(_last_result["away_house_id"])
	_score_label.text = "%s %d — %d %s · Resolver %s" % [
		home_house["name"], _last_result["home_score"], _last_result["away_score"],
		away_house["name"], _last_result["resolver_version"]
	]
	_status_label.text = "Complete · %s" % _presentation.progress_text()
	_play_button.text = "Play"
	_play_button.disabled = true
	_skip_button.disabled = true
	_replay_button.disabled = false
	var analysis := BoutAnalysis.summarize(_last_result, home_house, away_house)
	_explanation_label.text = "[b]Why it happened[/b]\n%s\n[color=#92a1b7]%s[/color]" % [analysis["headline"], analysis["detail"]]
	_event_log.grab_focus()


func _render_revealed_events() -> void:
	var event_lines: Array[String] = []
	for event in _revealed_events:
		event_lines.append("[color=#69d3c5]Round %d · %d–%d[/color]  %s" % [
			event["round"], event["home_score"], event["away_score"], event["text"]
		])
	_event_log.text = "\n".join(event_lines)


func _set_text_only(enabled: bool) -> void:
	_arena_view.visible = not enabled
	if enabled:
		_status_label.text = "Text-only mode. Commentary remains synchronized with the locked result."


func _set_presentation_controls_enabled(enabled: bool) -> void:
	_play_button.disabled = not enabled
	_speed_button.disabled = not enabled
	_skip_button.disabled = not enabled
	_replay_button.disabled = not enabled


func _house_by_id(house_id: String) -> Dictionary:
	for house in _houses:
		if house["id"] == house_id:
			return house
	assert(false, "Unknown House id")
	return {}


func _selected_opponent() -> Dictionary:
	var opponent_id: String = str(_opponent_picker.get_item_metadata(_opponent_picker.selected))
	return _house_by_id(opponent_id)


func _selected_lineup(house: Dictionary) -> Array[Dictionary]:
	var selected: Array[Dictionary] = []
	for picker in _lineup_pickers:
		var competitor_id: String = str(picker.get_item_metadata(picker.selected))
		for competitor in house["roster"]:
			if competitor["id"] == competitor_id:
				selected.append(competitor.duplicate(true))
				break
	return selected


func _lineup_has_duplicates(lineup: Array[Dictionary]) -> bool:
	var ids: Dictionary = {}
	for competitor in lineup:
		ids[competitor["id"]] = true
	return ids.size() != lineup.size()


func _lineup_profile(lineup: Array) -> Dictionary:
	var totals := {"power": 0, "guard": 0, "technique": 0}
	for competitor in lineup:
		for attribute in totals:
			totals[attribute] += int(competitor[attribute])
	var divisor: float = maxf(1.0, float(lineup.size()))
	return {
		"power": roundi(totals["power"] / divisor),
		"guard": roundi(totals["guard"] / divisor),
		"technique": roundi(totals["technique"] / divisor)
	}
