const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function loadGame(savedPacing = null) {
  const screen = { innerHTML: "", querySelectorAll: () => [], querySelector: () => null, addEventListener: () => {}, insertAdjacentHTML: () => {} };
  const button = { hidden: false, disabled: false, addEventListener: () => {} };
  const storage = new Map();
  if (savedPacing) storage.set("dungeon-simulation-combat-pacing-v1", savedPacing);
  const context = {
    document: { querySelector: selector => selector === "#game-screen" ? screen : button, querySelectorAll: () => [] },
    window: { LEADERBOARD_API: "", setTimeout, matchMedia: () => ({ matches: false }) },
    localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) },
    confirm: () => true,
    Math: Object.assign(Object.create(Math), { random: () => 0.5 })
  };
  vm.createContext(context);
  for (const file of ["game-index-data.js", "weapon-attack-data.js", "game-rules.js", "script.js"]) {
    vm.runInContext(fs.readFileSync(file, "utf8"), context);
  }
  vm.runInContext("render = () => {}; save = () => {};", context);
  return context;
}

function makeEnemy(name, damage = 0) {
  return {
    name, hp: 100, maxHp: 100, damage, dodge: 0, critChance: 0, gold: 1, xp: 1,
    damageReduction: 0, intent: { key: damage ? "attack" : "guard", label: damage ? "Strike" : "Guard" }
  };
}

function makeState(enemies) {
  return {
    name: "Tester", floor: 1, level: 1, xp: 0, skillPoints: 0, hp: 100, maxHp: 100,
    mana: 50, maxMana: 50, gold: 0, str: 10, dex: 10, con: 10, int: 10, wis: 10,
    cha: 10, speed: 10, critChance: 0, class: "warrior", chosenClass: "warrior",
    weapon: { name: "Test Sword", type: "Sword", damage: 5, crit: 0, attacks: [] },
    weapons: [], armor: [], items: [], equippedArmor: {}, attackCooldowns: {},
    defenseCooldowns: { aegis: 0, block: 0, dodge: 0 },
    currentFloor: { rooms: [{ id: "r0", type: "enemy", enemyCount: enemies.length, cleared: false }], currentId: "r0" },
    runStats: { enemiesDefeated: 0, damageDealt: 0, damageTaken: 0, fights: [] },
    combat: { boss: false, enemies, damageDealt: 0, damageTaken: 0, summonedCount: 0 },
    target: 0, log: []
  };
}

test("player action applies at impact and rejects repeated input during wind-up", async () => {
  const context = loadGame();
  vm.runInContext("state = " + JSON.stringify(makeState([makeEnemy("Target")])) + "; combatPacing = 'fast';", context);
  vm.runInContext("combatAction('basic'); combatAction('basic');", context);
  assert.equal(vm.runInContext("state.combat.enemies[0].hp", context), 100);
  assert.equal(vm.runInContext("combatResolution.phase", context), "player-windup");
  await new Promise(resolve => setTimeout(resolve, 250));
  assert.equal(vm.runInContext("state.combat.enemies[0].hp", context), 100);
  await new Promise(resolve => setTimeout(resolve, 550));
  assert.ok(vm.runInContext("state.combat.enemies[0].hp", context) < 100);
});

test("warriors and mages get distinct attack overlays while archers keep the existing feedback", () => {
  const context = loadGame();
  for (const [playerClass, action, expected] of [["warrior", "basic", "<i></i><i></i>"], ["warrior", "heavy", "single"], ["mage", "basic", "#a7a7a1"], ["archer", "basic", ""]]) {
    vm.runInContext(`state = { class: '${playerClass}', target: 0, weapon: { attacks: [] } }; combatResolution = { phase: 'player-impact', action: '${action}' };`, context);
    const markup = vm.runInContext("renderPlayerAttackVfx(0)", context);
    if (expected) assert.ok(markup.includes(expected), `${playerClass} overlay should include ${expected}`);
    else assert.equal(markup, "", "archer overlay should remain unchanged");
    assert.ok(!markup.includes("sword-blade") && !markup.includes("<svg"), "warrior attack art should only contain slash lines, without weapon models");
  }
  vm.runInContext("state = { class: 'mage', target: 0, weapon: { attacks: [{ command: 'burn', effect: 'Burn' }] } }; combatResolution = { phase: 'player-impact', action: 'burn' };", context);
  assert.ok(vm.runInContext("renderPlayerAttackVfx(0)", context).includes("--attack-color:#f06436"));
  vm.runInContext("state = { class: 'warrior', target: 0, weapon: { attacks: [{ command: 'ember-spell', spell: true, effect: 'Burn' }] } }; combatResolution = { phase: 'player-impact', action: 'ember-spell' };", context);
  assert.ok(vm.runInContext("renderPlayerAttackVfx(0)", context).includes("mage-attack-vfx"), "class spells use the spell flash even for a warrior");
});

test("misses put attack slashes under the enemy and blocks put a shield under the attack", () => {
  const context = loadGame();
  vm.runInContext("state = { class: 'warrior', weapon: { attacks: [] } }; combatFeedbacks = [{ kind: 'miss', targetIndex: 0, action: 'basic', createdAt: Date.now() }];", context);
  let markup = vm.runInContext("renderCombatOutcome(0)", context);
  assert.match(markup, /outcome-miss/);
  assert.match(markup, /Miss!/);
  assert.match(markup, /outcome-delay/);
  vm.runInContext("combatFeedbacks = [{ kind: 'blocked', targetIndex: 0, action: 'basic', createdAt: Date.now() }];", context);
  markup = vm.runInContext("renderCombatOutcome(0)", context);
  assert.match(markup, /outcome-shield/);
  assert.match(markup, /blocked-slashes/);
  vm.runInContext("combatFeedbacks = [{ kind: 'miss', targetIndex: 0, action: 'heavy', createdAt: Date.now() }];", context);
  markup = vm.runInContext("renderCombatOutcome(0)", context);
  assert.match(markup, /outcome-slashes single/);
  assert.equal((markup.match(/<i><\/i>/g) || []).length, 1, "heavy attack misses should show one slash");
  vm.runInContext("combatFeedbacks = [{ kind: 'blocked', targetIndex: 0, action: 'heavy', createdAt: Date.now() }];", context);
  markup = vm.runInContext("renderCombatOutcome(0)", context);
  assert.match(markup, /blocked-slashes single/);
  assert.equal((markup.match(/<i><\/i>/g) || []).length, 1, "heavy attack blocks should show one slash");
  vm.runInContext("state.class = 'mage';", context);
  markup = vm.runInContext("renderCombatOutcome(0)", context);
  assert.match(markup, /outcome-shield/);
  assert.match(markup, /blocked-spell/);
});

test("the red edge flash appears only on a landed enemy hit", () => {
  const context = loadGame();
  vm.runInContext("enemyHitFlash = true;", context);
  assert.match(vm.runInContext("renderEnemyHitFlash()", context), /screen-edge-flash/);
  vm.runInContext("enemyHitFlash = false;", context);
  assert.equal(vm.runInContext("renderEnemyHitFlash()", context), "");
  vm.runInContext("combatResolution = { phase: 'enemy-windup' };", context);
  assert.equal(vm.runInContext("renderEnemyHitFlash()", context), "");
});

test("enemy turns resolve and apply damage one enemy at a time", async () => {
  const context = loadGame();
  vm.runInContext("state = " + JSON.stringify(makeState([makeEnemy("First", 5), makeEnemy("Second", 7)])) + "; combatPacing = 'fast'; enemyTurn();", context);
  assert.equal(vm.runInContext("state.hp", context), 100);
  assert.equal(vm.runInContext("combatResolution.actor", context), "First");
  await new Promise(resolve => setTimeout(resolve, 150));
  assert.equal(vm.runInContext("state.hp", context), 95);
  assert.equal(vm.runInContext("combatResolution.actor", context), "First");
  await new Promise(resolve => setTimeout(resolve, 90));
  assert.equal(vm.runInContext("combatResolution.actor", context), "Second");
  assert.equal(vm.runInContext("state.hp", context), 95);
  await new Promise(resolve => setTimeout(resolve, 250));
  assert.equal(vm.runInContext("state.hp", context), 88);
  assert.equal(vm.runInContext("combatResolution", context), null);
});

test("combat pacing defaults to Fast and restores a saved Slow preference", () => {
  assert.equal(vm.runInContext("combatPacing", loadGame()), "fast");
  assert.equal(vm.runInContext("combatPacing", loadGame("slow")), "slow");
});
