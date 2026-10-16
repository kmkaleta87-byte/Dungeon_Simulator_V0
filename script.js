const screen = document.querySelector("#game-screen");
const titleButton = document.querySelector("#menu-button");
const indexButton = document.querySelector("#index-button");
const GAME_INDEX_DATA = window.GAME_INDEX_DATA;
const DUNGEON_RULES = window.DungeonRules;
const SAVE_KEY = "dungeon-simulation-browser-save-v1";
const SAVE_SLOTS_KEY = "dungeon-simulation-browser-slots-v1";
const LEADERBOARD_KEY = "dungeon-simulation-local-leaderboard-v1";
const PERSONAL_BESTS_KEY = "dungeon-simulation-personal-bests-v1";
const LEADERBOARD_API = window.LEADERBOARD_API || "";
const LEADERBOARD_DIFFICULTIES = ["easy", "normal", "hard"];
const SAVE_SLOT_IDS = ["slot1", "slot2", "slot3", "dev"];
const CLASS_NAMES = { warrior: "Warrior", archer: "Archer", mage: "Mage" };
const RARITIES = ["Common", "Uncommon", "Rare", "Epic", "Legendary", "Mythic", "Divine"];
const HEALTH_POTION_PERCENT = { Common: 20, Uncommon: 25, Rare: 30, Epic: 40, Legendary: 50, Mythic: 65, Divine: 80 };
const DIFFICULTIES = {
  easy: { label: "Easy", enemyHealth: 0.8, enemyDamage: 1.5, xpRequirement: 0.8, shopCost: 0.8 },
  normal: { label: "Normal", enemyHealth: 1.5, enemyDamage: 2, xpRequirement: 1, shopCost: 1 },
  hard: { label: "Hard", enemyHealth: 2, enemyDamage: 2.5, xpRequirement: 1.4, shopCost: 1.5 }
};
const WEAPONS = {
  warrior: [["Cinder Knife", "Dagger", "Common", "cinder-knife.png", 7, "Fire"]],
  archer: [["Frayed Hunting Bow", "Bow", "Common", "frayed-hunting-bow.png", 7, "Physical"]],
  mage: [["Cracked Ember Staff", "Staff", "Common", "cracked-ember-staff.png", 8, "Fire"]]
};
const RARITY_MULTIPLIER = [1, 1.25, 1.6, 2.1, 2.8, 3.7, 5];
const EFFECT_DETAILS = [
  ["Burn", "🔥", "Deals damage over time; fire attacks can spread it to nearby enemies."],
  ["Freeze", "❄️", "Builds stacks until the target becomes frozen."],
  ["Gust", "🌪️", "Pushes enemies away or pulls them toward an attack's center."],
  ["Root", "🌿", "Prevents an enemy from moving for a short duration."],
  ["Poison", "☠️", "Deals stacking damage over time."],
  ["Blind", "✨", "Reduces enemy accuracy and can cause attacks to miss."],
  ["Void", "🌑", "Deals dark damage that partially ignores defenses."],
  ["Shock", "⚡", "Lightning damage can arc to nearby enemies."],
  ["Bleed", "🩸", "Deals physical damage over time; stronger against wounded enemies."],
  ["Life Steal", "❤️", "Restores health based on damage dealt."],
  ["Mana Steal", "🔵", "Restores mana based on damage dealt."],
  ["Execution", "💀", "Deals greatly increased damage against weakened enemies."],
  ["Momentum", "📈", "Consecutive attacks without interruption increase damage."],
  ["Marked", "🎯", "Marked enemies take increased damage from the weapon or user."],
  ["Thorns", "🛡️", "Attackers take damage when striking the wielder."],
  ["Chain", "🔗", "Certain attacks jump to another nearby enemy."]
];
const ARMOR_INDEX = [...GAME_INDEX_DATA.armor, {
  name: "Iron Chestplate", rarity: "Common", type: "Chest Armor", set: "Iron",
  description: "A starter iron chestplate found in the first room.", file: "iron-chestplate.png"
}];
const ITEM_INDEX = [...GAME_INDEX_DATA.items, {
  name: "Small Healing Potion", rarity: "Common", type: "Potion",
  description: "A small potion found in the starting room that restores health.", file: "small-health-potion.png"
}];
const ROOM_LABELS = {
  start: "Starting Room", enemy: "Enemy Room", empty: "Empty Room", treasure: "Treasure Room",
  weapon: "Weapon Cache", fountain: "Fountain Room", shop: "Shop Room", trap: "Treasure Room", boss: "Boss Room"
};
const roomNames = {
  slime: ["Slime", "Basic"],
  skeleton: [["Skeleton Warrior", "Warrior"], ["Skeleton Archer", "Archer"], ["Skeleton Mage", "Mage"]],
  goblin: [["Goblin Warrior", "Warrior"], ["Goblin Archer", "Archer"], ["Goblin Mage", "Mage"]],
  specter: [["Specter Warrior", "Warrior"], ["Specter Mage", "Mage"]],
  vampire: [["Vampire Warrior", "Warrior"], ["Vampire Mage", "Mage"]],
  werewolf: [["Werewolf Warrior", "Warrior"], ["Werewolf Archer", "Archer"]],
  golem: ["Golem Warrior", "Warrior"]
};
const bossNames = ["The Slime Sovereign", "The Bone Regent", "The Goblin King", "The Veiled Haunt", "The Crimson Count", "The Moonfang Alpha", "The Mountain Heart", "The Bone Necromancer"];

let state = null;
let modal = null;
let indexCategory = "warrior";
let selectedIndexItem = null;
let inventoryWeaponFamily = "warrior";
let inventoryCategory = "weapons";
let weaponSort = { key: "rarity", direction: "desc" };
let leaderboardDifficulty = "normal";
let leaderboardEntries = [];
let leaderboardStatus = "idle";
let leaderboardRequest = 0;

indexButton.addEventListener("click", () => { modal = "index"; selectedIndexItem = null; showModal(); });
document.querySelector("#leaderboard-button").addEventListener("click", () => { modal = "leaderboard"; showModal(); });

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

function slug(value) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function randomInt(max) { return Math.floor(Math.random() * max); }
function choice(items) { return items[randomInt(items.length)]; }
function rarityClass(rarity) { return `rarity-${slug(rarity)}`; }
function message(text, tone = "") {
  state.log.unshift({ text, tone }); state.log = state.log.slice(0, 12);
  if (state.combat) { state.combat.log ||= []; state.combat.log.push({ text, tone }); state.combat.log = state.combat.log.slice(-80); }
}
function loadSaveSlots() {
  try {
    const stored = JSON.parse(localStorage.getItem(SAVE_SLOTS_KEY) || "null");
    if (stored) return { ...DUNGEON_RULES.createSaveSlots(), ...stored };
    const legacy = JSON.parse(localStorage.getItem(SAVE_KEY) || "null");
    if (!legacy) return DUNGEON_RULES.createSaveSlots();
    const slots = DUNGEON_RULES.createSaveSlots();
    slots[legacy.devMode ? "dev" : "slot1"] = legacy;
    return slots;
  } catch { return DUNGEON_RULES.createSaveSlots(); }
}
function save() {
  try {
    if (!state) return;
    const slots = loadSaveSlots();
    DUNGEON_RULES.writeSaveSlot(slots, SAVE_SLOT_IDS.includes(state.saveSlot) ? state.saveSlot : "slot1", state);
    localStorage.setItem(SAVE_SLOTS_KEY, JSON.stringify(slots));
  } catch { /* Browser storage may be disabled. */ }
}

function normalizeLeaderboardDifficulty(value) {
  const normalized=String(value||"").trim().toLowerCase();
  return LEADERBOARD_DIFFICULTIES.find(key=>key===normalized||DIFFICULTIES[key].label.toLowerCase()===normalized)||null;
}

function validateLeaderboardEntries(entries) {
  if (!Array.isArray(entries)) return [];
  const allowedClasses = [...Object.values(CLASS_NAMES), "Unchosen"];
  return entries.filter(entry => entry && typeof entry === "object" &&
    typeof entry.name === "string" && Number.isInteger(entry.floors) && entry.floors > 0 && entry.floors <= 100000 &&
    Number.isInteger(entry.level) && entry.level > 0 && entry.level <= 100000 &&
    allowedClasses.includes(entry.className) && normalizeLeaderboardDifficulty(entry.difficulty) !== null &&
    typeof entry.date === "number" && Number.isFinite(entry.date) && entry.name.trim().length > 0 && entry.name.length <= 22)
    .map(entry=>({...entry,difficulty:normalizeLeaderboardDifficulty(entry.difficulty)}))
    .sort((a, b) => b.floors - a.floors || b.level - a.level || a.date - b.date)
    .slice(0, 100);
}

function loadLeaderboard(difficulty = leaderboardDifficulty) {
  try {
    const entries = JSON.parse(localStorage.getItem(LEADERBOARD_KEY) || "[]");
    return validateLeaderboardEntries(entries).filter(entry => entry.difficulty.toLowerCase() === difficulty)
      .sort((a, b) => b.floors - a.floors || b.level - a.level || a.date - b.date).slice(0, 100);
  } catch { return []; }
}

function loadPersonalBests() {
  const allowedClasses = new Set([...Object.values(CLASS_NAMES), "Unchosen"]);
  try {
    const saved = JSON.parse(localStorage.getItem(PERSONAL_BESTS_KEY) || "{}");
    return Object.fromEntries(LEADERBOARD_DIFFICULTIES.flatMap(difficulty => {
      const item = saved?.[difficulty];
      if (!item || typeof item !== "object" || !Number.isInteger(item.floors) || item.floors < 0 || item.floors > 100000 ||
          !Number.isInteger(item.level) || item.level < 1 || item.level > 100000 || typeof item.name !== "string" || item.name.length > 22 ||
          !allowedClasses.has(item.className) || (item.date !== null && (!Number.isFinite(item.date) || item.date < 0))) return [];
      return [[difficulty, { name: item.name, className: item.className, floors: item.floors, level: item.level, date: item.date }]];
    }));
  } catch { return {}; }
}

function updatePersonalBest(run) {
  if (!run || run.devMode || !LEADERBOARD_DIFFICULTIES.includes(run.difficulty) || !Number.isInteger(run.floorsCleared) || run.floorsCleared < 1 || run.floorsCleared > 100000) return false;
  let bests;
  try { bests = JSON.parse(localStorage.getItem(PERSONAL_BESTS_KEY) || "{}"); } catch { bests = {}; }
  if (!bests || typeof bests !== "object" || Array.isArray(bests)) bests = {};
  const current = loadPersonalBests()[run.difficulty];
  if (current && current.floors >= run.floorsCleared) return false;
  bests[run.difficulty] = {
    name: String(run.name || "Adventurer").trim().slice(0, 22) || "Adventurer",
    className: CLASS_NAMES[run.chosenClass || run.class] || "Unchosen",
    floors: run.floorsCleared, level: Number.isInteger(run.level) && run.level > 0 ? run.level : 1, date: Date.now()
  };
  try { localStorage.setItem(PERSONAL_BESTS_KEY, JSON.stringify(bests)); return true; }
  catch { return false; }
}

function submitCompletedRun(run) {
  if (!run || run.devMode || run.leaderboardSubmitted || !LEADERBOARD_DIFFICULTIES.includes(run.difficulty) || !Number.isInteger(run.floorsCleared) || run.floorsCleared < 1 || run.floorsCleared > 100000) return;
  run.leaderboardSubmitted = true;
  run.runSubmissionStatus = LEADERBOARD_API ? "Submitting final score to the global board…" : "Global leaderboard is not configured; personal best is saved on this device.";
  if (!LEADERBOARD_API) return;
  fetch(`${LEADERBOARD_API.replace(/\/$/, "")}/scores`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: String(run.name || "Adventurer").trim().slice(0, 22) || "Adventurer", className: CLASS_NAMES[run.chosenClass || run.class] || "Unchosen", difficulty: run.difficulty, floors: run.floorsCleared, level: run.level || 1 })
  }).then(async response => {
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Score submission failed");
    if (data.result === "invalid") throw new Error("The server rejected this score as invalid.");
    run.runSubmissionStatus = data.result === "accepted" ? "Your score earned a place on the global top 100." : "Personal best saved. This score did not make the global top 100.";
    if (data.result === "accepted" && modal === "leaderboard") refreshGlobalLeaderboard(run.difficulty);
    if (state === run && modal === "death") render();
  }).catch(error => {
    run.runSubmissionStatus = `Personal best saved. Global submission failed: ${error.message}`;
    if (state === run && modal === "death") render();
  });
}

async function refreshGlobalLeaderboard(difficulty = leaderboardDifficulty) {
  leaderboardDifficulty = LEADERBOARD_DIFFICULTIES.includes(difficulty) ? difficulty : "normal";
  const requestId = ++leaderboardRequest;
  leaderboardStatus = LEADERBOARD_API ? "loading" : "unconfigured";
  leaderboardEntries = LEADERBOARD_API ? [] : loadLeaderboard(leaderboardDifficulty);
  updateLeaderboardView();
  if (!LEADERBOARD_API) return;
  try {
    const response = await fetch(`${LEADERBOARD_API.replace(/\/$/, "")}/scores?difficulty=${encodeURIComponent(leaderboardDifficulty)}`, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error("Leaderboard request failed");
    const data = await response.json();
    if (requestId !== leaderboardRequest) return;
    leaderboardEntries = validateLeaderboardEntries(data.scores);
    leaderboardStatus = "ready";
  } catch {
    if (requestId !== leaderboardRequest) return;
    leaderboardEntries = [];
    leaderboardStatus = "error";
  }
  updateLeaderboardView();
}

function renderLeaderboard() {
  const tabs = LEADERBOARD_DIFFICULTIES.map(key => `<button type="button" class="tab-button ${leaderboardDifficulty === key ? "active" : ""}" data-leaderboard-difficulty="${key}" aria-pressed="${leaderboardDifficulty === key}">${DIFFICULTIES[key].label}</button>`).join("");
  let contents;
  if (leaderboardStatus === "loading") contents = `<p class="empty-list">Loading the global ${DIFFICULTIES[leaderboardDifficulty].label} board…</p>`;
  else if (leaderboardStatus === "error") contents = `<p class="empty-list">The global leaderboard could not be reached. Check your connection and try again.</p><button class="small-button" data-leaderboard-retry>Retry</button>`;
  else contents = "";
  if (!contents && !leaderboardEntries.length) contents = `<p class="empty-list">No ${DIFFICULTIES[leaderboardDifficulty].label} records yet. Clear a boss floor to set the first record.</p>`;
  if (!contents) contents = `<div class="leaderboard-table" role="table" aria-label="Top 100 ${DIFFICULTIES[leaderboardDifficulty].label} scores"><div class="leaderboard-row leaderboard-head" role="row"><span>Rank</span><span>Character</span><span>Class</span><span>Level</span><span>Floors</span></div>${leaderboardEntries.map((entry, index) => `<div class="leaderboard-row" role="row"><span>${index + 1}</span><strong>${escapeHtml(entry.name)}</strong><span>${escapeHtml(entry.className)}</span><span>${entry.level}</span><b>${entry.floors}</b></div>`).join("")}</div>`;
  const notice = leaderboardStatus === "unconfigured" ? `<p class="leaderboard-note">Global leaderboard setup is not finished. Showing scores saved in this browser only; these are not shared.</p>` : "";
  return `${notice}<div class="leaderboard-tabs" role="tablist" aria-label="Difficulty leaderboard">${tabs}</div><div class="leaderboard-board">${contents}</div>`;
}

function updateLeaderboardView() {
  const backdrop = screen.querySelector(".modal-backdrop");
  if (!backdrop || modal !== "leaderboard") return;
  const markup = renderLeaderboard();
  const board = backdrop.querySelector(".leaderboard-board");
  if (board) board.innerHTML = markup.match(/<div class="leaderboard-board">([\s\S]*)<\/div>$/)?.[1] || "";
  const notice = backdrop.querySelector(".leaderboard-note");
  const newNotice = markup.match(/<p class="leaderboard-note">([\s\S]*?)<\/p>/)?.[1];
  if (notice && !newNotice) notice.remove();
  else if (!notice && newNotice) backdrop.querySelector(".leaderboard-tabs")?.insertAdjacentHTML("beforebegin", `<p class="leaderboard-note">${newNotice}</p>`);
  backdrop.querySelectorAll("[data-leaderboard-difficulty]").forEach(button => {
    const active = button.dataset.leaderboardDifficulty === leaderboardDifficulty;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function renderPersonalBests() {
  const bests = loadPersonalBests();
  return `<section class="personal-bests" aria-labelledby="personal-bests-title"><h3 id="personal-bests-title">Personal bests · this browser</h3><div class="personal-best-list">${LEADERBOARD_DIFFICULTIES.map(difficulty => {
    const best = bests[difficulty];
    return `<div class="personal-best-row"><strong>${DIFFICULTIES[difficulty].label}</strong><span>${best ? `${best.floors} floor${best.floors === 1 ? "" : "s"} · Lv ${best.level} · ${escapeHtml(best.name)}` : "Not set"}</span></div>`;
  }).join("")}</div></section>`;
}

function createWeapon(entry, rarity = entry[2], floor = 1) {
  const tier = Math.max(0, RARITIES.indexOf(rarity));
  const weapon = {
    name: entry[0], type: entry[1], rarity, file: entry[3], baseDamage: entry[4], element: entry[5],
    damage: Math.max(1, Math.round((entry[4] + floor) * RARITY_MULTIPLIER[tier] * (1 + (floor - 1) * 0.08))),
    crit: 0.05 + Math.max(0, tier) * 0.015,
    speed: entry[1] === "Dagger" || entry[1] === "Bow" ? 12 : 9
  };
  weapon.attacks = DUNGEON_RULES.createWeaponAttacks(
    entry[1] === "Bow" || entry[1] === "Crossbow" ? "archer" : entry[1] === "Staff" || entry[1] === "Wand" ? "mage" : "warrior",
    rarity, weapon.type, weapon.element, weapon.manaCost || 0
  );
  return weapon;
}

function equipCollectedArmor(armor) {
  state.equippedArmor ||= {};
  const occupied = state.equippedArmor[armor.slot];
  if (!occupied) state.equippedArmor[armor.slot] = armor;
  updateArmorBonuses();
}

function updateArmorBonuses() {
  if (!state) return;
  state.equippedArmor ||= {};
  state.baseMaxHp ??= state.maxHp;
  const bonus = DUNGEON_RULES.armorBonuses(state.equippedArmor, state.class).healthBonus;
  const previous = state.maxHp || state.baseMaxHp;
  state.maxHp = state.baseMaxHp + bonus;
  if (previous < state.maxHp) state.hp = Math.min(state.maxHp, state.hp + state.maxHp - previous);
  else state.hp = Math.min(state.hp, state.maxHp);
}

function migrateBrowserSave() {
  if (!state) return;
  state.saveSlot ||= state.devMode ? "dev" : "slot1";
  if(!DIFFICULTIES[state.difficulty])state.difficulty="normal";
  state.inventoryNotice ??= false;
  state.shopLootUpgradeLevel ??= 0;
  state.chosenClass ||= state.class || null;
  state.class=state.chosenClass;
  state.defenseCooldowns ||= { aegis: 0, block: 0, dodge: 0 };
  state.activeDefense ||= null;
  state.runStats ||= { enemiesDefeated: 0, damageDealt: 0, damageTaken: 0, fights: [] };
  state.equippedArmor ||= {};
  state.weapons ||= [];
  state.armor ||= [];
  const misplacedArmor = state.weapons.filter(item => item && (item.slot || item.defense !== undefined || item.damageReduction !== undefined));
  state.weapons = state.weapons.filter(item => !misplacedArmor.includes(item));
  for (const armor of misplacedArmor) {
    armor.slot ||= /shield/i.test(armor.type || armor.name) ? "shield" : /head|helmet/i.test(armor.type || armor.name) ? "head" : /leg/i.test(armor.type || armor.name) ? "legs" : /feet|boot/i.test(armor.type || armor.name) ? "feet" : "chest";
    if (!state.armor.some(item => item.name === armor.name && item.slot === armor.slot)) state.armor.push(armor);
  }
  for (const armor of state.armor || []) {
    armor.slot ||= /shield/i.test(armor.type || armor.name) ? "shield" : /head|helmet/i.test(armor.type || armor.name) ? "head" : /leg/i.test(armor.type || armor.name) ? "legs" : /feet|boot/i.test(armor.type || armor.name) ? "feet" : "chest";
    armor.set ||= (armor.name.match(/(?:Iron|Steel|Knightsteel|Runed Plate|Dragonforged|Starwoven|Celestial)/i) || ["Iron"])[0];
    armor.damageReduction ??= armor.defense || 1;
    armor.healthBonus ??= 0;
    armor.defense ??= armor.damageReduction;
    if(!armor.slotBonuses){
      const source=ARMOR_INDEX.find(entry=>entry.rarity===(armor.rarity||"Common")&&entry.type.toLowerCase().startsWith(armor.slot));
      if(source)armor.slotBonuses=DUNGEON_RULES.createCatalogArmor(source,state.floor||1).slotBonuses;
    }
    if (!state.equippedArmor[armor.slot]) state.equippedArmor[armor.slot] = armor;
  }
  for (const [slot, equipped] of Object.entries(state.equippedArmor)) {
    state.equippedArmor[slot] = state.armor.find(item => item.slot === slot && item.name === equipped.name) || equipped;
  }
  if (state.weapon) state.weapon = state.weapons.find(item => item.name === state.weapon.name && item.type === state.weapon.type) || state.weapon;
  for (const weapon of state.weapons || []) {
    if (!weapon.attacks) weapon.attacks = DUNGEON_RULES.createWeaponAttacks(
      ["Bow", "Crossbow"].includes(weapon.type) ? "archer" : ["Wand", "Staff"].includes(weapon.type) ? "mage" : "warrior",
      weapon.rarity || "Common", weapon.type, weapon.element || "Physical", weapon.manaCost || 0
    );
  }
  if (state.weapon && !state.weapon.attacks) {
    state.weapon.attacks = DUNGEON_RULES.createWeaponAttacks(
      ["Bow", "Crossbow"].includes(state.weapon.type) ? "archer" : ["Wand", "Staff"].includes(state.weapon.type) ? "mage" : "warrior",
      state.weapon.rarity || "Common", state.weapon.type, state.weapon.element || "Physical", state.weapon.manaCost || 0
    );
  }
  updateArmorBonuses();
}

function makeEnemy(floor, boss = false, index = 0) {
  const race = choice(Object.keys(roomNames));
  const template = roomNames[race];
  const variant = Array.isArray(template[0]) ? choice(template) : template;
  const name = boss ? (index === 1 ? "The Hollow Twin" : choice(bossNames)) : variant[0];
  const klass = boss ? "Boss" : variant[1];
  const baseHp = race === "golem" ? 95 : race === "werewolf" ? 58 : race === "slime" ? 42 : 32;
  const difficulty=DIFFICULTIES[state?.difficulty]||DIFFICULTIES.normal;
  const hp = Math.round((boss ? baseHp * (floor * 0.5 + 2) * 1.5 : baseHp) * Math.pow(1.25, floor - 1)*difficulty.enemyHealth);
  const baseDamage = race === "golem" ? 9 : race === "werewolf" ? 10 : 7;
  const element = ({ slime: "Water", skeleton: "Earth", goblin: "Wind", vampire: "Fire", werewolf: "Earth", golem: "Earth" })[race] || "None";
  return { name, race, klass, element, maxHp: hp, hp, damage: Math.max(1,Math.round(baseDamage * (boss ? 1.5 : 1) * Math.pow(1.18, floor - 1)*difficulty.enemyDamage)), dodge: race === "specter" ? 0.12 : klass === "Archer" ? 0.05 : 0.02, boss, elite: false, gold: Math.round((8 + floor * 2) * (boss ? 5 : 1)), xp: Math.round((50 + floor * 24) * (boss ? (floor * 0.5 + 2) : 1)) };
}

function makeRoom(type, x, y, id) {
  return { id, type, x, y, visited: false, cleared: false, searched: false, trapRevealed: false, fountainUsed: false, connections: [] };
}

function makeFloor(floor) {
  const width = 7;
  const height = 7;
  const rooms = [];
  const start = makeRoom(DUNGEON_RULES.entryRoomType(floor), 3, 6, "r0");
  rooms.push(start);
  const path = [start];
  const occupied = new Set([`${start.x},${start.y}`]);
  const route = [[3,5],[2,5],[2,4],[3,4],[4,4],[4,3],[3,3],[3,2],[3,1]];
  for (let i = 1; i <= route.length; i++) {
    const [x,y]=route[i-1];
    const previous=path[path.length-1];
    const direction=x>previous.x?"east":x<previous.x?"west":y>previous.y?"south":"north";
    const room=makeRoom(i===route.length?"boss":"enemy",x,y,`r${i}`);
    previous.connections.push({id:room.id,direction});
    room.connections.push({id:previous.id,direction:({north:"south",south:"north",east:"west",west:"east"})[direction]});
    rooms.push(room);path.push(room);occupied.add(`${x},${y}`);
  }
  const extras = Math.min(4, Math.floor(floor / 2) + 1);
  for (let i = 0; i < extras; i++) {
    const parent = choice(path.slice(1, -1));
    const options = [];
    for (const [dx, dy, direction] of [[0, -1, "north"], [1, 0, "east"], [0, 1, "south"], [-1, 0, "west"]]) {
      const x = parent.x + dx, y = parent.y + dy;
      if (x >= 0 && x < width && y >= 0 && y < height && !occupied.has(`${x},${y}`)) options.push({ x, y, direction });
    }
    if (options.length) {
      const next = choice(options); const type = choice(["enemy", "enemy", "empty", "treasure", "trap", "fountain"]);
      const room = makeRoom(type, next.x, next.y, `r${rooms.length}`);
      room.connections.push({ id: parent.id, direction: ({ north: "south", south: "north", east: "west", west: "east" })[next.direction] });
      parent.connections.push({ id: room.id, direction: next.direction });
      rooms.push(room); occupied.add(`${room.x},${room.y}`);
    }
  }
  const shopRoom = choice(path.slice(1, -1));
  shopRoom.type = "shop";
  const free = rooms.filter(room => room.type === "enemy");
  for (const room of free) {
    const position = rooms.indexOf(room);
    if (position < Math.max(1, Math.min(floor, 4)) + 1) room.enemyCount = Math.min(4, position);
    else if (Math.random() < 0.13) room.type = "empty";
  }
  return { number: floor, width, height, rooms, currentId: start.id, bossCleared: false };
}

function newRun(name, devMode = false, saveSlot = "slot1", difficulty = "normal") {
  state = {
    name: name || "Adventurer", devMode, saveSlot, difficulty: DIFFICULTIES[difficulty] ? difficulty : "normal", inventoryNotice: false, shopLootUpgradeLevel: 0, floor: 1, level: 1, xp: 0, skillPoints: 0, hp: 100, maxHp: 100,
    mana: 50, maxMana: 50, gold: 0, str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10,
    speed: 10, critChance: 0.05, class: null, chosenClass: null, weapon: null, weapons: [], armor: [], items: [],
    currentFloor: makeFloor(1), combat: null, deaths: 0, floorsCleared: 0, log: [],
    starter: { desk: false, closet: false, classOffer: false }, equippedArmor: {}, baseMaxHp: 100, attackCooldowns: {}, defenseCooldowns: { aegis: 0, block: 0, dodge: 0 }, activeDefense: null, disruptCooldown: 0, braced: false, showWeaponInfo: false,
    runStats: { enemiesDefeated: 0, damageDealt: 0, damageTaken: 0, fights: [] }
  };
  state.currentFloor.rooms[0].visited = true;
  message(`You wake in a cold stone room. Somewhere beyond it, the dungeon waits.`, "story");
  save(); render();
}

function startScreen() {
  titleButton.hidden = true;
  indexButton.hidden = false;
  const slots = loadSaveSlots();
  screen.innerHTML = `<div class="title-screen"><div class="title-copy"><p class="eyebrow">A dungeon adventure</p><h2>Every room<br>is a choice.</h2><p>Explore a shifting dungeon, search what you find, and fight your way toward the next floor.</p><button class="secondary-button" data-open-leaderboard>View highest floors</button>${renderPersonalBests()}</div><div class="start-form"><label for="player-name">Character name for a new run</label><input id="player-name" maxlength="22" placeholder="Adventurer" autocomplete="off"><label for="difficulty-choice">Difficulty</label><select id="difficulty-choice"><option value="easy">Easy · gentler enemies, faster leveling, lower prices</option><option value="normal" selected>Normal · standard balance</option><option value="hard">Hard · tougher enemies, slower leveling, higher prices</option></select><div class="save-slots">${SAVE_SLOT_IDS.map(slot=>{const saved=slots[slot];const label=slot==="dev"?"Dev slot":`Slot ${slot.slice(-1)}`;return `<article class="save-slot"><div><strong>${label}</strong><span>${escapeHtml(DUNGEON_RULES.describeSaveSlot(slots,slot))}${saved?` · ${DIFFICULTIES[saved.difficulty]?.label||"Normal"}`:""}</span></div><div class="save-slot-actions">${saved?`<button class="small-button" data-continue-slot="${slot}">Continue</button>`:""}<button class="small-button" data-new-slot="${slot}">${saved?"New run":"Start run"}</button>${saved?`<button class="text-button" data-delete-slot="${slot}">Delete</button>`:""}</div></article>`;}).join("")}</div><p class="fine-print">Run saves are stored in this browser. Global leaderboard records are separate; Dev-slot runs do not count.</p></div></div>`;
  screen.querySelector("[data-open-leaderboard]")?.addEventListener("click", () => { modal = "leaderboard"; showModal(); });
  screen.querySelectorAll("[data-new-slot]").forEach(button=>button.addEventListener("click",()=>{
    const slot=button.dataset.newSlot;const slotLabel=slot==="dev"?"dev":slot.slice(-1);const existing=slots[slot];
    if(existing&&(prompt(`Starting over replaces this save. Type exactly: overwrite slot ${slotLabel}`)!==`overwrite slot ${slotLabel}`||prompt(`This will replace ${DUNGEON_RULES.describeSaveSlot(slots,slot)}. Type OVERWRITE to confirm.`)!=="OVERWRITE"))return;
    newRun(screen.querySelector("#player-name").value.trim(),slot==="dev",slot,screen.querySelector("#difficulty-choice").value);
  }));
  screen.querySelectorAll("[data-continue-slot]").forEach(button=>button.addEventListener("click",()=>{state=slots[button.dataset.continueSlot];state.saveSlot=button.dataset.continueSlot;state.runStats ||= {enemiesDefeated:0,damageDealt:0,damageTaken:0,fights:[]};modal=null;render();}));
  screen.querySelectorAll("[data-delete-slot]").forEach(button=>button.addEventListener("click",()=>{
    const slot=button.dataset.deleteSlot;const saved=slots[slot];const slotLabel=slot==="dev"?"Dev slot":`Slot ${slot.slice(-1)}`;
    if(!window.confirm(`You are about to delete ${slotLabel}, character ${saved?.name||"Adventurer"}. Are you sure?`))return;
    DUNGEON_RULES.writeSaveSlot(slots,slot,null);localStorage.setItem(SAVE_SLOTS_KEY,JSON.stringify(slots));startScreen();
  }));
  if (modal) showModal();
}

function findRoom(id) { return state.currentFloor.rooms.find(room => room.id === id); }
function currentRoom() { return findRoom(state.currentFloor.currentId); }
function mapRoomImage(room) {
  if(room.type==="enemy"&&room.cleared)return "Images/Rooms/empty-room.png";
  const files = {
    start: "starting-room.png", enemy: "enemy-room.png", empty: "empty-room.png", treasure: "treasure-room.png",
    weapon: "weapon-treasure-room.png", fountain: "fountain-room.png", shop: "shop-room.png",
    trap: room.trapRevealed ? "trap-room.png" : "treasure-room.png", boss: "boss-room.png"
  };
  return `Images/Rooms/${files[room.type] || "empty-room.png"}`;
}

function renderMap() {
  const floor = state.currentFloor;
  const byCoord = new Map(floor.rooms.map(room => [`${room.x},${room.y}`, room]));
  let html = `<div class="map-area"><div class="map-grid" aria-label="Dungeon map">`;
  for (let y=0; y<7; y++) for (let x=0; x<7; x++) {
    const room = byCoord.get(`${x},${y}`);
    if (!room) html += `<span class="map-cell void" aria-hidden="true"></span>`;
    else {
      const current = room.id === floor.currentId;
      const revealed = room.visited || current;
      const title = revealed ? ROOM_LABELS[room.type] : "Unexplored room";
      html += `<button class="map-cell ${revealed ? "visited" : "unvisited"} ${current ? "current" : ""} ${revealed && room.type === "boss" ? "boss-cell" : ""}" data-room="${room.id}" ${current ? "aria-current='location'" : ""} aria-label="${escapeHtml(title)}" title="${escapeHtml(title)}">${revealed ? `<img class="room-tile-art" src="${mapRoomImage(room)}" alt="" aria-hidden="true">` : ""}${current ? `<img class="player-marker" src="Images/player.png" alt="" aria-hidden="true">` : ""}</button>`;
    }
  }
  return html + `</div><div class="map-legend"><span><i class="legend-marker player-key"></i>You</span><span><i class="legend-marker room-key"></i>Known room</span><span><i class="legend-marker fog-key"></i>Unexplored</span></div></div>`;
}

function weaponArt(weapon, large = false) {
  const classFolder = weapon.type === "Bow" || weapon.type === "Crossbow" ? "Archer" : weapon.type === "Staff" || weapon.type === "Wand" ? "Mage" : "Warrior";
  const path = escapeHtml(`Images/Weapons/${classFolder}/${weapon.file}`);
  return `<div class="item-art ${large ? "large" : ""}"><img src="${path}" alt="${escapeHtml(weapon.name)}"><span>${escapeHtml(weapon.name)}</span></div>`;
}

function itemArt(path, name, large = false) {
  return `<div class="item-art ${large ? "large" : ""}"><img src="${escapeHtml(path)}" alt="${escapeHtml(name)}"><span>${escapeHtml(name)}</span></div>`;
}

function enemyArt(enemy) {
  const bossArt = {
    "The Slime Sovereign": "slime-sovereign", "The Bone Regent": "bone-regent", "The Goblin King": "goblin-king",
    "The Veiled Haunt": "veiled-haunt", "The Crimson Count": "crimson-count", "The Moonfang Alpha": "moonfang-alpha",
    "The Mountain Heart": "mountain-heart", "The Bone Necromancer": "bone-necromancer", "The Ashen Twin": "ashen-twin", "The Hollow Twin": "hollow-twin"
  };
  const file = enemy.boss ? `${bossArt[enemy.name] || slug(enemy.name)}.png` : `${slug(enemy.name)}.png`;
  const folder = enemy.boss ? "Bosses" : "Races";
  return itemArt(`Images/Enemies/${folder}/${file}`, enemy.name);
}

function potionArt(item) {
  const file = item.name.toLowerCase().includes("mana") ? "mana-potion.png" : item.name.toLowerCase().includes("large") ? "large-health-potion.png" : item.name.toLowerCase().includes("small") ? "small-health-potion.png" : "healing-potion.png";
  return itemArt(`Images/Items/Potions/${file}`, item.name);
}

function bindArtFallbacks(root = screen) {
  root.querySelectorAll(".room-tile-art").forEach(img => {
    img.addEventListener("error", () => { img.hidden = true; }, { once: true });
    if (img.complete && img.naturalWidth === 0) img.hidden = true;
  });
  root.querySelectorAll(".item-art img").forEach(img => {
    const art = img.closest(".item-art");
    img.addEventListener("error", () => { img.hidden = true; art?.classList.remove("has-art"); }, { once: true });
    img.addEventListener("load", () => art?.classList.add("has-art"), { once: true });
    if (img.complete) {
      if (img.naturalWidth === 0) img.hidden = true;
      else art?.classList.add("has-art");
    }
  });
}

function weaponCard(weapon, index, equipped = false) {
  const family=weaponFamily(weapon);
  const classLocked=Boolean(state.chosenClass && family!==state.chosenClass);
  const equippedLabel = equipped ? `<span class="equipped-tag">Equipped</span>` : classLocked ? `<button class="small-button" disabled title="Only ${CLASS_NAMES[state.chosenClass]} weapons can be equipped">${CLASS_NAMES[family]||"Unknown"} weapon</button>` : `<button class="small-button" data-equip-weapon="${index}">Equip</button>`;
  const ammo = ["Bow","Crossbow"].includes(weapon.type) ? ` · ${state.arrows ?? 0} shared arrows` : "";
  return `<article class="inventory-item ${rarityClass(weapon.rarity)}">${weaponArt(weapon)}<div class="item-copy"><span class="item-meta">${escapeHtml(weapon.rarity)} ${escapeHtml(weapon.type)} · ${escapeHtml(weapon.element)}</span><strong>${escapeHtml(weapon.name)}</strong><span class="item-stats">${weapon.damage} damage · ${Math.round(weapon.crit*100)}% crit${ammo}</span></div><div class="inventory-item-actions">${equippedLabel}<button class="small-button" data-inventory-sell="weapon" data-sell-index="${index}" ${equipped?"disabled title=\"Equip another weapon before selling this one\"":""}>Sell · ${sellValue(weapon,"weapon")}g</button></div></article>`;
}

function getConnected() {
  const room = currentRoom();
  const directions = [
    { direction: "north", x: room.x, y: room.y - 1 },
    { direction: "east", x: room.x + 1, y: room.y },
    { direction: "south", x: room.x, y: room.y + 1 },
    { direction: "west", x: room.x - 1, y: room.y }
  ];
  return directions.flatMap(({ direction, x, y }) => {
    const adjacent = state.currentFloor.rooms.find(candidate => candidate.x === x && candidate.y === y);
    return adjacent ? [{ room: adjacent, direction }] : [];
  });
}

function renderMovement() {
  const destinations = new Map(getConnected().map(({ room, direction }) => [direction, room]));
  return `<div class="map-control-row"><div class="movement"><span class="movement-heading">Move</span><div class="compass-grid" role="group" aria-label="Move to an adjacent room">${["north", "west", "center", "east", "south"].map(direction => {
    if (direction === "center") return `<span class="compass-control compass-center" aria-hidden="true">@</span>`;
    const room = destinations.get(direction);
    const label = direction[0].toUpperCase();
    return room
      ? `<button class="compass-control ${direction}-control ${room.type === "boss" ? "boss-direction" : ""}" data-move="${room.id}" aria-label="Move ${direction} to ${room.visited ? ROOM_LABELS[room.type] : "unknown room"}">${label}<small>${escapeHtml(room.visited ? ROOM_LABELS[room.type] : "Unknown room")}</small></button>`
      : `<span class="compass-control ${direction}-control move-na" aria-label="${direction} unavailable">${label}<small>N/A</small></span>`;
  }).join("")}</div></div>${inventoryButtonMarkup()}</div>`;
}

function inventoryButtonMarkup() {
  return `<button class="inventory-button" data-open-inventory type="button">Inventory ${state.inventoryNotice?'<span class="inventory-notice" aria-label="New equipment">!</span>':""}</button>`;
}
function getActions() {
  const room = currentRoom();
  if (state.combat) {
    const weapon = state.weapon;
    const mageBlocked = state.class === "mage" && state.equippedArmor?.shield;
    const basicFallback = DUNGEON_RULES.basicAttackFallback(state.class,weapon?.type,state.mana,state.arrows);
    const basicLabel = state.class === "mage" ? "Basic spell" : state.class === "archer" ? "Basic shot" : "Basic attack";
    const arrowsOut = ["Bow", "Crossbow"].includes(weapon?.type) && state.arrows < (weapon?.effect==="Overdraw"?2:1) && !basicFallback;
    const manaCost = (weapon?.manaCost || 5) + (weapon?.effect==="Overcast"?2:0);
    const basicPreview=attackPreview({multiplier:basicFallback?0.5:1,critBonus:0,manaCost:basicFallback?0:weapon?.manaCost||5,aoe:false});
    const heavyPreview=attackPreview({multiplier:1.5,critBonus:0.1,cooldown:2,aoe:false});
    const specials = (weapon?.attacks || []).map(attack => {
      const cooldown = DUNGEON_RULES.isAttackOnCooldown(state.attackCooldowns,attack.command) ? state.attackCooldowns[attack.command] : 0;
      const preview = attackPreview(attack);
      const disabled = cooldown > 0 || (state.class === "mage" && mageBlocked) || (state.class === "mage" && state.mana < preview.manaCost) || (state.class === "archer" && state.arrows < preview.ammoCost);
      const chargeLabel=attack.chargesNextAttack?`Next hit: ~${preview.primaryDamage} dmg · ${Math.round(preview.critChance*100)}% crit`:`~${preview.primaryDamage} dmg · ${Math.round(preview.critChance*100)}% crit`;
      return `<button class="action-button special-action" data-attack="${escapeHtml(attack.command)}" ${disabled?"disabled":""}>${escapeHtml(attack.name)}<small>${cooldown?`Cooldown ${cooldown}`:`${chargeLabel}${attack.effect?` · ${effectIcon(attack.effect)}`:""}${attack.aoe?` · ${preview.targetCount} targets`:""}${preview.manaCost?` · ${preview.manaCost} mana`:""}${preview.ammoCost?` · ${preview.ammoCost} arrow`:""}`}</small></button>`;
    }).join("");
    const selectedEnemy=state.combat.enemies[state.target];
    const disruptable=DUNGEON_RULES.hasDisruptibleIntent(selectedEnemy);
    const disruptCooldown=state.disruptCooldown||0;
    const defense=classDefenseOption();
    const defenseAction=defense?`<button class="action-button secondary" data-attack="${defense.action}" ${defense.disabled?"disabled":""}>${defense.label}<small>${defense.description}</small></button>`:"";
    const disruptAction=disruptable?`<button class="action-button secondary" data-attack="disrupt" ${!DUNGEON_RULES.canDisrupt(selectedEnemy,disruptCooldown)?"disabled":""}>Disrupt<small>${disruptCooldown?`Cooldown ${disruptCooldown}`:`Cancel ${escapeHtml(selectedEnemy.intent.label)}`}</small></button>`:"";
    const basicDisabled=state.class==="mage"?(mageBlocked||state.mana<manaCost&&!basicFallback):state.class==="archer"?arrowsOut:false;
    return `<div class="action-grid"><button class="action-button" data-attack="basic" ${basicDisabled?"disabled":""}>${basicFallback?state.class==="mage"?"Staff strike":"Unarmed jab":basicLabel}<small>~${basicPreview.primaryDamage} dmg · ${Math.round(basicPreview.critChance*100)}% crit${basicPreview.effect?` · ${effectIcon(basicPreview.effect)}`:""}${basicFallback?" · No resource needed, reduced damage":state.class==="mage"?` · ${manaCost} mana`:state.class==="archer"?` · ${state.arrows||0} arrows`:" · Always available"}</small></button>${state.class==="warrior"?`<button class="action-button" data-attack="heavy" ${state.cooldown>0?"disabled":""}>Heavy attack<small>${state.cooldown?`Cooldown ${state.cooldown}`:`~${heavyPreview.primaryDamage} dmg · ${Math.round(heavyPreview.critChance*100)}% crit${heavyPreview.effect?` · ${effectIcon(heavyPreview.effect)}`:""} · 2 turn cooldown`}</small></button>`:""}${specials}${disruptAction}${defenseAction}<button class="action-button" data-action="heal">Use health potion</button><button class="action-button" data-action="mana">Use mana potion</button><button class="action-button secondary" data-action="flee">Flee</button></div>`;
  }
  if (room.type === "boss" && room.cleared) return `<p class="prompt-note">The chamber falls quiet. The stair to the next floor is open.</p><div class="action-grid"><button class="action-button" data-next-floor>Descend to floor ${state.floor + 1}</button></div>`;
  if (room.type === "start") return `<div class="action-grid"><button class="action-button" data-action="inspect-desk">Inspect the desk</button><button class="action-button" data-action="inspect-closet">Inspect the closet</button></div>${state.starter.classOffer && !state.class ? `<div class="class-choice"><p>The desk holds three forgotten weapons. Choose one.</p><div class="action-grid"><button class="action-button" data-class="warrior">Warrior · Sword</button><button class="action-button" data-class="archer">Archer · Bow</button><button class="action-button" data-class="mage">Mage · Staff</button></div></div>` : ""}`;
  if (room.type === "treasure" || room.type === "trap" || room.type === "weapon") return `<div class="action-grid"><button class="action-button" data-action="inspect-chest">Inspect chest</button><button class="action-button secondary" data-action="inspect-floor">Inspect floor</button></div>`;
  if (room.type === "fountain") return `<div class="action-grid"><button class="action-button" data-action="inspect-fountain">Inspect fountain</button><button class="action-button" data-action="drink-fountain" ${room.fountainUsed ? "disabled" : ""}>Drink from fountain</button></div>`;
  if (room.type === "shop") return `<div class="action-grid"><button class="action-button" data-action="shop">Browse shop</button></div>`;
  if (room.type === "boss") return `<p class="prompt-note">A heavy presence presses from beyond the sealed doorway.</p><div class="action-grid"><button class="action-button boss-action" data-action="enter-boss">Enter boss chamber</button></div>`;
  return `<p class="prompt-note">Nothing here asks for your attention.</p>`;
}

function effectiveStat(key) {
  return DUNGEON_RULES.effectiveStat(state[key], key, state.chosenClass || state.class);
}

function statValueLabel(stat) {
  if(stat.key==="critChance")return `${Math.round(state.critChance*100)}%`;
  const effective=Math.round(effectiveStat(stat.key)*10)/10;
  return `${effective} effective · ${state[stat.key]} raw`;
}

function statDescription(stat) {
  const synergy=DUNGEON_RULES.statSynergy(stat.key,state.chosenClass||state.class);
  const classNote=synergy>1?` ${CLASS_NAMES[state.chosenClass||state.class]} synergy: +${Math.round((synergy-1)*100)}% benefit.`:"";
  const diminishing=stat.key==="critChance"?" Crit investment gains halve after 20%.":" Stat benefits halve above 20.";
  return `${stat.description}${classNote}${diminishing}`;
}

function enemyIncomingDamage(enemy) {
  const scale = enemy.intent?.key === "cast" ? 1.15 : enemy.intent?.key === "shoot" ? 0.9 : 1;
  const raw = Math.round(enemy.damage * scale);
  const reduction = DUNGEON_RULES.armorDamageReduction(state.equippedArmor || {}, state.class);
  return Math.max(1, raw - reduction);
}

function healthPotionRestore(item) {
  const percent = HEALTH_POTION_PERCENT[item.rarity] || HEALTH_POTION_PERCENT.Common;
  return Math.ceil(state.maxHp * percent / 100);
}

function classDefenseOption() {
  state.defenseCooldowns ||= { aegis: 0, block: 0, dodge: 0 };
  const underAttack = state.combat?.enemies.some(enemy => enemy.hp > 0 && ["attack", "shoot", "cast"].includes(enemy.intent?.key));
  if (!underAttack) return null;
  if (state.class === "warrior") {
    const shield = state.equippedArmor?.shield;
    if (!shield) return null;
    const cooldown = state.defenseCooldowns.block || 0;
    const capacity = Math.max(1, (shield.defense || shield.damageReduction || 1) * 3);
    return { action: "block", label: "Shield Block", description: cooldown ? `Cooldown ${cooldown}` : `Absorb up to ${capacity} damage this round · 2-turn cooldown`, disabled: cooldown > 0 };
  }
  if (state.class === "mage") {
    const cooldown = state.defenseCooldowns.aegis || 0;
    const capacity = Math.max(1, Math.round(effectiveStat("con") * 2));
    return { action: "aegis", label: "Aegis", description: cooldown ? `Cooldown ${cooldown}` : `CON shield: ${capacity} · 8 mana · 2-turn cooldown`, disabled: cooldown > 0 || state.mana < 8 || Boolean(state.equippedArmor?.shield) };
  }
  if (state.class === "archer") {
    const cooldown = state.defenseCooldowns.dodge || 0;
    return { action: "dodge", label: "Evade", description: cooldown ? `Cooldown ${cooldown}` : "Reduce incoming damage by 50% this round · 2-turn cooldown", disabled: cooldown > 0 };
  }
  return null;
}

function renderLog() { return `<section class="context-box" aria-label="Recent events"><div class="context-heading">Context <span>Recent events</span></div><div class="context-output" role="log" aria-live="polite">${state.log.map(entry => `<p class="${entry.tone}">${entry.text}</p>`).join("")}</div></section>`; }

function captureModalView(){
  const element=screen.querySelector(".modal");
  if(!element)return null;
  return {
    title:element.getAttribute("aria-labelledby"),
    inventoryCategory:element.getAttribute("aria-labelledby")==="inventory-title"?inventoryCategory:null,
    scroll:[".modal",".shop-list",".sell-list","#inventory-list"].map(selector=>({selector,top:screen.querySelector(selector)?.scrollTop||0,left:screen.querySelector(selector)?.scrollLeft||0})),
    details:[...element.querySelectorAll("details")].map(detail=>detail.open)
  };
}

function restoreModalView(view){
  if(!view)return;
  const element=screen.querySelector(".modal");
  if(!element||element.getAttribute("aria-labelledby")!==view.title)return;
  if(view.inventoryCategory){
    inventoryCategory=view.inventoryCategory;
    element.querySelectorAll("[data-tab]").forEach(tab=>tab.classList.toggle("active",tab.dataset.tab===inventoryCategory));
    const list=element.querySelector("#inventory-list");
    if(list)list.innerHTML=renderInventoryItems(inventoryCategory);
    bindInventoryListActions();bindUseItem();bindInventoryControls();
  }
  [...element.querySelectorAll("details")].forEach((detail,index)=>{if(view.details[index]!==undefined)detail.open=view.details[index];});
  const restoreScroll=()=>{for(const saved of view.scroll){const current=screen.querySelector(saved.selector);if(current){current.scrollTop=saved.top;current.scrollLeft=saved.left;}}};
  restoreScroll();
  if(view.inventoryCategory&&typeof requestAnimationFrame==="function")requestAnimationFrame(restoreScroll);
}

function render() {
  if (!state) return startScreen();
  const modalView=captureModalView();
  migrateBrowserSave();
  ensureSkillStats();
  titleButton.hidden = false;
  indexButton.hidden = modal === "death";
  const room = currentRoom();
  const aliveEnemies = state.combat?.enemies.map((enemy, index) => ({ enemy, index })).filter(item => item.enemy.hp > 0) || [];
  screen.innerHTML = `<div class="run-topline"><span>Floor ${state.floor}</span><span>${escapeHtml(state.name)}</span><span>${DIFFICULTIES[state.difficulty]?.label||"Normal"} · Level ${state.level}${state.skillPoints ? ` · ${state.skillPoints} skill point${state.skillPoints === 1 ? "" : "s"}` : ""}</span><div class="run-shortcuts"><button class="small-button" data-open-recap>Run record</button><button class="small-button" data-open-leaderboard>Leaderboard</button></div></div>
    <div class="game-layout">
      <aside class="player-panel">
        <div class="player-stats">
          <div class="stat-row"><div class="stat-label"><span>Health</span><b>${state.hp} / ${state.maxHp}</b></div><div class="meter"><i class="hp-fill" style="width:${Math.max(0,state.hp/state.maxHp*100)}%"></i></div></div>
          <div class="stat-row"><div class="stat-label"><span>Mana</span><b>${state.mana} / ${state.maxMana}</b></div><div class="meter"><i class="mana-fill" style="width:${Math.max(0,state.mana/state.maxMana*100)}%"></i></div></div>
          <div class="resource-line"><span class="xp-color">XP ${state.xp} / ${xpToNext()}</span><span class="gold-color">${state.gold} gold</span></div>
        </div>
        ${state.weapon ? `<div class="equipped-weapon">${weaponArt(state.weapon,true)}<div><span class="item-meta">${escapeHtml(state.class)} · ${escapeHtml(state.weapon.rarity)} ${escapeHtml(state.weapon.type)}</span><strong>${escapeHtml(state.weapon.name)}</strong><span>${state.weapon.damage} damage · ${state.weapon.element}</span>${["Bow","Crossbow"].includes(state.weapon.type) ? `<span>${state.arrows ?? 0} arrows</span>` : ""}</div></div>` : `<p class="no-weapon">No weapon equipped</p>`}
        <div class="equipped-armor">${["head","chest","legs","feet","shield"].map(slot=>`<span>${slot}: ${state.equippedArmor[slot]?escapeHtml(state.equippedArmor[slot].name):"empty"}</span>`).join("")}<span class="armor-bonus">${armorSummaryText()}</span></div>
        ${renderLog()}
      </aside>
      <section class="play-panel">${state.combat ? renderCombat(aliveEnemies) : `<div class="room-heading"><div><p class="section-kicker">Floor ${state.floor} · ${room.type === "start" ? "Beginning" : "Room"}</p><h2>${escapeHtml(room.visited ? (room.type === "trap" && !room.trapRevealed ? "Treasure Room" : ROOM_LABELS[room.type]) : "Unknown Room")}</h2></div><span class="room-index">${room.x+1}.${room.y+1}</span></div>${renderMap()}${renderMovement()}<div class="room-actions"><h3>Actions</h3>${getActions()}</div>`}</section>
    </div>`;
  screen.querySelector("[data-open-leaderboard]")?.addEventListener("click", () => { modal = "leaderboard"; showModal(); });
  bindGameActions();
  bindArtFallbacks();
  if (modal) showModal();
  restoreModalView(modalView);
  save();
}

function renderCombat(enemies) {
  const attacks = state.weapon?.attacks || [];
  const targetCount = state.combat?.enemies.filter(enemy => enemy.hp > 0).length || 1;
  const basic = { name: state.class === "mage" ? "Basic spell" : state.class === "archer" ? "Basic shot" : "Basic attack", multiplier: 1, critBonus: 0, cooldown: 0, effect: state.weapon?.effect || null };
  const listedAttacks = [basic, ...attacks];
  if (state.class === "warrior") listedAttacks.splice(1, 0, { name: "Heavy attack", multiplier: 1.5, critBonus: 0.1, cooldown: 2, effect: null });
  const enemyCards = enemies.map(({ enemy, index }) => {
    const intent = enemy.intent || { label: "Preparing", key: "" };
    const hint = intent.key === "guard" ? " · reduces incoming damage" : intent.key === "dodge" ? " · evades your next attack" : "";
    const incoming=enemyIncomingDamage(enemy);
    const preview=["attack","shoot","cast"].includes(intent.key)?`<span class="incoming-damage">Potential hit: ${incoming}</span>`:"";
    return `<article class="enemy-card ${enemy.boss ? "boss-enemy" : ""}">${enemyArt(enemy)}<div class="enemy-information"><div class="enemy-name"><strong>${escapeHtml(enemy.name)}</strong><span>${escapeHtml(enemy.klass)}</span></div><div class="enemy-health"><span>${enemy.hp} / ${enemy.maxHp} HP</span><i><b style="width:${Math.max(0, enemy.hp / enemy.maxHp * 100)}%"></b></i></div><p>${enemy.damage} base damage · ${Math.round(enemy.dodge * 100)}% dodge · ${escapeHtml(enemy.element || "Neutral")}</p><p class="enemy-intent">Intent: <strong>${escapeHtml(intent.label)}</strong>${hint} ${preview}</p>${renderStatusBadges(enemy.effects)}</div><button class="small-button target-button" data-target="${index}">${state.target === index ? "Targeted" : "Target"}</button></article>`;
  }).join("");
  const attackInfo = state.showWeaponInfo ? `<div class="weapon-attack-info">${listedAttacks.map(attack => {
    const preview = attackPreview(attack, targetCount);
    const matchup = preview.elementRelation === "neutral" ? "" : ` · elemental ${preview.elementRelation}`;
    return `<article><strong>${escapeHtml(attack.name)}</strong><span>${escapeHtml(attack.description || "A reliable basic strike.")}</span><small>${preview.primaryDamage} damage${attack.aoe ? ` / ${preview.secondaryDamage} secondary · ${preview.targetCount} targets` : ""} · ${Math.round(preview.critChance * 100)}% crit${matchup} · ${preview.cooldown ? `${preview.cooldown} turn cooldown` : "No cooldown"}${preview.effect ? ` · ${escapeHtml(preview.effect)}` : ""}${preview.manaCost ? ` · ${preview.manaCost} mana` : ""}${preview.ammoCost ? ` · ${preview.ammoCost} arrow${preview.ammoCost === 1 ? "" : "s"}` : ""}</small></article>`;
  }).join("")}</div>` : "";
  return `<div class="combat-header"><p class="section-kicker">Combat · Floor ${state.floor}</p><h2>Fight</h2></div><div class="enemy-list">${enemyCards}</div>${renderPlayerCombatStatuses()}<div class="combat-info"><span>Weapon: ${escapeHtml(state.weapon?.name || "None")}</span><button class="small-button" data-toggle-weapon-info>${state.showWeaponInfo ? "Hide attack info" : "Attack info"}</button></div>${attackInfo}<div class="combat-toolbar">${inventoryButtonMarkup()}</div><div class="room-actions"><h3>Your turn</h3>${getActions()}</div>`;
}

function attackPreview(attack, targetCount = state.combat?.enemies.filter(enemy=>enemy.hp>0).length || 1) {
  const armor = DUNGEON_RULES.armorBonuses(state.equippedArmor || {}, state.class);
  const preview = DUNGEON_RULES.createAttackPreview({
    player: { ...state, critChance: state.critChance + armor.critChance }, playerClass: state.class,
    weapon: state.weapon || {}, attack, targetCount, charged: state.chargedAttack,
    targetElement: state.combat?.enemies[state.target]?.element
  });
  if (state.class === "archer" && attack.chargesNextAttack) preview.ammoCost = 0;
  return preview;
}

function renderStatusBadges(effects = {}) {
  const badges = Object.entries(effects || {}).map(([key,value])=>[key,typeof value==="number"?{turns:value,stacks:1}:value]).filter(([, value]) => value && typeof value === "object" && Number(value.turns) > 0).map(([key, value]) => {
    const info = DUNGEON_RULES.getEffectDefinition(key);
    if (!info) return "";
    const stacks = value.stacks > 1 ? ` ×${value.stacks}` : "";
    return `<span class="status-badge" title="${escapeHtml(info.description)}"><b aria-hidden="true">${escapeHtml(key.slice(0,1))}</b> ${escapeHtml(key)}${stacks} · ${value.turns}t</span>`;
  }).join("");
  return badges ? `<div class="status-list" aria-label="Active effects">${badges}</div>` : "";
}

function renderPlayerCombatStatuses() {
  const effects=renderStatusBadges(state.playerEffects);
  const brace=state.braced?`<div class="status-list" aria-label="Player stance"><span class="status-badge">Brace · next hit halved</span></div>`:"";
  return `${effects}${brace}`;
}

function armorSummaryText() {
  const bonus=DUNGEON_RULES.armorBonuses(state.equippedArmor||{},state.class);
  const details=[`+${bonus.damageReduction} damage reduction`];
  if(bonus.healthBonus)details.push(`+${bonus.healthBonus} max HP`);
  if(bonus.critChance)details.push(`+${Math.round(bonus.critChance*100)}% crit`);
  if(bonus.dexterity)details.push(`${bonus.dexterity>0?"+":""}${bonus.dexterity} DEX`);
  if(bonus.speed)details.push(`${bonus.speed>0?"+":""}${bonus.speed} speed`);
  if(bonus.thorns)details.push(`${Math.round(bonus.thorns*100)}% thorns`);
  return `${bonus.setName?`${bonus.setName} set: `:"Armor: "}${details.join(" · ")}`;
}

function armorPerkText(armor) {
  const perks=armor.slotBonuses||{};
  const labels=[];
  if(perks.critChance)labels.push(`+${Math.round(perks.critChance*100)}% crit`);
  if(perks.healthBonus||armor.healthBonus)labels.push(`+${perks.healthBonus||armor.healthBonus} HP`);
  if(perks.dexterity)labels.push(`${perks.dexterity>0?"+":""}${perks.dexterity} DEX`);
  if(perks.speed||armor.speedModifier)labels.push(`+${perks.speed||armor.speedModifier} speed`);
  return labels.length?labels.join(" · "):"No extra slot perk";
}

function bindGameActions() {
  screen.querySelectorAll("[data-action]").forEach(button=>button.addEventListener("click",()=>act(button.dataset.action)));
  screen.querySelectorAll("[data-class]").forEach(button=>button.addEventListener("click",()=>chooseClass(button.dataset.class)));
  screen.querySelectorAll("[data-move]").forEach(button=>button.addEventListener("click",()=>moveTo(button.dataset.move)));
  screen.querySelectorAll("[data-target]").forEach(button=>button.addEventListener("click",()=>{state.target=Number(button.dataset.target);render();}));
  screen.querySelectorAll("[data-equip-weapon]").forEach(button=>button.addEventListener("click",()=>equipWeapon(Number(button.dataset.equipWeapon))));
  screen.querySelectorAll("[data-equip-armor]").forEach(button=>button.addEventListener("click",()=>equipArmor(Number(button.dataset.equipArmor))));
  screen.querySelectorAll("[data-attack]").forEach(button=>button.addEventListener("click",()=>combatAction(button.dataset.attack)));
  screen.querySelector("[data-toggle-weapon-info]")?.addEventListener("click",()=>{state.showWeaponInfo=!state.showWeaponInfo;render();});
  screen.querySelectorAll("[data-open-skills]").forEach(button=>button.addEventListener("click",openSkills));
  screen.querySelectorAll("[data-open-recap]").forEach(button=>button.addEventListener("click",()=>{modal="recap";render();}));
  screen.querySelectorAll("[data-spend-stat]").forEach(button=>button.addEventListener("click",()=>spendSkillPoint(button.dataset.spendStat)));
}

function ensureSkillStats() {
  for (const key of ["str", "dex", "con", "int", "wis", "cha"]) state[key] ??= 10;
  state.speed ??= state.playerSpeed ?? 10;
  state.critChance ??= 0.05;
}

function openSkills() { modal = "skills"; render(); }

function spendSkillPoint(stat) {
  const result = DUNGEON_RULES.spendSkillPoint(state, stat);
  message(result.message, result.success ? "reward" : "");
  render();
}

function chooseClass(className) {
  if (!WEAPONS[className] || (state.chosenClass && state.chosenClass !== className)) return;
  state.class=className;
  state.chosenClass=className;
  const entries = WEAPONS[className];
  state.weapon=createWeapon(entries[0]);
  state.weapons=[state.weapon];
  state.inventoryNotice=true;
  if(className==="archer")state.arrows=14;
  state.starter.classOffer=false;
  message(`You choose the ${CLASS_NAMES[className]} path and take the ${state.weapon.name}.`, "story"); render();
}

function act(action) {
  const room=currentRoom();
  if (action==="inspect-desk") { state.starter.desk=true; state.starter.classOffer=true; message("Inside the desk is no single weapon, but three possibilities: a sword, a bow, and a staff. Choose your class before leaving.","story"); render(); return; }
  if (action==="inspect-closet") { if(state.starter.closet){message("The closet is empty now.");} else {state.starter.closet=true;const chest=ARMOR_INDEX.find(item=>item.name==="Common Iron Chest");const armor=DUNGEON_RULES.createCatalogArmor(chest,1);armor.name="Iron Chestplate";state.armor.push(armor);state.inventoryNotice=true;equipCollectedArmor(armor);state.items.push({name:"Small Healing Potion",rarity:"Common",type:"health",amount:25,quantity:1});message("Behind a moth-eaten cloak, you find an iron chestplate and a small healing potion.");} render();return; }
  if (action==="inventory") { openInventory(); return; }
  if (action==="inspect-chest") { inspectChest(room); render(); return; }
  if (action==="inspect-floor") { room.trapRevealed=true; message(room.type==="trap"?"A fine seam in the floor gives away the hidden mechanism.":"You check the floor. Dust, stone, and old scratches.");render();return; }
  if (action==="inspect-fountain") { message("Clear water moves beneath the stone surface. Drink when you need it.");render();return; }
  if (action==="drink-fountain") { const healed=state.maxHp-state.hp;state.hp=state.maxHp;room.fountainUsed=true;message(healed?`The fountain restores ${healed} health.`:"You were already at full health.");render();return; }
  if (action==="shop") { openShop(); return; }
  if (action==="enter-boss") { startCombat(true); return; }
  if (["attack","heavy","aim","heal","mana","flee"].includes(action)) { combatAction(action); return; }
}

function inspectChest(room) {
  if(room.searched){message("The chest has already been searched.");return;}
  room.searched=true;
  if(room.type==="trap") {
    room.trapRevealed=true;
    const outcome=randomInt(3);
    if(outcome===0){const damage=Math.min(state.hp-1,15+state.floor*2);state.hp-=Math.max(0,damage);message("The chest snaps open like a jaw. It was a mimic; you scramble back, losing health.","danger");}
    else if(outcome===1){const stolen=Math.min(state.gold,Math.ceil(state.gold/2));state.gold-=stolen;message(`The trapped chest springs. A hidden mechanism steals ${stolen} gold.`,"danger");}
    else {const loot=makeLoot();grantLoot(loot);message(`You avoid the mechanism and find ${loot.kind==="weapon"?`${loot.value.rarity} ${loot.value.name}`:loot.kind==="armor"?`${loot.value.rarity} ${loot.value.name}`:itemNameWithRarity(loot.value)}.`);}
  } else if(room.type==="weapon") { const weapon=makeLootWeapon(null,"Rare");state.weapons.push(weapon);state.inventoryNotice=true;state.items.push({name:"Large Health Potion",type:"health",amount:60,quantity:1,rarity:"Rare"});message(`Inside: ${weapon.rarity} ${weapon.name} (${weapon.type}) and a Rare Large Health Potion.`); }
  else {state.gold+=15;const foundPotion=Math.random()<0.35;if(foundPotion)state.items.push({name:"Small Health Potion",type:"health",amount:25,quantity:1,rarity:"Common"});message(foundPotion?"Inside the chest, beneath a layer of velvet, you find a small healing potion and 15 gold coins.":"The chest holds 15 gold coins; its healing supplies have long since been taken.");}
}

function roomTypeForFloor(room) {
  if(room.type==="enemy") {
    const floor=state.floor; const eligible=Math.min(4,Math.max(1,floor)); room.enemyCount=room.enemyCount||randomInt(eligible)+1;
  }
  return room.type;
}

function moveTo(id) {
  if(state.combat)return;
  if(!state.class && currentRoom().type==="start"){message("The stone doorway will not move. The desk’s three weapons seem to be the key.","story");render();return;}
  const next=findRoom(id); if(!next || !getConnected().some(connection=>connection.room.id===id))return;
  if(next.type==="boss") { message("The doorway to the boss chamber is open, but you can choose when to enter."); state.currentFloor.currentId=id;next.visited=true;render();return; }
  state.currentFloor.currentId=id; next.visited=true; roomTypeForFloor(next);
  const name=next.type==="trap"&&!next.trapRevealed?"Treasure Room":ROOM_LABELS[next.type];
  message(`You enter ${name.toLowerCase()}.`, next.type==="enemy"?"story":"");
  if(next.type==="enemy"&&!next.cleared) startCombat(false);
  else render();
}

function startCombat(boss) {
  const room=currentRoom();
  const count=boss?1:(room.enemyCount||1);
  const enemies=Array.from({length:count},(_,index)=>makeEnemy(state.floor,boss,index));
  state.combat={enemies,boss,log:[],damageDealt:0,damageTaken:0,summonedCount:0};state.cooldown=0;state.attackCooldowns={};state.defenseCooldowns={aegis:0,block:0,dodge:0};state.activeDefense=null;state.disruptCooldown=0;state.braced=false;state.aimed=false;state.target=0;
  for(const enemy of enemies)enemy.intent=DUNGEON_RULES.chooseEnemyIntent(enemy.klass,enemy.race);
  const enemy=enemies[0];
  const opening=choice([`${enemy.name} leaps from the dark!`,`A scrape of stone, then ${enemy.name} blocks the way.`,`Something rushes at you through the doorway: ${enemy.name}!`,`You hear a sharp cry as ${enemy.name} attacks!`]);
  message(opening,"danger"); render();
}

function combatAction(action) {
  const fight=state.combat; if(!fight)return;
  if(DUNGEON_RULES.allEnemiesDefeated(fight.enemies)){winFight();return;}
  let enemy=fight.enemies[state.target];
  if(!enemy||enemy.hp<=0){state.target=fight.enemies.findIndex(candidate=>candidate.hp>0);enemy=fight.enemies[state.target];}
  if(!enemy)return;
  if(["block","aegis","dodge"].includes(action)){
    state.defenseCooldowns ||= { aegis: 0, block: 0, dodge: 0 };
    const rules={
      block:{class:"warrior",key:"block",shield:true},
      aegis:{class:"mage",key:"aegis",mana:8},
      dodge:{class:"archer",key:"dodge"}
    }[action];
    const rule=rules;
    if(state.class!==rule.class || state.defenseCooldowns[rule.key]>0 || !state.combat.enemies.some(item=>item.hp>0&&["attack","shoot","cast"].includes(item.intent?.key))){message("That defense is not available right now.");render();return;}
    if(rule.shield&&!state.equippedArmor?.shield){message("Shield Block requires an equipped shield.");render();return;}
    if(rule.mana&&(state.mana<rule.mana||state.equippedArmor?.shield)){message(state.equippedArmor?.shield?"You cannot cast Aegis while a shield is equipped.":"Aegis requires 8 mana.");render();return;}
    if(action==="aegis"){
      state.mana-=rule.mana;
      state.activeDefense={type:"aegis",capacity:Math.max(1,Math.round(effectiveStat("con")*2))};
      message(`Aegis forms with ${state.activeDefense.capacity} shielding. It costs 8 mana and your turn.`,"story");
    }else if(action==="block"){
      const shield=state.equippedArmor.shield;
      state.activeDefense={type:"block",capacity:Math.max(1,(shield.defense||shield.damageReduction||1)*3)};
      message(`You brace behind your shield. It can absorb ${state.activeDefense.capacity} damage this round.`,"story");
    }else{
      state.activeDefense={type:"dodge",capacity:0};
      message("You evade the coming attacks, reducing their damage by half this round.","story");
    }
    state.defenseCooldowns[rule.key]=3;
    enemyTurn();return;
  }
  if(action==="disrupt"){
    if(!DUNGEON_RULES.disruptEnemy(enemy,state.disruptCooldown||0)){message("That enemy is not preparing an interruptible attack, or Disrupt is cooling down.");render();return;}
    state.disruptCooldown=3;
    message(`You disrupt ${enemy.name}'s ${enemy.intent.label.toLowerCase()}. Your turn passes.`,"story");
    enemyTurn();return;
  }
  if(action==="flee") { if(fight.boss){message("The boss chamber seals behind you. You cannot flee this fight.","danger");render();return;} state.combat=null;state.braced=false;message("You break away and retreat to the previous room.");render();return; }
  if(action==="heal"||action==="mana") { const type=action==="heal"?"health":"mana";const item=state.items.find(it=>it.type===type && it.quantity>0);if(!item){message(`No ${type} potion in your inventory.`);render();return;}item.quantity--;if(type==="health")state.hp=Math.min(state.maxHp,state.hp+healthPotionRestore(item));else state.mana=Math.min(state.maxMana,state.mana+item.amount+Math.max(0,effectiveStat("wis")-10));message(`You use a ${item.name}. Your turn passes.`);enemyTurn();return; }
  const weapon=state.weapon; if(!weapon){message("You need a weapon before you can attack.");render();return;}
  const special=DUNGEON_RULES.getSpecialAttack(weapon,action);
  const isBasic=action==="basic"||action==="attack";
  const isHeavy=action==="heavy";
  const basicFallback=isBasic?DUNGEON_RULES.basicAttackFallback(state.class,weapon.type,state.mana,state.arrows):null;
  const attack=special|| (isHeavy?{name:"Heavy attack",multiplier:1.5,critBonus:0.10,cooldown:2}:isBasic?{name:basicFallback==="mana"?"Staff strike":basicFallback==="arrows"?"Unarmed jab":"Basic attack",multiplier:basicFallback?0.5:1,critBonus:0,cooldown:0}:null);
  if(!attack){message("That attack is not available for this weapon.");render();return;}
  if(special&&DUNGEON_RULES.isAttackOnCooldown(state.attackCooldowns,action)){message(`${attack.name} is cooling down for ${state.attackCooldowns[action]} turn(s).`);render();return;}
  if(state.class==="mage"&&state.equippedArmor?.shield){message("You cannot cast while a shield is equipped.");render();return;}
  if(special?.chargesNextAttack){
    if(state.class==="mage"){const cost=(special.manaCost||0)+(weapon.effect==="Overcast"?2:0);if(state.mana<cost){message(`Not enough mana. Channeling costs ${cost}.`);render();return;}state.mana-=cost;}
    state.chargedAttack={multiplier:special.multiplier,critBonus:special.critBonus};
    message(`${special.name} is ready. Your next basic attack is empowered.`);enemyTurn();return;
  }
  const manaCost=state.class==="mage"&&!basicFallback?(special?.manaCost||weapon.manaCost||5)+(weapon.effect==="Overcast"?2:0):0;
  if(state.mana<manaCost){message(`Not enough mana. This spell costs ${manaCost} mana.`);render();return;}
  if(manaCost)state.mana-=manaCost;
  const arrowCost=["Bow","Crossbow"].includes(weapon.type)&&!basicFallback?(weapon.effect==="Overdraw"?2:1):0;
  if(arrowCost){state.arrows??=0;if(state.arrows<arrowCost){message(`Not enough arrows. This shot costs ${arrowCost}.`);render();return;}state.arrows-=arrowCost;}
  const charged=state.chargedAttack||{multiplier:1,critBonus:0};
  const multiplier=attack.multiplier*charged.multiplier;
  const armorBonuses=DUNGEON_RULES.armorBonuses(state.equippedArmor||{},state.class);
  const crit=Math.min(1,state.critChance+armorBonuses.critChance+(weapon.crit||0)+(attack.critBonus||0)+charged.critBonus+(weapon.effect==="Focus"?0.1:0)+(["Headshot","Snipe"].includes(weapon.effect)||["Headshot","Snipe"].includes(attack.effect)?0.2:0));
  const targets=special?.aoe?fight.enemies.filter(candidate=>candidate.hp>0):[enemy];
  let landed=false;
  for(const target of targets){
    const tracksTarget=["Homing","Snipe","Headshot"].includes(weapon.effect)||["Homing","Snipe","Headshot"].includes(attack.effect);
    if(target.intent?.key==="dodge"&&!target.effects?.Root&&!tracksTarget){target.intentDodging=true;message(`${target.name} reads your movement and evades the attack!`,"danger");continue;}
    if(Math.random()<target.dodge&&!target.effects?.Root&&!tracksTarget){message(`${target.name} dodges the attack!`,"danger");continue;}
    landed=true;
  const passiveBonus=({Penetration:1.15,Pierce:1.10,PiercingShot:1.12,Void:1.12,SpellPower:1.12,SpellEcho:1.08,Focus:1.08,Draw:1.12,DelayedCast:1.15,Overcast:1.25,RangeScaling:1.12,ArcaneCharge:1+Math.min(5,state.arcaneCharge||0)*0.04,Overdraw:1.25})[weapon.effect]||1;
    const momentumBonus=weapon.effect==="Momentum"?1+Math.min(5,state.momentum||0)*0.04:1;
    const defensePierce=["Void","Penetration","Pierce","PiercingShot"].includes(weapon.effect)?0.5:0;
    const matchup=DUNGEON_RULES.elementMatchup(weapon.element,target.element);
    const rawDamage=((state.class==="mage"?effectiveStat("int"):effectiveStat("str"))+weapon.damage)*multiplier*passiveBonus*momentumBonus*(target===enemy?1:special.secondaryMultiplier||0.5)*matchup.multiplier;
    let damage=Math.max(1,Math.round(rawDamage-(target.damageReduction||0)*(1-defensePierce)));
    if(target.intent?.key==="guard")damage=DUNGEON_RULES.guardDamage(damage,isHeavy);
    if(target.intent?.key==="ward")damage=Math.max(1,Math.round(damage*0.7));
    if(target.effects?.Marked)damage=Math.round(damage*1.2);
    if(["Execution","ExecutionBolt"].includes(special?.effect)||["Execution","ExecutionBolt"].includes(weapon.effect))if(target.hp/target.maxHp<=0.3)damage=Math.round(damage*1.5);
    const isCrit=Math.random()<crit;if(isCrit)damage*=2;
    const dealt=applyEnemyDamage(target,damage,`${attack.name} hits ${target.name}${isCrit?" critically":""}`);
    const applied=special?.effect||weapon.effect;
    if(weapon.effect==="Thorns")state.playerEffects=DUNGEON_RULES.applyCombatEffect(state.playerEffects||{},"Thorns",damage);
    else if(weapon.effect)applyWeaponEffect(target,weapon.effect,damage,!special?.aoe);
    if(special?.effect&&special.effect!==weapon.effect)applyWeaponEffect(target,special.effect,damage,!special.aoe);
    if(weapon.effect==="LifeSteal"||special?.effect==="LifeSteal")state.hp=Math.min(state.maxHp,state.hp+Math.max(1,Math.round(damage*0.05)));
    if(weapon.effect==="ManaSteal"||special?.effect==="ManaSteal")state.mana=Math.min(state.maxMana,state.mana+Math.max(1,Math.round(damage*0.05)));
    if(weapon.effect==="ManaSurge")state.mana=Math.min(state.maxMana,state.mana+Math.max(1,Math.round(damage*0.08)));
    if(weapon.effect==="ArcaneCharge")state.arcaneCharge=Math.min(5,(state.arcaneCharge||0)+1);
    if(weapon.effect==="Momentum")state.momentum=Math.min(5,(state.momentum||0)+1);
    if(weapon.effect==="Afterimage"||weapon.effect==="Teleport")state.playerEffects=DUNGEON_RULES.applyCombatEffect(state.playerEffects||{},"Afterimage",damage);
    if(["SpellEcho","Conjure"].includes(weapon.effect)&&target.hp>0){const echo=Math.max(1,Math.round(damage*(weapon.effect==="Conjure"?0.2:0.3)));applyEnemyDamage(target,echo,`${weapon.effect==="Conjure"?"Conjured wisp":"Spell Echo"} adds damage to ${target.name}`);}
    if(applied)message(`Effect applied: ${applied}${matchup.relation!=="neutral"?` · elemental ${matchup.relation}`:""}.`);
  }
  if(landed&&weapon.effect==="AmmoGeneration"&&Math.random()<0.2){state.arrows=Math.min(30,(state.arrows||0)+1);message("Ammo Generation recovers 1 arrow.");}
  if(landed&&weapon.effect==="Quiver"&&Math.random()<0.25){state.arrows=Math.min(30,(state.arrows||0)+2);message("Quiver recovers 2 arrows.");}
  state.chargedAttack=null;
  if(weapon.effect==="Channel"&&landed){state.chargedAttack={multiplier:1.25,critBonus:0.05};message("Channel stores power for your next attack.");}
  state.aimed=false;
  if(special?.cooldown){const effectiveCooldown=Math.max(0,special.cooldown-(weapon.effect==="CooldownReduction"?1:0));if(effectiveCooldown)state.attackCooldowns[action]=effectiveCooldown+1;}
  if(isHeavy)state.cooldown=3;
  if(DUNGEON_RULES.allEnemiesDefeated(fight.enemies)){winFight();return;}
  enemyTurn();
}

function enemyTurn() {
  if(!state.combat)return;
  if(DUNGEON_RULES.allEnemiesDefeated(state.combat.enemies)){winFight();return;}
  const enemies=state.combat?.enemies.filter(enemy=>enemy.hp>0)||[];
  for(const enemy of enemies){
    processEnemyEffects(enemy);if(enemy.hp<=0)continue;
    if(DUNGEON_RULES.consumeDisruptedIntent(enemy)){message(`${enemy.name}'s telegraphed action is disrupted.`,"story");continue;}
    if(enemy.effects?.Gust){delete enemy.effects.Gust;message(`${enemy.name} reels from the gust and loses its turn.`,"story");continue;}
    if(enemy.effects?.Freeze&&enemy.effects.Freeze.stacks>=5){delete enemy.effects.Freeze;message(`${enemy.name} is frozen solid and loses its turn.`,"story");continue;}
    if(enemy.intentDodging){enemy.intentDodging=false;message(`${enemy.name} spends its turn repositioning after the dodge.`,"story");continue;}
    if(enemy.intent?.key==="guard"){message(`${enemy.name} holds its guard and waits for an opening.`);continue;}
    if(enemy.intent?.key==="ward"){message(`${enemy.name}'s ward fades after absorbing part of your attack.`);continue;}
    if(enemy.intent?.key==="summon"||enemy.intent?.key==="buff"){
      const summonLimit=state.combat.boss?4:2;
      if(enemy.intent.key==="summon"&&state.combat.summonedCount<summonLimit){
        const summon=makeEnemy(state.floor,false,0);if(enemy.race==="skeleton"){summon.name="Lesser Skeleton";summon.race="skeleton";summon.klass="Warrior";summon.element="Earth";}summon.maxHp=Math.max(8,Math.round(summon.maxHp*0.35));summon.hp=summon.maxHp;summon.damage=Math.max(1,Math.round(summon.damage*0.45));summon.gold=0;summon.xp=0;summon.summoned=true;summon.intent=DUNGEON_RULES.chooseEnemyIntent(summon.klass,summon.race);state.combat.enemies.push(summon);state.combat.summonedCount++;message(`${enemy.name} calls ${summon.name.toLowerCase()} into the fight!`,"danger");
      }else if(enemy.intent.key==="buff"){
        for(const ally of state.combat.enemies.filter(item=>item.hp>0))ally.damage=Math.round(ally.damage*1.15);
        message(`${enemy.name} rallies its allies, increasing their damage.`,"danger");
      }else message(`${enemy.name} strains to summon, but its summoning limit is reached.`);
      continue;
    }
    const intent=enemy.intent?.key;
    const damageScale=intent==="cast"?1.15:intent==="shoot"?0.9:1;
    const blind=enemy.effects?.Blind||enemy.effects?.Cripple?0.65:1;
    if(Math.random()<enemy.dodge||state.playerEffects?.Afterimage||Math.random()<passiveEvasionChance()||Math.random()>blind){delete state.playerEffects?.Afterimage;message(`You evade ${enemy.name}'s ${intent==="shoot"?"shot":intent==="cast"?"spell":"attack"}.`,"story");}
    else {
      const damage=takePlayerDamage(Math.round(enemy.damage*damageScale));message(`${enemy.name} ${intent==="shoot"?"shoots":intent==="cast"?"casts":"strikes"} you for ${damage} damage.`,"danger");
      const thorns=Math.max(DUNGEON_RULES.armorBonuses(state.equippedArmor||{},state.class).thorns,state.playerEffects?.Thorns?0.2:0);
      if(thorns){const reflected=Math.max(1,Math.round(damage*thorns));const dealt=Math.min(enemy.hp,reflected);enemy.hp=Math.max(0,enemy.hp-reflected);state.combat.damageDealt+=dealt;state.runStats.damageDealt+=dealt;message(`Your thorns reflect ${reflected} damage to ${enemy.name}.`);}
      if(state.hp<=0){die();return;}
    }
  }
  if(!state.combat)return;
  if(DUNGEON_RULES.allEnemiesDefeated(state.combat.enemies)){winFight();return;}
  for(const enemy of enemies)enemy.effects=DUNGEON_RULES.tickCombatEffects(enemy.effects||{},{durationOnly:true}).statuses;
  for(const enemy of state.combat.enemies.filter(item=>item.hp>0))enemy.intent=DUNGEON_RULES.chooseEnemyIntent(enemy.klass,enemy.race);
  if(state.playerEffects){state.playerEffects=DUNGEON_RULES.tickCombatEffects(state.playerEffects).statuses;}
  for(const [key,value] of Object.entries(state.attackCooldowns||{})){state.attackCooldowns[key]=Math.max(0,value-1);if(!state.attackCooldowns[key])delete state.attackCooldowns[key];}
  for(const key of Object.keys(state.defenseCooldowns||{}))state.defenseCooldowns[key]=Math.max(0,state.defenseCooldowns[key]-1);
  state.activeDefense=null;
  state.cooldown=Math.max(0,(state.cooldown||0)-1);
  state.disruptCooldown=DUNGEON_RULES.tickDisruptCooldown(state.disruptCooldown||0);
  render();
}

function applyWeaponEffect(enemy,effect,damage,allowChain=true){
  enemy.effects ||= {};
  enemy.effects=DUNGEON_RULES.applyCombatEffect(enemy.effects,effect,damage);
  if(allowChain&&["Shock","Chain","Ricochet","RicochetShot","PiercingShot"].includes(effect)){
    const other=state.combat.enemies.find(item=>item!==enemy&&item.hp>0);if(other){const arc=Math.max(1,Math.round(damage*0.35));applyEnemyDamage(other,arc,`${effect} arcs to ${other.name}`);}
  }
  if(allowChain&&["Scatter","Multishot","Volley","Salvo","SpellRadius","SpellSplit"].includes(effect)){
    const other=state.combat.enemies.find(item=>item!==enemy&&item.hp>0);if(other){const splash=Math.max(1,Math.round(damage*0.35));applyEnemyDamage(other,splash,`${effect} splashes ${other.name}`);}
  }
}

function processEnemyEffects(enemy){
  const tick=DUNGEON_RULES.tickCombatEffects(enemy.effects||{},{damageOnly:true});enemy.effects=tick.statuses;
  for(const entry of tick.messages){applyEnemyDamage(enemy,entry.damage,`${entry.effect} damages ${enemy.name}`,"danger");if(!state.combat)return;}
}

function applyEnemyDamage(enemy,amount,description,tone=""){
  if(!enemy||enemy.hp<=0)return 0;
  const dealt=Math.min(enemy.hp,Math.max(0,Math.round(amount)));
  enemy.hp=Math.max(0,enemy.hp-dealt);
  if(state.combat){state.combat.damageDealt=(state.combat.damageDealt||0)+dealt;state.runStats.damageDealt=(state.runStats.damageDealt||0)+dealt;}
  message(`${description} for ${dealt} damage${enemy.hp===0?`; ${enemy.name} falls`:""}.`,enemy.hp===0?"story":tone);
  return dealt;
}

function effectiveDexterity(){return Math.max(1,effectiveStat("dex")+DUNGEON_RULES.armorBonuses(state.equippedArmor||{},state.class).dexterity-(state.class==="archer"&&state.equippedArmor?.shield?3:0));}
function passiveEvasionChance(){return Math.min(0.5,Math.max(0,effectiveDexterity()-10)*0.01+Math.max(0,effectiveStat("speed")-10)*0.005);}

function takePlayerDamage(damage) {
  let incoming=damage;
  if(state.weapon?.effect==="ManaShield"&&state.mana>0){const absorbed=Math.min(4,state.mana,incoming);state.mana-=absorbed;incoming-=absorbed;}
  const reduction=DUNGEON_RULES.armorDamageReduction(state.equippedArmor||{},state.class);
  let afterArmor=Math.max(1,incoming-reduction);
  const defense=state.activeDefense;
  if(defense?.type==="dodge")afterArmor=Math.max(1,Math.round(afterArmor*0.5));
  else if(defense&&["aegis","block"].includes(defense.type)&&defense.capacity>0){
    const absorbed=Math.min(defense.capacity,afterArmor);
    defense.capacity-=absorbed;
    afterArmor-=absorbed;
    if(absorbed)message(`${defense.type==="aegis"?"Aegis absorbs":"Your shield absorbs"} ${absorbed} damage${defense.capacity===0?" and breaks":""}.`,defense.capacity===0?"danger":"story");
  }
  const actual=DUNGEON_RULES.applyBraceToDamage(state,afterArmor);
  state.hp=Math.max(0,state.hp-actual);
  if(state.combat){state.combat.damageTaken+=actual;state.runStats.damageTaken+=actual;}
  return actual;
}
function winFight() {
  const fight=state.combat; const room=currentRoom();let totalGold=0,totalXp=0;
  for(const enemy of fight.enemies){totalGold+=enemy.gold;totalXp+=enemy.xp;}
  state.gold+=totalGold;totalXp+=Math.round(totalXp*0.35);const levels=gainXp(totalXp);
  let rewards=`Victory. +${totalGold} gold and +${totalXp} XP.`;
  if(Math.random()<0.8){const lootRarity=DUNGEON_RULES.rollLootRarity(room.enemyCount||1,fight.boss,Math.random());const loot=makeLoot(lootRarity);grantLoot(loot);rewards+=` Loot: ${loot.value.rarity} ${loot.value.name}${loot.kind==="weapon"?` (${loot.value.type})`:loot.kind==="armor"?` (${loot.value.slot})`:""}.`;}
  if(state.weapons.some(weapon=>["Bow","Crossbow"].includes(weapon.type))&&Math.random()<0.45){state.arrows=Math.min(30,(state.arrows||0)+6);rewards+=" +6 arrows.";}
  if(fight.enemies.some(enemy=>enemy.klass==="Archer")){state.arrows=Math.min(30,(state.arrows||0)+4);rewards+=" Archer dropped 4 arrows.";}
  if(levels)rewards+=` You leveled up! Current skillpoints: ${state.skillPoints}.`;
  const defeated=fight.enemies.filter(enemy=>!enemy.summoned).length;
  state.runStats.enemiesDefeated+=defeated;
  state.runStats.fights.unshift({floor:state.floor,boss:fight.boss,enemies:fight.enemies.map(enemy=>enemy.name),gold:totalGold,xp:totalXp,damageDealt:fight.damageDealt||0,damageTaken:fight.damageTaken||0,rewards,log:[...(fight.log||[])]});
  state.runStats.fights=state.runStats.fights.slice(0,20);
  state.combat=null;state.braced=false;state.activeDefense=null;room.cleared=true;
  if(fight.boss){state.currentFloor.bossCleared=true;state.floorsCleared++;rewards+=" The way to the next floor opens.";state.runStats.fights[0].rewards=rewards;state.runStats.fights.unshift({floor:state.floor,floorClear:true,level:state.level,enemiesDefeated:state.runStats.enemiesDefeated,gold:state.gold});state.runStats.fights=state.runStats.fights.slice(0,20);}
  message(rewards,"reward");render();
}

function gainXp(amount){state.xp+=amount;let count=0;while(state.xp>=xpToNext()){state.xp-=xpToNext();state.level++;state.skillPoints++;state.baseMaxHp=(state.baseMaxHp||state.maxHp)+20;state.maxHp=state.baseMaxHp+Object.values(state.equippedArmor||{}).reduce((sum,armor)=>sum+(armor.healthBonus||0),0);state.maxMana+=10;state.hp=Math.min(state.maxHp,state.hp+Math.ceil(state.maxHp*0.5));state.mana=state.maxMana;count++;}return count;}
function xpToNext(){const normal=state.level<9?200+(state.level-1)*100:Math.round(1000*Math.pow(1.3,state.level-9));return Math.round(normal*(DIFFICULTIES[state.difficulty]?.xpRequirement||1));}

function makeLootWeapon(forcedRarity=null,minimumRarity="Common"){
  const room=currentRoom();
  let rarity=forcedRarity||DUNGEON_RULES.rollLootRarity(room.enemyCount||1,Boolean(state.combat?.boss),Math.random());
  if(RARITIES.indexOf(rarity)<RARITIES.indexOf(minimumRarity))rarity=minimumRarity;
  if(state.devMode&&Math.random()<0.6)rarity=choice(RARITIES.slice(2));
  const ownedDivines=[...state.weapons,...state.armor,...state.items].filter(item=>item.rarity==="Divine").map(item=>item.name);
  let family=DUNGEON_RULES.rollWeaponFamily();
  if(rarity==="Divine"&&!GAME_INDEX_DATA.weapons[family].some(entry=>entry.rarity==="Divine"&&!ownedDivines.includes(entry.name))){
    const alternatives=["warrior","archer","mage"].filter(candidate=>GAME_INDEX_DATA.weapons[candidate].some(entry=>entry.rarity==="Divine"&&!ownedDivines.includes(entry.name)));
    if(alternatives.length)family=choice(alternatives);else rarity="Mythic";
  }
  const entry=DUNGEON_RULES.chooseCatalogWeapon(family,rarity,GAME_INDEX_DATA.weapons,Math.random,ownedDivines);
  const weapon=DUNGEON_RULES.createCatalogWeapon(entry,state.floor);
  if(weapon.arrows&&state.arrows==null)state.arrows=0;
  return weapon;
}

function makeLoot(rarity=null){
  rarity=rarity||DUNGEON_RULES.rollLootRarity(currentRoom().enemyCount||1,Boolean(state.combat?.boss),Math.random());
  const lootKind=DUNGEON_RULES.rollLootKind();
  if(lootKind==="weapon")return{kind:"weapon",value:makeLootWeapon(rarity)};
  if(lootKind==="armor"){
    const available=ARMOR_INDEX.filter(entry=>entry.rarity===rarity&&!(rarity==="Divine"&&[...state.armor,...state.items,...state.weapons].some(item=>item.name===entry.name)));
    const pool=available.length?available:ARMOR_INDEX.filter(entry=>entry.rarity!=="Divine");
    return{kind:"armor",value:DUNGEON_RULES.createCatalogArmor(choice(pool),state.floor)};
  }
  const mana=Math.random()<0.4;
  rarity=DUNGEON_RULES.avoidDuplicateDivine(rarity,state.items.some(item=>item.rarity==="Divine"&&item.type===(mana?"mana":"health")));
  return{kind:"item",value:{name:`${rarity} ${mana?"Mana":"Healing"} Potion`,type:mana?"mana":"health",amount:mana?18+state.floor*3:0,quantity:1,rarity}};
}

function grantLoot(loot){
  if(loot.kind==="weapon"){state.weapons.push(loot.value);state.inventoryNotice=true;}
  else if(loot.kind==="armor"){state.armor.push(loot.value);state.inventoryNotice=true;equipCollectedArmor(loot.value);}
  else state.items.push(loot.value);
}

function itemNameWithRarity(item) {
  const prefix=`${item.rarity} `;
  return item.name.startsWith(prefix)?item.name:`${prefix}${item.name}`;
}

function die(){state.hp=0;state.braced=false;state.activeDefense=null;if(state.combat){state.runStats.fights.unshift({floor:state.floor,defeat:true,enemies:state.combat.enemies.map(enemy=>enemy.name),damageDealt:state.combat.damageDealt||0,damageTaken:state.combat.damageTaken||0,log:[...(state.combat.log||[])]});state.runStats.fights=state.runStats.fights.slice(0,20);}state.combat=null;state.deaths++;updatePersonalBest(state);submitCompletedRun(state);message(`${state.name} has fallen. The run is over.`,"danger");modal="death";render();}

function openInventory(){
  state.inventoryNotice=false;
  inventoryWeaponFamily=state.class||"warrior";
  inventoryCategory="weapons";
  save();
  modal="inventory";render();
}
function equipWeapon(index){const weapon=state.weapons[index];if(!weapon)return;const family=weaponFamily(weapon);if(!family||family!==state.chosenClass){message(`Your ${CLASS_NAMES[state.chosenClass]||"chosen"} class cannot equip that weapon.`);modal="inventory";render();return;}state.weapon=weapon;state.class=state.chosenClass;weapon.attacks ||= DUNGEON_RULES.createWeaponAttacks(family,weapon.rarity,weapon.type,weapon.element||"Physical",weapon.manaCost||0);message(`${weapon.name} equipped.`);modal="inventory";render();}
function equipArmor(index){const armor=state.armor[index];if(!armor)return;const list=screen.querySelector("#inventory-list");const scrollTop=list?.scrollTop||0;const scrollLeft=list?.scrollLeft||0;state.equippedArmor=DUNGEON_RULES.equipArmor(state.equippedArmor||{},armor);updateArmorBonuses();message(`${armor.name} equipped in the ${armor.slot} slot.`);modal="inventory";if(modal==="inventory"&&list){list.innerHTML=renderInventoryItems("armor");bindInventoryListActions();bindUseItem();bindInventoryControls();list.scrollTop=scrollTop;list.scrollLeft=scrollLeft;updateInventoryEquipmentSummary();save();}else render();}

function updateInventoryEquipmentSummary(){
  const modalElement=screen.querySelector(".modal[aria-labelledby='inventory-title']");
  if(!modalElement)return;
  const slots=modalElement.querySelector(".equipped-slots");
  if(slots)slots.innerHTML=["head","chest","legs","feet","shield"].map(slot=>`<div><span>${slot}</span><strong>${escapeHtml(state.equippedArmor[slot]?.name||"Empty")}</strong></div>`).join("");
  const summary=modalElement.querySelector(".armor-set-summary");
  if(summary)summary.textContent=armorSummaryText();
}
function showModal(){
  const old=screen.querySelector(".modal-backdrop");if(old)old.remove();
  let content="";
  if(modal==="inventory"){
    content=`<section class="modal" role="dialog" aria-modal="true" aria-labelledby="inventory-title"><div class="modal-heading"><div><p class="section-kicker">Pack &amp; equipment</p><h2 id="inventory-title">Inventory</h2></div><button class="icon-close" data-close-modal aria-label="Close inventory">×</button></div><div class="inventory-tabs"><button class="tab-button active" data-tab="weapons">Weapons</button><button class="tab-button" data-tab="armor">Armor</button><button class="tab-button" data-tab="items">Items</button><button class="tab-button" data-open-skills>Skills${state.skillPoints ? ` (${state.skillPoints} unspent)` : ""}</button></div><div class="equipped-slots">${["head","chest","legs","feet","shield"].map(slot=>`<div><span>${slot}</span><strong>${escapeHtml(state.equippedArmor?.[slot]?.name||"Empty")}</strong></div>`).join("")}</div><p class="armor-set-summary">${escapeHtml(armorSummaryText())}</p><div class="inventory-list" id="inventory-list">${renderInventoryItems("weapons")}</div><p class="inventory-gold">${state.gold} gold · ${state.class?escapeHtml(CLASS_NAMES[state.class]):"Class unchosen"}</p></section>`;
  } else if(modal==="skills"){
    content=`<section class="modal skills-modal" role="dialog" aria-modal="true" aria-labelledby="skills-title"><div class="modal-heading"><div><p class="section-kicker">Character development</p><h2 id="skills-title">Skills &amp; advanced stats</h2></div><button class="icon-close" data-close-modal aria-label="Close skills">×</button></div><p class="skill-points">Unspent skill points: <strong>${state.skillPoints}</strong></p><div class="skill-list">${DUNGEON_RULES.STAT_DEFINITIONS.map(stat=>`<article class="skill-row"><div><strong>${stat.label}: ${statValueLabel(stat)}</strong><p>${statDescription(stat)}${stat.key==="dex"&&state.class==="archer"&&state.equippedArmor?.shield?" Equipped shield penalty applied.":""}</p></div><button class="small-button" data-spend-stat="${stat.key}" ${state.skillPoints===0 || (stat.key === "critChance" && state.critChance>=1) ? "disabled" : ""}>Improve</button></article>`).join("")}</div><button class="secondary-button skill-inventory-link" data-open-inventory type="button">Return to inventory</button></section>`;
  } else if(modal==="shop"){
    content=`<section class="modal shop-modal" role="dialog" aria-modal="true" aria-labelledby="shop-title"><div class="modal-heading"><div><p class="section-kicker">Floor ${state.floor} merchant · ${DIFFICULTIES[state.difficulty]?.label||"Normal"}</p><h2 id="shop-title">Shop</h2></div><button class="icon-close" data-close-modal aria-label="Close shop">×</button></div><div class="shop-upgrade"><div><strong>Stock quality · Level ${state.shopLootUpgradeLevel||0}/5</strong><p>Upgrade shop rarity odds for this run; current stock refreshes. Next upgrade: ${shopUpgradeCost()} gold.</p></div><button class="small-button" data-upgrade-shop ${(state.shopLootUpgradeLevel||0)>=5||state.gold<shopUpgradeCost()?"disabled":""}>Upgrade</button></div><div class="shop-list">${state.shopStock.map((item,index)=>`<article class="shop-item">${item.kind==="weapon"?weaponArt(item.value):item.kind==="armor"?itemArt(`Images/Armor/${item.value.file}`,item.value.name):potionArt(item.value)}<div><span class="item-meta">${escapeHtml(item.value.rarity)} ${escapeHtml(item.kind)}</span><strong>${escapeHtml(item.value.name)}</strong><p>${item.price} gold</p></div><button class="small-button" data-buy="${index}" ${state.gold<item.price?"disabled":""}>Buy</button></article>`).join("")}</div><div class="shop-footer"><span>${state.gold} gold</span><button class="small-button" data-reroll ${state.gold<shopRerollCost()?"disabled":""}>Reroll · ${shopRerollCost()} gold</button></div><details class="sell-inventory"><summary>Sell from inventory</summary>${renderSellList()}</details></section>`;
  } else if(modal==="death"){
    content=`<section class="modal death-modal" role="dialog" aria-modal="true" aria-labelledby="death-title"><p class="section-kicker">Run ended</p><h2 id="death-title">You have fallen.</h2><p>Floors cleared: ${state.floorsCleared} · Level ${state.level}</p>${state.devMode?`<p class="run-submission-result">Dev runs do not count toward personal or global records.</p>`:state.runSubmissionStatus?`<p class="run-submission-result">${escapeHtml(state.runSubmissionStatus)}</p>`:""}<div class="action-grid"><button class="action-button" data-restart>Restart run</button><button class="action-button secondary" data-title>Return to title</button></div></section>`;
  } else if(modal==="recap"){
    const fights=state.runStats?.fights||[];
    content=`<section class="modal recap-modal" role="dialog" aria-modal="true" aria-labelledby="recap-title"><div class="modal-heading"><div><p class="section-kicker">Run record · Floor ${state.floor}</p><h2 id="recap-title">Expedition recap</h2></div><button class="icon-close" data-close-modal aria-label="Close run recap">×</button></div><div class="recap-totals"><span><b>${state.floorsCleared}</b> floors cleared</span><span><b>${state.runStats?.enemiesDefeated||0}</b> enemies defeated</span><span><b>${state.runStats?.damageDealt||0}</b> damage dealt</span><span><b>${state.runStats?.damageTaken||0}</b> damage taken</span></div><div class="recap-list">${fights.length?fights.map((fight,index)=>`<details class="recap-entry" ${index===0?"open":""}><summary>${fight.floorClear?`Floor ${fight.floor} cleared`:fight.defeat?`Defeat on Floor ${fight.floor}`:`Floor ${fight.floor} · ${fight.boss?"Boss fight":"Battle"} · ${fight.enemies.map(escapeHtml).join(", ")}`}</summary>${fight.floorClear?`<p>Level ${fight.level} · ${fight.enemiesDefeated} enemies defeated · ${fight.gold} gold carried</p>`:`<p>${escapeHtml(fight.rewards||"Run ended before victory.")}</p><p>${fight.damageDealt||0} damage dealt · ${fight.damageTaken||0} damage taken</p>`}<div class="recap-log">${(fight.log||[]).map(entry=>`<p class="${escapeHtml(entry.tone||"")}">${escapeHtml(entry.text)}</p>`).join("")||"<p>No battle events recorded.</p>"}</div></details>`).join(""):`<p class="empty-list">No battles recorded yet.</p>`}</div></section>`;
  } else if(modal==="leaderboard"){
    content=`<section class="modal leaderboard-modal" role="dialog" aria-modal="true" aria-labelledby="leaderboard-title"><div class="modal-heading"><div><p class="section-kicker">Global rankings · Top 100</p><h2 id="leaderboard-title">Highest floors</h2></div><button class="icon-close" data-close-modal aria-label="Close leaderboard">×</button></div>${renderLeaderboard()}</section>`;
  } else if(modal==="index"){
    content=`<section class="modal index-modal" role="dialog" aria-modal="true" aria-labelledby="index-title"><div class="modal-heading"><div><p class="section-kicker">Field reference</p><h2 id="index-title">Index</h2></div><button class="icon-close" data-close-modal aria-label="Close Index">×</button></div><div class="index-layout"><nav class="index-categories" aria-label="Index categories">${[["warrior","Warrior Weapons"],["archer","Archer Weapons"],["mage","Mage Weapons"],["armor","Armor"],["items","Items"],["effects","Effects"]].map(([key,label])=>`<button class="index-category ${indexCategory===key?"active":""}" data-index-category="${key}">${label}</button>`).join("")}</nav><div class="index-content" id="index-content">${renderIndexCategory()}</div></div></section>`;
  }
  if(!content)return;
  screen.insertAdjacentHTML("beforeend",`<div class="modal-backdrop">${content}</div>`);
  bindArtFallbacks();
  screen.querySelector("[data-close-modal]")?.addEventListener("click",()=>{modal=null;render();});
  screen.querySelectorAll("[data-tab]").forEach(button=>button.addEventListener("click",()=>{inventoryCategory=button.dataset.tab;screen.querySelectorAll("[data-tab]").forEach(tab=>tab.classList.toggle("active",tab===button));screen.querySelector("#inventory-list").innerHTML=renderInventoryItems(inventoryCategory);bindInventoryListActions();bindUseItem();bindInventoryControls();}));
  bindInventoryListActions();
  screen.querySelectorAll("[data-open-skills]").forEach(button=>button.addEventListener("click",openSkills));
  screen.querySelectorAll("[data-spend-stat]").forEach(button=>button.addEventListener("click",()=>spendSkillPoint(button.dataset.spendStat)));
  bindUseItem();
  bindInventoryControls();
  screen.querySelectorAll("[data-buy]").forEach(button=>button.addEventListener("click",()=>buyItem(Number(button.dataset.buy))));
  screen.querySelectorAll("[data-sell-type]").forEach(button=>button.addEventListener("click",()=>sellItem(button.dataset.sellType,Number(button.dataset.sellIndex))));
  screen.querySelectorAll("[data-index-category]").forEach(button=>button.addEventListener("click",()=>{indexCategory=button.dataset.indexCategory;selectedIndexItem=null;screen.querySelectorAll("[data-index-category]").forEach(category=>category.classList.toggle("active",category===button));screen.querySelector("#index-content").innerHTML=renderIndexCategory();bindIndexItems();}));
  screen.querySelectorAll("[data-leaderboard-difficulty]").forEach(button=>button.addEventListener("click",()=>refreshGlobalLeaderboard(button.dataset.leaderboardDifficulty)));
  screen.querySelector("[data-leaderboard-retry]")?.addEventListener("click",()=>refreshGlobalLeaderboard(leaderboardDifficulty));
  if(modal==="leaderboard") refreshGlobalLeaderboard(leaderboardDifficulty);
  bindIndexItems();
  screen.querySelector("[data-reroll]")?.addEventListener("click",rerollShop);
  screen.querySelector("[data-upgrade-shop]")?.addEventListener("click",upgradeShopLoot);
  screen.querySelector("[data-restart]")?.addEventListener("click",()=>newRun(state.name,state.devMode,state.saveSlot,state.difficulty));
  screen.querySelector("[data-title]")?.addEventListener("click",()=>{modal=null;state=null;titleButton.hidden=true;startScreen();});
}

function getIndexWeaponEntries(family) {
  return GAME_INDEX_DATA.weapons[family];
}

function effectIcon(effectName) {
  const normalize=name=>name.replace(/\s/g,"").toLowerCase();
  return EFFECT_DETAILS.find(([name])=>normalize(name)===normalize(effectName))?.[1]||DUNGEON_RULES.getEffectDefinition(effectName)?.icon||"";
}

function formatIndexElement(element) { return element === "None" ? "Physical" : element; }
function formatIndexEffect(effect) { return effect.replace(/([a-z])([A-Z])/g,"$1 $2"); }

function renderIndexCategory() {
  if(selectedIndexItem){
    const item=selectedIndexItem;
    return `<button class="index-back" data-index-back>← Back to ${escapeHtml(item.categoryLabel)}</button><div class="index-detail">${item.art||""}<p class="item-meta">${escapeHtml(item.rarity||"")}${item.type?` · ${escapeHtml(item.type)}`:""}</p><h3>${escapeHtml(item.name)}</h3>${item.element?`<p>Element: ${escapeHtml(formatIndexElement(item.element))}</p>`:""}${item.damage?`<p>Base damage: ${item.damage}</p>`:""}${item.effect?`<p>Effect: <span aria-hidden="true">${effectIcon(item.effect)}</span> ${escapeHtml(formatIndexEffect(item.effect))}</p>`:""}<p>${escapeHtml(item.description||"")}</p></div>`;
  }
  if(["warrior","archer","mage"].includes(indexCategory)){
    const familyLabel=CLASS_NAMES[indexCategory];
    const entries=getIndexWeaponEntries(indexCategory);
    return `<p class="index-intro">${entries.length} ${familyLabel.toLowerCase()} weapon designs.</p><div class="index-list">${entries.map((item,index)=>`<button class="index-entry ${rarityClass(item.rarity)}" data-index-item="${index}"><span class="index-entry-name">${escapeHtml(item.name)}</span><span class="index-entry-meta">${escapeHtml(item.rarity)} ${escapeHtml(item.type)} · ${escapeHtml(formatIndexElement(item.element))} · <span aria-hidden="true">${effectIcon(item.effect)}</span> ${escapeHtml(formatIndexEffect(item.effect))}</span></button>`).join("")}</div>`;
  }
  if(indexCategory==="armor"||indexCategory==="items"){
    const entries=indexCategory==="armor"?ARMOR_INDEX:ITEM_INDEX;
    return `<p class="index-intro">${entries.length} ${indexCategory==="armor"?"armor pieces.":"items and ammunition."}</p><div class="index-list">${entries.map((item,index)=>`<button class="index-entry ${rarityClass(item.rarity)}" data-index-item="${index}"><span class="index-entry-name">${escapeHtml(item.name)}</span><span class="index-entry-meta">${escapeHtml(item.rarity)} · ${escapeHtml(item.type)}</span></button>`).join("")}</div>`;
  }
  return `<p class="index-intro">Effect glossary</p><div class="index-list effect-list">${EFFECT_DETAILS.map(([name,icon,description])=>`<article class="index-entry effect-entry"><span class="effect-name"><span aria-hidden="true">${icon}</span>${escapeHtml(name)}</span><span class="index-entry-meta">${escapeHtml(description)}</span></article>`).join("")}</div>`;
}

function bindIndexItems(){
  screen.querySelectorAll("[data-index-item]").forEach(button=>button.addEventListener("click",()=>{
    const index=Number(button.dataset.indexItem);
    const entries=getIndexEntries(indexCategory);
    selectedIndexItem=entries[index];
    screen.querySelector("#index-content").innerHTML=renderIndexCategory();
    bindIndexItems();
    screen.querySelector("[data-index-back]")?.addEventListener("click",()=>{selectedIndexItem=null;screen.querySelector("#index-content").innerHTML=renderIndexCategory();bindIndexItems();});
    bindArtFallbacks();
  }));
}

function getIndexEntries(category) {
  if(["warrior","archer","mage"].includes(category)) {
    return getIndexWeaponEntries(category).map(item=>({...item,categoryLabel:`${CLASS_NAMES[category]} Weapons`,art:weaponArt(item)}));
  }
  const entries=category==="armor"?ARMOR_INDEX:ITEM_INDEX;
  return entries.map(item=>({...item,categoryLabel:category==="armor"?"Armor":"Items",art:item.file?itemArt(category==="armor"?`Images/Armor/${item.file}`:`Images/Items/Potions/${item.file}`,item.name):`<div class="item-art"><span>${escapeHtml(item.name)}</span></div>`}));
}

function renderInventoryItems(tab){
  if(tab==="items"){
    const ammunition=state.arrows>0?`<article class="inventory-item"><div class="item-art"><span>Arrows</span></div><div class="item-copy"><span class="item-meta">Common ammunition</span><strong>Arrows</strong><span class="item-stats">${state.arrows} shared arrows for bows and crossbows</span></div></article>`:"";
    const items=state.items.map((item,index)=>{
      const restoration=item.type==="mana"?`Restores ${item.amount} mana`:`Restores ${HEALTH_POTION_PERCENT[item.rarity]||20}% max HP (${healthPotionRestore(item)} HP now)`;
      return `<article class="inventory-item ${rarityClass(item.rarity)}">${potionArt(item)}<div class="item-copy"><span class="item-meta">${escapeHtml(item.rarity)} · x${item.quantity}</span><strong>${escapeHtml(item.name)}</strong><span class="item-stats">${restoration}</span></div><div class="inventory-item-actions"><button class="small-button" data-use-item="${index}">Use</button><button class="small-button" data-inventory-sell="item" data-sell-index="${index}">Sell · ${sellValue(item,"item")}g</button></div></article>`;
    }).join("");
    return `${ammunition}${items||(!ammunition?"<p class=\"empty-list\">No items in your pack.</p>":"")}`;
  }
  if(tab==="weapons"){
    const familyWeapons=state.weapons.map((weapon,index)=>({weapon,index})).filter(({weapon})=>weaponFamily(weapon)===inventoryWeaponFamily);
    const rarityOrder=RARITIES;
    familyWeapons.sort((a,b)=>{
      let result=weaponSort.key==="damage"?a.weapon.damage-b.weapon.damage:weaponSort.key==="name"?a.weapon.name.localeCompare(b.weapon.name):rarityOrder.indexOf(a.weapon.rarity)-rarityOrder.indexOf(b.weapon.rarity);
      if(weaponSort.direction==="desc")result=-result;
      return result||a.weapon.name.localeCompare(b.weapon.name);
    });
    const sortButton=(key,label,defaultDirection)=>`<button class="sort-button ${weaponSort.key===key?"active":""}" data-weapon-sort="${key}" aria-label="Sort by ${label} ${weaponSort.key===key?(weaponSort.direction==="desc"?"descending":"ascending"):defaultDirection}">${label} <span>${weaponSort.key===key?(weaponSort.direction==="desc"?"↓":"↑"):"↕"}</span></button>`;
    return `<nav class="weapon-family-tabs" aria-label="Weapon class">${["warrior","archer","mage"].map(family=>`<button class="subtab-button ${inventoryWeaponFamily===family?"active":""}" data-weapon-family="${family}">${CLASS_NAMES[family]}</button>`).join("")}</nav><div class="weapon-sort-controls">${sortButton("rarity","Rarity","desc")}${sortButton("name","Name","asc")}${sortButton("damage","Damage","desc")}</div>${familyWeapons.length?familyWeapons.map(({weapon,index})=>weaponCard(weapon,index,weapon===state.weapon)).join(""):`<p class="empty-list">No ${CLASS_NAMES[inventoryWeaponFamily].toLowerCase()} weapons collected.</p>`}`;
  }
  if(tab==="armor")return state.armor.length?state.armor.map((item,index)=>{const equipped=state.equippedArmor?.[item.slot]===item;return `<article class="inventory-item ${rarityClass(item.rarity)}">${itemArt(`Images/Armor/${item.file||`${slug(item.set||"iron")}-${item.slot}.png`}`,item.name)}<div class="item-copy"><span class="item-meta">${escapeHtml(item.rarity)} · ${escapeHtml(item.slot)} · ${escapeHtml(item.set||"")}</span><strong>${escapeHtml(item.name)}</strong><span class="item-stats">${item.defense} defense · ${item.damageReduction} damage reduction · +${item.healthBonus||0} max HP · ${escapeHtml(armorPerkText(item))}</span></div><div class="inventory-item-actions">${equipped?`<span class="equipped-tag">Equipped</span>`:`<button class="small-button" data-equip-armor="${index}">Equip</button>`}<button class="small-button" data-inventory-sell="armor" data-sell-index="${index}" ${equipped?"disabled title=\"Unequip this armor before selling it\"":""}>Sell · ${sellValue(item,"armor")}g</button></div></article>`;}).join(""):`<p class="empty-list">No armor collected.</p>`;
  const ammunition=state.arrows>0?`<article class="inventory-item"><div class="item-art"><span>Arrows</span></div><div class="item-copy"><span class="item-meta">Common ammunition</span><strong>Arrows</strong><span class="item-stats">${state.arrows} shared arrows for bows and crossbows</span></div></article>`:"";
  return `${ammunition}${state.items.length?state.items.map((item,index)=>`<article class="inventory-item ${rarityClass(item.rarity)}">${potionArt(item)}<div class="item-copy"><span class="item-meta">${escapeHtml(item.rarity)} · x${item.quantity}</span><strong>${escapeHtml(item.name)}</strong><span class="item-stats">Restores ${item.amount} ${item.type==="mana"?"mana":"health"}</span></div><div class="inventory-item-actions"><button class="small-button" data-use-item="${index}">Use</button><button class="small-button" data-inventory-sell="item" data-sell-index="${index}">Sell · ${sellValue(item,"item")}g</button></div></article>`).join(""):`${ammunition?"":"<p class=\"empty-list\">No items in your pack.</p>"}`}`;
}

function weaponFamily(weapon){if(["Bow","Crossbow"].includes(weapon.type))return "archer";if(["Staff","Wand"].includes(weapon.type))return "mage";if(["Sword","Dagger","Axe","Scythe"].includes(weapon.type))return "warrior";return null;}

function bindInventoryControls(){
  screen.querySelectorAll("[data-weapon-family]").forEach(button=>button.addEventListener("click",()=>{inventoryWeaponFamily=button.dataset.weaponFamily;refreshInventoryList("weapons");}));
  screen.querySelectorAll("[data-weapon-sort]").forEach(button=>button.addEventListener("click",()=>{
    const key=button.dataset.weaponSort;
    weaponSort=weaponSort.key===key?{key,direction:weaponSort.direction==="desc"?"asc":"desc"}:{key,direction:key==="name"?"asc":"desc"};
    refreshInventoryList("weapons");
  }));
}

function bindInventoryListActions(){
  screen.querySelectorAll("#inventory-list [data-equip-weapon]").forEach(button=>button.addEventListener("click",()=>equipWeapon(Number(button.dataset.equipWeapon))));
  screen.querySelectorAll("#inventory-list [data-equip-armor]").forEach(button=>button.addEventListener("click",()=>equipArmor(Number(button.dataset.equipArmor))));
  screen.querySelectorAll("#inventory-list [data-inventory-sell]").forEach(button=>button.addEventListener("click",()=>sellItem(button.dataset.inventorySell,Number(button.dataset.sellIndex),"inventory")));
}

function refreshInventoryList(tab){
  const list=screen.querySelector("#inventory-list");
  if(!list)return;
  list.innerHTML=renderInventoryItems(tab);
  bindInventoryListActions();bindUseItem();bindInventoryControls();
}

function bindUseItem(){screen.querySelectorAll("[data-use-item]").forEach(button=>button.addEventListener("click",()=>{const item=state.items[Number(button.dataset.useItem)];if(!item)return;if(item.type==="health")state.hp=Math.min(state.maxHp,state.hp+healthPotionRestore(item));else state.mana=Math.min(state.maxMana,state.mana+item.amount+Math.max(0,effectiveStat("wis")-10));item.quantity--;if(item.quantity<=0)state.items.splice(state.items.indexOf(item),1);message(`Used ${item.name}.${state.combat?" Your turn passes.":""}`);modal="inventory";if(state.combat)enemyTurn();else render();}));}

function openShop(){
  const room=currentRoom();if(!state.shopStock)state.shopStock=Array.from({length:6},()=>shopItem());modal="shop";render();
}
function shopItem(){
  let rarity=DUNGEON_RULES.rollShopRarity(state.shopLootUpgradeLevel||0);const kind=DUNGEON_RULES.rollShopOfferKind();
  if(kind==="weapon"){const value=makeLootWeapon(rarity);rarity=value.rarity;return{kind:"weapon",value,price:priceFor(value.goldValue||value.damage*5,rarity)};}
  if(kind==="armor"){let entries=ARMOR_INDEX.filter(entry=>entry.rarity===rarity);if(rarity==="Divine")entries=entries.filter(entry=>![...state.armor,...state.weapons,...state.items].some(item=>item.name===entry.name));if(!entries.length)entries=ARMOR_INDEX.filter(entry=>entry.rarity!=="Divine");const value=DUNGEON_RULES.createCatalogArmor(choice(entries),state.floor);return{kind:"armor",value,price:priceFor(value.goldValue,rarity)};}
  const type=Math.random()<0.5?"health":"mana";rarity=DUNGEON_RULES.avoidDuplicateDivine(rarity,state.items.some(item=>item.rarity==="Divine"&&item.type===type));const value={name:`${rarity} ${type==="health"?"Health":"Mana"} Potion`,type,amount:30+state.floor*4,quantity:1,rarity};return{kind:"item",value,price:priceFor(18+state.floor*3,rarity)};
}
function priceFor(base,rarity="Common"){const rarityScale=[1,1.35,1.9,2.8,4.5,8,15][Math.max(0,RARITIES.indexOf(rarity))];return Math.max(1,Math.round(base*rarityScale*(DIFFICULTIES[state.difficulty]?.shopCost||1)*(1-Math.max(0,effectiveStat("cha")-10)*0.02)));}
function shopRerollCost(){return Math.round(30*(DIFFICULTIES[state.difficulty]?.shopCost||1));}
function shopUpgradeCost(){return Math.round(125*Math.pow(2,state.shopLootUpgradeLevel||0)*(DIFFICULTIES[state.difficulty]?.shopCost||1));}
function buyItem(index){const item=state.shopStock[index];if(!item||state.gold<item.price)return;state.gold-=item.price;if(item.kind==="weapon"){state.weapons.push(item.value);state.inventoryNotice=true;}else if(item.kind==="armor"){state.armor.push(item.value);state.inventoryNotice=true;equipCollectedArmor(item.value);}else state.items.push(item.value);state.shopStock.splice(index,1);if(item.value.rarity==="Divine"){state.shopStock=state.shopStock.filter(offer=>offer.kind!==item.kind||(item.kind==="weapon"?offer.value.name!==item.value.name:item.kind==="armor"?offer.value.name!==item.value.name:offer.value.type!==item.value.type||offer.value.rarity!=="Divine"));}message(`Purchased ${item.value.name}.`);modal="shop";render();}
function rerollShop(){const cost=shopRerollCost();if(state.gold<cost){message(`Rerolling costs ${cost} gold.`);modal="shop";render();return;}state.gold-=cost;state.shopStock=Array.from({length:6},()=>shopItem());modal="shop";render();}
function upgradeShopLoot(){if((state.shopLootUpgradeLevel||0)>=5)return;const cost=shopUpgradeCost();if(state.gold<cost)return;state.gold-=cost;state.shopLootUpgradeLevel=(state.shopLootUpgradeLevel||0)+1;state.shopStock=Array.from({length:6},()=>shopItem());message(`Permanent shop stock upgrade increased to level ${state.shopLootUpgradeLevel} for this run.`);modal="shop";render();}

function sellValue(item,kind){
  const rarityIndex=Math.max(0,RARITIES.indexOf(item.rarity||"Common"));
  const base=kind==="weapon"?Math.max(8,Math.round((item.damage||1)*2.5)):kind==="armor"?Math.max(8,Math.round((item.goldValue||item.defense*5||5)*0.4)):Math.max(2,Math.round((item.amount||5)*0.15));
  return Math.max(1,Math.round(base*(1+rarityIndex*0.35)));
}

function renderSellList(){
  const groups=[{kind:"weapon",items:state.weapons},{kind:"armor",items:state.armor},{kind:"item",items:state.items}];
  const entries=groups.flatMap(group=>group.items.map((item,index)=>({item,index,kind:group.kind}))).filter(({item,kind})=>!(kind==="weapon"&&item===state.weapon)&&!(kind==="armor"&&Object.values(state.equippedArmor||{}).includes(item)));
  if(!entries.length)return `<p class="empty-list">No unequipped gear or consumables to sell.</p>`;
  return `<div class="sell-list">${entries.map(({item,index,kind})=>`<article class="sell-row"><span>${escapeHtml(item.rarity||"Common")} ${escapeHtml(item.name)}${kind==="item"?` · x${item.quantity}`:""}</span><button class="small-button" data-sell-type="${kind}" data-sell-index="${index}">Sell · ${sellValue(item,kind)} gold</button></article>`).join("")}</div>`;
}

function sellItem(kind,index,returnModal="shop"){
  const list=kind==="weapon"?state.weapons:kind==="armor"?state.armor:state.items;
  const item=list[index];if(!item)return;
  if(kind==="weapon"&&item===state.weapon)return;
  if(kind==="armor"&&Object.values(state.equippedArmor||{}).includes(item))return;
  state.gold+=sellValue(item,kind);
  if(kind==="item"&&item.quantity>1)item.quantity--;else list.splice(index,1);
  message(`Sold ${item.name} for ${sellValue(item,kind)} gold.`);
  modal=returnModal;render();
}

function advanceFloor(){state.floor++;state.maxHp+=Math.floor(state.maxHp*0.08);state.hp=Math.min(state.maxHp,state.hp+Math.round(state.maxHp*0.2));state.mana=state.maxMana;state.shopStock=null;state.currentFloor=makeFloor(state.floor);state.currentFloor.rooms[0].visited=true;state.items=state.items.filter(item=>item.quantity>0);message(`Floor ${state.floor}. A new passage opens into the dungeon.`,"story");render();}

titleButton.addEventListener("click",()=>{if(state&&!confirm("Return to the title? Your run is saved in this browser."))return;modal=null;state=null;titleButton.hidden=true;startScreen();});
screen.addEventListener("click",event=>{
  if(event.target.closest("[data-open-inventory]")&&state&&modal!=="death")openInventory();
  if(event.target.closest("[data-next-floor]"))advanceFloor();
});
startScreen();

function renderPatchNotes(version){
  const patch=window.GAME_PATCH_NOTES?.[version];
  const target=document.querySelector("#patch-content");
  if(!patch||!target)return;
  target.innerHTML=`<h3>${escapeHtml(patch.title)}</h3><p class="patch-date">${escapeHtml(patch.subtitle)}</p>${patch.sections.map(section=>`<section><h4>${escapeHtml(section.heading)}</h4><ul>${section.items.map(item=>`<li>${escapeHtml(item)}</li>`).join("")}</ul></section>`).join("")}`;
  document.querySelectorAll("[data-patch]").forEach(button=>{const active=button.dataset.patch===version;button.classList.toggle("active",active);if(active)button.setAttribute("aria-current","true");else button.removeAttribute("aria-current");});
}

document.querySelectorAll?.("[data-patch]").forEach(button=>button.addEventListener("click",()=>renderPatchNotes(button.dataset.patch)));
renderPatchNotes("v0-patch-1");
if(typeof fetch==="function")fetch("about.txt").then(response=>{if(!response.ok)throw new Error("About text unavailable");return response.text();}).then(text=>{
  const target=document.querySelector("#about-copy");
  if(!target)return;
  const paragraphs=text.trim().split(/\r?\n\s*\r?\n/).map(value=>value.trim()).filter(Boolean);
  target.innerHTML=paragraphs.length?paragraphs.map(value=>`<p>${escapeHtml(value).replace(/\r?\n/g,"<br>")}</p>`).join(""):`<p class="about-placeholder">Add your introduction to about.txt.</p>`;
}).catch(()=>{
  const target=document.querySelector("#about-copy");
  if(target)target.innerHTML='<p class="about-placeholder">Add your introduction to about.txt.</p>';
});
