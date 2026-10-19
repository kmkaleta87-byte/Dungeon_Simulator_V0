const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function loadBrowserGame(leaderboardApi = "") {
  const screen = { innerHTML: "", querySelectorAll: () => [], querySelector: () => null, addEventListener: () => {}, insertAdjacentHTML: () => {} };
  const button = { hidden: false, addEventListener: () => {} };
  const storage = new Map();
  const context = {
    testScreen: screen,
    document: { querySelector: selector => selector === "#game-screen" ? screen : button },
    window: { LEADERBOARD_API: leaderboardApi },
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

test("enemy floor scaling stays flat through floor two and begins on floor three", () => {
  const context = loadBrowserGame();
  assert.equal(vm.runInContext("floorEnemyScale(1,1.25)", context), 1);
  assert.equal(vm.runInContext("floorEnemyScale(2,1.25)", context), 1);
  assert.equal(vm.runInContext("floorEnemyScale(3,1.25)", context), 1.25);
  vm.runInContext("newRun('Tester'); state.difficulty='normal'", context);
  const floorOne = vm.runInContext("makeEnemy(1)", context);
  const floorTwo = vm.runInContext("makeEnemy(2)", context);
  const floorThree = vm.runInContext("makeEnemy(3)", context);
  assert.equal(floorOne.maxHp, floorTwo.maxHp);
  assert.equal(floorOne.damage, floorTwo.damage);
  assert.ok(floorThree.maxHp > floorTwo.maxHp);
  assert.ok(floorThree.damage > floorTwo.damage);
  assert.ok(floorOne.maxHp < 48, `expected normal floor-one HP below old 48 baseline, got ${floorOne.maxHp}`);
  assert.ok(floorOne.damage < 14, `expected normal floor-one damage below old 14 baseline, got ${floorOne.damage}`);
});

test("floor-four enemies deal meaningful damage against a high-health player", () => {
  const context = loadBrowserGame();
  vm.runInContext(`newRun("Tester"); chooseClass("warrior"); state.maxHp=280; state.hp=280; state.equippedArmor={head:{damageReduction:2},chest:{damageReduction:3},legs:{damageReduction:2},feet:{damageReduction:2}};`, context);
  const normal = vm.runInContext("makeEnemy(4, false)", context);
  const boss = vm.runInContext("makeEnemy(4, true)", context);
  assert.ok(normal.damage >= 8, `expected floor-four normal damage >= 8, got ${normal.damage}`);
  assert.ok(boss.damage > normal.damage, `expected floor-four boss damage > ${normal.damage}, got ${boss.damage}`);
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

test("legacy local leaderboard data is difficulty-filtered and capped at 100", () => {
  const context = loadBrowserGame();
  context.localStorage.setItem("dungeon-simulation-local-leaderboard-v1", JSON.stringify([
    {name:"Mira",className:"Mage",difficulty:"Hard",floors:4,level:9,date:1},
    {name:"Mira",className:"Mage",difficulty:"Easy",floors:2,level:12,date:2},
    {name:"Mira",className:"Mage",difficulty:"Normal",floors:5,level:10,date:3},
  ]));
  vm.runInContext(`leaderboardDifficulty="normal"; leaderboardStatus="unconfigured"; leaderboardEntries=loadLeaderboard("normal")`, context);
  const markup = vm.runInContext("renderLeaderboard()", context);
  assert.match(markup, /Mira/);
  assert.match(markup, /Top 100 Normal scores/);
  assert.match(markup, />5</);
  assert.match(markup, /Easy/);
  assert.match(markup, /Hard/);
  assert.equal(vm.runInContext("loadLeaderboard('normal').length", context), 1);
  assert.equal(vm.runInContext("loadLeaderboard('hard').length", context), 1);
  assert.equal(vm.runInContext("loadLeaderboard('easy').length", context), 1);

  vm.runInContext(`
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(Array.from({length:105},(_,i)=>({name:"Player "+i,className:"Mage",difficulty:"Normal",floors:105-i,level:1,date:i}))));
  `, context);
  assert.equal(vm.runInContext("loadLeaderboard('normal').length", context), 100);
  assert.equal(vm.runInContext("loadLeaderboard('normal')[0].floors", context), 105);
});

test("global leaderboard API difficulty keys are accepted and normalized for display", () => {
  const context = loadBrowserGame();
  const apiRows = [
    {name:"Kiki the Archer",className:"Archer",difficulty:"normal",floors:1,level:5,date:1792117637096},
    {name:"Easy Player",className:"Warrior",difficulty:"easy",floors:2,level:3,date:100},
    {name:"Hard Player",className:"Mage",difficulty:"hard",floors:3,level:4,date:200}
  ];
  context.testApiRows = apiRows;
  const normalized = vm.runInContext("validateLeaderboardEntries(testApiRows)", context);
  assert.deepEqual(Array.from(normalized, row=>row.difficulty), ["hard","easy","normal"]);
  vm.runInContext(`leaderboardDifficulty="normal";leaderboardStatus="ready";leaderboardEntries=validateLeaderboardEntries(testApiRows).filter(row=>row.difficulty==="normal")`, context);
  assert.match(vm.runInContext("renderLeaderboard()", context), /Kiki the Archer/);
  assert.doesNotMatch(vm.runInContext("renderLeaderboard()", context), /No Normal records yet/);
});

test("personal bests update independently for Easy, Normal, and Hard and reject malformed storage", () => {
  const context = loadBrowserGame();
  const improved = vm.runInContext(`
    const results = [
      updatePersonalBest({name:"Easy Run",chosenClass:"warrior",difficulty:"easy",floorsCleared:3,level:4}),
      updatePersonalBest({name:"Normal Run",chosenClass:"archer",difficulty:"normal",floorsCleared:5,level:6}),
      updatePersonalBest({name:"Hard Run",chosenClass:"mage",difficulty:"hard",floorsCleared:2,level:3}),
      updatePersonalBest({name:"Old Easy Run",chosenClass:"warrior",difficulty:"easy",floorsCleared:2,level:99})
    ]; results;
  `, context);
  assert.deepEqual(Array.from(improved), [true, true, true, false]);
  const bests = JSON.parse(context.localStorage.getItem("dungeon-simulation-personal-bests-v1"));
  assert.deepEqual(Object.fromEntries(Object.entries(bests).map(([key, value]) => [key, { name: value.name, className: value.className, floors: value.floors, level: value.level }])), {
    easy: { name: "Easy Run", className: "Warrior", floors: 3, level: 4 },
    normal: { name: "Normal Run", className: "Archer", floors: 5, level: 6 },
    hard: { name: "Hard Run", className: "Mage", floors: 2, level: 3 }
  });
  assert.ok(Object.values(bests).every(value => Number.isFinite(value.date)));
  assert.match(vm.runInContext("renderPersonalBests()", context), /Easy Run/);
  assert.match(vm.runInContext("renderPersonalBests()", context), /Normal Run/);
  assert.match(vm.runInContext("renderPersonalBests()", context), /Hard Run/);
  context.localStorage.setItem("dungeon-simulation-personal-bests-v1", "{bad json");
  assert.deepEqual(Object.keys(vm.runInContext("loadPersonalBests()", context)), []);
});

test("completed-run global submission is once-only, avoids dev runs, and does not gate local bests", async () => {
  const context = loadBrowserGame("https://api.example");
  const requests = [];
  context.fetch = async (...args) => { requests.push(args); return { ok: true, json: async () => ({ result: "not_eligible" }) }; };
  vm.runInContext(`state={name:"Tester",chosenClass:"warrior",difficulty:"hard",floorsCleared:4,level:5}; updatePersonalBest(state); submitCompletedRun(state); submitCompletedRun(state);`, context);
  assert.equal(JSON.parse(context.localStorage.getItem("dungeon-simulation-personal-bests-v1")).hard.floors, 4);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(vm.runInContext("state.leaderboardSubmitted", context), true);
  assert.equal(requests.length, 1);
  vm.runInContext(`submitCompletedRun({name:"Dev",devMode:true,difficulty:"normal",floorsCleared:999,level:99})`, context);
  assert.equal(requests.length, 1);
  assert.equal(vm.runInContext("submitCompletedRun({name:'Tester',difficulty:'normal',floorsCleared:0,level:1})", context), undefined);
});

test("malformed or injected local leaderboard data cannot inject markup", () => {
  const context = loadBrowserGame();
  const key = "dungeon-simulation-local-leaderboard-v1";
  context.localStorage.setItem(key, JSON.stringify([
    { name: "<svg/onload=alert()>", className: "Mage", difficulty: "Hard", floors: 4, level: 8, date: 1 },
    { name: "Bad score", className: "Mage", difficulty: "Hard", floors: 999999999, level: 1, date: 2 },
    null
  ]));
  vm.runInContext(`leaderboardDifficulty="hard"; leaderboardStatus="unconfigured"; leaderboardEntries=loadLeaderboard("hard")`, context);
  const markup = vm.runInContext("renderLeaderboard()", context);
  assert.match(markup, /&lt;svg\/onload=alert\(\)&gt;/);
  assert.doesNotMatch(markup, /<svg\/onload/);
  assert.doesNotMatch(markup, /Bad score/);

  context.testWeapon = {name:"Sword",type:"Sword",file:'x" onerror="alert(1)'};
  const weaponMarkup = vm.runInContext("weaponArt(testWeapon)", context);
  assert.doesNotMatch(weaponMarkup, /onerror="alert/);
});

test("off-class weapons equip without changing class and clearly show the penalty", () => {
  const context = loadBrowserGame();
  vm.runInContext(`newRun("Tester"); chooseClass("warrior"); state.weapons.push({name:"Test Bow",type:"Bow",rarity:"Rare",damage:20,crit:0});`, context);
  const markup = vm.runInContext(`inventoryWeaponFamily="archer"; renderInventoryItems("weapons")`, context);
  assert.match(markup, /Off-class damage: 75%/);
  assert.match(markup, /data-inventory-sell="weapon"/);
  vm.runInContext("equipWeapon(1)", context);
  assert.equal(vm.runInContext("state.class", context), "warrior");
  assert.equal(vm.runInContext("state.weapon.type", context), "Bow");
  assert.match(vm.runInContext("state.log.map(entry=>entry.text).join(' ')", context), /25% less damage/);
});

test("off-class damage penalty appears in actual basic attack damage and preview", () => {
  const context = loadBrowserGame();
  vm.runInContext(`
    newRun("Tester"); chooseClass("warrior");
    const bow=DUNGEON_RULES.createCatalogWeapon(GAME_INDEX_DATA.weapons.archer.find(item=>item.rarity==="Common"),1);
    state.weapons.push(bow); state.weapon=bow; state.str=10; state.critChance=0; state.arrows=10;
    const enemy={name:"Target",hp:500,maxHp:500,damage:1,dodge:0,damageReduction:0,element:"Neutral",intent:{key:"attack",label:"Attacking"},effects:{}};
    state.target=0; state.combat={enemies:[enemy],boss:false,damageDealt:0,damageTaken:0,summonedCount:0};
    Math.random=()=>0.99; var expected=attackPreview({multiplier:1,critBonus:0}).primaryDamage;
    combatAction("basic"); var enemyAfter=state.combat.enemies[0].hp;
  `, context);
  assert.equal(vm.runInContext("enemyAfter", context), 500-vm.runInContext("expected", context));
  assert.match(vm.runInContext("state.log.map(entry=>entry.text).join(' ')", context), /off-class damage penalty/);
  assert.equal(vm.runInContext("state.arrows", context), 9);
});

test("off-class staffs use mana and off-class bows use shared arrows", () => {
  const context = loadBrowserGame();
  vm.runInContext(`
    newRun("Tester"); chooseClass("warrior");
    const staff=DUNGEON_RULES.createCatalogWeapon(GAME_INDEX_DATA.weapons.mage.find(item=>item.rarity==="Common"),1);
    const bow=DUNGEON_RULES.createCatalogWeapon(GAME_INDEX_DATA.weapons.archer.find(item=>item.rarity==="Common"),1);
    var staffUsesMana=DUNGEON_RULES.weaponUsesMana(staff,state.class);
    var bowUsesMana=DUNGEON_RULES.weaponUsesMana(bow,state.class);
    state.weapon=bow; state.arrows=4; var bowConsumesArrow=attackPreview({multiplier:1,critBonus:0}).ammoCost;
  `, context);
  assert.equal(vm.runInContext("staffUsesMana", context), true);
  assert.equal(vm.runInContext("bowUsesMana", context), false);
  assert.equal(vm.runInContext("bowConsumesArrow", context), 1);
  vm.runInContext(`state.weapon=bow; state.arrows=0; var fallback=DUNGEON_RULES.basicAttackFallback(state.class,bow.type,state.mana,state.arrows);`, context);
  assert.equal(vm.runInContext("fallback", context), "arrows");
  vm.runInContext(`(()=>{
    const mageStaff=state.weapons.find(item=>item.type==="Staff")||DUNGEON_RULES.createCatalogWeapon(GAME_INDEX_DATA.weapons.mage.find(item=>item.rarity==="Common"),1);
    state.weapon=mageStaff; state.mana=40; state.hp=100; state.arrows=0;
    const target={name:"Guard",hp:500,maxHp:500,damage:1,dodge:0,damageReduction:0,element:"Neutral",intent:{key:"guard",label:"Guard"},effects:{}};
    state.target=0; state.combat={enemies:[target],boss:false,damageDealt:0,damageTaken:0,summonedCount:0};
    Math.random=()=>0.99; combatAction("basic");
  })()`,context);
  assert.equal(vm.runInContext("state.mana",context),40-vm.runInContext("state.weapon.manaCost",context));
});

test("every off-class family keeps the chosen class, and off-class AoE matches both damage previews", () => {
  const context=loadBrowserGame();
  for(const [klass,family,type] of [["warrior","archer","Bow"],["archer","mage","Staff"],["mage","warrior","Sword"]]){
    vm.runInContext(`(()=>{newRun("Tester"); chooseClass("${klass}"); const item=GAME_INDEX_DATA.weapons.${family}.find(entry=>entry.type==="${type}"&&entry.rarity==="Rare"); const weapon=DUNGEON_RULES.createCatalogWeapon(item,2); state.weapons.push(weapon); equipWeapon(state.weapons.length-1);})()`,context);
    assert.equal(vm.runInContext("state.class",context),klass);
    assert.equal(vm.runInContext(`weaponFamily(state.weapon)`,context),family);
    assert.equal(vm.runInContext("DUNGEON_RULES.weaponDamageMultiplier(state.class,state.weapon)",context),0.75);
  }
  vm.runInContext(`
    var aoeResults=(()=>{newRun("Tester"); chooseClass("warrior");
    const entry=GAME_INDEX_DATA.weapons.archer.find(item=>item.type==="Bow"&&item.rarity==="Epic");
    const bow=DUNGEON_RULES.createCatalogWeapon(entry,2); state.weapon=bow; state.weapons.push(bow); state.arrows=10; state.critChance=0;
    const first={name:"First",hp:500,maxHp:500,damage:1,dodge:0,damageReduction:0,element:"Neutral",intent:{key:"attack",label:"Strike"},effects:{}};
    const second={name:"Second",hp:500,maxHp:500,damage:1,dodge:0,damageReduction:0,element:"Neutral",intent:{key:"attack",label:"Strike"},effects:{}};
    state.target=0; state.combat={enemies:[first,second],boss:false,damageDealt:0,damageTaken:0,summonedCount:0};
    Math.random=()=>0.99; const aoe=bow.attacks.find(attack=>attack.aoe); const expected=attackPreview(aoe,2,first);
    combatAction(aoe.command); return {primaryLoss:500-first.hp,secondaryLoss:500-second.hp,expected};})();
  `,context);
  assert.equal(vm.runInContext("aoeResults.primaryLoss",context),vm.runInContext("aoeResults.expected.primaryDamage",context));
  assert.equal(vm.runInContext("aoeResults.secondaryLoss",context),vm.runInContext("aoeResults.expected.secondaryDamage",context));
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

test("Mage retains a basic strike after Aegis and while a shield blocks spellcasting", () => {
  const context = loadBrowserGame();
  vm.runInContext(`
    newRun("Tester"); chooseClass("mage");
    const enemy={name:"Attacker",race:"goblin",klass:"Warrior",hp:1000,maxHp:1000,damage:1,dodge:0,intent:{key:"attack",label:"Strike"}};
    state.target=0; state.combat={boss:false,summonedCount:0,damageDealt:0,damageTaken:0,enemies:[enemy]};
    combatAction("aegis");
    var actionsAfterAegis=getActions();
    state.mana=0;
    var actionsAtZeroMana=getActions();
    state.equippedArmor.shield={defense:2};
    state.weapon.attacks=[{name:"Magic Bolt",command:"magicbolt",multiplier:1,manaCost:3}];
    enemy.intent={key:"guard",label:"Guard"};
    var actionsWithShield=getActions();
    var manaBeforeShieldStrike=state.mana, hpBeforeShieldStrike=enemy.hp;
    Math.random=()=>0.99; combatAction("basic");
    var manaAfterShieldStrike=state.mana, hpAfterShieldStrike=enemy.hp;
  `, context);
  assert.match(vm.runInContext("actionsAfterAegis", context), /data-attack="basic"(?! disabled)/);
  assert.match(vm.runInContext("actionsAtZeroMana", context), /data-attack="basic"(?! disabled)[^>]*>Staff strike/);
  assert.match(vm.runInContext("actionsWithShield", context), /data-attack="basic"(?! disabled)[^>]*>Staff strike/);
  assert.match(vm.runInContext("actionsWithShield", context), /data-attack="magicbolt" disabled/);
  assert.equal(vm.runInContext("manaAfterShieldStrike", context), vm.runInContext("manaBeforeShieldStrike", context));
  assert.ok(vm.runInContext("hpAfterShieldStrike", context)<vm.runInContext("hpBeforeShieldStrike", context));
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
  assert.ok(vm.runInContext("attackPreviewResult.primaryDamage < enemyMaxHp", context), `charge damage ${vm.runInContext("attackPreviewResult.primaryDamage", context)} vs ${vm.runInContext("enemyMaxHp", context)} HP`);
});

test("weapon forge applies per-weapon upgrades, limits, floor resets, and permits off-class weapons", () => {
  const context = loadBrowserGame();
  vm.runInContext(`
    newRun("Tester"); chooseClass("warrior"); state.gold=10000;
    const entry=GAME_INDEX_DATA.weapons.warrior.find(item=>item.rarity==="Rare");
    const forged=DUNGEON_RULES.createCatalogWeapon(entry,1);
    state.weapons=[forged]; state.weapon=forged; state.upgradeWeaponIndex=0;
    const baseDamage=forged.damage, baseCrit=forged.crit;
    upgradeWeapon("damage"); upgradeWeapon("crit"); upgradeWeapon("effect");
  `, context);
  assert.equal(vm.runInContext("state.weapon.damageUpgrade", context), 1);
  assert.equal(vm.runInContext("state.weapon.critUpgrade", context), 0.01);
  assert.ok(Math.abs(vm.runInContext("state.weapon.effectChance", context)-0.24)<1e-12);
  assert.equal(vm.runInContext("state.weapon.upgradesThisFloor", context), 3);
  const goldAfterLimit = vm.runInContext("state.gold", context);
  vm.runInContext("upgradeWeapon('speed')", context);
  assert.equal(vm.runInContext("state.gold", context), goldAfterLimit);
  vm.runInContext("state.floor=2; upgradeWeapon('damage')", context);
  assert.equal(vm.runInContext("state.weapon.damageUpgrade", context), 3);
  assert.equal(vm.runInContext("state.weapon.upgradesThisFloor", context), 1);
  vm.runInContext(`state.weapons.push(DUNGEON_RULES.createCatalogWeapon(GAME_INDEX_DATA.weapons.archer.find(item=>item.rarity==="Rare"),2)); state.upgradeWeaponIndex=1; const goldBeforeOffClass=state.gold; upgradeWeapon("damage");`, context);
  assert.equal(vm.runInContext("state.weapons[1].damageUpgrade", context), 2);
  assert.ok(vm.runInContext("state.gold", context)<vm.runInContext("goldBeforeOffClass", context));
});

test("a fully absorbed shield Block counters once for a non-critical half basic hit", () => {
  const context=loadBrowserGame();
  vm.runInContext(`
    newRun("Tester"); chooseClass("warrior"); state.critChance=1;
    const enemy={name:"Attacker",hp:500,maxHp:500,damage:1,dodge:0,damageReduction:0,effects:{}};
    state.target=0; state.combat={enemies:[enemy],damageDealt:0,damageTaken:0};
    state.equippedArmor={}; state.activeDefense={type:"block",capacity:5};
    var counterExpected=attackPreview({multiplier:0.5,critBonus:0,manaCost:0,ammoCost:0},1,enemy).primaryDamage;
    takePlayerDamage(5,enemy); var afterFirst=enemy.hp;
    takePlayerDamage(1,enemy); var afterSecond=enemy.hp;
  `,context);
  assert.equal(vm.runInContext("500-afterFirst",context),vm.runInContext("counterExpected",context));
  assert.equal(vm.runInContext("afterSecond",context),vm.runInContext("afterFirst",context));
  assert.equal(vm.runInContext("state.activeDefense.counterUsed",context),true);
});

test("partial Block absorption does not counter, and combat resolves a lethal counter", () => {
  const context=loadBrowserGame();
  vm.runInContext(`
    newRun("Tester"); chooseClass("warrior");
    const partial={name:"Partial",hp:500,maxHp:500,damage:1,dodge:0,damageReduction:0};
    state.combat={enemies:[partial],damageDealt:0,damageTaken:0}; state.target=0;
    state.activeDefense={type:"block",capacity:1}; takePlayerDamage(5,partial); var partialHp=partial.hp;
    const victim={name:"Last Attacker",hp:1,maxHp:1,damage:1,dodge:0,damageReduction:0,intent:{key:"attack",label:"Strike"},effects:{}};
    state.combat={enemies:[victim],boss:false,damageDealt:0,damageTaken:0,summonedCount:0}; state.target=0;
    state.equippedArmor={}; state.activeDefense={type:"block",capacity:20}; state.hp=100; state.armor=[];
    Math.random=()=>0.99; enemyTurn(); var combatResolved=!state.combat;
  `,context);
  assert.equal(vm.runInContext("partialHp",context),500);
  assert.equal(vm.runInContext("combatResolved",context),true);
});

test("Index Guide and shop gear comparisons expose planned information", () => {
  const context=loadBrowserGame();
  vm.runInContext(`
    newRun("Tester"); chooseClass("warrior");
    indexCategory="guide"; var guide=renderIndexCategory();
    const offer={kind:"weapon",value:{name:"Test Bow",type:"Bow",rarity:"Rare",damage:20,crit:0.1,element:"Fire",attacks:[{name:"Volley"}]},price:40};
    var comparison=renderShopGearItem(offer,0);
  `,context);
  assert.match(vm.runInContext("guide",context),/Mana and arrows/);
  assert.match(vm.runInContext("guide",context),/Off-class weapons/);
  assert.match(vm.runInContext("comparison",context),/off-class ×0\.75/);
  assert.match(vm.runInContext("comparison",context),/Equipped:/);
  assert.match(vm.runInContext("comparison",context),/Volley/);
  vm.runInContext(`const pieces=ARMOR_INDEX.slice(0,5).map(entry=>DUNGEON_RULES.createCatalogArmor(entry,2)); state.equippedArmor=Object.fromEntries(pieces.map(piece=>[piece.slot,piece])); var armorComparison=pieces.map((piece,index)=>renderShopGearItem({kind:"armor",value:{...piece,name:"New " + piece.slot}},index)).join(" ");`,context);
  assert.match(vm.runInContext("armorComparison",context),/defense/);
  assert.match(vm.runInContext("armorComparison",context),/damage reduction/);
  assert.match(vm.runInContext("armorComparison",context),/Equipped:/);
});

test("high DEX grants one optional attack before enemy actions and never chains", () => {
  const context = loadBrowserGame();
  vm.runInContext(`
    newRun("Tester"); chooseClass("warrior"); state.dex=20; state.str=10;
    const weapon=state.weapon; weapon.damage=1; weapon.attacks=[];
    const enemy={name:"Training Target",hp:1000,maxHp:1000,damage:1,dex:10,dodge:0,gold:0,xp:0,intent:{key:"guard",label:"Guard"}};
    state.combat={boss:false,enemies:[enemy],damageDealt:0,damageTaken:0,summonedCount:0};
    state.attackCooldowns={sample:2}; state.target=0; Math.random=()=>0.4;
    combatAction("basic");
  `, context);
  assert.equal(vm.runInContext("state.combat.bonusAttackPending", context), true);
  assert.equal(vm.runInContext("state.attackCooldowns.sample", context), 2);
  assert.match(vm.runInContext("state.log.map(entry=>entry.text).join(' ')", context), /too fast/i);
  vm.runInContext("combatAction('basic')", context);
  assert.equal(vm.runInContext("state.combat.bonusAttackPending", context), false);
  assert.equal(vm.runInContext("state.attackCooldowns.sample", context), 1);
  assert.match(vm.runInContext("renderCombat(state.combat.enemies.map((enemy,index)=>({enemy,index})))", context), /Your turn/);
  let useHandler;
  context.testScreen.querySelectorAll = selector => selector === "[data-use-item]" ? [{ dataset: { useItem: "0" }, addEventListener: (_type, handler) => { useHandler = handler; } }] : [];
  vm.runInContext(`state.items=[{name:"Potion",type:"health",quantity:1}]; state.hp=50; state.combat.bonusAttackPending=true; bindUseItem();`, context);
  useHandler();
  assert.equal(vm.runInContext("state.items[0].quantity", context), 1);
  assert.equal(vm.runInContext("state.hp", context), 50);
  assert.equal(vm.runInContext("state.combat.bonusAttackPending", context), true);
});

test("elite spawn odds start on floor five, rise per enemy, and cap at thirty percent", () => {
  const context = loadBrowserGame();
  assert.equal(vm.runInContext("eliteChanceForFloor(4)", context), 0);
  assert.equal(vm.runInContext("eliteChanceForFloor(5)", context), 0.03);
  assert.equal(vm.runInContext("eliteChanceForFloor(14)", context), 0.3);
  assert.equal(vm.runInContext("eliteChanceForFloor(54)", context), 0.3);
  vm.runInContext(`
    const group=[{name:"A",boss:false,element:"Water"},{name:"B",boss:false,element:"Earth"},{name:"Boss",boss:true,element:"Fire"}];
    const rolls=[0.02,0,0.02,0.99,0];
    applyEliteAffinities(group,5,()=>rolls.shift());
    var eliteTestGroup=group;
  `, context);
  assert.equal(vm.runInContext("eliteTestGroup[0].elite", context), true);
  assert.equal(vm.runInContext("eliteTestGroup[0].affinity", context), "Fire");
  assert.equal(vm.runInContext("eliteTestGroup[0].element", context), "Fire");
  assert.equal(vm.runInContext("eliteTestGroup[1].elite", context), true);
  assert.equal(vm.runInContext("eliteTestGroup[1].affinity", context), "Wind");
  assert.equal(vm.runInContext("eliteTestGroup[2].elite", context), undefined);
});

test("early elite crowd adjustment only softens four-enemy rooms and fades by floor fifteen", () => {
  const context = loadBrowserGame();
  assert.equal(vm.runInContext("eliteCrowdReductionChance(5)", context), 0.5);
  assert.equal(vm.runInContext("eliteCrowdReductionChance(14)", context), 0.05);
  assert.equal(vm.runInContext("eliteCrowdReductionChance(15)", context), 0);
  assert.equal(vm.runInContext("eliteCrowdReductionChance(54)", context), 0);
  vm.runInContext(`
    var eliteFour=Array.from({length:4},(_,i)=>({elite:i===0}));
    var adjustedAtFive=compensateEliteCrowd(eliteFour,5,()=>0.49);
    var eliteThree=Array.from({length:3},(_,i)=>({elite:i===0}));
    var adjustedAtFifteen=compensateEliteCrowd(eliteFour,15,()=>0);
    var adjustedThree=compensateEliteCrowd(eliteThree,5,()=>0);
  `, context);
  assert.equal(vm.runInContext("adjustedAtFive", context), true);
  assert.equal(vm.runInContext("eliteFour.length", context), 3);
  assert.equal(vm.runInContext("eliteFour.some(enemy=>enemy.elite)", context), true);
  assert.equal(vm.runInContext("adjustedAtFifteen", context), false);
  assert.equal(vm.runInContext("adjustedThree", context), false);
});

test("elite affinity effects proc at a fixed fifteen percent only on landed damaging intents", () => {
  const context = loadBrowserGame();
  vm.runInContext("newRun('Tester')", context);
  for (const [affinity,effect] of [["Fire","Burn"],["Water","Freeze"],["Earth","Cripple"],["Wind","Blind"]]) {
    context.testAffinity=affinity; context.testEffect=effect;
    assert.equal(vm.runInContext("tryApplyEliteAffinityEffect({elite:true,affinity:testAffinity,affinityEffect:testEffect,damage:10},'attack',true,()=>0.149)", context), true);
    assert.ok(vm.runInContext("Boolean(state.playerEffects[testEffect])", context));
    vm.runInContext("state.playerEffects={}", context);
  }
  assert.equal(vm.runInContext("tryApplyEliteAffinityEffect({elite:true,affinity:'Fire',affinityEffect:'Burn'},'attack',true,()=>0.15)", context), false);
  assert.equal(vm.runInContext("tryApplyEliteAffinityEffect({elite:true,affinity:'Fire',affinityEffect:'Burn'},'attack',false,()=>0)", context), false);
  assert.equal(vm.runInContext("tryApplyEliteAffinityEffect({elite:true,affinity:'Fire',affinityEffect:'Burn'},'guard',true,()=>0)", context), false);
  assert.equal(vm.runInContext("state.playerEffects.Burn", context), undefined);
});

test("elite player effects tick, interrupt, weaken, and miss attacks with clear feedback", () => {
  const context = loadBrowserGame();
  vm.runInContext(`
    newRun('Tester'); chooseClass('warrior');
    state.playerEffects={Burn:{turns:1,stacks:2}}; state.hp=100; tickPlayerCombatEffects();
    var burnTickHp=state.hp, burnExpired=!state.playerEffects.Burn;
    const enemy={name:'Practice Enemy',hp:500,maxHp:500,damage:1,dex:20,dodge:0,gold:0,xp:0,intent:{key:'guard',label:'Guard'}};
    state.combat={boss:false,enemies:[enemy],damageDealt:0,damageTaken:0,summonedCount:0};
    state.target=0; state.playerEffects={Freeze:{turns:2,stacks:5}}; combatAction('basic');
    var freezeEnemyHp=enemy.hp, freezeCleared=!state.playerEffects.Freeze;
    state.playerEffects={};
    var uncrippledPreview=attackPreview({multiplier:1}).primaryDamage;
    state.playerEffects={Cripple:{turns:2,stacks:1}};
    var cripplePreview=attackPreview({multiplier:1}).primaryDamage;
    state.playerEffects={Blind:{turns:2,stacks:1}}; Math.random=()=>0.1;
    var beforeBlindAttack=enemy.hp; combatAction('basic'); var blindDamage=beforeBlindAttack-enemy.hp;
    var playerBadges=renderPlayerCombatStatuses();
  `, context);
  assert.equal(vm.runInContext("burnTickHp", context), 96);
  assert.equal(vm.runInContext("burnExpired", context), true);
  assert.equal(vm.runInContext("freezeEnemyHp", context), 500);
  assert.equal(vm.runInContext("freezeCleared", context), true);
  assert.ok(vm.runInContext("cripplePreview", context)<vm.runInContext("uncrippledPreview", context));
  assert.equal(vm.runInContext("blindDamage", context), 0);
  assert.match(vm.runInContext("playerBadges", context), /20% chance to miss/);
  assert.match(vm.runInContext("state.log.map(entry=>entry.text).join(' ')", context), /lose this action|miss/i);
});

test("lethal elite Burn ends the run", () => {
  const context = loadBrowserGame();
  vm.runInContext(`newRun('Tester'); state.hp=3; state.playerEffects={Burn:{turns:1,stacks:5}}; tickPlayerCombatEffects();`, context);
  assert.equal(vm.runInContext("state.hp", context), 0);
  assert.equal(vm.runInContext("modal", context), "death");
});

test("new elite effects keep their full duration until the next enemy turn", () => {
  const context = loadBrowserGame();
  vm.runInContext(`
    newRun('Tester'); state.hp=100;
    state.combat={enemies:[],freshPlayerEffects:[]};
    tryApplyEliteAffinityEffect({elite:true,affinity:'Fire',affinityEffect:'Burn',damage:1},'attack',true,()=>0);
    tickPlayerCombatEffects();
    var freshBurnHp=state.hp, freshBurnTurns=state.playerEffects.Burn.turns;
    state.combat.freshPlayerEffects=[]; tickPlayerCombatEffects();
    var nextBurnHp=state.hp;
  `, context);
  assert.equal(vm.runInContext("freshBurnHp", context), 100);
  assert.equal(vm.runInContext("freshBurnTurns", context), 3);
  assert.equal(vm.runInContext("nextBurnHp", context), 98);
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
  assert.equal(vm.runInContext("state.shopPotions.length", context), 2);
  assert.equal(vm.runInContext("shopUpgradeCost()", context), firstCost * 2);
});

test("shop has six gear offers and a separate two-potion selection", () => {
  const context = loadBrowserGame();
  vm.runInContext(`newRun('Tester'); chooseClass('mage'); state.gold=100000; openShop();`, context);
  assert.equal(vm.runInContext("state.shopStock.length", context), 6);
  assert.ok(vm.runInContext("state.shopStock.every(item => item.kind === 'weapon' || item.kind === 'armor')", context));
  assert.equal(vm.runInContext("state.shopPotions.length", context), 2);
  vm.runInContext("buyPotion(0)", context);
  assert.equal(vm.runInContext("state.shopPotions.length", context), 1);
  assert.equal(vm.runInContext("state.items.length", context), 1);
  vm.runInContext("state.gold=100000; rerollShop()", context);
  assert.equal(vm.runInContext("state.shopPotions.length", context), 2);
  assert.equal(vm.runInContext("state.shopStock.length", context), 6);
});

test("combat gear rewards can include a separate bonus potion", () => {
  const context = loadBrowserGame();
  context.Math.random = () => 0;
  vm.runInContext(`
    newRun('Tester'); chooseClass('warrior');
    state.currentFloor.rooms[0]={...state.currentFloor.rooms[0],type:'enemy',enemyCount:1};
    state.combat={boss:false,enemies:[{name:'Test Enemy',gold:5,xp:1,summoned:false}],damageDealt:0,damageTaken:0,log:[]};
    winFight();
  `, context);
  assert.equal(vm.runInContext("state.weapons.length", context), 2);
  assert.equal(vm.runInContext("state.items.length", context), 1);
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

test("matching potions stack from drops and existing saves without merging different variants", () => {
  const context = loadBrowserGame();
  vm.runInContext(`
    newRun("Tester"); state.items=[];
    grantLoot({kind:"item",value:{name:"Rare Healing Potion",type:"health",rarity:"Rare",amount:0,quantity:1}});
    grantLoot({kind:"item",value:{name:"Rare Healing Potion",type:"health",rarity:"Rare",amount:0,quantity:2}});
    grantLoot({kind:"item",value:{name:"Rare Mana Potion",type:"mana",rarity:"Rare",amount:30,quantity:1}});
    var stackedBeforeMigration=state.items.map(item=>item.quantity);
    state.items.push({name:"Rare Healing Potion",type:"health",rarity:"Rare",amount:0,quantity:3});
    migrateBrowserSave();
    var stackedAfterMigration=state.items.map(item=>item.quantity);
    var potionMarkup=renderInventoryItems("items");
  `, context);
  assert.deepEqual(Array.from(vm.runInContext("stackedBeforeMigration", context)), [3, 1]);
  assert.deepEqual(Array.from(vm.runInContext("stackedAfterMigration", context)), [6, 1]);
  assert.match(vm.runInContext("potionMarkup", context), /Rare Healing Potion/);
  assert.match(vm.runInContext("potionMarkup", context), /x6/);
});

test("armor inventory equips the highest-defense piece independently for each slot", () => {
  const context = loadBrowserGame();
  vm.runInContext(`
    newRun("Tester"); chooseClass("warrior"); render=()=>{}; save=()=>{};
    const lowHead={name:"Light Hood",slot:"head",defense:2,damageReduction:5,healthBonus:0,set:"Light",rarity:"Common"};
    const highHead={name:"Iron Helm",slot:"head",defense:8,damageReduction:1,healthBonus:0,set:"Iron",rarity:"Rare"};
    const chest={name:"Iron Chest",slot:"chest",defense:6,damageReduction:4,healthBonus:5,set:"Iron",rarity:"Rare"};
    state.armor=[lowHead,highHead,chest]; state.equippedArmor={head:lowHead};
    var armorMarkup=renderInventoryItems("armor");
    var equipBestHandler;
    screen.querySelector=selector=>selector==="#inventory-list [data-equip-best]"?{addEventListener:(_type,handler)=>{equipBestHandler=handler;}}:null;
    bindInventoryListActions(); equipBestHandler();
    var bestHead=state.equippedArmor.head.name, bestChest=state.equippedArmor.chest.name;
  `, context);
  assert.match(vm.runInContext("armorMarkup", context), /data-equip-best/);
  assert.equal(vm.runInContext("bestHead", context), "Iron Helm");
  assert.equal(vm.runInContext("bestChest", context), "Iron Chest");
});

test("cleared enemy rooms use the same map tile as empty rooms", () => {
  const context = loadBrowserGame();
  assert.equal(vm.runInContext("mapRoomImage({type:'enemy', cleared:true})", context), "Images/Rooms/empty-room.png");
  assert.equal(vm.runInContext("mapRoomImage({type:'enemy', cleared:false})", context), "Images/Rooms/enemy-room.png");
});

test("generated floors retain one boss and place the guaranteed shop outside its path cell", () => {
  const context = loadBrowserGame();
  for (let floor = 1; floor <= 30; floor++) {
    vm.runInContext(`
      state={floor:${floor},difficulty:'normal'}; var generatedFloor=makeFloor(${floor});
      var reachable=new Set([generatedFloor.currentId]), frontier=[generatedFloor.currentId];
      while(frontier.length){const id=frontier.shift();const room=generatedFloor.rooms.find(item=>item.id===id);for(const edge of room.connections)if(!reachable.has(edge.id)){reachable.add(edge.id);frontier.push(edge.id);}}
      var bossRoom=generatedFloor.rooms.find(room=>room.type==='boss');
    `, context);
    assert.equal(vm.runInContext("generatedFloor.rooms.filter(room=>room.type==='boss').length", context), 1, `floor ${floor}`);
    assert.equal(vm.runInContext("generatedFloor.rooms.filter(room=>room.type==='shop').length", context), 1, `floor ${floor}`);
    assert.ok(vm.runInContext("reachable.has(bossRoom.id)", context), `boss is reachable on floor ${floor}`);
  }
});

test("boss fights expose usable combat and inventory choices while disabling flee", () => {
  const context = loadBrowserGame();
  vm.runInContext(`
    newRun('Tester');chooseClass('warrior');
    state.combat={boss:true,summonedCount:0,damageDealt:0,damageTaken:0,enemies:[{name:'Boss',hp:500,maxHp:500,damage:10,dodge:0,intent:{key:'attack',label:'Strike'}}]};
    var bossActions=getActions();var combatInventoryButton=inventoryButtonMarkup();
  `, context);
  const actions = vm.runInContext("bossActions", context);
  assert.match(actions, /data-attack="basic"(?! disabled)/);
  assert.match(vm.runInContext("combatInventoryButton", context), /data-open-inventory/);
  assert.match(actions, /Use health potion/);
  assert.match(actions, /data-action="flee" disabled/);
});

test("XP rewards crossing multiple thresholds award one skill point per level", () => {
  const context = loadBrowserGame();
  vm.runInContext(`newRun('Tester');state.level=8;state.skillPoints=0;state.xp=0;var gained=gainXp(5000);`, context);
  assert.ok(vm.runInContext("gained", context) > 1);
  assert.equal(vm.runInContext("state.skillPoints", context), vm.runInContext("gained", context));
  assert.ok(vm.runInContext("state.xp", context) >= 0);
  assert.ok(vm.runInContext("state.xp", context) < vm.runInContext("xpToNext()", context));
});

test("archer arrows are one visible shared resource with explicit costs and safe bounds", () => {
  const context = loadBrowserGame();
  context.Math.random = () => 0.99;
  vm.runInContext(`
    newRun('Tester');chooseClass('archer');state.arrows=2;
    state.combat={boss:false,summonedCount:0,damageDealt:0,damageTaken:0,enemies:[{name:'Target',race:'slime',klass:'Warrior',hp:500,maxHp:500,damage:1,dodge:0,intent:{key:'guard',label:'Guard'}}]};state.target=0;
    combatAction('basic');var afterShot=state.arrows;var arrowLog=state.log.map(entry=>entry.text).join(' ');
    state.arrows=0;var zeroArrowInventory=renderInventoryItems('items');var exhaustedActions=getActions();
    changeArrowCount(-5);var lowerBound=state.arrows;changeArrowCount(40);var upperBound=state.arrows;
  `, context);
  assert.equal(vm.runInContext("afterShot", context), 1);
  assert.match(vm.runInContext("arrowLog", context), /spend 1 arrow\. 1 shared arrow remains/);
  assert.match(vm.runInContext("zeroArrowInventory", context), /0 shared arrows/);
  assert.match(vm.runInContext("exhaustedActions", context), /data-attack="basic"(?! disabled)[^>]*>Unarmed jab/);
  assert.equal(vm.runInContext("lowerBound", context), 0);
  assert.equal(vm.runInContext("upperBound", context), 30);
});

test("leaderboard shows a retryable network error separately from a genuinely empty board", async () => {
  const context = loadBrowserGame("https://leaderboard.example");
  context.fetch = async () => { throw new Error("offline"); };
  await vm.runInContext("refreshGlobalLeaderboard('normal')", context);
  assert.equal(vm.runInContext("leaderboardStatus", context), "error");
  assert.match(vm.runInContext("renderLeaderboard()", context), /could not be reached[\s\S]*Retry/);
  context.fetch = async () => ({ ok: true, json: async () => ({ scores: [] }) });
  await vm.runInContext("refreshGlobalLeaderboard('normal')", context);
  assert.equal(vm.runInContext("leaderboardStatus", context), "ready");
  assert.match(vm.runInContext("renderLeaderboard()", context), /No Normal records yet/);
  assert.doesNotMatch(vm.runInContext("renderLeaderboard()", context), /could not be reached/);
});

test("all combat damage sources clamp and remove a target killed by an elemental Sundering effect", () => {
  const context = loadBrowserGame();
  vm.runInContext(`
    newRun('Tester'); chooseClass('warrior');
    const primary={name:'Primary',hp:100,maxHp:100,effects:{},damage:1,intent:{key:'guard'}};
    const chained={name:'Chained',hp:3,maxHp:3,effects:{},damage:1,intent:{key:'guard'}};
    state.weapon.effect='Shock'; state.combat={boss:false,enemies:[primary,chained],damageDealt:0,damageTaken:0,summonedCount:0};
    applyWeaponEffect(primary,'Shock',20,true);
  `, context);
  assert.equal(vm.runInContext("state.combat.enemies[1].hp", context), 0);
  assert.equal(vm.runInContext("state.combat.damageDealt", context), 3);
  assert.match(vm.runInContext("state.log[0].text", context), /Chained falls/);
});

test("inventory category survives armor and item actions that rerender the modal", () => {
  const context = loadBrowserGame();
  vm.runInContext(`newRun('Tester'); chooseClass('warrior'); state.items=[{name:'Test Potion',type:'health',amount:10,rarity:'Common',quantity:1}]; inventoryCategory='items'; modal='inventory';`, context);
  vm.runInContext("sellItem('item',0,'inventory')", context);
  assert.equal(vm.runInContext("inventoryCategory", context), 'items');
  assert.match(vm.runInContext("renderInventoryItems(inventoryCategory)", context), /No items in your pack/);
  vm.runInContext(`state.armor.push({name:'Test Boots',slot:'feet',rarity:'Common',defense:1,damageReduction:0,healthBonus:0}); inventoryCategory='armor';`, context);
  vm.runInContext("equipArmor(0)", context);
  assert.equal(vm.runInContext("inventoryCategory", context), 'armor');
});

test("equipping successive armor pieces updates the list in place and preserves its scroll offset", () => {
  const context = loadBrowserGame();
  const inventoryList = { scrollTop: 684, scrollLeft: 0, innerHTML: "" };
  context.testScreen.querySelector = selector => selector === "#inventory-list" ? inventoryList : null;
  vm.runInContext(`
    newRun('Tester'); chooseClass('warrior');
    state.armor=[
      {name:'Iron Helm',slot:'head',rarity:'Common',defense:1,damageReduction:0,healthBonus:0},
      {name:'Iron Chest',slot:'chest',rarity:'Common',defense:1,damageReduction:0,healthBonus:0},
      {name:'Iron Boots',slot:'feet',rarity:'Common',defense:1,damageReduction:0,healthBonus:0}
    ];
    inventoryCategory='armor';modal='inventory';
    equipArmor(0);equipArmor(1);equipArmor(2);
  `, context);
  assert.equal(inventoryList.scrollTop, 684);
  assert.equal(vm.runInContext("inventoryCategory", context), "armor");
  assert.equal(vm.runInContext("Object.keys(state.equippedArmor).length", context), 3);
});

test("archer basic hits restore mana", () => {
  const context = loadBrowserGame();
  context.Math.random = () => 0.5;
  vm.runInContext(`
    newRun('Tester');chooseClass('archer');state.mana=0;state.arrows=5;
    state.combat={boss:false,summonedCount:0,damageDealt:0,damageTaken:0,enemies:[{name:'Target',race:'slime',klass:'Warrior',hp:500,maxHp:500,damage:1,dodge:0,intent:{key:'guard',label:'Guard'}}]};state.target=0;
    combatAction('basic');
  `, context);
  assert.equal(vm.runInContext("state.mana", context), 1);
  assert.match(vm.runInContext("state.log.map(entry=>entry.text).join(' ')", context), /restores 1 mana/);
});

test("archer special mana recovery requires a successful hit", () => {
  const context = loadBrowserGame();
  context.Math.random = () => 0.99;
  vm.runInContext(`
    newRun('Tester');chooseClass('archer');state.mana=0;state.arrows=5;
    state.weapon.attacks=[{name:'Pinning Shot',command:'pinshot',multiplier:1,cooldown:0,effect:'Pin',manaGain:1}];
    state.combat={boss:false,summonedCount:0,damageDealt:0,damageTaken:0,enemies:[{name:'Dodger',race:'specter',klass:'Warrior',hp:500,maxHp:500,damage:1,dodge:1,intent:{key:'guard',label:'Guard'}}]};state.target=0;
    combatAction('pinshot');
  `, context);
  assert.equal(vm.runInContext("state.mana", context), 0);
});

test("Update V1.1 consolidates features and bug fixes into separate sections", () => {
  const source = fs.readFileSync("patch-notes.js", "utf8");
  assert.match(source, /"v1\.1"[\s\S]*?heading: "New Features"[\s\S]*?Mage mana costs and drop rates[\s\S]*?heading: "Bugs"[\s\S]*?boss path[\s\S]*?Staff strike/i);
  assert.match(source, /Matching potions stack[\s\S]*?Equip Best[\s\S]*?full effectiveness above 20[\s\S]*?every five stat levels/i);
  assert.doesNotMatch(source, /V0(?:\.\d+)?/i);
});

test("Update V1.2 separates verified bug fixes from strategy and gear features", () => {
  const source = fs.readFileSync("patch-notes.js", "utf8");
  assert.match(source, /"v1\.2"[\s\S]*?subtitle: "Regions, tactical combat, meaningful choices, and bug fixes"[\s\S]*?heading: "New Features"[\s\S]*?off-class weapon attacks deal 25% less damage[\s\S]*?shield Block[\s\S]*?Quick Guide[\s\S]*?four five-floor regions[\s\S]*?heading: "Bugs"[\s\S]*?Boss rooms remain[\s\S]*?shared count[\s\S]*?connection failures[\s\S]*?Retry/);
});

test("enemy formations assign a vanguard to a ranged ally and boss patterns rotate", () => {
  const context = loadBrowserGame();
  const formation = vm.runInContext(`(() => {
    const enemies=[{klass:"Warrior",hp:10},{klass:"Archer",hp:10}];
    const assigned=assignEnemyFormation(enemies,()=>0);
    return {assigned,role:enemies[0].formationRole,protector:enemies[1].protectedByIndex};
  })()`, context);
  assert.deepEqual({ ...formation }, { assigned: true, role: "Vanguard", protector: 0 });
  assert.equal(vm.runInContext(`assignEnemyFormation([{klass:"Warrior"},{klass:"Warrior"}],()=>0)`, context), false);
  const pattern = vm.runInContext(`(() => { const boss={name:"The Moonfang Alpha",bossTurn:0}; return [nextBossIntent(boss).label,nextBossIntent(boss).label,nextBossIntent(boss).label,nextBossIntent(boss).label]; })()`, context);
  assert.deepEqual(Array.from(pattern), ["Alpha Pounce", "Circle the Prey", "Moonfang Rend", "Alpha Pounce"]);
});

test("risky route choice promises better rewards and the trait guide covers enemy races", () => {
  const context = loadBrowserGame();
  vm.runInContext(`
    state={floor:2,xp:0,level:1,skillPoints:0,gold:0,difficulty:"normal",weapons:[],armor:[],items:[],equippedArmor:{},
      currentFloor:{rooms:[{id:"r0",type:"enemy",enemyCount:2,cleared:false,riskyChoice:true}],currentId:"r0"},
      runStats:{enemiesDefeated:0,damageDealt:0,damageTaken:0,fights:[]},log:[],
      combat:{boss:false,enemies:[{name:"Test",gold:10,xp:100,summoned:false}],damageDealt:0,damageTaken:0,log:[]}};
    makeLoot=()=>({kind:"item",value:{rarity:"Common",name:"Test drop"}}); grantLoot=()=>{}; Math.random=()=>0.99;
    winFight();
  `, context);
  assert.equal(vm.runInContext("state.gold", context), 15);
  assert.match(vm.runInContext("state.runStats.fights[0].rewards", context), /\+203 XP/);
  assert.match(vm.runInContext("state.runStats.fights[0].rewards", context), /Test drop/);
  const traits = vm.runInContext(`["slime","skeleton","goblin","specter","vampire","werewolf","golem"].map(race=>enemyTrait({race}))`, context);
  assert.equal(Array.from(traits).length, 7);
  assert.match(String(traits[1]), /ranged attacks hit harder/);
  assert.match(String(traits[4]), /heals on landed hits/);
  assert.match(String(traits[6]), /reduces incoming damage/);
});

test("Update V1.2 notes document the tactical additions without campaign story", () => {
  const source = fs.readFileSync("patch-notes.js", "utf8");
  assert.match(source, /guarded line[\s\S]*?Enemy races now have readable[\s\S]*?forked enemy encounter[\s\S]*?Bosses follow recognizable, repeating combat patterns/);
  assert.doesNotMatch(source, /campaign story|new lore/i);
});

test("regions rotate every five floors, use bounded race pools, and repeat after twenty", () => {
  const context = loadBrowserGame();
  const boundaries = vm.runInContext(`[1,5,6,10,11,15,16,20,21].map(floor=>{const region=regionForFloor(floor);return [floor,region.id,region.cycle,region.regionStart,region.regionEnd]})`, context);
  assert.deepEqual(Array.from(boundaries, row=>Array.from(row)), [
    [1,"undead",1,1,5],[5,"undead",1,1,5],[6,"warrens",1,6,10],[10,"warrens",1,6,10],
    [11,"haunted",1,11,15],[15,"haunted",1,11,15],[16,"feral-stone",1,16,20],[20,"feral-stone",1,16,20],[21,"undead",2,21,25]
  ]);
  const pools = vm.runInContext(`Array.from({length:40},(_,i)=>{const floor=i+1;const enemy=makeEnemy(floor);return regionForFloor(floor).races.includes(enemy.race)})`, context);
  assert.ok(Array.from(pools).every(Boolean));
  assert.equal(vm.runInContext("makeEnemy(20,true).name", context), "The Threshold Warden");
  assert.equal(vm.runInContext("makeEnemy(20,true).milestoneBoss", context), true);
  assert.equal(vm.runInContext("makeEnemy(21,true).milestoneBoss", context), false);
  const regionIndex = vm.runInContext("indexCategory='regions';renderIndexCategory()", context);
  assert.match(regionIndex, /Undead Catacombs/);
  assert.match(regionIndex, /Threshold Warden/);
});

test("milestone boss victory offers a resumable end-or-continue decision and records on end", () => {
  const context = loadBrowserGame();
  vm.runInContext(`
    newRun("Milestone Tester"); state.floor=20; state.floorsCleared=20; state.milestonePending=true;
    const beforeFloor=state.floor; advanceFloor(); var blockedAtMilestone=state.floor===beforeFloor;
    finishMilestoneRun();
  `, context);
  assert.equal(vm.runInContext("blockedAtMilestone", context), true);
  assert.equal(vm.runInContext("state.runEnded", context), true);
  assert.equal(vm.runInContext("state.milestonePending", context), false);
  assert.equal(vm.runInContext("modal", context), "run-end");
  assert.equal(vm.runInContext("loadPersonalBests().normal.floors", context), 20);
  assert.equal(vm.runInContext("state.leaderboardSubmitted", context), true);
});

test("V1.2 patch notes include regions and milestone bosses", () => {
  const notes = fs.readFileSync("patch-notes.js", "utf8");
  const page = fs.readFileSync("index.html", "utf8");
  assert.match(notes, /"v1\.2"[\s\S]*?four five-floor regions[\s\S]*?own regular-enemy and boss pool[\s\S]*?Threshold Warden[\s\S]*?global leaderboard/);
  assert.match(page, /data-patch="v1\.2"[^>]*>Update V1\.2 <span>Current<\/span>/);
  assert.match(fs.readFileSync("Images/ART_ASSET_CHECKLIST.txt", "utf8"), /Floors\/HauntedHollows\/environment-background\.png[\s\S]*?floor-20-milestone-boss\.png - The Threshold Warden/);
});
