const ui = {
  playerPanel: document.getElementById("playerPanel"),
  enemyRow: document.getElementById("enemyRow"),
  intentRow: document.getElementById("intentRow"),
  diceRow: document.getElementById("diceRow"),
  abilityRow: document.getElementById("abilityRow"),
  log: document.getElementById("log"),
  runStatus: document.getElementById("runStatus"),
  rerollsLabel: document.getElementById("rerollsLabel"),
  targetHint: document.getElementById("targetHint"),
  rollBtn: document.getElementById("rollBtn"),
  rerollBtn: document.getElementById("rerollBtn"),
  endTurnBtn: document.getElementById("endTurnBtn"),
  overlay: document.getElementById("overlay"),
};

const DOODLES = {
  "Stabby Star": "⭐",
  "Bloop Snake": "🐍",
  "Mr. Paperclip": "🖇️",
  "Homework Goblin": "👺",
  "Crooked Knight": "♞",
  Smudger: "🫠",
  "Angry Equation": "∑😡",
  "Principal Spork": "🍴",
  "Beefy Balloon Dog": "🎈🐕",
  "Shouting Cloud": "⛈️",
  "Detention Cube": "🧊",
  "King Doodle": "👑✏️",
};

const ABILITIES = {
  odd_jab: {
    name: "Odd Jab",
    req: { type: "odd", count: 1 },
    maxTier: 2,
    target: "enemy",
    desc: (tier, dice) => {
      if (tier === 0) return "Deal 1 damage.";
      if (tier === 1) return "Deal 2 damage.";
      const v = dice?.[0];
      return v === 1 || v === 5 ? "Deal 3 damage." : "Deal 2 damage.";
    },
    effect: (ctx, dice, target) => {
      const t = getTier(ctx, "odd_jab");
      const dmg = t === 0 ? 1 : t === 1 ? 2 : (dice[0] === 1 || dice[0] === 5 ? 3 : 2);
      attack(ctx, target, dmg);
    },
  },
  even_guard: {
    name: "Even Guard",
    req: { type: "even", count: 1 },
    maxTier: 2,
    target: "self",
    desc: (tier, dice) => {
      if (tier === 0) return "Gain 1 block.";
      if (tier === 1) return "Gain 2 block.";
      const v = dice?.[0];
      return v === 2 || v === 6 ? "Gain 3 block." : "Gain 2 block.";
    },
    effect: (ctx, dice) => {
      const t = getTier(ctx, "even_guard");
      const blk = t === 0 ? 1 : t === 1 ? 2 : (dice[0] === 2 || dice[0] === 6 ? 3 : 2);
      addBlock(ctx.player, blk);
    },
  },
  match_strike: {
    name: "Match Strike",
    req: { type: "pair", count: 2 },
    maxTier: 2,
    target: "enemy",
    desc: (tier) => tier < 1 ? "Deal 4 damage." : tier < 2 ? "Deal 6 damage." : "Deal 6 damage and gain 2 block.",
    effect: (ctx, _, target) => {
      const t = getTier(ctx, "match_strike");
      attack(ctx, target, t === 0 ? 4 : 6);
      if (t >= 2) addBlock(ctx.player, 2);
    },
  },
  graph_paper_wall: {
    name: "Graph Paper Wall",
    req: { type: "even", count: 1 },
    maxTier: 2,
    target: "self",
    desc: (tier, dice) => {
      const d = dice?.[0] ?? 0;
      if (tier === 0) return d === 6 ? "Gain 4 block." : "Gain 2 block (or 4 on a 6).";
      if (tier === 1) return d === 6 ? "Gain 5 block." : "Gain 3 block (or 5 on a 6).";
      return [2, 4, 6].includes(d) ? "Gain 5 block." : "Gain 3 block (or 5 on 2/4/6).";
    },
    effect: (ctx, dice) => {
      const tier = getTier(ctx, "graph_paper_wall");
      const d = dice[0];
      if (tier === 0) addBlock(ctx.player, d === 6 ? 4 : 2);
      if (tier === 1) addBlock(ctx.player, d === 6 ? 5 : 3);
      if (tier >= 2) addBlock(ctx.player, [2, 4, 6].includes(d) ? 5 : 3);
    },
  },
  pencil_poke: { name: "Pencil Poke", req: { type: "le3", count: 1 }, maxTier: 1, target: "enemy", desc: (t) => t ? "Deal 3 damage." : "Deal 2 damage.", effect: (ctx, _, target) => attack(ctx, target, getTier(ctx, "pencil_poke") ? 3 : 2) },
  margin_shield: { name: "Margin Shield", req: { type: "ge4", count: 1 }, maxTier: 1, target: "self", desc: (t) => t ? "Gain 3 block." : "Gain 2 block.", effect: (ctx) => addBlock(ctx.player, getTier(ctx, "margin_shield") ? 3 : 2) },
  eraser_bonk: { name: "Eraser Bonk", req: { type: "is6", count: 1 }, maxTier: 1, target: "enemy", desc: (t) => t ? "Deal 5 damage." : "Deal 3 damage.", effect: (ctx, _, target) => attack(ctx, target, getTier(ctx, "eraser_bonk") ? 5 : 3) },
  doodle_dodge: { name: "Doodle Dodge", req: { type: "is1", count: 1 }, maxTier: 1, target: "self", desc: (t) => t ? "Gain 5 block." : "Gain 3 block.", effect: (ctx) => addBlock(ctx.player, getTier(ctx, "doodle_dodge") ? 5 : 3) },
  twin_slam: { name: "Twin Slam", req: { type: "pair", count: 2 }, maxTier: 1, target: "enemy", desc: (t) => t ? "Deal 7 damage." : "Deal 5 damage.", effect: (ctx, _, target) => attack(ctx, target, getTier(ctx, "twin_slam") ? 7 : 5) },
  triple_threat: { name: "Triple Threat", req: { type: "triple", count: 3 }, maxTier: 1, target: "enemy", desc: (t) => t ? "Deal 12 damage." : "Deal 9 damage.", effect: (ctx, _, target) => attack(ctx, target, getTier(ctx, "triple_threat") ? 12 : 9) },
  straight_edge: {
    name: "Straight Edge",
    req: { type: "small_straight", count: 3 },
    maxTier: 1,
    target: "enemy",
    desc: (t) => t ? "Deal 5 damage and gain 5 block." : "Deal 4 damage and gain 4 block.",
    effect: (ctx, _, target) => {
      const v = getTier(ctx, "straight_edge") ? 5 : 4;
      attack(ctx, target, v);
      addBlock(ctx.player, v);
    },
  },
  lucky_scribble: {
    name: "Lucky Scribble",
    req: { type: "three_distinct", count: 3 },
    maxTier: 1,
    oncePerTurn: true,
    target: "self",
    desc: (t) => t ? "Add 1 bonus die (that die can be rerolled for free once)." : "Add 1 bonus die this turn.",
    effect: (ctx) => {
      const bonus = rollDie();
      ctx.dice.push({ value: bonus, used: false, selected: false, freeReroll: getTier(ctx, "lucky_scribble") > 0 });
      log(`Lucky Scribble adds a bonus die (${bonus}).`);
    },
  },
  dogeared_plan: {
    name: "Dog-Eared Plan",
    req: { type: "any", count: 2 },
    maxTier: 0,
    target: "self",
    desc: () => "Gain block equal to (sum of 2 dice - 4), minimum 0.",
    effect: (ctx, dice) => addBlock(ctx.player, Math.max(0, dice[0] + dice[1] - 4)),
  },
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
  { floor: 3, boss: true, enemies: [enemy("King Doodle", 50, [{ a: "attack", v: 6, l: "scribble swipe" }, { a: "attack", v: 3, h: 2, l: "loose lines" }, { a: "block", v: 8, l: "redraw" }, { a: "charge", v: 14, l: "mega margin slam" },], true)] },
];

function enemy(name, hp, intents, boss = false) {
  return { name, hp, maxHp: hp, block: 0, intents, idx: 0, pendingBonus: 0, boss, hitThisTurn: false };
}

const state = {
  runIndex: 0,
  phase: "combat",
  player: {
    hp: 24,
    maxHp: 24,
    block: 0,
    rerolls: 2,
    abilities: [owned("odd_jab"), owned("even_guard"), owned("match_strike"), owned("graph_paper_wall")],
  },
  enemies: [],
  dice: [],
  turn: { rolled: false, attackBonus: 0 },
  pendingTarget: null,
};

function owned(id) {
  return { id, tier: 0, usedThisTurn: false };
}

function startEncounter() {
  const spec = ENCOUNTERS[state.runIndex];
  state.enemies = spec.enemies.map((e) => ({ ...e }));
  state.player.block = 0;
  state.player.rerolls = 2;
  state.dice = [];
  state.turn = { rolled: false, attackBonus: 0 };
  state.pendingTarget = null;
  state.phase = "combat";
  log(`--- Floor ${spec.floor}, encounter ${state.runIndex + 1} begins ---`);
  render();
}

function rollDie() {
  return Math.floor(Math.random() * 6) + 1;
}

function rollTurn() {
  if (state.phase !== "combat" || state.turn.rolled) return;
  state.dice = Array.from({ length: 5 }, () => ({ value: rollDie(), used: false, selected: false, freeReroll: false }));
  state.turn.rolled = true;
  state.turn.attackBonus = 0;
  state.player.abilities.forEach((a) => (a.usedThisTurn = false));
  log(`Rolled dice: ${state.dice.map((d) => d.value).join(", ")}`);
  render();
}

function rerollSelected() {
  if (!state.turn.rolled || state.player.rerolls <= 0 || state.pendingTarget) return;
  let selected = state.dice.filter((d) => d.selected && !d.used);
  if (selected.length === 0) selected = state.dice.filter((d) => !d.used);
  if (selected.length === 0) return;

  selected.forEach((d) => {
    if (d.freeReroll) d.freeReroll = false;
    else d.value = rollDie();
    d.selected = false;
  });

  state.player.rerolls -= 1;
  log(`Rerolled ${selected.length} dice.`);
  render();
}

function toggleDie(index) {
  const d = state.dice[index];
  if (!d || d.used || state.pendingTarget) return;
  d.selected = !d.selected;
  render();
}

function selectedDiceIndexes() {
  return state.dice
    .map((d, i) => ({ d, i }))
    .filter(({ d }) => d.selected && !d.used)
    .map(({ i }) => i);
}

function selectedDiceValues() {
  return selectedDiceIndexes().map((i) => state.dice[i].value);
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

function canUseAbility(ability) {
  const data = ABILITIES[ability.id];
  if (!state.turn.rolled || state.pendingTarget || !data) return false;
  if (data.oncePerTurn && ability.usedThisTurn) return false;
  return requirementMet(data.req, selectedDiceValues());
}

function useAbility(id) {
  const oa = state.player.abilities.find((a) => a.id === id);
  const data = ABILITIES[id];
  if (!oa || !data || !canUseAbility(oa)) return;

  const indexes = selectedDiceIndexes();
  const vals = indexes.map((i) => state.dice[i].value);
  const living = state.enemies.filter((e) => e.hp > 0);

  if (data.target === "enemy" && living.length > 1) {
    state.pendingTarget = { oa, data, indexes, vals };
    ui.targetHint.textContent = `Pick a target for ${data.name}`;
    render();
    return;
  }

  const target = data.target === "enemy" ? living[0] : null;
  executeAbility(oa, data, indexes, vals, target);
}

function executeAbility(oa, data, indexes, vals, target) {
  data.effect(state, vals, target);

  indexes.forEach((i) => {
    state.dice[i].used = true;
    state.dice[i].selected = false;
  });

  oa.usedThisTurn = true;
  state.pendingTarget = null;
  ui.targetHint.textContent = "";
  log(`Used ${data.name} with [${vals.join(", ")}].`);

  if (allEnemiesDead()) {
    finishEncounter();
    return;
  }

  render();
}

function chooseTarget(enemyIndex) {
  if (!state.pendingTarget) return;
  const e = state.enemies[enemyIndex];
  if (!e || e.hp <= 0) return;

  const { oa, data, indexes, vals } = state.pendingTarget;
  executeAbility(oa, data, indexes, vals, e);
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
  log(`${enemy.name} takes ${hpDamage} damage (${absorbed} blocked).`);
}

function addBlock(target, value) {
  target.block += value;
  log(`${target === state.player ? "You" : target.name} gain ${value} block.`);
}

function getTier(ctx, abilityId) {
  return ctx.player.abilities.find((a) => a.id === abilityId)?.tier ?? 0;
}

function endTurn() {
  if (state.phase !== "combat" || !state.turn.rolled || state.pendingTarget) return;

  state.enemies.filter((e) => e.hp > 0).forEach((e) => {
    e.hitThisTurn = false;
    const intent = e.intents[e.idx % e.intents.length];
    e.idx += 1;

    if (intent.a === "attack") {
      const total = (intent.h || 1) * intent.v + e.pendingBonus;
      e.pendingBonus = 0;

      const absorbed = Math.min(state.player.block, total);
      state.player.block -= absorbed;
      const taken = total - absorbed;
      state.player.hp -= taken;
      if (intent.block) e.block += intent.block;

      log(`${e.name} uses ${intent.l}: ${total} incoming (${absorbed} blocked).`);
    } else if (intent.a === "block") {
      e.block += intent.v;
      log(`${e.name} uses ${intent.l}: +${intent.v} block.`);
    } else if (intent.a === "charge") {
      e.pendingBonus += intent.v;
      log(`${e.name} is charging ${intent.v}.`);
    }
  });

  state.player.block = 0;
  state.player.rerolls = 2;
  state.dice = [];
  state.turn.rolled = false;

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
  if (state.runIndex === ENCOUNTERS.length - 1) {
    showVictory();
    return;
  }
  state.phase = "reward";
  showRewards();
}

function buildRewardChoices() {
  const ownedIds = new Set(state.player.abilities.map((a) => a.id));
  const unlockPool = Object.keys(ABILITIES).filter((id) => !ownedIds.has(id));
  const upgrades = state.player.abilities.filter((a) => a.tier < ABILITIES[a.id].maxTier);
  const picks = [];

  if (state.player.abilities.length < 8) {
    for (let i = 0; i < 2; i += 1) {
      if (!unlockPool.length) break;
      const idx = Math.floor(Math.random() * unlockPool.length);
      const id = unlockPool.splice(idx, 1)[0];
      picks.push({
        title: `Learn ${ABILITIES[id].name}`,
        req: reqText(ABILITIES[id].req),
        effect: ABILITIES[id].desc(0),
        apply: () => state.player.abilities.push(owned(id)),
      });
    }
  }

  if (upgrades.length) {
    const candidate = upgrades[Math.floor(Math.random() * upgrades.length)];
    const data = ABILITIES[candidate.id];
    picks.push({
      title: `Upgrade ${data.name}`,
      req: reqText(data.req),
      effect: `Lv ${candidate.tier + 1} ➜ Lv ${candidate.tier + 2}: ${data.desc(Math.min(candidate.tier + 1, data.maxTier))}`,
      apply: () => {
        candidate.tier += 1;
      },
    });
  }

  while (picks.length < 3) {
    picks.push({
      title: "Doodle Stretch",
      req: "No cost",
      effect: "Recover 4 HP.",
      apply: () => {
        state.player.hp = Math.min(state.player.maxHp, state.player.hp + 4);
      },
    });
  }

  return picks.slice(0, 3);
}

function showRewards() {
  const choices = buildRewardChoices();
  ui.overlay.classList.remove("hidden");
  ui.overlay.innerHTML = `
    <div class="overlay-card">
      <h2>Pick a reward</h2>
      <div class="reward-grid">
        ${choices
          .map(
            (c, i) => `
          <div class="ability sketch">
            <h4>${c.title}</h4>
            <div class="meta"><strong>Cost:</strong> ${c.req}</div>
            <div class="effect"><strong>Effect:</strong> ${c.effect}</div>
            <button data-ridx="${i}">Take</button>
          </div>
        `
          )
          .join("")}
      </div>
    </div>
  `;

  [...ui.overlay.querySelectorAll("button")].forEach((btn) => {
    btn.addEventListener("click", () => {
      const pick = choices[Number(btn.dataset.ridx)];
      pick.apply();
      ui.overlay.classList.add("hidden");
      state.runIndex += 1;
      startEncounter();
    });
  });
}

function showVictory() {
  state.phase = "victory";
  ui.overlay.classList.remove("hidden");
  ui.overlay.innerHTML = `
    <div class="overlay-card">
      <h2>King Doodle defeated 🎉</h2>
      <p>You survived all 9 fights.</p>
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
      <p>Try a new run and draft smarter defenses.</p>
      <button id="restartBtn">Try Again</button>
    </div>
  `;
  document.getElementById("restartBtn").addEventListener("click", restart);
}

function restart() {
  state.runIndex = 0;
  state.phase = "combat";
  state.player.hp = 24;
  state.player.block = 0;
  state.player.rerolls = 2;
  state.player.abilities = [owned("odd_jab"), owned("even_guard"), owned("match_strike"), owned("graph_paper_wall")];
  state.dice = [];
  state.pendingTarget = null;
  ui.overlay.classList.add("hidden");
  ui.log.innerHTML = "";
  startEncounter();
}

function reqText(req) {
  const map = {
    odd: "Select one odd die",
    even: "Select one even die",
    pair: "Select a pair",
    triple: "Select a triple",
    le3: "Select one die ≤ 3",
    ge4: "Select one die ≥ 4",
    is1: "Select one die showing 1",
    is6: "Select one die showing 6",
    three_distinct: "Select 3 distinct dice",
    small_straight: "Select 3 consecutive dice",
    any: "Select any 2 dice",
  };
  return map[req.type] ?? "Pattern cost";
}

function render() {
  renderStatus();
  renderPlayer();
  renderAbilities();
  renderEnemies();
  renderIntents();
  renderDice();

  ui.rerollsLabel.textContent = `Rerolls left: ${state.player.rerolls}`;
  if (!state.pendingTarget) ui.targetHint.textContent = "";
}

function renderStatus() {
  const enc = ENCOUNTERS[state.runIndex];
  ui.runStatus.textContent = `Floor ${enc.floor} · Fight ${state.runIndex + 1}/9${enc.elite ? " · Elite" : ""}${enc.boss ? " · Boss" : ""}`;
}

function renderPlayer() {
  ui.playerPanel.innerHTML = `
    <h3>Player</h3>
    <p>HP: <span class="hp">${Math.max(state.player.hp, 0)}</span> / ${state.player.maxHp}</p>
    <p>Block: <span class="blk">${state.player.block}</span></p>
    <p>Dice per turn: <strong>5d6</strong></p>
    <p>Rerolls per turn: <strong>2</strong></p>
  `;
}

function renderAbilities() {
  const selected = selectedDiceValues();
  ui.abilityRow.innerHTML = state.player.abilities
    .map((a) => {
      const data = ABILITIES[a.id];
      const level = a.tier + 1;
      const canUse = canUseAbility(a);
      const effectText = data.desc(a.tier, selected);
      return `
        <article class="ability">
          <div class="ability-head">
            <h4>${data.name}</h4>
            <span class="level">Level ${level}</span>
          </div>
          <div class="meta"><strong>Cost:</strong> ${reqText(data.req)}</div>
          <div class="effect"><strong>Effect:</strong> ${effectText}</div>
          <button data-ability="${a.id}" ${canUse ? "" : "disabled"}>Use Ability</button>
        </article>
      `;
    })
    .join("");

  [...ui.abilityRow.querySelectorAll("button")].forEach((b) => {
    b.addEventListener("click", () => useAbility(b.dataset.ability));
  });
}

function renderEnemies() {
  ui.enemyRow.innerHTML = state.enemies
    .map((e, idx) => {
      if (e.hp <= 0) {
        return `<article class="enemy-card"><div class="enemy-art">✖</div><div class="enemy-name">${e.name}</div><div class="enemy-sub">defeated</div></article>`;
      }

      const targetable = state.pendingTarget ? "targetable" : "";
      return `
        <article class="enemy-card ${targetable}" data-target="${idx}">
          <div class="enemy-art">${DOODLES[e.name] || "?"}</div>
          <div class="enemy-name">${e.name}</div>
          <div class="enemy-sub">HP <span class="hp">${e.hp}</span> · Block <span class="blk">${e.block}</span></div>
        </article>
      `;
    })
    .join("");

  if (state.pendingTarget) {
    [...ui.enemyRow.querySelectorAll("[data-target]")].forEach((el) => {
      el.addEventListener("click", () => chooseTarget(Number(el.dataset.target)));
    });
  }
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
    .map((d, i) => `<button class="die ${d.selected ? "selected" : ""} ${d.used ? "used" : ""}" data-die="${i}">${d.value}</button>`)
    .join("");
  [...ui.diceRow.querySelectorAll("button")].forEach((el) => {
    el.addEventListener("click", () => toggleDie(Number(el.dataset.die)));
  });
}

function log(text) {
  const row = document.createElement("div");
  row.className = "log-item";
  row.textContent = text;
  ui.log.prepend(row);
}

ui.rollBtn.addEventListener("click", rollTurn);
ui.rerollBtn.addEventListener("click", rerollSelected);
ui.endTurnBtn.addEventListener("click", endTurn);

startEncounter();
