from __future__ import annotations

from doodle_dice.content import ENCOUNTERS
from doodle_dice.engine import BattleEnemy, Player, apply_reward, run_enemy_turn, run_player_turn


def run_simulation(seed: int = 7) -> str:
    import random

    random.seed(seed)
    player = Player()
    lines: list[str] = ["=== Doodle Dice Prototype Run ==="]

    for i, enc in enumerate(ENCOUNTERS, start=1):
        enemies = [BattleEnemy(e.name, e.hp, e.hp) for e in enc.enemies]
        lines.append(f"\nEncounter {i} (Floor {enc.floor})")

        turn = 1
        while player.hp > 0 and any(e.hp > 0 for e in enemies):
            lines.append(f"Turn {turn}: HP={player.hp}")
            lines.append("  P: " + run_player_turn(player, enemies))
            living = [f"{e.name}({max(0,e.hp)}hp/{e.block}blk)" for e in enemies if e.hp > 0]
            lines.append("  E: " + (", ".join(living) if living else "all defeated"))
            if any(e.hp > 0 for e in enemies):
                lines.append("  ET: " + run_enemy_turn(player, enemies))
            turn += 1
            if turn > 20:
                lines.append("  [safety break]")
                break

        if player.hp <= 0:
            lines.append("Run failed.")
            break

        lines.append("Win encounter.")
        lines.append(apply_reward(player))

    if player.hp > 0:
        lines.append(f"\nRun complete. Final HP={player.hp}")
        lines.append("Abilities: " + ", ".join(f"{a.name}(t{a.tier})" for a in player.abilities))

    return "\n".join(lines)
