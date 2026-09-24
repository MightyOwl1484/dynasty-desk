class_name DeterministicRng
extends RefCounted

const MODULUS: int = 2147483648
const MULTIPLIER: int = 1103515245
const INCREMENT: int = 12345

var _state: int


func _init(seed_value: int) -> void:
	_state = abs(seed_value) % MODULUS
	if _state == 0:
		_state = 1


func next_int() -> int:
	_state = (MULTIPLIER * _state + INCREMENT) % MODULUS
	return _state


func next_float() -> float:
	return float(next_int()) / float(MODULUS - 1)


func range_int(minimum: int, maximum: int) -> int:
	assert(maximum >= minimum, "maximum must be greater than or equal to minimum")
	return minimum + (next_int() % (maximum - minimum + 1))
