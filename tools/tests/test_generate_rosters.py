import sys
import unittest
from pathlib import Path


TOOLS_DIRECTORY = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(TOOLS_DIRECTORY))

from generate_rosters import generate_league  # noqa: E402


class GenerateRostersTests(unittest.TestCase):
    def test_generation_is_deterministic(self) -> None:
        self.assertEqual(generate_league(104729), generate_league(104729))
        self.assertNotEqual(generate_league(104729), generate_league(104730))

    def test_requested_shape_and_unique_identity(self) -> None:
        league = generate_league(7, house_count=4, roster_size=6)
        self.assertEqual(len(league["houses"]), 4)
        competitors = [competitor for house in league["houses"] for competitor in house["roster"]]
        self.assertEqual(len(competitors), 24)
        self.assertEqual(len({competitor["id"] for competitor in competitors}), 24)
        self.assertEqual(len({competitor["name"] for competitor in competitors}), 24)

    def test_attributes_and_potential_stay_in_bounds(self) -> None:
        league = generate_league(22)
        for house in league["houses"]:
            for competitor in house["roster"]:
                for attribute in ("power", "agility", "guard", "technique", "resolve"):
                    self.assertGreaterEqual(competitor[attribute], 35)
                    self.assertLessEqual(competitor[attribute], 95)
                self.assertGreaterEqual(competitor["potential"], 50)
                self.assertLessEqual(competitor["potential"], 96)

    def test_invalid_sizes_fail_early(self) -> None:
        with self.assertRaises(ValueError):
            generate_league(1, house_count=1)
        with self.assertRaises(ValueError):
            generate_league(1, roster_size=2)


if __name__ == "__main__":
    unittest.main()
