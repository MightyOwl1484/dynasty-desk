"""Run deterministic offline balance checks against fictional Arena content.

This standard-library tool mirrors the versioned GDScript resolver for bulk analysis.
GDScript remains authoritative at runtime; the parity fixture in both test suites makes
an intentional rules change visible before a balance report can silently drift.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


TOOL_VERSION = "balance-0.1.0"
RESOLVER_VERSION = "arena-0.4.0"
MODULUS = 2_147_483_648
MULTIPLIER = 1_103_515_245
INCREMENT = 12_345
STRATEGIES = {
    "balanced": {"attack": 1.0, "defense": 1.0, "tempo": 0},
    "aggressive": {"attack": 1.10, "defense": 0.87, "tempo": 0},
    "guarded": {"attack": 0.90, "defense": 1.13, "tempo": 0},
    "elusive": {"attack": 1.04, "defense": 0.95, "tempo": 0},
}


class DeterministicRng:
    """Python equivalent of game/src/simulation/deterministic_rng.gd."""

    def __init__(self, seed: int) -> None:
        self.state = abs(seed) % MODULUS or 1

    def next_int(self) -> int:
        self.state = (MULTIPLIER * self.state + INCREMENT) % MODULUS
        return self.state

    def range_int(self, minimum: int, maximum: int) -> int:
        if maximum < minimum:
            raise ValueError("maximum must be greater than or equal to minimum")
        return minimum + self.next_int() % (maximum - minimum + 1)


def _exchange_total(
    competitor: dict[str, Any], modifiers: dict[str, float], round_number: int, rng: DeterministicRng
) -> float:
    attack = (
        competitor["power"] * 0.35
        + competitor["agility"] * 0.20
        + competitor["technique"] * 0.30
        + competitor["resolve"] * 0.15
    ) * modifiers["attack"]
    defense = (
        competitor["guard"] * 0.45
        + competitor["agility"] * 0.25
        + competitor["resolve"] * 0.30
    ) * modifiers["defense"]
    late_round_resolve = competitor["resolve"] * (round_number - 1) * 0.025
    return attack * 0.57 + defense * 0.43 + late_round_resolve + rng.range_int(-12, 12) + modifiers["tempo"]


def resolve_bout(
    home_house: dict[str, Any],
    away_house: dict[str, Any],
    seed: int,
    home_strategy: str = "balanced",
    away_strategy: str = "balanced",
) -> dict[str, Any]:
    """Resolve the score fields needed for offline analysis."""
    rng = DeterministicRng(seed)
    home_score = 0
    away_score = 0
    home_modifiers = STRATEGIES[home_strategy]
    away_modifiers = STRATEGIES[away_strategy]

    for round_number in range(1, 4):
        for position in range(3):
            home_total = _exchange_total(home_house["roster"][position], home_modifiers, round_number, rng)
            away_total = _exchange_total(away_house["roster"][position], away_modifiers, round_number, rng)
            points = 2 if abs(home_total - away_total) >= 7.5 else 1
            if home_total >= away_total:
                home_score += points
            else:
                away_score += points

    if home_score == away_score:
        home_resolve = sum(competitor["resolve"] for competitor in home_house["roster"][:3])
        away_resolve = sum(competitor["resolve"] for competitor in away_house["roster"][:3])
        if home_resolve + rng.range_int(0, 4) >= away_resolve + rng.range_int(0, 4):
            home_score += 1
        else:
            away_score += 1

    return {
        "resolver_version": RESOLVER_VERSION,
        "seed": seed,
        "home_house_id": home_house["id"],
        "away_house_id": away_house["id"],
        "home_score": home_score,
        "away_score": away_score,
        "winner_id": home_house["id"] if home_score > away_score else away_house["id"],
    }


def recommended_lineup(house: dict[str, Any], strategy: str = "balanced") -> list[dict[str, Any]]:
    """Mirror the runtime's deterministic readiness recommendation for AI analysis."""
    modifiers = STRATEGIES[strategy]

    def readiness(competitor: dict[str, Any]) -> tuple[float, str]:
        attack = (
            competitor["power"] * 0.35
            + competitor["agility"] * 0.20
            + competitor["technique"] * 0.30
            + competitor["resolve"] * 0.15
        ) * modifiers["attack"]
        defense = (
            competitor["guard"] * 0.45
            + competitor["agility"] * 0.25
            + competitor["resolve"] * 0.30
        ) * modifiers["defense"]
        condition = (
            (competitor.get("morale", 60) - 60.0) / 12.0
            - competitor.get("fatigue", 12) / 10.0
            + competitor.get("form", 0) / 3.0
        )
        return attack * 0.57 + defense * 0.43 + condition, competitor["id"]

    return sorted(house["roster"], key=lambda competitor: (-readiness(competitor)[0], readiness(competitor)[1]))[:3]


def analyze(league: dict[str, Any], samples: int = 100, seed: int = 104_729) -> dict[str, Any]:
    """Exercise every ordered House and strategy matchup and summarize win rates."""
    if samples < 1:
        raise ValueError("samples must be positive")
    houses = league["houses"]
    if len(houses) < 2:
        raise ValueError("balance analysis needs at least two Houses")
    house_records = {house["id"]: {"wins": 0, "bouts": 0} for house in houses}
    strategy_records = {strategy: {"wins": 0, "bouts": 0} for strategy in STRATEGIES}
    bout_count = 0

    for home_index, home_house in enumerate(houses):
        for away_index, away_house in enumerate(houses):
            if home_index == away_index:
                continue
            for home_strategy in STRATEGIES:
                for away_strategy in STRATEGIES:
                    for sample in range(samples):
                        bout_seed = seed + bout_count * 7_919 + sample
                        prepared_home = {**home_house, "roster": recommended_lineup(home_house, home_strategy)}
                        prepared_away = {**away_house, "roster": recommended_lineup(away_house, away_strategy)}
                        result = resolve_bout(prepared_home, prepared_away, bout_seed, home_strategy, away_strategy)
                        home_won = result["winner_id"] == home_house["id"]
                        house_records[home_house["id"]]["bouts"] += 1
                        house_records[away_house["id"]]["bouts"] += 1
                        house_records[result["winner_id"]]["wins"] += 1
                        strategy_records[home_strategy]["bouts"] += 1
                        strategy_records[away_strategy]["bouts"] += 1
                        strategy_records[home_strategy if home_won else away_strategy]["wins"] += 1
                        bout_count += 1

    house_results = _rate_rows(house_records, "house_id")
    strategy_results = _rate_rows(strategy_records, "strategy")
    house_spread = max(row["win_rate"] for row in house_results) - min(row["win_rate"] for row in house_results)
    strategy_spread = max(row["win_rate"] for row in strategy_results) - min(row["win_rate"] for row in strategy_results)
    warnings = []
    if house_spread > 0.20:
        warnings.append(f"House win-rate spread {house_spread:.3f} exceeds 0.200.")
    if strategy_spread > 0.15:
        warnings.append(f"Strategy win-rate spread {strategy_spread:.3f} exceeds 0.150.")
    return {
        "tool_version": TOOL_VERSION,
        "resolver_version": RESOLVER_VERSION,
        "samples_per_matchup": samples,
        "seed": seed,
        "bouts": bout_count,
        "house_win_rate_spread": round(house_spread, 4),
        "strategy_win_rate_spread": round(strategy_spread, 4),
        "houses": house_results,
        "strategies": strategy_results,
        "warnings": warnings,
    }


def _rate_rows(records: dict[str, dict[str, int]], key_name: str) -> list[dict[str, Any]]:
    rows = []
    for record_id, record in records.items():
        rows.append(
            {
                key_name: record_id,
                "wins": record["wins"],
                "bouts": record["bouts"],
                "win_rate": round(record["wins"] / record["bouts"], 4),
            }
        )
    return sorted(rows, key=lambda row: (-row["win_rate"], row[key_name]))


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--league", type=Path, default=Path("game/data/prototype_league.json"))
    parser.add_argument("--samples", type=int, default=100)
    parser.add_argument("--seed", type=int, default=104_729)
    parser.add_argument("--output", type=Path)
    parser.add_argument("--strict", action="store_true", help="Exit nonzero when a balance threshold is exceeded.")
    args = parser.parse_args()

    league = json.loads(args.league.read_text(encoding="utf-8"))
    report = analyze(league, args.samples, args.seed)
    rendered = json.dumps(report, indent=2) + "\n"
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(rendered, encoding="utf-8")
        print(f"Analyzed {report['bouts']} bouts at {args.output}")
    else:
        print(rendered, end="")
    if args.strict and report["warnings"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
