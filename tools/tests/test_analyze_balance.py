import json
import sys
import unittest
from pathlib import Path


TOOLS_DIRECTORY = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(TOOLS_DIRECTORY))

from analyze_balance import DeterministicRng, analyze, recommended_lineup, resolve_bout  # noqa: E402


class AnalyzeBalanceTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.league = json.loads(
            (TOOLS_DIRECTORY.parent / "game" / "data" / "prototype_league.json").read_text(encoding="utf-8")
        )

    def test_rng_matches_godot_contract(self) -> None:
        rng = DeterministicRng(104729)
        self.assertEqual([rng.next_int() for _ in range(3)], [1068105182, 510585791, 365478540])

    def test_resolver_parity_fixture(self) -> None:
        result = resolve_bout(self.league["houses"][0], self.league["houses"][1], 104729, "guarded", "aggressive")
        self.assertEqual((result["winner_id"], result["home_score"], result["away_score"]), ("tidebreak-union", 3, 12))

    def test_analysis_is_deterministic_and_counts_every_matchup(self) -> None:
        first = analyze(self.league, samples=2, seed=7)
        second = analyze(self.league, samples=2, seed=7)
        self.assertEqual(first, second)
        expected_bouts = 4 * 3 * 4 * 4 * 2
        self.assertEqual(first["bouts"], expected_bouts)
        self.assertTrue(all(row["bouts"] > 0 for row in first["houses"]))
        self.assertTrue(all(0.0 <= row["win_rate"] <= 1.0 for row in first["strategies"]))

    def test_recommended_lineup_selects_three_without_mutating_roster(self) -> None:
        house = self.league["houses"][0]
        original = json.loads(json.dumps(house))
        lineup = recommended_lineup(house)
        self.assertEqual([competitor["name"] for competitor in lineup[:2]], ["Xara Gale", "Yori Ash"])
        self.assertEqual(len(lineup), 3)
        self.assertEqual(house, original)

    def test_invalid_sample_count_fails(self) -> None:
        with self.assertRaises(ValueError):
            analyze(self.league, samples=0)


if __name__ == "__main__":
    unittest.main()
