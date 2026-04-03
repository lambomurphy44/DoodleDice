# Doodle Dice Prototype

A lightweight CLI prototype for **Doodle Dice** (aka **Scribble Siege** in early naming), a roguelite dice-builder with a notebook-sketch vibe.

## What's in this repo

- `doodle_dice/content.py`: game content (abilities, enemies, encounters) encoded as data.
- `doodle_dice/engine.py`: minimal combat engine for turns, dice, and enemy intents.
- `doodle_dice/sim.py`: non-interactive run simulator that plays all 9 prototype combats.
- `run.py`: entry point.

## Prototype assumptions implemented

- 5d6 per player turn
- 2 rerolls per turn (AI rerolls low-value leftovers)
- 3 floors / 9 combats
- post-combat reward choice simulation (2 abilities + 1 upgrade option)
- no relics, no shops, no map branching

## Run

```bash
python3 run.py
```

## Notes

This code is intentionally compact and data-driven so it can be turned into a real game loop/UI later.
