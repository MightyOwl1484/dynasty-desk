class_name SeasonSchedule
extends RefCounted


static func create(houses: Array) -> Array[Dictionary]:
	assert(houses.size() >= 4 and houses.size() % 2 == 0, "A round-robin schedule needs an even number of Houses")
	var rotation: Array[String] = []
	for house in houses:
		rotation.append(str(house["id"]))

	var fixtures: Array[Dictionary] = []
	for week_index in range(rotation.size() - 1):
		for pair_index in range(rotation.size() / 2):
			var first_id: String = rotation[pair_index]
			var second_id: String = rotation[rotation.size() - 1 - pair_index]
			var reverse_home: bool = (week_index + pair_index) % 2 == 1
			var home_id: String = second_id if reverse_home else first_id
			var away_id: String = first_id if reverse_home else second_id
			fixtures.append({
				"id": "week-%d-%s-v-%s" % [week_index + 1, home_id, away_id],
				"week": week_index + 1,
				"home_house_id": home_id,
				"away_house_id": away_id
			})

		var rotating_id: String = rotation.pop_back()
		rotation.insert(1, rotating_id)
	return fixtures


static func fixture_for(schedule: Array[Dictionary], house_id: String, week_number: int) -> Dictionary:
	for fixture in schedule:
		if fixture["week"] != week_number:
			continue
		if house_id in [fixture["home_house_id"], fixture["away_house_id"]]:
			return fixture.duplicate(true)
	return {}


static func opponent_for(schedule: Array[Dictionary], house_id: String, week_number: int) -> String:
	var fixture := fixture_for(schedule, house_id, week_number)
	if fixture.is_empty():
		return ""
	return fixture["away_house_id"] if fixture["home_house_id"] == house_id else fixture["home_house_id"]
