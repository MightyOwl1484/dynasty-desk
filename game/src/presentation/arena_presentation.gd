class_name ArenaPresentation
extends RefCounted

enum State {
	EMPTY,
	READY,
	PLAYING,
	PAUSED,
	COMPLETE
}

var _result: Dictionary = {}
var _events: Array[Dictionary] = []
var _next_event_index: int = 0
var _state: State = State.EMPTY
var _speed: float = 1.0


func load_result(resolved_bout: Dictionary) -> void:
	assert(resolved_bout.has("events") and resolved_bout["events"] is Array, "Presentation requires result events")
	_result = resolved_bout.duplicate(true)
	_events.clear()
	for event in resolved_bout["events"]:
		_events.append(event.duplicate(true))
	_next_event_index = 0
	_state = State.READY


func play() -> void:
	assert(_state != State.EMPTY, "Load a result before playing")
	if _state == State.COMPLETE:
		replay()
	_state = State.PLAYING


func pause() -> void:
	if _state == State.PLAYING:
		_state = State.PAUSED


func replay() -> void:
	assert(_state != State.EMPTY, "Load a result before replaying")
	_next_event_index = 0
	_state = State.READY


func reveal_next() -> Dictionary:
	if _state != State.PLAYING or _next_event_index >= _events.size():
		return {}

	var event: Dictionary = _events[_next_event_index].duplicate(true)
	_next_event_index += 1
	if _next_event_index >= _events.size():
		_state = State.COMPLETE
	return event


func skip() -> Array[Dictionary]:
	assert(_state != State.EMPTY, "Load a result before skipping")
	var remaining: Array[Dictionary] = []
	while _next_event_index < _events.size():
		remaining.append(_events[_next_event_index].duplicate(true))
		_next_event_index += 1
	_state = State.COMPLETE
	return remaining


func set_speed(value: float) -> void:
	assert(value in [1.0, 2.0, 4.0], "Presentation speed must be 1x, 2x, or 4x")
	_speed = value


func event_interval_seconds() -> float:
	return 1.6 / _speed


func state() -> State:
	return _state


func is_playing() -> bool:
	return _state == State.PLAYING


func is_complete() -> bool:
	return _state == State.COMPLETE


func progress_text() -> String:
	return "%d of %d moments" % [_next_event_index, _events.size()]


func result() -> Dictionary:
	return _result.duplicate(true)
