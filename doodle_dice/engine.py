from __future__ import annotations

from dataclasses import dataclass
import random

from doodle_dice.content import Ability, DICE_PER_TURN, ENEMIES, MAX_ABILITIES, REROLLS_PER_TURN, STARTING_HP


@dataclass
class BattleEnemy:
    name: str
    hp: int
    max_hp: int
    block: int = 0
    intent_idx: int = 0
    pending_bonus: int = 0


@dataclass
class Player:
    hp: int = STARTING_HP
    block: int = 0
    abilities: list[Ability] | None = None

    def __post_init__(self) -> None:
        if self.abilities is None:
            from doodle_dice.content import ABILITY_POOL

            self.abilities = [ABILITY_POOL[0], ABILITY_POOL[1], ABILITY_POOL[2], ABILITY_POOL[3]]


def roll_dice(n: int = DICE_PER_TURN) -> list[int]:
    return [random.randint(1, 6) for _ in range(n)]


def find_pair(dice: list[int]) -> tuple[int, int] | None:
    counts: dict[int, list[int]] = {}
    for i, die in enumerate(dice):
        counts.setdefault(die, []).append(i)
    for indexes in counts.values():
        if len(indexes) >= 2:
            return indexes[0], indexes[1]
    return None


def choose_action(player: Player, dice: list[int], incoming_damage: int) -> tuple[str, list[int], int, str] | None:
    if not dice:
        return None

    # defend when large incoming damage expected
    if incoming_damage >= 7:
        for i, d in enumerate(dice):
            if d % 2 == 0:
                block = 2 if d == 6 else 1
                return "block", [i], block, "Even Guard"

    pair = find_pair(dice)
    if pair:
        return "attack", [pair[0], pair[1]], 4, "Match Strike"

    for i, d in enumerate(dice):
        if d % 2 == 1:
            return "attack", [i], 1, "Odd Jab"

    for i, d in enumerate(dice):
        if d % 2 == 0:
            block = 2 if d == 6 else 1
            return "block", [i], block, "Even Guard"

    return None


def _remove_indexes(dice: list[int], indexes: list[int]) -> list[int]:
    idx_set = set(indexes)
    return [d for i, d in enumerate(dice) if i not in idx_set]


def run_player_turn(player: Player, enemies: list[BattleEnemy]) -> str:
    dice = roll_dice()
    # simple reroll rule: reroll <= 2 dice two times
    for _ in range(REROLLS_PER_TURN):
        low = [i for i, d in enumerate(dice) if d <= 2]
        if not low:
            break
        for i in low:
            dice[i] = random.randint(1, 6)

    log = [f"roll={dice}"]
    while dice and any(e.hp > 0 for e in enemies):
        incoming = sum(max(0, e.pending_bonus + e_next_damage(e)) for e in enemies if e.hp > 0)
        action = choose_action(player, dice, incoming)
        if not action:
            break
        kind, indexes, value, name = action
        used = [dice[i] for i in indexes]
        dice = _remove_indexes(dice, indexes)

        if kind == "attack":
            target = next((e for e in enemies if e.hp > 0), None)
            if target is None:
                break
            dmg = max(0, value - target.block)
            target.block = max(0, target.block - value)
            target.hp -= dmg
            log.append(f"{name}({used}) -> {target.name} -{dmg}")
        else:
            player.block += value
            log.append(f"{name}({used}) -> +{value} block")

    return " | ".join(log)


def e_next_damage(enemy: BattleEnemy) -> int:
    if enemy.hp <= 0:
        return 0
    template = ENEMIES[enemy.name]
    intent = template.intents[enemy.intent_idx % len(template.intents)]
    if intent.action in {"attack", "charged_attack"}:
        return intent.value * intent.hits
    if intent.action == "charge":
        return intent.value
    return 0


def run_enemy_turn(player: Player, enemies: list[BattleEnemy]) -> str:
    logs: list[str] = []
    for enemy in enemies:
        if enemy.hp <= 0:
            continue
        t = ENEMIES[enemy.name]
        intent = t.intents[enemy.intent_idx % len(t.intents)]
        enemy.intent_idx += 1

        if intent.action == "attack":
            total = intent.value * intent.hits + enemy.pending_bonus
            enemy.pending_bonus = 0
            taken = max(0, total - player.block)
            player.block = max(0, player.block - total)
            player.hp -= taken
            logs.append(f"{enemy.name} {intent.label} for {total} ({taken} dmg)")
        elif intent.action == "block":
            enemy.block += intent.value
            logs.append(f"{enemy.name} gains {intent.value} block")
        elif intent.action == "charge":
            enemy.pending_bonus += intent.value
            logs.append(f"{enemy.name} charges +{intent.value}")

    player.block = 0
    return " | ".join(logs)


def apply_reward(player: Player) -> str:
    from doodle_dice.content import ABILITY_POOL

    owned = {a.name for a in player.abilities}
    upgradable = [a for a in player.abilities if a.tier < a.max_tier]
    unlocks = [a for a in ABILITY_POOL if a.name not in owned]

    if len(player.abilities) < MAX_ABILITIES and unlocks and random.random() < 0.66:
        picked = random.choice(unlocks)
        player.abilities.append(Ability(**picked.__dict__))
        return f"reward: learned {picked.name}"

    if upgradable:
        picked = random.choice(upgradable)
        picked.tier += 1
        return f"reward: upgraded {picked.name} to tier {picked.tier}"

    return "reward: no valid reward"
