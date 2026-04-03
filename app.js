const ui = {
  playerPanel: document.getElementById("playerPanel"),
  enemyRow: document.getElementById("enemyRow"),
  intentRow: document.getElementById("intentRow"),
  diceRow: document.getElementById("diceRow"),
  abilityRow: document.getElementById("abilityRow"),
  log: document.getElementById("log"),
  runStatus: document.getElementById("runStatus"),
  rerollsLabel: document.getElementById("rerollsLabel"),
  rollBtn: document.getElementById("rollBtn"),
  rerollBtn: document.getElementById("rerollBtn"),
  endTurnBtn: document.getElementById("endTurnBtn"),
  overlay: document.getElementById("overlay"),
};

const DOODLES = {
  "Stabby Star": "⭐",
  "Bloop Snake": "~<:◉",
  "Mr. Paperclip": "🖇️",
  "Homework Goblin": "👺",
  "Crooked Knight": "♞",
  Smudger: "☁️",
  "Angry Equation": "∑😡",
  "Principal Spork": "🍴",
  "Beefy Balloon Dog": "🎈🐕",
  "Shouting Cloud": "☁️😬",
  "Detention Cube": "🧊",
  "King Doodle": "👑✏️",
};

const ABILITIES = {
  odd_jab: { name: "Odd Jab", req: { type: "odd", count: 1 }, once: false, effect: (ctx, dice) => attack(ctx, pickEnemy(ctx), tierScale(ctx, "odd_jab", 1, 2, dice[0] === 1 || dice[0] === 5 ? 3 : 2)) },
  even_guard: { name: "Even Guard", req: { type: "even", count: 1 }, once: false, effect: (ctx, dice) => addBlock(ctx.player, tierScale(ctx, "even_guard", 1, 2, dice[0] === 2 || dice[0] === 6 ? 3 : 2)) },
  match_strike: { name: "Match Strike", req: { type: "pair", count: 2 }, once: false, effect: (ctx) => { const t = getTier(ctx, "match_strike"); const dmg = t === 0 ? 4 : 6; attack(ctx, pickEnemy(ctx), dmg); if (t >= 2) addBlock(ctx.player, 2); } },
  graph_paper_wall: { name: "Graph Paper Wall", req: { type: "even", count: 1 }, once: false, effect: (ctx, dice) => {
    const tier = getTier(ctx, "graph_paper_wall");
    const d = dice[0];
    if (tier === 0) addBlock(ctx.player, d === 6 ? 4 : 2);
    if (tier === 1) addBlock(ctx.player, d === 6 ? 5 : 3);
    if (tier >= 2) addBlock(ctx.player, [2, 4, 6].includes(d) ? 5 : 3);
  } },
  pencil_poke: { name: "Pencil Poke", req: { type: "le3", count: 1 }, effect: (ctx) => attack(ctx, pickEnemy(ctx), tierScale(ctx, "pencil_poke", 2, 3, 3)) },
  margin_shield: { name: "Margin Shield", req: { type: "ge4", count: 1 }, effect: (ctx) => addBlock(ctx.player, tierScale(ctx, "margin_shield", 2, 3, 3)) },
  eraser_bonk: { name: "Eraser Bonk", req: { type: "is6", count: 1 }, effect: (ctx) => attack(ctx, pickEnemy(ctx), tierScale(ctx, "eraser_bonk", 3, 5, 5)) },
  doodle_dodge: { name: "Doodle Dodge", req: { type: "is1", count: 1 }, effect: (ctx) => addBlock(ctx.player, tierScale(ctx, "doodle_dodge", 3, 5, 5)) },
  twin_slam: { name: "Twin Slam", req: { type: "pair", count: 2 }, effect: (ctx) => attack(ctx, pickEnemy(ctx), tierScale(ctx, "twin_slam", 5, 7, 7)) },
  triple_threat: { name: "Triple Threat", req: { type: "triple", count: 3 }, effect: (ctx) => attack(ctx, pickEnemy(ctx), tierScale(ctx, "triple_threat", 9, 12, 12)) },
  straight_edge: { name: "Straight Edge", req: { type: "small_straight", count: 3 }, effect: (ctx) => {
    const v = tierScale(ctx, "straight_edge", 4, 5, 5);
    attack(ctx, pickEnemy(ctx), v);
    addBlock(ctx.player, v);
  } },
  lucky_scribble: { name: "Lucky Scribble", req: { type: "three_distinct", count: 3 }, once: true, effect: (ctx) => {
    const bonus = rollDie();
    ctx.dice.push({ value: bonus, used: false, selected: false, freeReroll: getTier(ctx, "lucky_scribble") > 0 });
    log(`Lucky Scribble adds a bonus die (${bonus}).`);
  } },
  dogeared_plan: { name: "Dog-Eared Plan", req: { type: "any", count: 2 }, once: false, effect: (ctx, dice) => addBlock(ctx.player, Math.max(0, dice[0] + dice[1] - 4)) },
  panic_scribble: { name: "Panic Scribble", req: { type: "chance3", count: 3 }, once: true, effect: (ctx, dice) => attack(ctx, pickEnemy(ctx), Math.floor((dice[0] + dice[1] + dice[2]) / 2)) },
  corner_fold: { name: "Corner Fold", req: { type: "large_straight", count: 4 }, once: true, effect: (ctx) => { ctx.turn.attackBonus += 3; log("Corner Fold primed +3 attack for next hit."); } },
  red_pen: { name: "Red Pen", req: { type: "odd", count: 1 }, once: false, effect: (ctx) => { attack(ctx, pickEnemy(ctx), 1); attack(ctx, pickEnemy(ctx), 1); } },
};

const ENCOUNTERS = [
  { floor: 1, enemies: [enemy("Stabby Star", 8, [{ a: "attack", v: 3, l: "poke" }, { a: "attack", v: 4, l: "poke harder" }]), enemy("Bloop Snake", 10, [{ a: "attack", v: 2, h: 2, l: "double bite" }, { a: "block", v: 3, l: "curl up" }])] },
  { floor: 1, enemies: [enemy("Mr. Paperclip", 12, [{ a: "attack", v: 4, l: "clip clack" }, { a: "block", v: 4, l: "posture" }])] },
  { floor: 1, elite: true, enemies: [enemy("Homework Goblin", 22, [{ a: "attack", v: 5, l: "swipe" }, { a: "block", v: 4, l: "paper shield" }, { a: "attack", v: 8, l: "big swing" }])] },
  { floor: 2, enemies: [enemy("Crooked Knight", 15, [{ a: "attack", v: 5, l: "hoof slam" }, { a: "attack", v: 3, l: "jagged jab", block: 2 }])] },
  { floor: 2, enemies: [enemy("Smudger", 16, [{ a: "attack", v: 4, l: "smear" }, { a: "block", v: 5, l: "thicken" }, { a: "charge", v: 7, l: "smear up" }]), enemy("Angry Equation", 14, [{ a: "attack", v: 2, h: 3, l: "math fists" }, { a: "charge", v: 3, l: "flex" }])] },
  { floor: 2, elite: true, enemies: [enemy("Principal Spork", 30, [{ a: "attack", v: 4, h: 2, l: "jab jab" }, { a: "block", v: 6, l: "strict stance" }, { a: "charge", v: 4, l: "lecture pose" }, { a: "attack", v: 10, l: "slam" }])] },
  { floor: 3, enemies: [enemy("Beefy Balloon Dog", 20, [{ a: "attack", v: 6, l: "bark punch" }, { a: "block", v: 6, l: "inflate" }, { a: "attack", v: 9, l: "headbutt" }])] },
  { floor: 3, enemies: [enemy("Shouting Cloud", 18, [{ a: "attack", v: 3, h: 2, l: "rain rattle" }, { a: "attack", v: 8, l: "thunder bark" }]), enemy("Detention Cube", 24, [{ a: "attack", v: 7, l: "march" }, { a: "block", v: 8, l: "brace" }, { a: "charge", v: 12, l: "charge up" }])] },
  { floor: 3, boss: true, enemies: [enemy("King Doodle", 50, [{ a: "attack", v: 6, l: "scribble swipe" }, { a: "attack", v: 3, h: 2, l: "loose lines" }, { a: "block", v: 8, l: "redraw" }, { a: "charge", v: 14, l: "mega margin slam" }], true)] },
];

function enemy(name, hp, intents, boss = false) {
  return { name, hp, maxHp: hp, block: 0, intents, idx: 0, pendingBonus: 0, boss };
}

const state = {
  runIndex: 0,
  phase: "combat",
  player: { hp: 24, maxHp: 24, block: 0, rerolls: 2, abilities: [
    owned("odd_jab", 2),
    owned("even_guard", 2),
    owned("match_strike", 2),
    owned("graph_paper_wall", 2),
  ] },
  enemies: [],
  dice: [],
  turn: { rolled: false, attackBonus: 0, used: new Set() },
};

function owned(id, maxTier = 1) {
  return { id, tier: 0, maxTier, usedThisTurn: false };
}

function startEncounter() {
  const spec = ENCOUNTERS[state.runIndex];
  state.enemies = spec.enemies.map((e) => ({ ...e }));
  state.player.block = 0;
  state.player.rerolls = 2;
  state.dice = [];
  state.turn = { rolled: false, attackBonus: 0, used: new Set() };
  state.phase = "combat";
  log(`--- Floor ${spec.floor} encounter ${state.runIndex + 1} begins ---`);
  render();
}

function rollDie() {
  return Math.floor(Math.random() * 6) + 1;
}

function rollTurn() {
  if (state.turn.rolled || state.phase !== "combat") return;
  state.dice = Array.from({ length: 5 }, () => ({ value: rollDie(), used: false, selected: false, freeReroll: false }));
  state.turn.rolled = true;
  state.turn.attackBonus = 0;
  state.player.abilities.forEach((a) => (a.usedThisTurn = false));
  log(`Rolled dice: ${state.dice.map((d) => d.value).join(", ")}`);
  render();
}

function rerollSelected() {
  if (!state.turn.rolled || state.player.rerolls <= 0) return;
  let selected = state.dice.filter((d) => d.selected && !d.used);
  if (selected.length === 0) selected = state.dice.filter((d) => !d.used);
  if (selected.length === 0) return;

  selected.forEach((d) => {
    if (d.freeReroll) {
      d.freeReroll = false;
    } else {
      d.value = rollDie();
    }
    d.selected = false;
  });

  state.player.rerolls -= 1;
  log(`Rerolled ${selected.length} die/dice.`);
  render();
}

function toggleDie(index) {
  const die = state.dice[index];
  if (!die || die.used) return;
  die.selected = !die.selected;
  render();
}

function selectedDiceValues() {
  return state.dice.filter((d) => d.selected && !d.used).map((d) => d.value);
}

function selectedDiceIndexes() {
  return state.dice
    .map((d, i) => ({ d, i }))
    .filter(({ d }) => d.selected && !d.used)
    .map(({ i }) => i);
}

function canUseAbility(ownedAbility) {
  const data = ABILITIES[ownedAbility.id];
  if (!data || !state.turn.rolled) return false;
  if (data.once && ownedAbility.usedThisTurn) return false;
  const picked = selectedDiceValues();
  return requirementMet(data.req, picked);
}

function requirementMet(req, vals) {
  if (vals.length < req.count) return false;
  if (req.type === "any") return vals.length >= req.count;
  if (req.type === "odd") return vals.length === req.count && vals.every((v) => v % 2 === 1);
  if (req.type === "even") return vals.length === req.count && vals.every((v) => v % 2 === 0);
  if (req.type === "is1") return vals.length === 1 && vals[0] === 1;
  if (req.type === "is6") return vals.length === 1 && vals[0] === 6;
  if (req.type === "le3") return vals.length === 1 && vals[0] <= 3;
  if (req.type === "ge4") return vals.length === 1 && vals[0] >= 4;
  if (req.type === "pair") return vals.length === 2 && vals[0] === vals[1];
  if (req.type === "triple") return vals.length === 3 && vals.every((v) => v === vals[0]);
  if (req.type === "three_distinct") return vals.length === 3 && new Set(vals).size === 3;
  if (req.type === "small_straight") return vals.length === 3 && isStraight(vals, 3);
  if (req.type === "large_straight") return vals.length === 4 && isStraight(vals, 4);
  if (req.type === "chance3") return vals.length === 3;
  return false;
}

function isStraight(vals, len) {
  const s = [...new Set(vals)].sort((a, b) => a - b);
  if (s.length !== len) return false;
  for (let i = 1; i < s.length; i += 1) {
    if (s[i] - s[i - 1] !== 1) return false;
  }
  return true;
}

function useAbility(id) {
  const oa = state.player.abilities.find((a) => a.id === id);
  const data = ABILITIES[id];
  if (!oa || !data || !canUseAbility(oa)) return;

  const indexes = selectedDiceIndexes();
  const vals = indexes.map((i) => state.dice[i].value);

  data.effect(state, vals);
  indexes.forEach((i) => {
    state.dice[i].used = true;
    state.dice[i].selected = false;
  });

  oa.usedThisTurn = true;
  log(`Used ${data.name} with [${vals.join(", ")}].`);

  if (allEnemiesDead()) {
    finishEncounter();
    return;
  }
  render();
}

function attack(ctx, enemy, amount) {
  if (!enemy) return;
  let dmg = amount + ctx.turn.attackBonus;
  ctx.turn.attackBonus = 0;

  if (enemy.name === "King Doodle" && !enemy.hitThisTurn) {
    dmg = Math.max(0, dmg - 1);
    enemy.hitThisTurn = true;
  }

  const absorbed = Math.min(enemy.block, dmg);
  enemy.block -= absorbed;
  const hpDamage = Math.max(0, dmg - absorbed);
  enemy.hp -= hpDamage;
  log(`${enemy.name} takes ${hpDamage} dmg (${absorbed} blocked).`);
}

function addBlock(target, value) {
  target.block += value;
  log(`${target === state.player ? "You" : target.name} gain ${value} block.`);
}

function getTier(ctx, abilityId) {
  return ctx.player.abilities.find((a) => a.id === abilityId)?.tier ?? 0;
}

function tierScale(ctx, abilityId, base, up1, up2) {
  const t = getTier(ctx, abilityId);
  if (t <= 0) return base;
  if (t === 1) return up1;
  return up2;
}

function pickEnemy(ctx) {
  return ctx.enemies.find((e) => e.hp > 0);
}

function endTurn() {
  if (state.phase !== "combat" || !state.turn.rolled) return;
  const living = state.enemies.filter((e) => e.hp > 0);

  living.forEach((e) => {
    e.hitThisTurn = false;
    const intent = e.intents[e.idx % e.intents.length];
    e.idx += 1;
    if (intent.a === "attack") {
      const hits = intent.h || 1;
      const total = hits * intent.v + e.pendingBonus;
      e.pendingBonus = 0;
      let remaining = total;
      const absorbed = Math.min(state.player.block, remaining);
      state.player.block -= absorbed;
      remaining -= absorbed;
      state.player.hp -= remaining;
      if (intent.block) e.block += intent.block;
      log(`${e.name} uses ${intent.l}: ${total} incoming (${absorbed} blocked).`);
    } else if (intent.a === "block") {
      e.block += intent.v;
      log(`${e.name} uses ${intent.l}: +${intent.v} block.`);
    } else if (intent.a === "charge") {
      e.pendingBonus += intent.v;
      log(`${e.name} is charging (${intent.v})...`);
    }
  });

  state.player.block = 0;
  state.player.rerolls = 2;
  state.turn.rolled = false;
  state.dice = [];

  if (state.player.hp <= 0) {
    showDefeat();
    return;
  }
  render();
}

function allEnemiesDead() {
  return state.enemies.every((e) => e.hp <= 0);
}

function finishEncounter() {
  log(`Encounter ${state.runIndex + 1} cleared.`);
  if (state.runIndex === ENCOUNTERS.length - 1) {
    showVictory();
    return;
  }
  state.phase = "reward";
  showRewards();
}

function showRewards() {
  const choices = buildRewardChoices();
  ui.overlay.classList.remove("hidden");
  ui.overlay.innerHTML = `
    <div class="overlay-card">
      <h2>Pick a trick</h2>
      <p>Choose one reward after combat.</p>
      <div class="reward-grid">
        ${choices
          .map((c, i) => `
            <div class="ability sketch">
              <strong>${c.title}</strong>
              <small>${c.detail}</small>
              <button data-ridx="${i}">Take this</button>
            </div>
          `)
          .join("")}
      </div>
    </div>
  `;

  [...ui.overlay.querySelectorAll("button")].forEach((btn) => {
    btn.addEventListener("click", () => {
      const picked = choices[Number(btn.dataset.ridx)];
      picked.apply();
      ui.overlay.classList.add("hidden");
      state.runIndex += 1;
      startEncounter();
    });
  });
}

function buildRewardChoices() {
  const ownedIds = new Set(state.player.abilities.map((a) => a.id));
  const unlockPool = Object.keys(ABILITIES).filter((id) => !ownedIds.has(id));
  const upPool = state.player.abilities.filter((a) => a.tier < a.maxTier);
  const picks = [];

  if (state.player.abilities.length < 8 && unlockPool.length > 0) {
    for (let i = 0; i < 2; i += 1) {
      const idx = Math.floor(Math.random() * unlockPool.length);
      const id = unlockPool.splice(idx, 1)[0];
      if (!id) continue;
      picks.push({ title: `Learn ${ABILITIES[id].name}`, detail: describeReq(ABILITIES[id].req), apply: () => state.player.abilities.push(owned(id, 1)) });
    }
  }

  if (upPool.length > 0) {
    const candidate = upPool[Math.floor(Math.random() * upPool.length)];
    picks.push({ title: `Upgrade ${ABILITIES[candidate.id].name}`, detail: `Tier ${candidate.tier} → ${candidate.tier + 1}`, apply: () => { candidate.tier += 1; } });
  }

  while (picks.length < 3) {
    picks.push({ title: "Doodle Stretch", detail: "Recover 4 HP", apply: () => { state.player.hp = Math.min(state.player.maxHp, state.player.hp + 4); } });
  }

  return picks.slice(0, 3);
}

function describeReq(req) {
  const map = {
    odd: "Use one odd die",
    even: "Use one even die",
    pair: "Use a pair",
    triple: "Use a triple",
    le3: "Use a die of 3 or less",
    ge4: "Use a die of 4+",
    is1: "Use a 1",
    is6: "Use a 6",
    three_distinct: "Use 3 distinct dice",
    small_straight: "Use a small straight",
    large_straight: "Use a large straight",
    chance3: "Use exactly 3 dice",
    any: "Use any two dice",
  };
  return map[req.type] || "Pattern requirement";
}

function showVictory() {
  state.phase = "victory";
  ui.overlay.classList.remove("hidden");
  ui.overlay.innerHTML = `
    <div class="overlay-card">
      <h2>You beat King Doodle 🎉</h2>
      <p>The notebook survived. Barely.</p>
      <button id="restartBtn">Start New Run</button>
    </div>
  `;
  document.getElementById("restartBtn").addEventListener("click", restart);
}

function showDefeat() {
  state.phase = "defeat";
  ui.overlay.classList.remove("hidden");
  ui.overlay.innerHTML = `
    <div class="overlay-card">
      <h2>You got doodled on 💥</h2>
      <p>Run ended before the final bell.</p>
      <button id="restartBtn">Try Again</button>
    </div>
  `;
  document.getElementById("restartBtn").addEventListener("click", restart);
}

function restart() {
  state.runIndex = 0;
  state.player.hp = 24;
  state.player.block = 0;
  state.player.abilities = [owned("odd_jab", 2), owned("even_guard", 2), owned("match_strike", 2), owned("graph_paper_wall", 2)];
  ui.overlay.classList.add("hidden");
  ui.log.innerHTML = "";
  startEncounter();
}

function render() {
  renderStatus();
  renderPlayer();
  renderEnemies();
  renderIntents();
  renderDice();
  renderAbilities();
  ui.rerollsLabel.textContent = `Rerolls: ${state.player.rerolls}`;
}

function renderStatus() {
  const enc = ENCOUNTERS[state.runIndex];
  ui.runStatus.textContent = `Floor ${enc.floor} · Fight ${state.runIndex + 1}/9${enc.elite ? " · Elite" : ""}${enc.boss ? " · Boss" : ""}`;
}

function renderPlayer() {
  ui.playerPanel.innerHTML = `
    <h3>Player</h3>
    <p>HP: <span class="hp">${Math.max(0, state.player.hp)}</span> / ${state.player.maxHp}</p>
    <p>Block: <span class="blk">${state.player.block}</span></p>
    <p>Dice: 5d6</p>
    <p>Rerolls/turn: 2</p>
    <hr />
    <h4>Build</h4>
    ${state.player.abilities
      .map((a) => `<div>${ABILITIES[a.id].name} <small>(tier ${a.tier})</small></div>`)
      .join("")}
  `;
}

function renderEnemies() {
  ui.enemyRow.innerHTML = state.enemies
    .map((e) => {
      if (e.hp <= 0) return `<div class="enemy-card"><div class="enemy-art">✖</div><div class="enemy-name">${e.name}</div><small>defeated</small></div>`;
      return `
        <div class="enemy-card">
          <div class="enemy-art">${DOODLES[e.name] || "?"}</div>
          <div class="enemy-name">${e.name}</div>
          <small>HP: <span class="hp">${e.hp}</span> · Block: <span class="blk">${e.block}</span></small>
        </div>
      `;
    })
    .join("");
}

function renderIntents() {
  ui.intentRow.innerHTML = state.enemies
    .filter((e) => e.hp > 0)
    .map((e) => {
      const i = e.intents[e.idx % e.intents.length];
      if (i.a === "attack") return `<div class="intent-pill">${e.name}: ${i.l} (${(i.h || 1) * i.v + e.pendingBonus})</div>`;
      if (i.a === "block") return `<div class="intent-pill">${e.name}: ${i.l} (+${i.v} block)</div>`;
      return `<div class="intent-pill">${e.name}: ${i.l} (charging ${i.v})</div>`;
    })
    .join("");
}

function renderDice() {
  ui.diceRow.innerHTML = state.dice
    .map((d, idx) => `<button class="die ${d.selected ? "selected" : ""} ${d.used ? "used" : ""}" data-die="${idx}">${d.value}</button>`)
    .join("");
  [...ui.diceRow.querySelectorAll("button")].forEach((b) => b.addEventListener("click", () => toggleDie(Number(b.dataset.die))));
}

function renderAbilities() {
  ui.abilityRow.innerHTML = state.player.abilities
    .map((oa) => {
      const data = ABILITIES[oa.id];
      const canUse = canUseAbility(oa);
      return `
        <div class="ability">
          <strong>${data.name}</strong>
          <small>${describeReq(data.req)} · tier ${oa.tier}</small>
          <button data-ability="${oa.id}" ${canUse ? "" : "disabled"}>Use</button>
        </div>
      `;
    })
    .join("");
  [...ui.abilityRow.querySelectorAll("button")].forEach((b) => b.addEventListener("click", () => useAbility(b.dataset.ability)));
}

function log(text) {
  const item = document.createElement("div");
  item.className = "log-item";
  item.textContent = text;
  ui.log.prepend(item);
}

ui.rollBtn.addEventListener("click", rollTurn);
ui.rerollBtn.addEventListener("click", rerollSelected);
ui.endTurnBtn.addEventListener("click", endTurn);

startEncounter();
