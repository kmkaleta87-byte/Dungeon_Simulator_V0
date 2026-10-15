const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function loadRules() {
  const context = { window: {} };
  vm.runInNewContext(fs.readFileSync("game-rules.js", "utf8"), context);
  return context.window.DungeonRules;
}

function loadCatalog() {
  const context = { window: {} };
  vm.runInNewContext(fs.readFileSync("game-index-data.js", "utf8"), context);
  return context.window.GAME_INDEX_DATA;
}

test("every catalog weapon effect has a visible combat definition", () => {
  const rules = loadRules();
  const catalog = loadCatalog();
  const effects = new Set(Object.values(catalog.weapons).flat().map(weapon => weapon.effect).filter(Boolean));
  for (const effect of effects) {
    assert.ok(rules.getEffectDefinition(effect), `${effect} has a definition`);
    assert.ok(rules.getEffectDefinition(effect).description.length > 0, `${effect} explains its behavior`);
  }
  for (const family of ["warrior", "archer", "mage"]) {
    for (const rarity of ["Uncommon", "Rare", "Epic", "Legendary", "Mythic", "Divine"]) {
      const attacks = rules.createWeaponAttacks(family, rarity, family === "warrior" ? "Sword" : family === "archer" ? "Bow" : "Staff", "Fire", 5);
      for (const attack of attacks) {
        assert.ok(rules.getEffectDefinition(attack.effect), `${family} ${rarity} ${attack.name} effect`);
      }
    }
  }
});

test("damage statuses stack, deal damage, and expire deterministically", () => {
  const rules = loadRules();
  let statuses = rules.applyCombatEffect({}, "Burn", 50);
  statuses = rules.applyCombatEffect(statuses, "Burn", 50);
  assert.equal(statuses.Burn.stacks, 2);
  const tick = rules.tickCombatEffects(statuses);
  assert.equal(tick.damage, 4);
  assert.equal(tick.statuses.Burn.turns, 2);
  assert.equal(tick.statuses.Burn.stacks, 2);
  const expired = rules.tickCombatEffects({ Root: { turns: 1, stacks: 1 } });
  assert.equal(expired.statuses.Root, undefined);
});

test("one-turn control effects survive the damage tick that precedes an enemy action", () => {
  const rules = loadRules();
  const statuses = rules.applyCombatEffect({}, "Gust", 10);
  const damageTick = rules.tickCombatEffects(statuses, { damageOnly: true });
  assert.ok(damageTick.statuses.Gust, "Gust remains active so the enemy turn can be skipped");
  const afterTurn = rules.tickCombatEffects(damageTick.statuses, { durationOnly: true });
  assert.equal(afterTurn.statuses.Gust, undefined, "Gust expires after its skipped turn");
});

test("armor slots grant different perks and matching sets retain damage reduction", () => {
  const rules = loadRules();
  const catalog = loadCatalog();
  const entries = catalog.armor;
  const equipped = {};
  for (const slot of ["Head", "Chest", "Legs", "Feet"]) {
    const entry = entries.find(item => item.rarity === "Rare" && item.type === `${slot} Armor`);
    const armor = rules.createCatalogArmor(entry, 3);
    Object.assign(equipped, rules.equipArmor(equipped, armor));
  }
  const bonuses = rules.armorBonuses(equipped, "warrior");
  assert.ok(bonuses.critChance > 0);
  assert.ok(bonuses.dexterity > 0);
  assert.ok(bonuses.speed > 0);
  assert.ok(bonuses.thorns > 0);
  assert.ok(bonuses.damageReduction >= rules.armorSetBonus(equipped));
  assert.ok(bonuses.setName);
});

test("attack preview reports effective damage, crit, costs, cooldown, and AoE", () => {
  const rules = loadRules();
  const preview = rules.createAttackPreview({
    player: { str: 12, int: 10, critChance: 0.1, mana: 20, arrows: 8 },
    playerClass: "archer",
    weapon: { type: "Bow", damage: 20, crit: 0.08 },
    attack: { multiplier: 1.5, critBonus: 0.2, cooldown: 2, manaCost: 0, aoe: true, secondaryMultiplier: 0.5 },
    targetCount: 3
  });
  assert.equal(preview.critChance, 0.38);
  assert.equal(preview.manaCost, 0);
  assert.equal(preview.ammoCost, 1);
  assert.equal(preview.cooldown, 2);
  assert.equal(preview.targetCount, 3);
  assert.ok(preview.primaryDamage > preview.secondaryDamage);
});

test("the core elemental cycle grants advantage and disadvantage with neutral fallbacks", () => {
  const rules = loadRules();
  assert.equal(rules.elementMatchup("Water", "Fire").multiplier, 1.25);
  assert.equal(rules.elementMatchup("Fire", "Water").multiplier, 0.8);
  assert.equal(rules.elementMatchup("Nature", "Water").relation, "advantage");
  assert.equal(rules.elementMatchup("Air", "Earth").relation, "advantage");
  assert.equal(rules.elementMatchup("Void", "Fire").multiplier, 1);
  const preview = rules.createAttackPreview({
    player: { str: 10 }, playerClass: "warrior", weapon: { damage: 10, element: "Water" },
    attack: { multiplier: 1 }, targetElement: "Fire"
  });
  assert.equal(preview.primaryDamage, 25);
  assert.equal(preview.elementRelation, "advantage");
});

test("enemy intent tables are class-flavored and deterministic under injected rolls", () => {
  const rules = loadRules();
  assert.equal(rules.chooseEnemyIntent("Archer", "skeleton", () => 0.9).key, "dodge");
  assert.equal(rules.chooseEnemyIntent("Archer", "skeleton", () => 0.1).key, "shoot");
  assert.equal(rules.chooseEnemyIntent("Warrior", "goblin", () => 0.9).key, "guard");
  assert.equal(rules.chooseEnemyIntent("Mage", "skeleton", () => 0.9).key, "summon");
  assert.equal(rules.chooseEnemyIntent("Basic", "slime", () => 0.9).key, "attack");
});

test("Disrupt is available only for telegraphed spells or shots and cancels that intent", () => {
  const rules = loadRules();
  const mage = { hp: 10, intent: { key: "cast", label: "Bone bolt" } };
  const archer = { hp: 10, intent: { key: "shoot", label: "Shoot" } };
  const guarded = { hp: 10, intent: { key: "guard", label: "Guard" } };

  assert.equal(rules.hasDisruptibleIntent(mage), true);
  assert.equal(rules.hasDisruptibleIntent(archer), true);
  assert.equal(rules.hasDisruptibleIntent(guarded), false);
  assert.equal(rules.hasDisruptibleIntent({ hp: 0, intent: { key: "cast" } }), false);
  assert.equal(rules.canDisrupt(mage, 0), true);
  assert.equal(rules.canDisrupt(archer, 0), true);
  assert.equal(rules.canDisrupt(mage, 1), false);
  assert.equal(rules.disruptEnemy(mage, 0), true);
  assert.equal(mage.intentDisrupted, true);
  assert.equal(rules.consumeDisruptedIntent(mage), true);
  assert.equal(mage.intentDisrupted, false);
  assert.equal(rules.disruptEnemy(guarded, 0), false);
});

test("Disrupt cooldown keeps the action unavailable for two enemy turns", () => {
  const rules = loadRules();
  const enemy = { hp: 10, intent: { key: "cast", label: "Cast" } };
  assert.equal(rules.disruptEnemy(enemy, 0), true);

  let cooldown = 3;
  cooldown = rules.tickDisruptCooldown(cooldown);
  assert.equal(cooldown, 2);
  assert.equal(rules.canDisrupt(enemy, cooldown), false);
  cooldown = rules.tickDisruptCooldown(cooldown);
  assert.equal(cooldown, 1);
  assert.equal(rules.canDisrupt(enemy, cooldown), false);
  cooldown = rules.tickDisruptCooldown(cooldown);
  assert.equal(cooldown, 0);
  assert.equal(rules.canDisrupt(enemy, cooldown), true);
});

test("heavy attacks break through Guard more effectively than regular attacks", () => {
  const rules = loadRules();
  assert.equal(rules.guardDamage(100, false), 55);
  assert.equal(rules.guardDamage(100, true), 80);
});

test("Brace can only be activated once until an incoming hit consumes it", () => {
  const rules = loadRules();
  const player = { braced: false };
  assert.equal(rules.brace(player), true);
  assert.equal(player.braced, true);
  assert.equal(rules.brace(player), false);
  assert.equal(rules.applyBraceToDamage(player, 17), 9);
  assert.equal(player.braced, false);
  assert.equal(rules.applyBraceToDamage(player, 17), 17);
});

test("save slot helpers preserve independent saves and report floor and level", () => {
  const rules = loadRules();
  const slots = rules.createSaveSlots();
  rules.writeSaveSlot(slots, "slot2", { name: "Mira", floor: 4, level: 7 });
  rules.writeSaveSlot(slots, "dev", { name: "Test", floor: 2, level: 3, devMode: true });
  assert.equal(rules.describeSaveSlot(slots, "slot2"), "Mira · Floor 4 · Level 7");
  assert.equal(rules.describeSaveSlot(slots, "slot1"), "Empty");
  assert.equal(slots.dev.floor, 2);
});
