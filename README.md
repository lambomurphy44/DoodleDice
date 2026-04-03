# Doodle Dice (Playable Web Prototype)

This repo contains a browser-playable prototype of Doodle Dice.

## Run locally

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000`.

## Current UX layout

- Left panel: ability cards (with cost + effect + level)
- Center: enlarged battle arena (enemies, intents, dice controls)
- Right panel: player stats + combat log

## Gameplay systems implemented

- 5d6 each turn and up to 2 rerolls
- 3 floors / 9 encounters, including elite fights and final boss
- Reward picks after combat (learn or upgrade)
- Single-target attacks require target selection when multiple enemies are alive

## Files

- `index.html`: page structure
- `styles.css`: notebook visual styling and layout
- `app.js`: combat + progression logic and rendering
