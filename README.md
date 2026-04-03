# Doodle Dice (Playable Web Prototype)

This repository now contains a **playable browser game prototype** for the Doodle Dice roguelite dicebuilder concept.

## Implemented

- Notebook-style UI with doodle-themed visuals.
- Full 3-floor run with **9 combats** (including elites and final boss).
- Core combat loop:
  - roll **5d6** each turn
  - up to **2 rerolls**
  - spend dice on abilities
  - enemy intents execute on end turn
- Starting abilities + unlockable abilities.
- Reward flow after each encounter (**2 learn options + 1 upgrade option**).
- Victory/defeat overlays and restart flow.

## Run

Because this is a static front-end app, serve it with any simple local HTTP server from repo root:

```bash
python3 -m http.server 8000
```

Then open:

- `http://localhost:8000`

## Files

- `index.html` — game layout and UI shell
- `styles.css` — notebook/sketch visual style
- `app.js` — game data, combat rules, run progression, and rendering logic

