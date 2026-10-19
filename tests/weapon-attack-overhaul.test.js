const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function loadRules() {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync("game-index-data.js", "utf8"), context);
  vm.runInContext(fs.readFileSync("weapon-attack-data.js", "utf8"), context);
  vm.runInContext(fs.readFileSync("game-rules.js", "utf8"), context);
  return { rules: context.window.DungeonRules, catalog: context.window.GAME_INDEX_DATA.weapons, context };
}

function loadGame(randomRoll = 0.1) {
  const screen = { innerHTML: "", querySelectorAll: () => [], querySelector: () => null, addEventListener: () => {}, insertAdjacentHTML: () => {} };
  const context = {
    document: { querySelector: () => screen }, window: {}, localStorage: { getItem: () => null, setItem: () => {} }, confirm: () => true,
    Math: Object.assign(Object.create(Math), { random: () => randomRoll })
  };
  vm.createContext(context);
  for (const file of ["game-index-data.js", "weapon-attack-data.js", "game-rules.js", "script.js"]) vm.runInContext(fs.readFileSync(file, "utf8"), context);
  vm.runInContext("render=()=>{}; save=()=>{}", context);
  return context;
}

test("Legendary, Mythic, and Divine catalog weapons have rarity-complete attack profiles", () => {
  const { rules, catalog } = loadRules();
  const expected = { Legendary: 4, Mythic: 5, Divine: 6 };
  for (const [family, entries] of Object.entries(catalog)) {
    for (const entry of entries.filter(item => expected[item.rarity])) {
      const attacks = rules.createWeaponAttacks(family, entry.rarity, entry.type, entry.element, 7, entry.name);
      assert.equal(attacks.length, expected[entry.rarity], `${entry.name} ${entry.rarity} attack count`);
      assert.ok(attacks.every(attack => attack.name && attack.description && attack.command && attack.id));
      const signatures = attacks.map(({ multiplier, critBonus, cooldown, effect, effectChance, manaCost, manaGain, healOnHit, chargesNextAttack, aoe, secondaryMultiplier }) =>
        JSON.stringify([multiplier, critBonus, cooldown, effect, effectChance, manaCost, manaGain, healOnHit, chargesNextAttack, aoe, secondaryMultiplier]));
      assert.equal(new Set(signatures).size, signatures.length, `${entry.name} has mechanically distinct progression steps`);
      for (const attack of attacks) {
        assert.ok(Number.isFinite(attack.multiplier) && attack.multiplier > 0, `${entry.name} ${attack.name} damage multiplier`);
        assert.ok(Number.isFinite(attack.cooldown) && attack.cooldown >= 0, `${entry.name} ${attack.name} cooldown`);
        if (attack.effect) assert.ok(rules.getEffectDefinition(attack.effect), `${entry.name} ${attack.name} effect`);
      }
    }
  }
});

test("every Mythic and Divine special attack name, ID, and command is globally unique", () => {
  const { rules, catalog } = loadRules();
  const attacks = [];
  for (const [family, entries] of Object.entries(catalog)) {
    for (const entry of entries.filter(item => ["Mythic", "Divine"].includes(item.rarity))) {
      attacks.push(...rules.createWeaponAttacks(family, entry.rarity, entry.type, entry.element, 5, entry.name));
    }
  }
  for (const key of ["name", "id", "command"]) {
    const values = attacks.map(attack => attack[key]);
    assert.equal(new Set(values).size, values.length, `duplicate Mythic/Divine ${key}`);
  }
  assert.equal(attacks.length, 396);
});

test("the representative attack progressions retain their named moves and resource profiles", () => {
  const { rules, catalog } = loadRules();
  const find = (family, name, type) => catalog[family].find(item => item.name === name && item.type === type);
  const kingEntry = find("warrior", "The Merciful King", "Sword");
  const artemisEntry = find("archer", "Artemis, Bow of the Huntress", "Bow");
  const wandEntry = find("mage", "Wand of the Frozen King", "Wand");
  const king = rules.createWeaponAttacks("warrior", "Divine", "Sword", "Fire", 0, kingEntry.name);
  const artemis = rules.createWeaponAttacks("archer", "Divine", "Bow", "Physical", 0, artemisEntry.name);
  const wand = rules.createWeaponAttacks("mage", "Divine", "Wand", "Ice", 7, wandEntry.name);
  assert.deepEqual(Array.from(king, attack => attack.name), ["King’s Measure", "Ember Edict", "Crownfire Sweep", "Pardon’s Edge", "Sovereign Pyre", "The Last Mercy"]);
  assert.deepEqual(Array.from(artemis, attack => attack.name), ["Huntress’ Draw", "Crescent Pin", "Three-Moon Split", "Silent Quarry", "Artemis’ Pursuit", "Moonless Volley"]);
  assert.deepEqual(Array.from(wand, attack => attack.name), ["Winter’s Answer", "Rimeglass Lance", "Whitecourt Shards", "The King’s Stillness", "Throne of Rime", "Absolute Winter"]);
  assert.equal(king[2].aoe, true);
  assert.equal(king[1].effect, "Blind");
  assert.equal(king[2].effect, "Burn");
  assert.equal(king[4].effect, "Burn");
  assert.ok(king[5].healOnHit > 0);
  assert.equal(artemis[1].effect, "Pin");
  assert.equal(artemis[4].effect, "Marked");
  assert.ok(artemis[5].aoe && artemis[5].secondaryMultiplier > 0);
  assert.equal(wand[5].manaCost, 13);
  assert.equal(wand[5].aoe, true);
});

test("legacy saves refresh catalog profiles without losing upgrades or run state", () => {
  const context = {
    document: { querySelector: () => ({ innerHTML: "", querySelectorAll: () => [], querySelector: () => null, addEventListener: () => {} }) },
    window: {}, localStorage: { getItem: () => null, setItem: () => {} }, confirm: () => true,
    Math: Object.assign(Object.create(Math), { random: () => 0.5 })
  };
  vm.createContext(context);
  for (const file of ["game-index-data.js", "weapon-attack-data.js", "game-rules.js", "script.js"]) vm.runInContext(fs.readFileSync(file, "utf8"), context);
  vm.runInContext(`
    state = { name:"Tester", floor:9, class:"warrior", chosenClass:"warrior", hp:80, maxHp:100, baseMaxHp:100,
      weapons:[{name:"The Merciful King",type:"Sword",rarity:"Divine",element:"Fire",damage:200,damageUpgrade:7,critUpgrade:0.1,level:3,attacks:[{name:"Old generic",command:"old",multiplier:1}]}],
      weapon:null, armor:[], equippedArmor:{}, items:[], currentFloor:{rooms:[],currentId:"r0"}, runStats:{enemiesDefeated:12,damageDealt:99,damageTaken:5,fights:[]}, log:[] };
    state.weapon=state.weapons[0];
    migrateBrowserSave();
  `, context);
  assert.equal(vm.runInContext("state.weapon.attacks[0].name", context), "King’s Measure");
  assert.equal(vm.runInContext("state.weapon.damageUpgrade", context), 7);
  assert.equal(vm.runInContext("state.weapon.critUpgrade", context), 0.1);
  assert.equal(vm.runInContext("state.weapon.level", context), 3);
  assert.equal(vm.runInContext("state.floor", context), 9);
  assert.equal(vm.runInContext("state.runStats.enemiesDefeated", context), 12);
});

test("a Divine health rider heals from damage dealt during the attack", () => {
  const context = loadGame();
  vm.runInContext(`
    newRun("Tester"); chooseClass("warrior");
    const entry=GAME_INDEX_DATA.weapons.warrior.find(item=>item.name==="The Merciful King");
    const weapon=window.DungeonRules.createCatalogWeapon(entry,8);
    state.weapon=weapon; state.weapons=[weapon]; state.str=30; state.hp=40; state.maxHp=120;
    state.combat={boss:false,enemies:[{name:"Target",hp:10000,maxHp:10000,damage:1,dodge:0,damageReduction:0,intent:{key:"attack",label:"Attack"},effects:{}}],damageDealt:0,damageTaken:0,summonedCount:0};
    state.target=0; state.attackCooldowns={}; state.log=[];
    render=()=>{}; save=()=>{};
    combatAction(weapon.attacks[5].command);
  `, context);
  assert.ok(vm.runInContext("state.hp", context) > 40);
  assert.ok(vm.runInContext("state.combat.enemies[0].hp", context) < 10000);
  assert.ok(vm.runInContext("state.attackCooldowns[state.weapon.attacks[5].command]", context) > 0);
});

test("catalog AoE attacks hit every live enemy and apply their profiled effect", () => {
  const context = loadGame();
  vm.runInContext(`
    newRun("Tester"); chooseClass("warrior");
    const entry=GAME_INDEX_DATA.weapons.warrior.find(item=>item.name==="The Merciful King");
    const weapon=window.DungeonRules.createCatalogWeapon(entry,8);
    state.weapon=weapon; state.weapons=[weapon]; state.str=30;
    state.combat={boss:false,enemies:[0,1].map(i=>({name:"Target "+i,hp:10000,maxHp:10000,damage:1,dodge:0,damageReduction:0,intent:{key:"attack",label:"Attack"},effects:{}})),damageDealt:0,damageTaken:0,summonedCount:0};
    state.target=0; state.attackCooldowns={}; state.log=[];
    combatAction(weapon.attacks[2].command);
  `, context);
  assert.ok(vm.runInContext("state.combat.enemies.every(enemy=>enemy.hp<10000)", context));
  assert.ok(vm.runInContext("state.combat.enemies.every(enemy=>enemy.effects.Burn)", context));
  assert.ok(vm.runInContext("state.attackCooldowns[state.weapon.attacks[2].command]>0", context));
});

test("catalog Mage and Archer capstones spend the shown resources and retain their riders", () => {
  const mage = loadGame();
  vm.runInContext(`
    newRun("Mage"); chooseClass("mage");
    const entry=GAME_INDEX_DATA.weapons.mage.find(item=>item.name==="Wand of the Frozen King");
    const weapon=window.DungeonRules.createCatalogWeapon(entry,8);
    state.weapon=weapon; state.weapons=[weapon]; state.mana=50; state.maxMana=50;
    state.combat={boss:false,enemies:[{name:"Target",hp:10000,maxHp:10000,damage:1,dodge:0,damageReduction:0,intent:{key:"attack",label:"Attack"},effects:{}}],damageDealt:0,damageTaken:0,summonedCount:0};
    state.target=0; state.attackCooldowns={}; state.log=[];
    combatAction(weapon.attacks[5].command);
  `, mage);
  assert.equal(vm.runInContext("state.mana", mage), 50 - vm.runInContext("state.weapon.attacks[5].manaCost", mage));
  assert.ok(vm.runInContext("state.combat.enemies[0].hp<10000", mage));

  const archer = loadGame();
  vm.runInContext(`
    newRun("Archer"); chooseClass("archer");
    const entry=GAME_INDEX_DATA.weapons.archer.find(item=>item.name==="Artemis, Bow of the Huntress");
    const weapon=window.DungeonRules.createCatalogWeapon(entry,8);
    state.weapon=weapon; state.weapons=[weapon]; state.arrows=5; state.mana=10; state.maxMana=50;
    state.combat={boss:false,enemies:[{name:"Target",hp:10000,maxHp:10000,damage:1,dodge:0,damageReduction:0,intent:{key:"attack",label:"Attack"},effects:{}}],damageDealt:0,damageTaken:0,summonedCount:0};
    state.target=0; state.attackCooldowns={}; state.log=[];
    combatAction(weapon.attacks[5].command);
  `, archer);
  assert.equal(vm.runInContext("state.arrows", archer), 4);
  assert.equal(vm.runInContext("state.mana", archer), 13);
});
