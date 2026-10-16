const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function loadRules() {
  const context = { window: {} };
  vm.runInNewContext(fs.readFileSync("game-rules.js", "utf8"), context);
  return context.window.DungeonRules;
}

test("only the first floor starts in the starting room", () => {
  const rules = loadRules();
  assert.equal(rules.entryRoomType(1), "start");
  for (let floor = 2; floor <= 100; floor++) {
    assert.equal(rules.entryRoomType(floor), "empty");
  }
});

test("spending skill points improves the selected stat and derived resources", () => {
  const rules = loadRules();
  const player = { level: 1, skillPoints: 2, str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10, speed: 10, critChance: 0.05, hp: 80, maxHp: 100, mana: 20, maxMana: 50 };

  assert.equal(rules.spendSkillPoint(player, "str").success, true);
  assert.equal(player.str, 11);
  assert.equal(player.skillPoints, 1);
  assert.equal(rules.spendSkillPoint(player, "con").success, true);
  assert.equal(player.con, 11);
  assert.equal(player.maxHp, 110);
  assert.equal(player.hp, 90);
  assert.equal(player.skillPoints, 0);
});

test("class synergies strengthen relevant stats while returns diminish above twenty", () => {
  const rules = loadRules();
  assert.equal(rules.effectiveStat(12, "str", "warrior"), 12.5);
  assert.equal(rules.effectiveStat(12, "dex", "warrior"), 12);
  assert.equal(rules.effectiveStat(12, "dex", "archer"), 12.5);
  assert.equal(rules.effectiveStat(22, "str", "warrior") - rules.effectiveStat(21, "str", "warrior"), 0.625);

  const mage = { class: "mage", skillPoints: 1, con: 10, maxHp: 100, baseMaxHp: 100, hp: 50, int: 10, maxMana: 50, mana: 20 };
  rules.spendSkillPoint(mage, "con");
  assert.equal(mage.con, 11);
  assert.equal(mage.maxHp, 112);
  assert.equal(mage.baseMaxHp, 112);
});

test("critical chance skill investments diminish after twenty percent", () => {
  const rules = loadRules();
  const player = { skillPoints: 2, critChance: 0.19 };
  rules.spendSkillPoint(player, "critChance");
  assert.equal(player.critChance, 0.2);
  player.skillPoints = 1;
  rules.spendSkillPoint(player, "critChance");
  assert.ok(Math.abs(player.critChance - 0.205) < 1e-12);
});

test("invalid stat choices and unspent-point exhaustion do not change player stats", () => {
  const rules = loadRules();
  const player = { level: 1, skillPoints: 0, str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10, speed: 10, critChance: 0.05, hp: 100, maxHp: 100, mana: 50, maxMana: 50 };

  assert.equal(rules.spendSkillPoint(player, "str").success, false);
  player.skillPoints = 1;
  assert.equal(rules.spendSkillPoint(player, "luck").success, false);
  assert.equal(player.str, 10);
  assert.equal(player.skillPoints, 1);
});

test("every catalog weapon can be selected for gameplay and receives its family resources", () => {
  const rules = loadRules();
  const catalogContext = { window: {} };
  vm.runInNewContext(fs.readFileSync("game-index-data.js", "utf8"), catalogContext);
  const catalog = catalogContext.window.GAME_INDEX_DATA.weapons;

  for (const family of ["warrior", "archer", "mage"]) {
    const entries = catalog[family];
    assert.equal(entries.length, 84);
    const reachable = new Set();
    for (const rarity of ["Common", "Uncommon", "Rare", "Epic", "Legendary", "Mythic", "Divine"]) {
      const tierEntries = entries.filter(entry => entry.rarity === rarity);
      for (let index = 0; index < tierEntries.length; index++) {
        reachable.add(rules.chooseCatalogWeapon(family, rarity, catalog, () => (index + 0.1) / tierEntries.length).name);
      }
    }
    assert.equal(reachable.size, entries.length, `${family} weapons reachable by the chooser`);
    for (const entry of entries) {
      const weapon = rules.createCatalogWeapon(entry, 1);
      assert.ok(Array.isArray(weapon.attacks), `${entry.name} has a browser attack list`);
      if (entry.rarity === "Common") assert.equal(weapon.attacks.length, 0);
      else assert.equal(weapon.attacks.length, ["Common", "Uncommon", "Rare", "Epic", "Legendary", "Mythic", "Divine"].indexOf(entry.rarity), `${entry.name} has the expected rarity attack count`);
    }
    const crossbow = entries.find(entry => entry.type === "Crossbow");
    if (crossbow) assert.equal(rules.createCatalogWeapon(crossbow, 1).arrows, 18);
  }

  assert.equal(rules.createCatalogWeapon(catalog.mage[0], 1).name, catalog.mage[0].name);
  assert.ok(catalog.mage.some(entry => entry.name !== "Cracked Ember Staff"));
  assert.equal(rules.createCatalogWeapon(catalog.mage[0], 1).manaCost, 3);
  assert.equal(rules.createCatalogWeapon(catalog.mage[0], 4).manaCost, 4);
  assert.equal(rules.createCatalogWeapon(catalog.mage[0], 10).manaCost, 6);
  assert.equal(rules.chooseCatalogWeapon("mage", "Divine", catalog, () => 0, [catalog.mage.filter(item => item.rarity === "Divine")[0].name]).name,
    catalog.mage.filter(item => item.rarity === "Divine")[1].name);
});

test("normal room and boss loot can roll through all configured rarities", () => {
  const rules = loadRules();
  const roomOneTop = rules.rollLootRarity(1, false, 0.999);
  const roomFourTop = rules.rollLootRarity(4, false, 0.999);
  const bossFloor = rules.rollLootRarity(1, true, 0);
  assert.equal(roomOneTop, "Mythic");
  assert.equal(roomFourTop, "Divine");
  assert.equal(bossFloor, "Epic");
  assert.equal(rules.rollShopRarity(0, 0.999), "Divine");
});

test("weapon drops use the existing weighted class-family pool", () => {
  const rules = loadRules();
  assert.ok(["warrior", "archer", "mage"].includes(rules.rollWeaponFamily()));
  assert.equal(rules.rollWeaponFamily(() => 0.62), "warrior");
  assert.equal(rules.rollWeaponFamily(() => 0.63), "archer");
  assert.equal(rules.rollWeaponFamily(() => 0.90), "archer");
  assert.equal(rules.rollWeaponFamily(() => 0.91), "mage");
  assert.equal(rules.rollWeaponFamily(() => 0.5, "mage"), "mage");
  assert.equal(rules.rollWeaponFamily(() => 0.5, "warrior"), "warrior");
  assert.notEqual(rules.rollWeaponFamily(() => 0.1, "archer"), "warrior");
});

test("class-aware loot favors the chosen weapon family and tailors mana potion odds", () => {
  const rules = loadRules();
  assert.equal(rules.rollLootKind(() => 0.99, "mage"), "item");
  assert.equal(rules.rollLootKind(() => 0.99, "warrior"), "item");
  assert.equal(rules.rollLootKind(() => 0.99, "archer"), "item");
  assert.equal(rules.rollPotionType(() => 0.5, "mage"), "mana");
  assert.equal(rules.rollPotionType(() => 0.5, "warrior"), "health");
  assert.equal(rules.rollPotionType(() => 0.2, "archer"), "mana");
  assert.equal(rules.rollPotionType(() => 0.3, "archer"), "health");
});

test("loot favors weapon drops enough that warrior weapons are not starter-only", () => {
  const rules = loadRules();
  assert.equal(rules.rollLootKind(() => 0.1), "weapon");
  assert.equal(rules.rollLootKind(() => 0.59), "weapon");
  assert.equal(rules.rollLootKind(() => 0.6), "armor");
  assert.equal(rules.rollLootKind(() => 0.89), "armor");
  assert.equal(rules.rollLootKind(() => 0.9), "item");
  assert.equal(rules.rollShopOfferKind(() => 0.44), "weapon");
  assert.equal(rules.rollShopOfferKind(() => 0.45), "armor");
  assert.equal(rules.rollShopOfferKind(() => 0.79), "armor");
  assert.equal(rules.rollShopOfferKind(() => 0.8), "item");
});

test("basic attacks cannot be shadowed by weapon-special cooldown entries", () => {
  const rules = loadRules();
  const weapon = { attacks: [{ command: "basic", cooldown: 3 }, { command: "technique", cooldown: 2 }] };
  assert.equal(rules.getSpecialAttack(weapon, "basic"), null);
  assert.equal(rules.getSpecialAttack(weapon, "technique").command, "technique");
  assert.equal(rules.isAttackOnCooldown({}, "basic"), false);
  assert.equal(rules.isAttackOnCooldown({ technique: 2 }, "basic"), false);
  assert.equal(rules.isAttackOnCooldown({ technique: 2 }, "technique"), true);
});

test("an exhausted mage or archer retains a weak resource-free attack", () => {
  const rules = loadRules();
  assert.equal(rules.basicAttackFallback("mage", "Staff", 0, 12), "mana");
  for (const mana of [0, 1, 2, 3, 4]) assert.equal(rules.basicAttackFallback("mage", "Staff", mana, 12, 5), "mana");
  assert.equal(rules.basicAttackFallback("mage", "Staff", 5, 12, 5), null);
  assert.equal(rules.basicAttackFallback("archer", "Bow", 20, 0), "arrows");
  assert.equal(rules.basicAttackFallback("archer", "Bow", 20, 1), null);
  assert.equal(rules.basicAttackFallback("warrior", "Sword", 0, 0), null);
});

test("combat recognizes a cleared encounter even after effect or counter damage", () => {
  const rules = loadRules();
  assert.equal(rules.allEnemiesDefeated([{ hp: 0 }, { hp: 0 }]), true);
  assert.equal(rules.allEnemiesDefeated([{ hp: 0 }, { hp: 1 }]), false);
  assert.equal(rules.allEnemiesDefeated([]), false);
});

test("divine consumables downgrade when the same divine type is already owned", () => {
  const rules = loadRules();
  assert.equal(rules.avoidDuplicateDivine("Divine", true), "Mythic");
  assert.equal(rules.avoidDuplicateDivine("Divine", false), "Divine");
  assert.equal(rules.avoidDuplicateDivine("Legendary", true), "Legendary");
});

test("rarity-based weapon attacks carry costs, cooldowns, effects, and area targeting", () => {
  const rules = loadRules();
  const common = rules.createWeaponAttacks("warrior", "Common", "Sword", "Fire");
  const uncommon = rules.createWeaponAttacks("warrior", "Uncommon", "Sword", "Fire");
  const epicBow = rules.createWeaponAttacks("archer", "Epic", "Bow", "Fire");
  const divineStaff = rules.createWeaponAttacks("mage", "Divine", "Staff", "Fire", 8);

  assert.equal(common.length, 0);
  assert.equal(uncommon[0].command, "charge");
  assert.equal(uncommon[0].chargesNextAttack, true);
  assert.ok(epicBow.some(attack => attack.command === "arrowstorm" && attack.aoe && attack.effect === "Volley"));
  assert.ok(divineStaff.some(attack => attack.command === "worldsend" && attack.aoe && attack.manaCost === 14));
  assert.ok(divineStaff.every(attack => attack.cooldown >= 0));
});

test("armor occupies distinct slots and only equipped pieces grant mitigation", () => {
  const rules = loadRules();
  const catalogContext = { window: {} };
  vm.runInNewContext(fs.readFileSync("game-index-data.js", "utf8"), catalogContext);
  const entries = catalogContext.window.GAME_INDEX_DATA.armor;
  const head = rules.createCatalogArmor(entries.find(item => item.rarity === "Common" && item.type === "Head Armor"), 1);
  const chest = rules.createCatalogArmor(entries.find(item => item.rarity === "Common" && item.type === "Chest Armor"), 1);
  let equipped = rules.equipArmor({}, head);
  equipped = rules.equipArmor(equipped, chest);

  assert.equal(head.slot, "head");
  assert.equal(chest.slot, "chest");
  assert.equal(Object.keys(equipped).length, 2);
  assert.equal(rules.armorSetBonus(equipped), 0);
  assert.equal(rules.armorDamageReduction(equipped, "warrior"), head.damageReduction + chest.damageReduction);

  for (const slot of ["legs", "feet"]) {
    const entry = entries.find(item => item.rarity === "Common" && item.type === `${slot[0].toUpperCase()}${slot.slice(1)} Armor`);
    equipped = rules.equipArmor(equipped, rules.createCatalogArmor(entry, 1));
  }
  assert.equal(rules.armorSetBonus(equipped), 2);
  const shield = rules.createCatalogArmor(entries.find(item => item.rarity === "Common" && item.type === "Shield Armor"), 1);
  equipped = rules.equipArmor(equipped, shield);
  assert.equal(rules.armorDamageReduction(equipped, "mage"), rules.armorDamageReduction(equipped, "warrior") - shield.damageReduction);
});
