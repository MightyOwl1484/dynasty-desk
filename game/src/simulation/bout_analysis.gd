class_name BoutAnalysis
extends RefCounted

const STRATEGY_NOTES: Dictionary = {
	"balanced": "Balanced kept pressure and protection even across all three rounds.",
	"aggressive": "Aggressive created more pressure while accepting weaker protection.",
	"guarded": "Guarded traded attacking chances for stronger protection and patience.",
	"elusive": "Elusive used movement to create openings without taking maximum risk."
}


static func summarize(result: Dictionary, home_house: Dictionary, away_house: Dictionary) -> Dictionary:
	var winner_house: Dictionary = home_house if result["winner_id"] == home_house["id"] else away_house
	var winning_strategy: String = (
		str(result["home_strategy"])
		if winner_house["id"] == home_house["id"]
		else str(result["away_strategy"])
	)
	var points_by_competitor: Dictionary = {}
	var decisive_exchanges: int = 0
	var narrow_exchanges: int = 0

	for event in result["events"]:
		if event["type"] == "decisive_exchange":
			decisive_exchanges += 1
		elif event["type"] == "narrow_exchange":
			narrow_exchanges += 1
		if event["house_id"] != winner_house["id"] or str(event["competitor_id"]).is_empty():
			continue
		var competitor_id: String = str(event["competitor_id"])
		points_by_competitor[competitor_id] = int(points_by_competitor.get(competitor_id, 0)) + int(event.get("points", 1))

	var leader_id: String = ""
	var leader_name: String = ""
	var leader_points: int = -1
	for event in result["events"]:
		if event["house_id"] != winner_house["id"] or str(event["competitor_id"]).is_empty():
			continue
		var competitor_id: String = str(event["competitor_id"])
		var points: int = int(points_by_competitor.get(competitor_id, 0))
		if points > leader_points:
			leader_id = competitor_id
			leader_name = str(event["competitor_name"])
			leader_points = points
	assert(not leader_id.is_empty(), "A completed bout needs a leading competitor")

	var score_margin: int = absi(int(result["home_score"]) - int(result["away_score"]))
	return {
		"leader_id": leader_id,
		"leader_name": leader_name,
		"leader_points": leader_points,
		"winning_strategy": winning_strategy,
		"decisive_exchanges": decisive_exchanges,
		"narrow_exchanges": narrow_exchanges,
		"headline": "%s led %s with %d exchange points." % [leader_name, winner_house["name"], leader_points],
		"detail": "%s Final margin: %d. The bout contained %d decisive and %d narrow exchanges." % [
			STRATEGY_NOTES[winning_strategy], score_margin, decisive_exchanges, narrow_exchanges
		]
	}
