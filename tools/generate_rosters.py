"""Generate deterministic fictional Arena Houses using only the Python standard library."""

from __future__ import annotations

import argparse
import json
import random
import re
from pathlib import Path
from typing import Any


FIRST_NAMES = (
    "Ada", "Ari", "Bren", "Cass", "Dara", "Eli", "Fenn", "Gia", "Hale", "Ilya",
    "Jori", "Kael", "Lio", "Mara", "Niko", "Oren", "Pax", "Quin", "Rhea", "Sable",
    "Tamsin", "Uma", "Vale", "Wren", "Xara", "Yori", "Zev",
)
LAST_NAMES = (
    "Ash", "Brindle", "Cairn", "Dusk", "Ember", "Fen", "Gale", "Holt", "Ire", "Jade",
    "Kestrel", "Lark", "Morrow", "North", "Onyx", "Pike", "Quill", "Ro", "Stone", "Thorne",
    "Umber", "Venn", "Ward", "Yarrow", "Zeal",
)

HOUSE_BLUEPRINTS = (
    ("Ember Crown", "ef8354", "Patient veterans who turn resolve into late-round pressure."),
    ("Tidebreak Union", "45b7d1", "Quick technicians who create openings through movement."),
    ("Verdant Oath", "73c088", "Disciplined defenders who absorb pressure and answer together."),
    ("Gilded Jackals", "f0c75e", "Fearless attackers who chase decisive exchanges."),
    ("Nightglass", "8f80d8", "Elusive specialists who control distance and tempo."),
    ("Iron Chorus", "a9b4c2", "Balanced competitors who thrive on coordinated preparation."),
    ("Sunward Pact", "ff8f70", "High-energy prospects who improve quickly with experience."),
    ("Frostwake", "71c4e8", "Composed tacticians who punish predictable opponents."),
)

ARCHETYPES = {
    "vanguard": {"power": 13, "guard": 6, "resolve": 5},
    "duelist": {"agility": 11, "technique": 10, "power": 2},
    "sentinel": {"guard": 14, "resolve": 7, "agility": -2},
    "tactician": {"technique": 13, "agility": 5, "resolve": 4},
    "survivor": {"resolve": 14, "guard": 6, "power": 2},
}


def _slug(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def _bounded(value: int, minimum: int = 35, maximum: int = 95) -> int:
    return max(minimum, min(maximum, value))


def _competitor(rng: random.Random, house_id: str, index: int, used_names: set[str]) -> dict[str, Any]:
    while True:
        name = f"{rng.choice(FIRST_NAMES)} {rng.choice(LAST_NAMES)}"
        if name not in used_names:
            used_names.add(name)
            break

    archetype = rng.choice(tuple(ARCHETYPES))
    bonuses = ARCHETYPES[archetype]
    attributes = {
        attribute: _bounded(rng.randint(48, 78) + bonuses.get(attribute, 0))
        for attribute in ("power", "agility", "guard", "technique", "resolve")
    }
    current_rating = round(sum(attributes.values()) / len(attributes))

    return {
        "id": f"{house_id}-{index + 1:02d}-{_slug(name)}",
        "name": name,
        "age": rng.randint(18, 34),
        "archetype": archetype,
        **attributes,
        "potential": _bounded(current_rating + rng.randint(3, 18), 50, 96),
    }


def generate_league(seed: int, house_count: int = 8, roster_size: int = 10) -> dict[str, Any]:
    """Return a deterministic JSON-compatible synthetic league."""
    if not 2 <= house_count <= len(HOUSE_BLUEPRINTS):
        raise ValueError(f"house_count must be between 2 and {len(HOUSE_BLUEPRINTS)}")
    if not 3 <= roster_size <= 16:
        raise ValueError("roster_size must be between 3 and 16")

    rng = random.Random(seed)
    used_names: set[str] = set()
    houses = []

    for name, color, identity in HOUSE_BLUEPRINTS[:house_count]:
        house_id = _slug(name)
        houses.append(
            {
                "id": house_id,
                "name": name,
                "color": color,
                "identity": identity,
                "roster": [
                    _competitor(rng, house_id, index, used_names)
                    for index in range(roster_size)
                ],
            }
        )

    return {
        "schema_version": 1,
        "generator_version": "roster-0.1.0",
        "seed": seed,
        "houses": houses,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--seed", type=int, default=104729)
    parser.add_argument("--houses", type=int, default=8)
    parser.add_argument("--roster-size", type=int, default=10)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()

    payload = generate_league(args.seed, args.houses, args.roster_size)
    rendered = json.dumps(payload, indent=2) + "\n"

    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(rendered, encoding="utf-8")
        print(f"Generated {args.houses} Houses at {args.output}")
    else:
        print(rendered, end="")


if __name__ == "__main__":
    main()
