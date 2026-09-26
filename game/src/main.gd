extends Control

const PrototypeLeagueScript = preload("res://src/data/prototype_league.gd")
const ArenaMatchResolverScript = preload("res://src/simulation/arena_match_resolver.gd")
const BoutAnalysisScript = preload("res://src/simulation/bout_analysis.gd")
const ArenaPresentationScript = preload("res://src/presentation/arena_presentation.gd")
const ArenaViewScript = preload("res://src/presentation/arena_view.gd")
const WeeklyCycleScript = preload("res://src/application/weekly_cycle.gd")
const LineupSelectorScript = preload("res://src/application/lineup_selector.gd")
const OnboardingGuideScript = preload("res://src/application/onboarding_guide.gd")
const SeasonScheduleScript = preload("res://src/domain/season_schedule.gd")
const SeasonStateScript = preload("res://src/application/season_state.gd")
const LocalSaveStoreScript = preload("res://src/persistence/local_save_store.gd")
const SPEEDS: Array[float] = [1.0, 2.0, 4.0]

var _houses: Array[Dictionary] = []
var _presentation := ArenaPresentationScript.new()
var _last_result: Dictionary = {}
var _revealed_events: Array[Dictionary] = []
var _seed: int = 104729
var _speed_index: int = 0
var _week_number: int = 1
var _week_state: Dictionary = {}
var _career_house: Dictionary = {}
var _schedule: Array[Dictionary] = []
var _season_state: Dictionary = {}
var _season_complete: bool = false

var _house_picker: OptionButton
var _opponent_picker: OptionButton
var _opponent_summary: Label
var _strategy_picker: OptionButton
var _training_picker: OptionButton
var _training_summary: Label
var _lineup_pickers: Array[OptionButton] = []
var _strategy_summary: Label
var _house_summary: Label
var _lineup_summary: Label
var _standings_label: Label
var _result_heading: Label
var _score_label: Label
var _explanation_label: Label
var _status_label: Label
var _event_log: RichTextLabel
var _arena_view: Control
var _play_button: Button
var _speed_button: Button
var _skip_button: Button
var _replay_button: Button
var _advance_button: Button
var _reset_button: Button
var _export_button: Button
var _import_button: Button
var _import_confirmation: ConfirmationDialog
var _native_import_dialog: FileDialog
var _native_export_dialog: FileDialog
var _pending_import_text: String = ""
var _pending_export_text: String = ""
var _browser_import_input: JavaScriptObject
var _browser_import_reader: JavaScriptObject
var _browser_change_callback: JavaScriptObject
var _browser_read_callback: JavaScriptObject
var _browser_error_callback: JavaScriptObject
var _tour_panel: PanelContainer
var _tour_progress: Label
var _tour_title: Label
var _tour_body: Label
var _tour_back_button: Button
var _tour_next_button: Button
var _tour_step_index: int = 0
var _reduced_motion: CheckButton
var _text_only: CheckButton
var _presentation_timer: Timer


func _ready() -> void:
	_houses = PrototypeLeagueScript.create_houses()
	_schedule = SeasonScheduleScript.create(_houses)
	_season_state = SeasonStateScript.start(_houses, _schedule, 104729)
	_build_theme()
	_build_interface()
	_update_house_summary(0)
	_update_strategy_summary(0)
	_update_training_summary(0)
	_restore_career()
	_render_standings()
	_sync_week_controls()
	if _career_house.is_empty():
		_open_tour()


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

	var scroll := ScrollContainer.new()
	scroll.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	margin.add_child(scroll)
	var page := VBoxContainer.new()
	page.add_theme_constant_override("separation", 12)
	page.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	scroll.add_child(page)

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
	_build_guided_tour(page)

	_standings_label = Label.new()
	_standings_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_standings_label.add_theme_color_override("font_color", Color("c8d2e1"))
	_standings_label.accessibility_name = "Current mini-season standings"
	page.add_child(_standings_label)

	var setup := GridContainer.new()
	setup.columns = 2
	setup.add_theme_constant_override("separation", 20)
	page.add_child(setup)
	_build_house_picker(setup)
	_build_opponent_picker(setup)
	_build_training_picker(setup)
	_build_strategy_picker(setup)

	_house_summary = Label.new()
	_house_summary.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_house_summary.accessibility_name = "Selected House summary"
	page.add_child(_house_summary)
	_build_lineup_picker(page)

	var week_actions := VBoxContainer.new()
	week_actions.add_theme_constant_override("separation", 8)
	page.add_child(week_actions)
	_advance_button = Button.new()
	_advance_button.text = "Start Week 1"
	_advance_button.accessibility_name = "Advance the guided weekly management flow"
	_advance_button.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_advance_button.pressed.connect(_advance_week)
	week_actions.add_child(_advance_button)
	var secondary_actions := HBoxContainer.new()
	secondary_actions.add_theme_constant_override("separation", 8)
	week_actions.add_child(secondary_actions)
	_reset_button = Button.new()
	_reset_button.text = "Reset career"
	_reset_button.accessibility_name = "Erase the local career and start again"
	_reset_button.pressed.connect(_reset_career)
	secondary_actions.add_child(_reset_button)
	var help_button := Button.new()
	help_button.text = "How to play"
	help_button.accessibility_name = "Open the getting started tour"
	help_button.pressed.connect(_open_tour)
	secondary_actions.add_child(help_button)
	_export_button = Button.new()
	_export_button.text = "Export save"
	_export_button.accessibility_name = "Download a portable career save"
	_export_button.pressed.connect(_export_career)
	secondary_actions.add_child(_export_button)
	_import_button = Button.new()
	_import_button.text = "Import save"
	_import_button.accessibility_name = "Choose a portable career save to import"
	_import_button.pressed.connect(_choose_import)
	secondary_actions.add_child(_import_button)

	var match_area := VBoxContainer.new()
	match_area.add_theme_constant_override("separation", 24)
	match_area.size_flags_vertical = Control.SIZE_EXPAND_FILL
	page.add_child(match_area)
	_build_arena_column(match_area)
	_build_commentary_column(match_area)
	_build_save_dialogs()

	_presentation_timer = Timer.new()
	_presentation_timer.one_shot = false
	_presentation_timer.timeout.connect(_reveal_next_event)
	add_child(_presentation_timer)


func _build_save_dialogs() -> void:
	_import_confirmation = ConfirmationDialog.new()
	_import_confirmation.title = "Replace local career?"
	_import_confirmation.confirmed.connect(_confirm_import)
	add_child(_import_confirmation)
	_native_import_dialog = FileDialog.new()
	_native_import_dialog.file_mode = FileDialog.FILE_MODE_OPEN_FILE
	_native_import_dialog.access = FileDialog.ACCESS_FILESYSTEM
	_native_import_dialog.filters = PackedStringArray(["*.json ; JSON career save"])
	_native_import_dialog.file_selected.connect(_on_native_import_file)
	add_child(_native_import_dialog)
	_native_export_dialog = FileDialog.new()
	_native_export_dialog.file_mode = FileDialog.FILE_MODE_SAVE_FILE
	_native_export_dialog.access = FileDialog.ACCESS_FILESYSTEM
	_native_export_dialog.filters = PackedStringArray(["*.json ; JSON career save"])
	_native_export_dialog.current_file = "dynasty-desk-arena-career.json"
	_native_export_dialog.file_selected.connect(_on_native_export_file)
	add_child(_native_export_dialog)


func _build_guided_tour(parent: VBoxContainer) -> void:
	_tour_panel = PanelContainer.new()
	_tour_panel.visible = false
	_tour_panel.accessibility_name = "Getting started guided tour"
	parent.add_child(_tour_panel)
	var margin := MarginContainer.new()
	margin.add_theme_constant_override("margin_left", 16)
	margin.add_theme_constant_override("margin_right", 16)
	margin.add_theme_constant_override("margin_top", 12)
	margin.add_theme_constant_override("margin_bottom", 12)
	_tour_panel.add_child(margin)
	var content := VBoxContainer.new()
	content.add_theme_constant_override("separation", 6)
	margin.add_child(content)
	_tour_progress = Label.new()
	_tour_progress.add_theme_color_override("font_color", Color("69d3c5"))
	content.add_child(_tour_progress)
	_tour_title = Label.new()
	_tour_title.add_theme_font_size_override("font_size", 22)
	content.add_child(_tour_title)
	_tour_body = Label.new()
	_tour_body.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_tour_body.accessibility_live = AccessibilityServer.LIVE_POLITE
	content.add_child(_tour_body)
	var actions := HBoxContainer.new()
	actions.add_theme_constant_override("separation", 8)
	content.add_child(actions)
	_tour_back_button = Button.new()
	_tour_back_button.text = "Back"
	_tour_back_button.pressed.connect(_tour_previous)
	actions.add_child(_tour_back_button)
	_tour_next_button = Button.new()
	_tour_next_button.text = "Next"
	_tour_next_button.pressed.connect(_tour_next)
	actions.add_child(_tour_next_button)
	var close_button := Button.new()
	close_button.text = "Close tour"
	close_button.pressed.connect(_close_tour)
	actions.add_child(close_button)


func _open_tour() -> void:
	_tour_step_index = 0
	_tour_panel.visible = true
	_render_tour_step()
	_tour_next_button.grab_focus()


func _close_tour() -> void:
	_tour_panel.visible = false
	_house_picker.grab_focus()


func _tour_previous() -> void:
	_tour_step_index = maxi(0, _tour_step_index - 1)
	_render_tour_step()


func _tour_next() -> void:
	if _tour_step_index >= OnboardingGuideScript.count() - 1:
		_close_tour()
		return
	_tour_step_index += 1
	_render_tour_step()


func _render_tour_step() -> void:
	var tour_step := OnboardingGuideScript.step(_tour_step_index)
	_tour_progress.text = OnboardingGuideScript.progress_text(_tour_step_index)
	_tour_title.text = tour_step["title"]
	_tour_body.text = tour_step["body"]
	_tour_back_button.disabled = _tour_step_index == 0
	_tour_next_button.text = "Start choosing" if _tour_step_index == OnboardingGuideScript.count() - 1 else "Next"


func _build_house_picker(parent: Container) -> void:
	var column := VBoxContainer.new()
	column.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	parent.add_child(column)
	var label := Label.new()
	label.text = "Your House"
	column.add_child(label)
	_house_picker = OptionButton.new()
	_house_picker.fit_to_longest_item = false
	_house_picker.clip_text = true
	_house_picker.accessibility_name = "Choose your Arena House"
	for house in _houses:
		_house_picker.add_item(house["name"])
	_house_picker.item_selected.connect(_update_house_summary)
	column.add_child(_house_picker)


func _build_opponent_picker(parent: Container) -> void:
	var column := VBoxContainer.new()
	column.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	parent.add_child(column)
	var label := Label.new()
	label.text = "Opponent"
	column.add_child(label)
	_opponent_picker = OptionButton.new()
	_opponent_picker.fit_to_longest_item = false
	_opponent_picker.clip_text = true
	_opponent_picker.accessibility_name = "Scheduled opposing Arena House"
	_opponent_picker.item_selected.connect(_update_opponent_summary)
	column.add_child(_opponent_picker)
	_opponent_summary = Label.new()
	_opponent_summary.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_opponent_summary.add_theme_font_size_override("font_size", 15)
	column.add_child(_opponent_summary)


func _build_training_picker(parent: Container) -> void:
	var column := VBoxContainer.new()
	column.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	parent.add_child(column)
	var label := Label.new()
	label.text = "Training"
	column.add_child(label)
	_training_picker = OptionButton.new()
	_training_picker.fit_to_longest_item = false
	_training_picker.clip_text = true
	_training_picker.accessibility_name = "Choose this week's training focus"
	for option in WeeklyCycleScript.training_options():
		_training_picker.add_item(option["label"])
		_training_picker.set_item_metadata(_training_picker.item_count - 1, option["id"])
	_training_picker.item_selected.connect(_update_training_summary)
	column.add_child(_training_picker)
	_training_summary = Label.new()
	_training_summary.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_training_summary.add_theme_font_size_override("font_size", 15)
	column.add_child(_training_summary)


func _build_strategy_picker(parent: Container) -> void:
	var column := VBoxContainer.new()
	column.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	parent.add_child(column)
	var label := Label.new()
	label.text = "Bout strategy"
	column.add_child(label)
	_strategy_picker = OptionButton.new()
	_strategy_picker.fit_to_longest_item = false
	_strategy_picker.clip_text = true
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
		picker.fit_to_longest_item = false
		picker.clip_text = true
		picker.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		picker.accessibility_name = "Choose competitor for lineup slot %d" % (slot + 1)
		picker.item_selected.connect(_update_lineup_summary)
		lineup_row.add_child(picker)
		_lineup_pickers.append(picker)
	_lineup_summary = Label.new()
	_lineup_summary.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_lineup_summary.add_theme_font_size_override("font_size", 14)
	parent.add_child(_lineup_summary)


func _build_arena_column(parent: Container) -> void:
	var column := VBoxContainer.new()
	column.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	column.size_flags_stretch_ratio = 1.35
	parent.add_child(column)

	_arena_view = ArenaViewScript.new()
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


func _build_commentary_column(parent: Container) -> void:
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

	_explanation_label = Label.new()
	_explanation_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_explanation_label.accessibility_name = "Post-bout explanation"
	_explanation_label.text = "After the bout, a short review will explain the key contributor and tactical shape."
	column.add_child(_explanation_label)

	_event_log = RichTextLabel.new()
	_event_log.bbcode_enabled = false
	_event_log.custom_minimum_size = Vector2(320, 240)
	_event_log.size_flags_vertical = Control.SIZE_EXPAND_FILL
	_event_log.focus_mode = Control.FOCUS_ALL
	_event_log.accessibility_name = "Bout event commentary"
	_event_log.text = "Every visual moment also appears here as text."
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
	_house_summary.text = "%s — %s\n%d competitors available. Choose the three who enter the arena." % [
		house["name"], house["identity"], house["roster"].size()
	]


func _populate_opponents(player_house_id: String) -> void:
	_opponent_picker.clear()
	var opponent_id: String = SeasonScheduleScript.opponent_for(_schedule, player_house_id, _week_number)
	if opponent_id.is_empty():
		_opponent_summary.text = "The three-week prototype schedule is complete."
		return
	for house in _houses:
		if house["id"] != opponent_id:
			continue
		_opponent_picker.add_item(house["name"])
		_opponent_picker.set_item_metadata(_opponent_picker.item_count - 1, house["id"])
	_opponent_picker.select(0)
	_update_opponent_summary(0)


func _populate_lineup(house: Dictionary) -> void:
	var recommended_ids := LineupSelectorScript.ids(house)
	for slot in range(_lineup_pickers.size()):
		var picker := _lineup_pickers[slot]
		picker.clear()
		for competitor in house["roster"]:
			picker.add_item("%s · %s · P%d G%d T%d · Fat %d Mor %d" % [
				competitor["name"], str(competitor.get("archetype", "competitor")).capitalize(),
				competitor["power"], competitor["guard"], competitor["technique"],
				competitor.get("fatigue", 12), competitor.get("morale", 60)
			])
			picker.set_item_metadata(picker.item_count - 1, competitor["id"])
		for item_index in range(picker.item_count):
			if picker.get_item_metadata(item_index) == recommended_ids[slot]:
				picker.select(item_index)
				break
	_update_lineup_summary()


func _update_opponent_summary(_index: int = 0) -> void:
	if not _house_summary or _opponent_picker.item_count == 0:
		return
	var opponent := _selected_opponent()
	var profile := _lineup_profile(LineupSelectorScript.select(opponent))
	_opponent_summary.text = "%s · Active trio P%d G%d T%d" % [
		opponent["identity"], profile["power"], profile["guard"], profile["technique"]
	]
	_house_summary.accessibility_description = "Selected opponent: %s. %s" % [opponent["name"], opponent["identity"]]
	if _lineup_pickers.all(func(picker: OptionButton) -> bool: return picker.item_count > 0):
		_update_lineup_summary()


func _update_lineup_summary(_index: int = 0) -> void:
	if not _lineup_summary or _lineup_pickers.is_empty():
		return
	var house: Dictionary = _active_house()
	var selected: Array[Dictionary] = _selected_lineup(house)
	var names: Array[String] = []
	for competitor in selected:
		names.append(competitor["name"])
	var profile := _lineup_profile(selected)
	var opponent_profile := _lineup_profile(LineupSelectorScript.select(_selected_opponent()))
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


func _update_training_summary(index: int) -> void:
	var plan_id: String = str(_training_picker.get_item_metadata(index))
	var plan: Dictionary = WeeklyCycleScript.TRAINING_PLANS[plan_id]
	_training_summary.text = "%s Fatigue %+d · Morale %+d" % [
		plan["description"], plan["fatigue"], plan["morale"]
	]


func _advance_week() -> void:
	if _week_state.is_empty():
		_start_week()
	elif _week_state["phase"] == "briefing":
		_week_state = WeeklyCycleScript.acknowledge_briefing(_week_state)
		_status_label.text = "Choose one training tradeoff for this week."
	elif _week_state["phase"] == "training":
		var plan_id: String = str(_training_picker.get_item_metadata(_training_picker.selected))
		_week_state = WeeklyCycleScript.choose_training(_week_state, plan_id)
		_populate_lineup(_week_state["house"])
		_status_label.text = "Training committed. Choose three different competitors."
	elif _week_state["phase"] == "lineup":
		var selected_lineup := _selected_lineup(_week_state["house"])
		if _lineup_has_duplicates(selected_lineup):
			_status_label.text = "Choose three different competitors before locking the lineup."
			return
		var lineup_ids: Array = selected_lineup.map(func(competitor: Dictionary) -> String: return competitor["id"])
		_week_state = WeeklyCycleScript.choose_lineup(_week_state, lineup_ids)
		_status_label.text = "Lineup locked. Choose the tactical approach."
	elif _week_state["phase"] == "strategy":
		var strategy: String = _strategy_picker.get_item_text(_strategy_picker.selected).to_lower()
		_week_state = WeeklyCycleScript.choose_strategy(_week_state, strategy)
		_status_label.text = "Choices locked. The deterministic result is ready to resolve."
	elif _week_state["phase"] == "bout":
		_resolve_week_bout()
	elif _week_state["phase"] == "news":
		_close_week()
	_sync_week_controls()


func _start_week() -> void:
	var source_house: Dictionary = _career_house if not _career_house.is_empty() else _houses[_house_picker.selected]
	_week_state = WeeklyCycleScript.start_week(source_house, _selected_opponent(), _week_number, _seed)
	var briefing: Dictionary = _week_state["news"][0]
	_status_label.text = "%s · %s" % [briefing["headline"], briefing["body"]]
	_event_log.text = "%s\n%s" % [briefing["headline"], briefing["body"]]
	_result_heading.text = "Week %d briefing" % _week_number
	_score_label.text = "Preparation decisions remain editable until each phase is locked."
	_explanation_label.text = "One clear choice at a time: training, lineup, strategy, then the arena."
	_set_presentation_controls_enabled(false)


func _resolve_week_bout() -> void:
	_presentation_timer.stop()
	_week_state = WeeklyCycleScript.resolve_bout(_week_state)
	_last_result = _week_state["result"]
	var player_house: Dictionary = _week_state["house"].duplicate(true)
	player_house["roster"] = _selected_lineup(_week_state["house"])
	var opponent_house: Dictionary = _week_state["opponent"].duplicate(true)
	opponent_house["roster"] = LineupSelectorScript.select(opponent_house)
	_presentation.load_result(_last_result)
	_arena_view.configure(player_house, opponent_house)
	_revealed_events.clear()
	_event_log.text = "Result locked. Press Play, choose Skip, or use Text only."
	_explanation_label.text = "The post-bout review appears when the presentation completes."
	_result_heading.text = "Bout ready"
	_score_label.text = "%s 0 — 0 %s · Seed %d" % [player_house["name"], opponent_house["name"], _last_result["seed"]]
	_status_label.text = "Ready · %s" % _presentation.progress_text()
	_play_button.text = "Play"
	_set_presentation_controls_enabled(true)
	_replay_button.disabled = true
	_advance_button.disabled = true


func _close_week() -> void:
	_week_state = WeeklyCycleScript.acknowledge_news(_week_state)
	_career_house = _week_state["house"].duplicate(true)
	if _career_house.get("color") is String:
		_career_house["color"] = Color(_career_house["color"])
	_week_number += 1
	_seed += 7919
	_week_state.clear()
	_populate_lineup(_career_house)
	var next_opponent_id: String = SeasonScheduleScript.opponent_for(_schedule, _career_house["id"], _week_number)
	if next_opponent_id.is_empty():
		_season_complete = true
		_opponent_picker.clear()
		_opponent_summary.text = "Three-week prototype schedule complete."
		_house_summary.text = "%s — Mini-season complete\nThree connected weeks carried fatigue, morale, and form forward." % _career_house["name"]
		_render_season_review()
	else:
		_populate_opponents(_career_house["id"])
		_house_summary.text = "%s — Week %d ready\nFatigue, morale, and form now carry into the next decision." % [
			_career_house["name"], _week_number
		]
		_status_label.text = "Week complete. Start Week %d when ready." % _week_number
	_persist_career()
	_set_presentation_controls_enabled(false)


func _persist_career() -> void:
	var envelope := LocalSaveStoreScript.create_envelope(
		_career_house,
		_season_state,
		_week_number,
		_seed,
		_season_complete,
		Time.get_datetime_string_from_system(true)
	)
	var save_error := LocalSaveStoreScript.save(envelope)
	if save_error == OK:
		_status_label.text += " Career saved locally."
	else:
		_status_label.text += " Local save failed (error %d)." % save_error


func _export_career() -> void:
	var loaded := LocalSaveStoreScript.load()
	if not loaded["ok"]:
		_status_label.text = "Export failed: %s" % loaded["error"]
		return
	var contents: String = LocalSaveStoreScript.encode(loaded["envelope"])
	if OS.has_feature("web"):
		JavaScriptBridge.download_buffer(contents.to_utf8_buffer(), "dynasty-desk-arena-career.json", "application/json")
		_status_label.text = "Portable career save download requested."
	else:
		_pending_export_text = contents
		_native_export_dialog.popup_centered_ratio()


func _on_native_export_file(path: String) -> void:
	var file := FileAccess.open(path, FileAccess.WRITE)
	if file == null:
		_status_label.text = "Export failed: could not write the selected file."
		return
	file.store_string(_pending_export_text)
	file.close()
	_pending_export_text = ""
	_status_label.text = "Portable career save exported."


func _choose_import() -> void:
	if OS.has_feature("web"):
		if _browser_import_input == null:
			var document: JavaScriptObject = JavaScriptBridge.get_interface("document")
			_browser_import_input = document.createElement("input")
			_browser_import_input.type = "file"
			_browser_import_input.accept = ".json,application/json"
			_browser_import_input.style.display = "none"
			_browser_change_callback = JavaScriptBridge.create_callback(_on_browser_file_chosen)
			_browser_import_input.onchange = _browser_change_callback
			document.body.appendChild(_browser_import_input)
		_browser_import_input.value = ""
		_browser_import_input.click()
	else:
		_native_import_dialog.popup_centered_ratio()


func _on_browser_file_chosen(_args: Array) -> void:
	if int(_browser_import_input.files.length) == 0:
		return
	var selected_file: JavaScriptObject = _browser_import_input.files[0]
	if int(selected_file.size) > 2_000_000:
		_status_label.text = "Import failed: save file is too large."
		return
	_browser_import_reader = JavaScriptBridge.create_object("FileReader")
	_browser_read_callback = JavaScriptBridge.create_callback(_on_browser_file_read)
	_browser_error_callback = JavaScriptBridge.create_callback(_on_browser_file_error)
	_browser_import_reader.onload = _browser_read_callback
	_browser_import_reader.onerror = _browser_error_callback
	_browser_import_reader.readAsText(selected_file)


func _on_browser_file_read(_args: Array) -> void:
	_receive_import_text(str(_browser_import_reader.result))


func _on_browser_file_error(_args: Array) -> void:
	_status_label.text = "Import failed: the selected file could not be read."


func _on_native_import_file(path: String) -> void:
	var file := FileAccess.open(path, FileAccess.READ)
	if file == null:
		_status_label.text = "Import failed: the selected file could not be opened."
		return
	if file.get_length() > 2_000_000:
		file.close()
		_status_label.text = "Import failed: save file is too large."
		return
	var contents := file.get_as_text()
	file.close()
	_receive_import_text(contents)


func _receive_import_text(contents: String) -> void:
	var decoded := LocalSaveStoreScript.decode(contents)
	if not decoded["ok"]:
		_status_label.text = "Import failed: %s Existing career unchanged." % decoded["error"]
		return
	_pending_import_text = contents
	var career: Dictionary = decoded["envelope"]["career"]
	var progress := "completed season" if career["season_complete"] else "Week %d" % career["next_week"]
	_import_confirmation.dialog_text = "Import %s at %s? This replaces the local career." % [career["house"]["name"], progress]
	_import_confirmation.popup_centered()


func _confirm_import() -> void:
	var imported := LocalSaveStoreScript.import_text(_pending_import_text)
	_pending_import_text = ""
	if not imported["ok"]:
		_status_label.text = "Import failed: %s Existing career unchanged." % imported["error"]
		return
	_presentation_timer.stop()
	_week_state.clear()
	_last_result.clear()
	_revealed_events.clear()
	_arena_view.reset_view()
	_set_presentation_controls_enabled(false)
	_result_heading.text = "The arena is waiting"
	_score_label.text = "The same locked choices and seed always produce the same bout."
	_explanation_label.text = "After the bout, a short review will explain the key contributor and tactical shape."
	_event_log.text = "Portable career imported. Continue from the saved week."
	_restore_career()
	_render_standings()
	_sync_week_controls()
	_status_label.text = "Portable career imported. %s" % _status_label.text


func _restore_career() -> void:
	var loaded := LocalSaveStoreScript.load()
	if not loaded["ok"]:
		return
	var career: Dictionary = loaded["envelope"]["career"]
	_tour_panel.visible = false
	_career_house = career["house"].duplicate(true)
	if _career_house.get("color") is String:
		_career_house["color"] = Color(_career_house["color"])
	_season_state = career["season"].duplicate(true)
	_week_number = int(career["next_week"])
	_seed = int(career["next_seed"])
	_season_complete = bool(career["season_complete"])
	for house_index in range(_houses.size()):
		if _houses[house_index]["id"] == _career_house["id"]:
			_house_picker.select(house_index)
			break
	_populate_lineup(_career_house)
	if _season_complete:
		_opponent_picker.clear()
		_opponent_summary.text = "Three-week prototype schedule complete."
		_house_summary.text = "%s — Mini-season restored\nThe completed local career is ready for review or reset." % _career_house["name"]
		_render_season_review()
		_status_label.text += " Completed local career restored."
	else:
		_populate_opponents(_career_house["id"])
		_house_summary.text = "%s — Week %d restored\nFatigue, morale, form, results, and standings were loaded locally." % [
			_career_house["name"], _week_number
		]
		_status_label.text = "Local career restored. Start Week %d when ready." % _week_number


func _reset_career() -> void:
	var clear_error := LocalSaveStoreScript.clear()
	if clear_error != OK:
		_status_label.text = "Could not clear the local career (error %d)." % clear_error
		return
	_houses = PrototypeLeagueScript.create_houses()
	_schedule = SeasonScheduleScript.create(_houses)
	_season_state = SeasonStateScript.start(_houses, _schedule, 104729)
	_week_number = 1
	_seed = 104729
	_week_state.clear()
	_career_house.clear()
	_last_result.clear()
	_season_complete = false
	_house_picker.select(0)
	_update_house_summary(0)
	_render_standings()
	_result_heading.text = "The arena is waiting"
	_score_label.text = "The same locked choices and seed always produce the same bout."
	_explanation_label.text = "After the bout, a short review will explain the key contributor and tactical shape."
	_event_log.text = "Local career cleared. Choose a House to begin again."
	_status_label.text = "Local career reset."
	_arena_view.reset_view()
	_set_presentation_controls_enabled(false)
	_sync_week_controls()
	_open_tour()


func _sync_week_controls() -> void:
	var phase: String = "setup" if _week_state.is_empty() else str(_week_state["phase"])
	_house_picker.disabled = not _career_house.is_empty() or phase != "setup"
	_opponent_picker.disabled = true
	_training_picker.disabled = phase != "training"
	_strategy_picker.disabled = phase != "strategy"
	for picker in _lineup_pickers:
		picker.disabled = phase != "lineup"
	_advance_button.disabled = phase == "recovery" or _season_complete
	_export_button.disabled = not _week_state.is_empty() or _career_house.is_empty()
	_import_button.disabled = not _week_state.is_empty()
	var labels := {
		"setup": "Start Week %d" % _week_number,
		"briefing": "Open training plan",
		"training": "Commit training",
		"lineup": "Lock active trio",
		"strategy": "Lock strategy",
		"bout": "Lock result and enter the arena",
		"recovery": "Bout in progress",
		"news": "Close Week %d" % _week_number
	}
	_advance_button.text = "Prototype season complete" if _season_complete else labels.get(phase, "Continue")


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
	_event_log.text = "Replay ready. The locked result and event order are unchanged."
	_explanation_label.text = "The post-bout review will return at the end of this replay."
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
	var analysis := BoutAnalysisScript.summarize(_last_result, home_house, away_house)
	_explanation_label.text = "Why it happened\n%s\n%s" % [analysis["headline"], analysis["detail"]]
	if not _week_state.is_empty() and _week_state["phase"] == "recovery":
		_week_state = WeeklyCycleScript.apply_recovery(_week_state)
		_season_state = SeasonStateScript.resolve_week(_season_state, _houses, _week_number, _last_result)
		_render_standings()
		var story: Dictionary = _week_state["news"][-1]
		_explanation_label.text += "\nWeek consequence\n%s" % story["headline"]
		_status_label.text = "Recovery applied. Review the result, then close the week."
		_sync_week_controls()
	_event_log.grab_focus()


func _render_revealed_events() -> void:
	var event_lines: Array[String] = []
	for event in _revealed_events:
		event_lines.append("Round %d · %d–%d  %s" % [
			event["round"], event["home_score"], event["away_score"], event["text"]
		])
	_event_log.text = "\n".join(event_lines)


func _render_standings() -> void:
	var entries: Array[String] = []
	var place: int = 1
	for row in SeasonStateScript.table(_season_state):
		entries.append("%d. %s %d pts (%+d)" % [place, row["house_name"], row["points"], row["score_difference"]])
		place += 1
	var standings_text := "Standings · %s" % "  ·  ".join(entries)
	var objective_house_id: String = _career_house.get("id", _houses[_house_picker.selected]["id"])
	var objective := SeasonStateScript.objective_status(_season_state, objective_house_id)
	var objective_progress := "campaign not started" if objective["weeks_played"] == 0 else "currently %d of %d" % [objective["current_position"], _houses.size()]
	_standings_label.text = "%s\nObjective · %s (top %d) · %s" % [
		standings_text, objective["label"], objective["target_position"], objective_progress
	]
	_standings_label.accessibility_description = _standings_label.text


func _render_season_review() -> void:
	var review := SeasonStateScript.review(_season_state, _career_house)
	_result_heading.text = "Season review · %s" % review["champion_name"]
	_score_label.text = "%s finish %d of %d · %d wins, %d losses · %d points (%+d)" % [
		_career_house["name"], review["player_position"], review["house_count"],
		review["wins"], review["losses"], review["points"], review["score_difference"]
	]
	var objective_result := "achieved" if review["objective_achieved"] else "missed"
	_explanation_label.text = "%s\nObjective: %s — %s.\nArena standout: %s with %d exchange points." % [
		review["headline"], review["objective"], objective_result,
		review["standout_name"], review["standout_points"]
	]
	_event_log.text = "Three-week chapter complete\nThe final table, objective verdict, and standout are stored with this local career. Reset when you are ready to begin a new House story."
	_status_label.text = "Prototype season complete. Review the campaign or reset for another House."


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
	if not _career_house.is_empty() and _career_house["id"] == house_id:
		return _career_house
	for house in _houses:
		if house["id"] == house_id:
			return house
	assert(false, "Unknown House id")
	return {}


func _active_house() -> Dictionary:
	if not _week_state.is_empty():
		return _week_state["house"]
	if not _career_house.is_empty():
		return _career_house
	return _houses[_house_picker.selected]


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
