class_name OnboardingGuide
extends RefCounted

const STEPS: Array[Dictionary] = [
	{
		"title": "1. Choose your House",
		"body": "Start with the House whose identity sounds fun. A strong active trio is already recommended, and your campaign goal is to finish in the top half.",
		"focus": "house"
	},
	{
		"title": "2. Make one choice at a time",
		"body": "Use the large Continue button. Each week unlocks only the choice that matters now: training, active trio, then strategy.",
		"focus": "advance"
	},
	{
		"title": "3. Experience the bout your way",
		"body": "The result locks before presentation. Play, speed up, skip, reduce motion, or use text only; every path reveals the same outcome. Closing the week saves automatically.",
		"focus": "play"
	}
]


static func count() -> int:
	return STEPS.size()


static func step(step_index: int) -> Dictionary:
	assert(step_index >= 0 and step_index < STEPS.size(), "Tour step is out of range")
	return STEPS[step_index].duplicate(true)


static func progress_text(step_index: int) -> String:
	return "Getting started · %d of %d" % [step_index + 1, STEPS.size()]
