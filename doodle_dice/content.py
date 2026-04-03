from __future__ import annotations

from dataclasses import dataclass, field
from typing import Callable


@dataclass
class Ability:
    name: str
    requirement: str
    base_value: int
    kind: str  # attack | block | utility
    max_tier: int = 1
    tier: int = 0
    notes: str = ""

    @property
    def value(self) -> int:
        return self.base_value + self.tier


@dataclass
class Intent:
    label: str
    action: str  # attack | block | charge | charged_attack
    value: int
    hits: int = 1


@dataclass
class EnemyTemplate:
    name: str
    hp: int
    intents: list[Intent]


@dataclass
class Encounter:
    floor: int
    enemies: list[EnemyTemplate]
    elite: bool = False
    boss: bool = False


STARTING_HP = 24
DICE_PER_TURN = 5
REROLLS_PER_TURN = 2
MAX_ABILITIES = 8


ABILITY_POOL: list[Ability] = [
    Ability("Odd Jab", "odd", 1, "attack", max_tier=2),
    Ability("Even Guard", "even", 1, "block", max_tier=2),
    Ability("Match Strike", "pair", 4, "attack", max_tier=2),
    Ability("Graph Paper Wall", "even", 2, "block", max_tier=2, notes="6 grants +2 bonus block"),
    Ability("Pencil Poke", "le3", 2, "attack"),
    Ability("Margin Shield", "ge4", 2, "block"),
    Ability("Eraser Bonk", "is6", 3, "attack"),
    Ability("Doodle Dodge", "is1", 3, "block"),
    Ability("Twin Slam", "pair", 5, "attack"),
    Ability("Triple Threat", "triple", 9, "attack"),
    Ability("Straight Edge", "small_straight", 4, "utility", notes="deal + block"),
    Ability("Lucky Scribble", "three_distinct", 1, "utility", notes="bonus die"),
]


def _ints(items: list[tuple[str, str, int, int]]) -> list[Intent]:
    return [Intent(a, b, c, d) for a, b, c, d in items]


ENEMIES = {
    "Stabby Star": EnemyTemplate("Stabby Star", 8, _ints([
        ("Poke", "attack", 3, 1),
        ("Hard Poke", "attack", 4, 1),
    ])),
    "Bloop Snake": EnemyTemplate("Bloop Snake", 10, _ints([
        ("Double Bite", "attack", 2, 2),
        ("Curl Up", "block", 3, 1),
    ])),
    "Mr. Paperclip": EnemyTemplate("Mr. Paperclip", 12, _ints([
        ("Clack", "attack", 4, 1),
        ("Pose", "block", 4, 1),
    ])),
    "Homework Goblin": EnemyTemplate("Homework Goblin", 22, _ints([
        ("Swipe", "attack", 5, 1),
        ("Crinkle Guard", "block", 4, 1),
        ("Big Swing", "attack", 8, 1),
    ])),
    "Crooked Knight": EnemyTemplate("Crooked Knight", 15, _ints([
        ("Trot Slam", "attack", 5, 1),
        ("Skewed Guard", "attack", 3, 1),
    ])),
    "Smudger": EnemyTemplate("Smudger", 16, _ints([
        ("Smear", "attack", 4, 1),
        ("Thicken", "block", 5, 1),
        ("Build Up", "charge", 7, 1),
    ])),
    "Angry Equation": EnemyTemplate("Angry Equation", 14, _ints([
        ("Solve This", "attack", 2, 3),
        ("Flex", "charge", 3, 1),
    ])),
    "Principal Spork": EnemyTemplate("Principal Spork", 30, _ints([
        ("Jab Jab", "attack", 4, 2),
        ("Authority", "block", 6, 1),
        ("Lecture Pose", "charge", 4, 1),
        ("Slam", "attack", 10, 1),
    ])),
    "Beefy Balloon Dog": EnemyTemplate("Beefy Balloon Dog", 20, _ints([
        ("Bark Punch", "attack", 6, 1),
        ("Inflate", "block", 6, 1),
        ("Headbutt", "attack", 9, 1),
    ])),
    "Shouting Cloud": EnemyTemplate("Shouting Cloud", 18, _ints([
        ("Rattle Rain", "attack", 3, 2),
        ("Thunder Bark", "attack", 8, 1),
    ])),
    "Detention Cube": EnemyTemplate("Detention Cube", 24, _ints([
        ("March", "attack", 7, 1),
        ("Brace", "block", 8, 1),
        ("Charge", "charge", 12, 1),
    ])),
    "King Doodle": EnemyTemplate("King Doodle", 50, _ints([
        ("Scribble Swipe", "attack", 6, 1),
        ("Loose Lines", "attack", 3, 2),
        ("Redraw", "block", 8, 1),
        ("Mega Margin Slam", "charge", 14, 1),
    ])),
}


ENCOUNTERS: list[Encounter] = [
    Encounter(1, [ENEMIES["Stabby Star"], ENEMIES["Bloop Snake"]]),
    Encounter(1, [ENEMIES["Mr. Paperclip"]]),
    Encounter(1, [ENEMIES["Homework Goblin"]], elite=True),
    Encounter(2, [ENEMIES["Crooked Knight"]]),
    Encounter(2, [ENEMIES["Smudger"], ENEMIES["Angry Equation"]]),
    Encounter(2, [ENEMIES["Principal Spork"]], elite=True),
    Encounter(3, [ENEMIES["Beefy Balloon Dog"]]),
    Encounter(3, [ENEMIES["Shouting Cloud"], ENEMIES["Detention Cube"]]),
    Encounter(3, [ENEMIES["King Doodle"]], boss=True),
]
