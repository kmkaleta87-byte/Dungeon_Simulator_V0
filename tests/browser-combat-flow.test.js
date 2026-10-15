const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function loadBrowserGame() {
  const screen = { innerHTML: "", querySelectorAll: () => [], querySelector: () => null, addEventListener: () => {}, insertAdjacentHTML: () => {} };
  const button = { hidden: false, addEventListener: () => {} };
  const storage = new Map();
  const context = {
    document: { querySelector: selector => selector === "#game-screen" ? screen : button },
    window: {},
    localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) },
    confirm: () => true,
    Math: Object.assign(Object.create(Math), { random: () => 0.5 })
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync("game-index-data.js", "utf8"), context);
  vm.runInContext(fs.readFileSync("game-rules.js", "utf8"), context);
  vm.runInContext(fs.readFileSync("script.js", "utf8"), context);
  vm.runInContext("render = () => {}; save = () => {};", context);
  return context;
}

test("a warrior can use a basic attack during cooldown and the final kill exits combat", () => {
  const context = loadBrowserGame();
  vm.runInContext(`
    state = {
      name: "Tester", floor: 1, level: 1, xp: 0, skillPoints: 0,
      hp: 100, maxHp: 100, mana: 50, maxMana: 50, gold: 0,
      str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10, speed: 10,
      critChance: 0, class: "warrior", weapon: { name: "Test Sword", type: "Sword", damage: 2, crit: 0, attacks: [{ name: "Heavy Cut", command: "heavycut", multiplier: 1, cooldown: 2 }] },
      weapons: [], armor: [], items: [], equippedArmor: {}, attackCooldowns: {},
      currentFloor: { rooms: [{ id: "r0", type: "enemy", enemyCount: 1, cleared: false }], currentId: "r0" },
      runStats: { enemiesDefeated: 0, damageDealt: 0, damageTaken: 0, fights: [] },
      combat: { boss: false, enemies: [{ name: "Test Enemy", hp: 100, maxHp: 100, damage: 1, dodge: 0, gold: 1, xp: 1, intent: { key: "guard", label: "Guard" } }], damageDealt: 0, damageTaken: 0, summonedCount: 0 },
      target: 0, log: []
    };
    combatAction("heavycut");
  `, context);

  assert.equal(vm.runInContext("state.attackCooldowns.heavycut", context), 2);
  const beforeBasic = vm.runInContext("state.combat.enemies[0].hp", context);
  vm.runInContext("combatAction('basic')", context);
  assert.ok(vm.runInContext("state.combat.enemies[0].hp", context) < beforeBasic);
  assert.ok(vm.runInContext("state.attackCooldowns.heavycut", context) < 2);

  vm.runInContext("state.combat.enemies[0].hp = 1; combatAction('basic')", context);
  assert.equal(vm.runInContext("state.combat", context), null);
  assert.equal(vm.runInContext("state.currentFloor.rooms[0].cleared", context), true);
});

test("difficulty scales enemy pressure, XP requirements, and shop prices", () => {
  const context = loadBrowserGame();
  vm.runInContext(`newRun("Tester", false, "slot1", "easy")`, context);
  assert.equal(vm.runInContext("xpToNext()", context), 160);
  const easyHp = vm.runInContext("makeEnemy(1).maxHp", context);
  const easyDamage = vm.runInContext("makeEnemy(4).damage", context);
  vm.runInContext("state.difficulty='normal'", context);
  const normalHp = vm.runInContext("makeEnemy(1).maxHp", context);
  const normalDamage = vm.runInContext("makeEnemy(4).damage", context);
  vm.runInContext("state.difficulty='hard'", context);
  const hardHp = vm.runInContext("makeEnemy(1).maxHp", context);
  const hardDamage = vm.runInContext("makeEnemy(4).damage", context);
  assert.ok(easyHp < normalHp && normalHp < hardHp);
  assert.ok(easyDamage < normalDamage && normalDamage < hardDamage);
  assert.equal(vm.runInContext("xpToNext()", context), 280);
  vm.runInContext("state.cha=10", context);
  const hardPrice = vm.runInContext("priceFor(100, 'Rare')", context);
  vm.runInContext("state.difficulty='normal'", context);
  assert.ok(hardPrice > vm.runInContext("priceFor(100, 'Rare')", context));
});

test("floor-four enemies deal meaningful damage against a high-health player", () => {
  const context = loadBrowserGame();
  vm.runInContext(`newRun("Tester"); chooseClass("warrior"); state.maxHp=280; state.hp=280; state.equippedArmor={head:{damageReduction:2},chest:{damageReduction:3},legs:{damageReduction:2},feet:{damageReduction:2}};`, context);
  const normal = vm.runInContext("makeEnemy(4, false)", context);
  const boss = vm.runInContext("makeEnemy(4, true)", context);
  context.testEnemy = normal;
  const normalHit = vm.runInContext("enemyIncomingDamage(testEnemy)", context);
  context.testEnemy = boss;
  const bossHit = vm.runInContext("enemyIncomingDamage(testEnemy)", context);
  assert.ok(normalHit >= 10, `expected floor-four normal hit >= 10, got ${normalHit}`);
  assert.ok(bossHit >= 20, `expected floor-four boss hit >= 20, got ${bossHit}`);
});

test("bosses scale tougher than regular enemies and equipment stays out of weapon lists", () => {
  const context = loadBrowserGame();
  vm.runInContext(`newRun("Tester");`, context);
  const normal = vm.runInContext("makeEnemy(1, false)", context);
  const boss = vm.runInContext("makeEnemy(1, true)", context);
  assert.ok(boss.maxHp > normal.maxHp * 2);
  assert.ok(boss.damage > normal.damage);

  vm.runInContext(`state.weapons.push({name:"Misfiled Armor",type:"Armor",slot:"chest",defense:3,damageReduction:2}); render = () => {};`, context);
  assert.doesNotMatch(vm.runInContext("renderInventoryItems('weapons')", context), /Misfiled Armor/);
  vm.runInContext("migrateBrowserSave()", context);
  assert.equal(vm.runInContext("state.weapons.some(item => item.name === 'Misfiled Armor')", context), false);
  assert.equal(vm.runInContext("state.armor.some(item => item.name === 'Misfiled Armor')", context), true);
});

test("skill upgrades are opened through Inventory rather than a run-header shortcut", () => {
  const source = fs.readFileSync("script.js", "utf8");
  assert.doesNotMatch(source, /class="small-button skills-shortcut" data-open-skills/);
  assert.match(source, /data-tab="items"[\s\S]*?data-open-skills/);
});

test("level-ups restore half of maximum HP and fully restore mana", () => {
  const context = loadBrowserGame();
  vm.runInContext(`newRun("Tester"); state.hp=30; state.mana=0; gainXp(xpToNext());`, context);
  assert.equal(vm.runInContext("state.maxHp", context), 120);
  assert.equal(vm.runInContext("state.hp", context), 90);
  assert.equal(vm.runInContext("state.maxMana", context), 60);
  assert.equal(vm.runInContext("state.mana", context), 60);
  vm.runInContext("state.hp=115; gainXp(xpToNext());", context);
  assert.equal(vm.runInContext("state.hp", context), 140);
});

test("health potions scale by rarity and max HP while mana potions stay flat", () => {
  const context = loadBrowserGame();
  vm.runInContext(`newRun("Tester"); state.maxHp=301; state.items=[
    {name:"Legendary Healing Potion",type:"health",rarity:"Legendary",amount:40,quantity:1},
    {name:"Legendary Mana Potion",type:"mana",rarity:"Legendary",amount:24,quantity:1}
  ];`, context);
  assert.equal(vm.runInContext("healthPotionRestore(state.items[0])", context), 151);
  assert.equal(vm.runInContext("healthPotionRestore({rarity:'Common'})", context), 61);
  const itemMarkup = vm.runInContext("renderInventoryItems('items')", context);
  assert.match(itemMarkup, /Restores 50% max HP \(151 HP now\)/);
  assert.match(itemMarkup, /Restores 24 mana/);
});

test("leaderboard keeps each character's best cleared-floor record and ignores Dev runs", () => {
  const context = loadBrowserGame();
  vm.runInContext(`
    recordLeaderboard({name:"Mira",chosenClass:"mage",difficulty:"hard",floorsCleared:4,level:9});
    recordLeaderboard({name:"Mira",chosenClass:"mage",difficulty:"easy",floorsCleared:2,level:12});
    recordLeaderboard({name:"Mira",chosenClass:"mage",difficulty:"normal",floorsCleared:5,level:10});
    recordLeaderboard({name:"Dev Tester",chosenClass:"warrior",difficulty:"normal",floorsCleared:99,level:99,devMode:true});
  `, context);
  const markup = vm.runInContext("renderLeaderboard()", context);
  assert.match(markup, /Mira/);
  assert.match(markup, /Mage · Normal/);
  assert.match(markup, />5</);
  assert.doesNotMatch(markup, /Dev Tester/);
  assert.equal(vm.runInContext("loadLeaderboard().length", context), 1);
});

test("malformed or injected local leaderboard data cannot inject markup", () => {
  const context = loadBrowserGame();
  const key = "dungeon-simulation-local-leaderboard-v1";
  context.localStorage.setItem(key, JSON.stringify([
    { name: "<svg/onload=alert()>", className: "Mage", difficulty: "Hard", floors: 4, level: 8, date: 1 },
    { name: "Bad score", className: "Mage", difficulty: "Hard", floors: 999999999, level: 1, date: 2 },
    null
  ]));
  const markup = vm.runInContext("renderLeaderboard()", context);
  assert.match(markup, /&lt;svg\/onload=alert\(\)&gt;/);
  assert.doesNotMatch(markup, /<svg\/onload/);
  assert.doesNotMatch(markup, /Bad score/);

  context.testWeapon = {name:"Sword",type:"Sword",file:'x" onerror="alert(1)'};
  const weaponMarkup = vm.runInContext("weaponArt(testWeapon)", context);
  assert.doesNotMatch(weaponMarkup, /onerror="alert/);
});

test("class choice stays locked and off-class weapons remain sellable but unequippable", () => {
  const context = loadBrowserGame();
  vm.runInContext(`newRun("Tester"); chooseClass("warrior"); state.weapons.push({name:"Test Bow",type:"Bow",rarity:"Rare",damage:20,crit:0});`, context);
  const markup = vm.runInContext(`inventoryWeaponFamily="archer"; renderInventoryItems("weapons")`, context);
  assert.match(markup, /Archer weapon/);
  assert.match(markup, /data-inventory-sell="weapon"/);
  vm.runInContext("equipWeapon(1)", context);
  assert.equal(vm.runInContext("state.class", context), "warrior");
  assert.notEqual(vm.runInContext("state.weapon.type", context), "Bow");
});

test("the three class defenses mitigate actual incoming damage and consume their capacity", () => {
  const context = loadBrowserGame();
  const setup = (klass, defense, armor = {}) => vm.runInContext(`state={class:"${klass}",chosenClass:"${klass}",hp:100,mana:50,weapon:{},equippedArmor:${JSON.stringify(armor)},activeDefense:${JSON.stringify(defense)},braced:false,log:[],runStats:{damageTaken:0},combat:{damageTaken:0}};`, context);
  setup("warrior", {type:"block",capacity:6}, {shield:{defense:2,damageReduction:0}});
  assert.equal(vm.runInContext("takePlayerDamage(10)", context), 4);
  assert.equal(vm.runInContext("state.activeDefense.capacity", context), 0);
  setup("mage", {type:"aegis",capacity:8});
  assert.equal(vm.runInContext("takePlayerDamage(10)", context), 2);
  setup("archer", {type:"dodge",capacity:0});
  assert.equal(vm.runInContext("takePlayerDamage(10)", context), 5);
});

test("combat displays armor-adjusted damage for telegraphed enemy attacks", () => {
  const context = loadBrowserGame();
  vm.runInContext(`
    newRun("Tester"); chooseClass("warrior");
    state.equippedArmor={chest:{damageReduction:2}};
    const enemy={name:"Test Caster",klass:"Mage",hp:50,maxHp:50,damage:10,dodge:0,element:"Fire",intent:{key:"cast",label:"Fire bolt"}};
    state.target=0; state.combat={enemies:[enemy]};
    var combatMarkup=renderCombat([{enemy,index:0}]);
  `, context);
  assert.match(vm.runInContext("combatMarkup", context), /Potential hit: 10/);
});

test("class defenses spend a turn, apply once, and begin their cooldown", () => {
  const context = loadBrowserGame();
  for (const [klass, action, armor, expectedHp, expectedMana, cooldownKey] of [
    ["warrior", "block", {shield:{defense:2,damageReduction:0}}, 96, 50, "block"],
    ["mage", "aegis", {}, 100, 42, "aegis"],
    ["archer", "dodge", {}, 95, 50, "dodge"]
  ]) {
    vm.runInContext(`
      newRun("Tester"); chooseClass("${klass}");
      state.equippedArmor=${JSON.stringify(armor)};
      state.target=0;
      state.combat={boss:false,summonedCount:0,damageDealt:0,damageTaken:0,enemies:[{name:"Attacker",race:"goblin",klass:"Warrior",hp:100,maxHp:100,damage:10,dodge:0,intent:{key:"attack",label:"Strike"}}]};
      combatAction("${action}");
    `, context);
    assert.equal(vm.runInContext("state.hp", context), expectedHp, `${klass} mitigation`);
    assert.equal(vm.runInContext("state.mana", context), expectedMana, `${klass} resource cost`);
    assert.equal(vm.runInContext(`state.defenseCooldowns.${cooldownKey}`, context), 2, `${klass} cooldown`);
  }
});

test("combat telegraphs before enemy damage instead of applying an unanswerable opening ambush", () => {
  const context = loadBrowserGame();
  context.Math.random = () => 0;
  vm.runInContext(`newRun("Tester"); chooseClass("warrior"); startCombat(false);`, context);
  assert.equal(vm.runInContext("state.hp", context), 100);
  assert.match(vm.runInContext("renderCombat(state.combat.enemies.map((enemy,index)=>({enemy,index})) )", context), /Potential hit:/);
});

test("a floor-two Legendary Warrior charge does not one-shot a normal floor-five enemy", () => {
  const context = loadBrowserGame();
  vm.runInContext(`
    newRun("Tester"); chooseClass("warrior");
    const entry=GAME_INDEX_DATA.weapons.warrior.find(item=>item.rarity==="Legendary");
    state.weapon=state.weapons[0]=window.DungeonRules.createCatalogWeapon(entry,2);
    state.str=10;
    const enemy=makeEnemy(5,false,0);
    state.combat={enemies:[enemy],boss:false}; state.target=0;
    state.chargedAttack={multiplier:1.5,critBonus:0.1};
    var attackPreviewResult=attackPreview({multiplier:1.5,critBonus:0.1});
    var enemyMaxHp=enemy.maxHp;
  `, context);
  assert.ok(vm.runInContext("attackPreviewResult.primaryDamage < enemyMaxHp", context));
});

test("shop odds keep divine rare with a small capped upgrade and prices rise steeply by tier", () => {
  const context = loadBrowserGame();
  vm.runInContext(`newRun("Tester");`, context);
  const rules = context.window.DungeonRules;
  assert.equal(rules.rollShopRarity(0, 0.998), "Mythic");
  assert.equal(rules.rollShopRarity(0, 0.999), "Divine");
  assert.equal(rules.rollShopRarity(5, 0.997), "Mythic");
  assert.equal(rules.rollShopRarity(5, 0.998), "Divine");
  const prices = vm.runInContext(`["Common","Uncommon","Rare","Epic","Legendary","Mythic","Divine"].map(rarity=>priceFor(100,rarity))`, context);
  assert.deepEqual(Array.from(prices), [100,135,190,280,450,800,1500]);
});

test("shop stock upgrade persists for the run and costs increase exponentially", () => {
  const context = loadBrowserGame();
  vm.runInContext(`newRun("Tester"); state.gold=10000; state.shopStock=Array.from({length:6},()=>shopItem());`, context);
  const firstCost = vm.runInContext("shopUpgradeCost()", context);
  vm.runInContext("upgradeShopLoot()", context);
  assert.equal(vm.runInContext("state.shopLootUpgradeLevel", context), 1);
  assert.equal(vm.runInContext("state.shopStock.length", context), 6);
  assert.equal(vm.runInContext("shopUpgradeCost()", context), firstCost * 2);
});

test("shop sales remove chosen inventory goods and add gold", () => {
  const context = loadBrowserGame();
  vm.runInContext(`newRun("Tester"); chooseClass("warrior"); state.weapons.push({name:"Unequipped Sword",type:"Sword",rarity:"Rare",damage:12}); state.items.push({name:"Health Potion",type:"health",amount:25,rarity:"Common",quantity:2});`, context);
  const weaponValue = vm.runInContext("sellValue(state.weapons[1], 'weapon')", context);
  vm.runInContext("sellItem('weapon', 1)", context);
  assert.equal(vm.runInContext("state.weapons.length", context), 1);
  assert.equal(vm.runInContext("state.gold", context), weaponValue);
  vm.runInContext("sellItem('item', 0)", context);
  assert.equal(vm.runInContext("state.items[0].quantity", context), 1);
  vm.runInContext("modal='inventory'; sellItem('item', 0, 'inventory')", context);
  assert.equal(vm.runInContext("modal", context), "inventory");
});

test("inventory groups weapons by class and clears the new-gear marker when opened", () => {
  const context = loadBrowserGame();
  vm.runInContext(`newRun("Tester"); chooseClass("warrior"); state.weapons.push({name:"Test Bow",type:"Bow",rarity:"Rare",damage:20,file:"test-bow.png"}); state.inventoryNotice=true;`, context);
  const warriorMarkup = vm.runInContext("renderInventoryItems('weapons')", context);
  assert.match(warriorMarkup, /Warrior/);
  assert.doesNotMatch(warriorMarkup, /Test Bow/);
  vm.runInContext("inventoryWeaponFamily='archer'", context);
  const archerMarkup = vm.runInContext("renderInventoryItems('weapons')", context);
  assert.match(archerMarkup, /Test Bow/);
  assert.match(archerMarkup, /data-weapon-sort=\"damage\"/);
  assert.match(archerMarkup, /data-inventory-sell=\"weapon\"/);
  vm.runInContext("openInventory()", context);
  assert.equal(vm.runInContext("state.inventoryNotice", context), false);
});

test("cleared enemy rooms use the same map tile as empty rooms", () => {
  const context = loadBrowserGame();
  assert.equal(vm.runInContext("mapRoomImage({type:'enemy', cleared:true})", context), "Images/Rooms/empty-room.png");
  assert.equal(vm.runInContext("mapRoomImage({type:'enemy', cleared:false})", context), "Images/Rooms/enemy-room.png");
});
