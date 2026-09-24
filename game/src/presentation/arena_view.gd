class_name ArenaView
extends Control

const HOME_COLOR := Color("ef8354")
const AWAY_COLOR := Color("45b7d1")
const ARENA_COLOR := Color("18263b")
const LINE_COLOR := Color("5c6d84")
const TEXT_COLOR := Color("f5f7fb")

var _home_house: Dictionary = {}
var _away_house: Dictionary = {}
var _active_house_id: String = ""
var _active_competitor_id: String = ""
var _event_progress: float = 0.0
var _active_tween: Tween


func _ready() -> void:
	custom_minimum_size = Vector2(0, 260)
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	accessibility_name = "Arena presentation. No moments have played."


func configure(home_house: Dictionary, away_house: Dictionary) -> void:
	_home_house = home_house.duplicate(true)
	_away_house = away_house.duplicate(true)
	reset_view()


func reset_view() -> void:
	if _active_tween and _active_tween.is_valid():
		_active_tween.kill()
	_active_house_id = ""
	_active_competitor_id = ""
	_event_progress = 0.0
	accessibility_name = "Arena presentation ready. Use the commentary log for a text equivalent."
	queue_redraw()


func show_event(event: Dictionary, animate: bool = true) -> void:
	if _active_tween and _active_tween.is_valid():
		_active_tween.kill()
	_active_house_id = str(event.get("house_id", ""))
	_active_competitor_id = str(event.get("competitor_id", ""))
	accessibility_name = "Arena moment: %s" % str(event.get("text", ""))
	if animate:
		_event_progress = 0.0
		_active_tween = create_tween()
		_active_tween.tween_method(_set_event_progress, 0.0, 1.0, 0.75)
	else:
		_event_progress = 0.5
		queue_redraw()


func _set_event_progress(value: float) -> void:
	_event_progress = value
	queue_redraw()


func _draw() -> void:
	var arena_rect := Rect2(Vector2(8, 8), size - Vector2(16, 16))
	draw_style_box(_arena_style(), arena_rect)
	var center_x := size.x * 0.5
	draw_line(Vector2(center_x, 24), Vector2(center_x, size.y - 24), LINE_COLOR, 2.0)
	draw_circle(Vector2(center_x, size.y * 0.5), minf(size.x, size.y) * 0.13, Color.TRANSPARENT, false, 2.0, true)

	_draw_house(_home_house, true, HOME_COLOR)
	_draw_house(_away_house, false, AWAY_COLOR)


func _draw_house(house: Dictionary, is_home: bool, color: Color) -> void:
	if house.is_empty():
		return
	var roster: Array = house.get("roster", [])
	var base_x := size.x * (0.27 if is_home else 0.73)
	for index in range(mini(roster.size(), 3)):
		var competitor: Dictionary = roster[index]
		var y := size.y * (0.28 + float(index) * 0.22)
		var is_active: bool = str(competitor.get("id", "")) == _active_competitor_id
		var direction := 1.0 if is_home else -1.0
		var movement := sin(_event_progress * PI) * 54.0 * direction if is_active else 0.0
		var marker_position := Vector2(base_x + movement, y)
		var radius := 19.0 if is_active else 14.0
		draw_circle(marker_position, radius + 4.0, Color("f5f7fb") if is_active else Color("26374e"))
		draw_circle(marker_position, radius, color)
		var initials := _initials(str(competitor.get("name", "?")))
		draw_string(ThemeDB.fallback_font, marker_position + Vector2(-10, 6), initials, HORIZONTAL_ALIGNMENT_LEFT, -1, 14, TEXT_COLOR)


func _arena_style() -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = ARENA_COLOR
	style.border_color = LINE_COLOR
	style.set_border_width_all(2)
	style.set_corner_radius_all(28)
	return style


func _initials(competitor_name: String) -> String:
	var parts := competitor_name.split(" ", false)
	var initials := ""
	for part in parts.slice(0, 2):
		initials += part.left(1).to_upper()
	return initials
