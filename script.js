const screen = document.querySelector("#game-screen");
const titleButton = document.querySelector("#menu-button");
const inventoryButton = document.querySelector("#inventory-button");
const SAVE_KEY = "dungeon-simulation-browser-save-v1";
const CLASS_NAMES = { warrior: "Warrior", archer: "Archer", mage: "Mage" };
const RARITIES = ["Common", "Uncommon", "Rare", "Epic", "Legendary", "Mythic", "Divine"];
const WEAPONS = {
  warrior: [
    ["Cinder Knife", "Dagger", "Common", "cinder-knife.png", 7, "Fire"],
    ["Frostbite Dirk", "Dagger", "Common", "frostbite-dirk.png", 7, "Water"],
    ["Breeze Shiv", "Dagger", "Common", "breeze-shiv.png", 7, "Wind"],
    ["Rootwood Axe", "Axe", "Common", "rootwood-axe.png", 9, "Nature"],
    ["Crackle Axe", "Axe", "Common", "crackle-axe.png", 9, "Wind"],
    ["Rotting Hatchet", "Axe", "Common", "rotting-hatchet.png", 9, "Nature"],
    ["Lantern Blade", "Sword", "Common", "lantern-blade.png", 8, "Fire"],
    ["Dusksteel Sword", "Sword", "Common", "dusksteel-sword.png", 8, "Void"],
    ["Ironfang", "Sword", "Common", "ironfang.png", 8, "Physical"],
    ["Harvest Scythe", "Scythe", "Common", "harvest-scythe.png", 10, "Physical"],
    ["Ashen Reaper", "Scythe", "Common", "ashen-reaper.png", 10, "Fire"],
    ["Winter Reaper", "Scythe", "Common", "winter-reaper.png", 10, "Water"],
    ["Emberfang", "Dagger", "Uncommon", "emberfang.png", 11, "Fire"],
    ["Glacier Needle", "Dagger", "Uncommon", "glacier-needle.png", 11, "Water"],
    ["Whisperwind", "Dagger", "Uncommon", "whisperwind.png", 11, "Wind"],
    ["Thorncleaver", "Axe", "Uncommon", "thorncleaver.png", 13, "Nature"],
    ["Stormsplitter", "Axe", "Uncommon", "stormsplitter.png", 13, "Wind"],
    ["Venom Hatchet", "Axe", "Uncommon", "venom-hatchet.png", 13, "Nature"],
    ["Sunsteel", "Sword", "Uncommon", "sunsteel.png", 12, "Fire"],
    ["Gloamfang", "Sword", "Uncommon", "gloamfang.png", 12, "Void"],
    ["Bloodletter", "Sword", "Uncommon", "bloodletter.png", 12, "Physical"]
  ],
  archer: [["Frayed Hunting Bow", "Bow", "Common", "frayed-hunting-bow.png", 7, "Physical"]],
  mage: [["Cracked Ember Staff", "Staff", "Common", "cracked-ember-staff.png", 8, "Fire"]]
};
const RARITY_MULTIPLIER = [1, 1.25, 1.6, 2.1, 2.8, 3.7, 5];
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

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

function slug(value) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function randomInt(max) { return Math.floor(Math.random() * max); }
function choice(items) { return items[randomInt(items.length)]; }
function rarityClass(rarity) { return `rarity-${slug(rarity)}`; }
function message(text, tone = "") { state.log.unshift({ text, tone }); state.log = state.log.slice(0, 12); }
function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch { /* Browser storage may be disabled. */ } }
function loadSave() { try { return JSON.parse(localStorage.getItem(SAVE_KEY) || "null"); } catch { return null; } }

function createWeapon(entry, rarity = entry[2], floor = 1) {
  const tier = Math.max(0, RARITIES.indexOf(rarity));
  const weapon = {
    name: entry[0], type: entry[1], rarity, file: entry[3], baseDamage: entry[4], element: entry[5],
    damage: Math.max(1, Math.round((entry[4] + floor) * RARITY_MULTIPLIER[tier] * (1 + (floor - 1) * 0.08))),
    crit: 0.05 + Math.max(0, tier) * 0.015,
    speed: entry[1] === "Dagger" || entry[1] === "Bow" ? 12 : 9
  };
  return weapon;
}

function makeEnemy(floor, boss = false, index = 0) {
  const race = choice(Object.keys(roomNames));
  const template = roomNames[race];
  const variant = Array.isArray(template[0]) ? choice(template) : template;
  const name = boss ? (index === 1 ? "The Hollow Twin" : choice(bossNames)) : variant[0];
  const klass = boss ? "Boss" : variant[1];
  const baseHp = race === "golem" ? 95 : race === "werewolf" ? 58 : race === "slime" ? 42 : 32;
  const hp = Math.round((boss ? baseHp * (floor * 0.5 + 2) : baseHp) * Math.pow(1.2, floor - 1));
  const baseDamage = race === "golem" ? 9 : race === "werewolf" ? 10 : 7;
  return { name, race, klass, maxHp: hp, hp, damage: Math.round(baseDamage * (boss ? 1.5 : 1) * Math.pow(1.14, floor - 1)), dodge: race === "specter" ? 0.12 : klass === "Archer" ? 0.05 : 0.02, boss, elite: false, gold: Math.round((8 + floor * 2) * (boss ? 5 : 1)), xp: Math.round((50 + floor * 24) * (boss ? (floor * 0.5 + 2) : 1)) };
}

function makeRoom(type, x, y, id) {
  return { id, type, x, y, visited: false, cleared: false, searched: false, trapRevealed: false, fountainUsed: false, connections: [] };
}

function makeFloor(floor) {
  const width = 7;
  const height = 7;
  const rooms = [];
  const start = makeRoom("start", 3, 6, "r0");
  rooms.push(start);
  let current = start;
  const path = [start];
  const occupied = new Set([`${start.x},${start.y}`]);
  for (let i = 1; i < 9; i++) {
    const options = [];
    for (const [dx, dy, direction] of [[0, -1, "north"], [1, 0, "east"], [0, 1, "south"], [-1, 0, "west"]]) {
      const x = current.x + dx, y = current.y + dy;
      if (x >= 0 && x < width && y >= 0 && y < height && !occupied.has(`${x},${y}`)) options.push({ x, y, direction });
    }
    if (!options.length) break;
    const next = choice(options);
    const room = makeRoom(i === 8 ? "boss" : "enemy", next.x, next.y, `r${i}`);
    current.connections.push({ id: room.id, direction: next.direction });
    room.connections.push({ id: current.id, direction: ({ north: "south", south: "north", east: "west", west: "east" })[next.direction] });
    rooms.push(room); path.push(room); occupied.add(`${room.x},${room.y}`); current = room;
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

function newRun(name, devMode = false) {
  state = {
    name: name || "Adventurer", devMode, floor: 1, level: 1, xp: 0, skillPoints: 0, hp: 100, maxHp: 100,
    mana: 50, maxMana: 50, gold: 0, playerSpeed: 10, class: null, weapon: null, weapons: [], armor: [], items: [],
    currentFloor: makeFloor(1), combat: null, deaths: 0, floorsCleared: 0, log: [],
    starter: { desk: false, closet: false, classOffer: false }
  };
  state.currentFloor.rooms[0].visited = true;
  message(`You wake in a cold stone room. Somewhere beyond it, the dungeon waits.`, "story");
  save(); render();
}

function startScreen() {
  inventoryButton.hidden = true;
  const saved = loadSave();
  screen.innerHTML = `<div class="title-screen"><div class="title-copy"><p class="eyebrow">A dungeon adventure</p><h2>Every room<br>is a choice.</h2><p>Explore a shifting dungeon, search what you find, and fight your way toward the next floor.</p></div><form class="start-form" id="start-form"><label for="player-name">Name</label><input id="player-name" name="name" maxlength="22" placeholder="Adventurer" autocomplete="off"><label class="dev-toggle"><input type="checkbox" name="dev"> <span>Developer loot rates</span></label><button class="primary-button" type="submit">${saved ? "Start a new run" : "Enter the dungeon"}<span aria-hidden="true">↗</span></button>${saved ? `<button class="secondary-button" id="continue-run" type="button">Continue Floor ${saved.floor}, Level ${saved.level}</button><button class="text-button" id="delete-run" type="button">Delete saved run</button>` : ""}<p class="fine-print">Runs are saved in this browser on this device.</p></form></div>`;
  screen.querySelector("#start-form").addEventListener("submit", event => { event.preventDefault(); const data = new FormData(event.currentTarget); newRun(data.get("name").trim(), data.has("dev")); });
  screen.querySelector("#continue-run")?.addEventListener("click", () => { state = saved; modal = null; render(); });
  screen.querySelector("#delete-run")?.addEventListener("click", () => {
    const button = screen.querySelector("#delete-run");
    if (button.dataset.confirm === "yes") { localStorage.removeItem(SAVE_KEY); startScreen(); }
    else { button.dataset.confirm = "yes"; button.textContent = "Confirm delete saved run"; }
  });
}

function findRoom(id) { return state.currentFloor.rooms.find(room => room.id === id); }
function currentRoom() { return findRoom(state.currentFloor.currentId); }
function roomSymbol(room) {
  if (room.id === state.currentFloor.currentId) return "@";
  if (!room.visited) return "?";
  return { start: "S", enemy: "E", empty: "O", treasure: "T", weapon: "W", fountain: "F", shop: "$", trap: room.trapRevealed ? "!" : "T", boss: "B" }[room.type] || "?";
}
function renderMap() {
  const floor = state.currentFloor;
  const byCoord = new Map(floor.rooms.map(room => [`${room.x},${room.y}`, room]));
  const minX = Math.min(...floor.rooms.map(room => room.x));
  const maxX = Math.max(...floor.rooms.map(room => room.x));
  const minY = Math.min(...floor.rooms.map(room => room.y));
  const maxY = Math.max(...floor.rooms.map(room => room.y));
  let html = `<div class="map-area"><div class="map-grid" style="--map-cols:${maxX - minX + 1}">`;
  for (let y=minY; y<=maxY; y++) for (let x=minX; x<=maxX; x++) {
    const room = byCoord.get(`${x},${y}`);
    if (!room) html += `<span class="map-cell void" aria-hidden="true"></span>`;
    else html += `<button class="map-cell ${room.visited ? "visited" : "unvisited"} ${room.id === floor.currentId ? "current" : ""} ${room.type === "boss" ? "boss-cell" : ""}" data-room="${room.id}" ${room.id === floor.currentId ? "aria-current='location'" : ""} title="${room.visited ? escapeHtml(ROOM_LABELS[room.type]) : "Unexplored room"}">${roomSymbol(room)}</button>`;
  }
  return html + `</div><div class="map-legend"><span><b>@</b> You</span><span><b>?</b> Unknown</span><span><b>O</b> Empty</span><span><b>.</b> No room</span></div></div>`;
}

function weaponArt(weapon, large = false) {
  const classFolder = weapon.type === "Bow" || weapon.type === "Crossbow" ? "Archer" : weapon.type === "Staff" || weapon.type === "Wand" ? "Mage" : "Warrior";
  const path = `Images/Weapons/${classFolder}/${weapon.file}`;
  return `<div class="item-art ${large ? "large" : ""}"><img src="${path}" alt="${escapeHtml(weapon.name)}"><span>(art in progress [${escapeHtml(weapon.name)}])</span></div>`;
}

function itemArt(path, name, large = false) {
  return `<div class="item-art ${large ? "large" : ""}"><img src="${path}" alt="${escapeHtml(name)}"><span>(art in progress [${escapeHtml(name)}])</span></div>`;
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
  const equippedLabel = equipped ? `<span class="equipped-tag">Equipped</span>` : `<button class="small-button" data-equip-weapon="${index}">Equip</button>`;
  return `<article class="inventory-item ${rarityClass(weapon.rarity)}">${weaponArt(weapon)}<div class="item-copy"><span class="item-meta">${escapeHtml(weapon.rarity)} ${escapeHtml(weapon.type)} · ${escapeHtml(weapon.element)}</span><strong>${escapeHtml(weapon.name)}</strong><span class="item-stats">${weapon.damage} damage · ${Math.round(weapon.crit*100)}% crit</span></div>${equippedLabel}</article>`;
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
  return `<div class="movement"><span class="movement-heading">Move</span><div class="compass-grid" role="group" aria-label="Move to an adjacent room">${["north", "west", "center", "east", "south"].map(direction => {
    if (direction === "center") return `<span class="compass-control compass-center" aria-hidden="true">@</span>`;
    const room = destinations.get(direction);
    const label = direction[0].toUpperCase();
    return room
      ? `<button class="compass-control ${direction}-control ${room.type === "boss" ? "boss-direction" : ""}" data-move="${room.id}" aria-label="Move ${direction} to ${room.visited ? ROOM_LABELS[room.type] : "unknown room"}">${label}<small>${escapeHtml(room.visited ? ROOM_LABELS[room.type] : "Unknown room")}</small></button>`
      : `<span class="compass-control ${direction}-control move-na" aria-label="${direction} unavailable">${label}<small>N/A</small></span>`;
  }).join("")}</div></div>`;
}
function getActions() {
  const room = currentRoom();
  if (state.combat) return `<div class="action-grid"><button class="action-button" data-action="attack">Quick attack</button><button class="action-button" data-action="heavy">Heavy attack <small>1 turn cooldown</small></button><button class="action-button" data-action="aim">Aim <small>Next attack +crit</small></button><button class="action-button" data-action="heal">Use health potion</button><button class="action-button" data-action="mana">Use mana potion</button><button class="action-button secondary" data-action="flee">Flee</button></div>`;
  if (room.type === "boss" && room.cleared) return `<p class="prompt-note">The chamber falls quiet. The stair to the next floor is open.</p><div class="action-grid"><button class="action-button" data-next-floor>Descend to floor ${state.floor + 1}</button></div>`;
  if (room.type === "start") return `<div class="action-grid"><button class="action-button" data-action="inspect-desk">Inspect the desk</button><button class="action-button" data-action="inspect-closet">Inspect the closet</button></div>${state.starter.classOffer && !state.class ? `<div class="class-choice"><p>The desk holds three forgotten weapons. Choose one.</p><div class="action-grid"><button class="action-button" data-class="warrior">Warrior · Sword</button><button class="action-button" data-class="archer">Archer · Bow</button><button class="action-button" data-class="mage">Mage · Staff</button></div></div>` : ""}`;
  if (room.type === "treasure" || room.type === "trap" || room.type === "weapon") return `<div class="action-grid"><button class="action-button" data-action="inspect-chest">Inspect chest</button><button class="action-button secondary" data-action="inspect-floor">Inspect floor</button></div>`;
  if (room.type === "fountain") return `<div class="action-grid"><button class="action-button" data-action="inspect-fountain">Inspect fountain</button><button class="action-button" data-action="drink-fountain" ${room.fountainUsed ? "disabled" : ""}>Drink from fountain</button></div>`;
  if (room.type === "shop") return `<div class="action-grid"><button class="action-button" data-action="shop">Browse shop</button></div>`;
  if (room.type === "boss") return `<p class="prompt-note">A heavy presence presses from beyond the sealed doorway.</p><div class="action-grid"><button class="action-button boss-action" data-action="enter-boss">Enter boss chamber</button></div>`;
  return `<p class="prompt-note">Nothing here asks for your attention.</p>`;
}

function renderLog() { return `<section class="context-box" aria-label="Recent events"><div class="context-heading">Context <span>Recent events</span></div><div class="context-output" role="log" aria-live="polite">${state.log.map(entry => `<p class="${entry.tone}">${entry.text}</p>`).join("")}</div></section>`; }

function render() {
  if (!state) return startScreen();
  titleButton.hidden = false;
  inventoryButton.hidden = modal === "death";
  const itemCount = state.items.reduce((count, item) => count + item.quantity, 0);
  inventoryButton.querySelector("span").textContent = `${itemCount} item${itemCount === 1 ? "" : "s"}`;
  const room = currentRoom();
  const aliveEnemies = state.combat?.enemies.map((enemy, index) => ({ enemy, index })).filter(item => item.enemy.hp > 0) || [];
  screen.innerHTML = `<div class="run-topline"><span>Floor ${state.floor}</span><span>${escapeHtml(state.name)}</span><span>Level ${state.level}${state.skillPoints ? ` · ${state.skillPoints} skill point${state.skillPoints === 1 ? "" : "s"}` : ""}</span></div>
    <div class="game-layout">
      <aside class="player-panel">
        <div class="player-stats">
          <div class="stat-row"><div class="stat-label"><span>Health</span><b>${state.hp} / ${state.maxHp}</b></div><div class="meter"><i class="hp-fill" style="width:${Math.max(0,state.hp/state.maxHp*100)}%"></i></div></div>
          <div class="stat-row"><div class="stat-label"><span>Mana</span><b>${state.mana} / ${state.maxMana}</b></div><div class="meter"><i class="mana-fill" style="width:${Math.max(0,state.mana/state.maxMana*100)}%"></i></div></div>
          <div class="resource-line"><span class="xp-color">XP ${state.xp} / ${xpToNext()}</span><span class="gold-color">${state.gold} gold</span></div>
        </div>
        ${state.weapon ? `<div class="equipped-weapon">${weaponArt(state.weapon,true)}<div><span class="item-meta">${escapeHtml(state.class)} · ${escapeHtml(state.weapon.rarity)} ${escapeHtml(state.weapon.type)}</span><strong>${escapeHtml(state.weapon.name)}</strong><span>${state.weapon.damage} damage · ${state.weapon.element}</span>${state.weapon.type === "Bow" ? `<span>${state.arrows ?? 14} arrows</span>` : ""}</div></div>` : `<p class="no-weapon">No weapon equipped</p>`}
        <div class="equipped-armor">${state.armor.length ? state.armor.map(item=>`<span>${escapeHtml(item.name)}</span>`).join("") : `<span>Armor: none</span>`}</div>
        ${renderLog()}
      </aside>
      <section class="play-panel">${state.combat ? renderCombat(aliveEnemies) : `<div class="room-heading"><div><p class="section-kicker">Floor ${state.floor} · ${room.type === "start" ? "Beginning" : "Room"}</p><h2>${escapeHtml(room.visited ? (room.type === "trap" && !room.trapRevealed ? "Treasure Room" : ROOM_LABELS[room.type]) : "Unknown Room")}</h2></div><span class="room-index">${room.x+1}.${room.y+1}</span></div>${renderMap()}${renderMovement()}<div class="room-actions"><h3>Actions</h3>${getActions()}</div>`}</section>
    </div>`;
  bindGameActions();
  bindArtFallbacks();
  if (modal) showModal();
  save();
}

function renderCombat(enemies) {
  return `<div class="combat-header"><p class="section-kicker">Combat · Floor ${state.floor}</p><h2>Fight</h2></div><div class="enemy-list">${enemies.map(({enemy,index})=>`<article class="enemy-card ${enemy.boss ? "boss-enemy" : ""}">${enemyArt(enemy)}<div class="enemy-information"><div class="enemy-name"><strong>${escapeHtml(enemy.name)}</strong><span>${escapeHtml(enemy.klass)}</span></div><div class="enemy-health"><span>${enemy.hp} / ${enemy.maxHp} HP</span><i><b style="width:${Math.max(0,enemy.hp/enemy.maxHp*100)}%"></b></i></div><p>${enemy.damage} damage · ${Math.round(enemy.dodge*100)}% dodge</p></div><button class="small-button target-button" data-target="${index}">${state.target === index ? "Targeted" : "Target"}</button></article>`).join("")}</div><div class="combat-info"><span>Weapon: ${escapeHtml(state.weapon?.name || "None")}</span><span>${state.cooldown > 0 ? `Heavy cooldown ${state.cooldown}` : "Heavy ready"}</span><span>${state.aimed ? "Aim ready" : ""}</span></div><div class="room-actions"><h3>Your turn</h3>${getActions()}</div>`;
}

function bindGameActions() {
  screen.querySelectorAll("[data-action]").forEach(button=>button.addEventListener("click",()=>act(button.dataset.action)));
  screen.querySelectorAll("[data-class]").forEach(button=>button.addEventListener("click",()=>chooseClass(button.dataset.class)));
  screen.querySelectorAll("[data-move]").forEach(button=>button.addEventListener("click",()=>moveTo(button.dataset.move)));
  screen.querySelectorAll("[data-target]").forEach(button=>button.addEventListener("click",()=>{state.target=Number(button.dataset.target);render();}));
  screen.querySelectorAll("[data-equip-weapon]").forEach(button=>button.addEventListener("click",()=>equipWeapon(Number(button.dataset.equipWeapon))));
}

function chooseClass(className) {
  state.class=className;
  const entries = WEAPONS[className];
  state.weapon=createWeapon(entries[0]);
  state.weapons=[state.weapon];
  if(className==="archer")state.arrows=14;
  state.starter.classOffer=false;
  message(`You choose the ${CLASS_NAMES[className]} path and take the ${state.weapon.name}.`, "story"); render();
}

function act(action) {
  const room=currentRoom();
  if (action==="inspect-desk") { state.starter.desk=true; state.starter.classOffer=true; message("Inside the desk is no single weapon, but three possibilities: a sword, a bow, and a staff. Choose your class before leaving.","story"); render(); return; }
  if (action==="inspect-closet") { if(state.starter.closet){message("The closet is empty now.");} else {state.starter.closet=true;state.armor.push({name:"Iron Chestplate",rarity:"Common",defense:2});state.items.push({name:"Small Healing Potion",rarity:"Common",type:"health",amount:25,quantity:1});message("Behind a moth-eaten cloak, you find an iron chestplate and a small healing potion.");} render();return; }
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
    else {const item=makeLoot();state.items.push(item);message(`You avoid the mechanism and find a ${item.rarity} ${item.name}.`);}
  } else if(room.type==="weapon") { const weapon=makeLootWeapon();state.weapons.push(weapon);state.items.push({name:"Large Health Potion",type:"health",amount:60,quantity:1,rarity:"Rare"});message(`Inside: ${weapon.rarity} ${weapon.name} (${weapon.type}) and a Rare Large Health Potion.`); }
  else {state.gold+=15;state.items.push({name:"Small Health Potion",type:"health",amount:25,quantity:1,rarity:"Common"});message("Inside the chest, beneath a layer of velvet, you find a small healing potion and 15 gold coins.");}
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
  state.combat={enemies,boss};state.cooldown=0;state.aimed=false;state.target=0;
  const enemy=enemies[0];
  const opening=choice([`${enemy.name} leaps from the dark!`,`A scrape of stone, then ${enemy.name} blocks the way.`,`Something rushes at you through the doorway: ${enemy.name}!`,`You hear a sharp cry as ${enemy.name} attacks!`]);
  message(opening,"danger"); render();
  if(Math.random()<0.18 && state.hp>0){const damage=takePlayerDamage(enemy.damage);message(`${enemy.name} catches you off guard for ${damage} damage.`,"danger");if(state.hp<=0){die();return;}render();}
}

function combatAction(action) {
  const fight=state.combat; if(!fight)return;
  let enemy=fight.enemies[state.target];
  if(!enemy||enemy.hp<=0){state.target=fight.enemies.findIndex(candidate=>candidate.hp>0);enemy=fight.enemies[state.target];}
  if(!enemy)return;
  if(action==="flee") { if(fight.boss){message("The boss chamber seals behind you. You cannot flee this fight.","danger");render();return;} state.combat=null;message("You break away and retreat to the previous room.");render();return; }
  if(action==="heal"||action==="mana") { const type=action;const item=state.items.find(it=>it.type===type && it.quantity>0);if(!item){message(`No ${type} potion in your inventory.`);render();return;}item.quantity--;if(type==="heal")state.hp=Math.min(state.maxHp,state.hp+item.amount);else state.mana=Math.min(state.maxMana,state.mana+item.amount);message(`You use a ${item.name}. Your turn passes.`);enemyTurn();return; }
  if(action==="aim") { state.aimed=true;message("You steady your stance and line up the next attack.");enemyTurn();return; }
  if(action==="heavy"&&state.cooldown>0){message(`That attack is cooling down for ${state.cooldown} more turn(s).`);render();return;}
  const weapon=state.weapon; if(!weapon){message("You need a weapon before you can attack.");render();return;}
  let cost=0,multiplier=action==="heavy"?1.75:1,crit=weapon.crit+(state.aimed?0.35:0)+(action==="heavy"?0.08:0);
  if(state.class==="mage"){cost=action==="heavy"?12:6;if(state.mana<cost){message(`Not enough mana. This spell costs ${cost} mana.`);render();return;}state.mana-=cost;}
  if(weapon.type==="Bow"){if((state.arrows??14)<=0){message("No arrows left. Find an archer or switch weapons.");render();return;}state.arrows--;}
  let damage=Math.max(1,Math.round((10+weapon.damage)*multiplier));
  const isCrit=Math.random()<crit;if(isCrit)damage*=2;
  if(Math.random()<enemy.dodge){message(`${enemy.name} dodges your attack!`,"danger");}
  else {enemy.hp=Math.max(0,enemy.hp-damage);message(`${action==="heavy"?"Heavy attack":"Quick attack"} hits ${enemy.name} for ${damage}${isCrit?" critical":""} damage.`);if(enemy.hp===0)message(`${enemy.name} falls.`,"story");}
  state.aimed=false;if(action==="heavy")state.cooldown=1;else if(state.cooldown>0)state.cooldown--;
  if(fight.enemies.every(item=>item.hp<=0)){winFight();return;}
  enemyTurn();
}

function enemyTurn() {
  const enemies=state.combat?.enemies.filter(enemy=>enemy.hp>0)||[];
  for(const enemy of enemies){if(Math.random()<enemy.dodge)continue;const damage=takePlayerDamage(enemy.damage);message(`${enemy.name} strikes you for ${damage} damage.`,"danger");if(state.hp<=0){die();return;}}
  render();
}

function takePlayerDamage(damage) { const reduction=state.armor.reduce((sum,item)=>sum+(item.defense||0),0);const actual=Math.max(1,damage-reduction);state.hp=Math.max(0,state.hp-actual);return actual; }
function winFight() {
  const fight=state.combat; const room=currentRoom();let totalGold=0,totalXp=0;
  for(const enemy of fight.enemies){totalGold+=enemy.gold;totalXp+=enemy.xp;}
  state.gold+=totalGold;totalXp+=Math.round(totalXp*0.35);const levels=gainXp(totalXp);
  let rewards=`Victory. +${totalGold} gold and +${totalXp} XP.`;
  if(Math.random()<0.62){const loot=makeLoot();if(loot.kind==="weapon"){state.weapons.push(loot.value);rewards+=` Loot: ${loot.value.rarity} ${loot.value.name} (${loot.value.type}).`;}else{state.items.push(loot.value);rewards+=` Loot: ${loot.value.rarity} ${loot.value.name}.`;}}
  if(state.weapons.some(weapon=>weapon.type==="Bow")&&Math.random()<0.45){state.arrows=Math.min(30,(state.arrows||14)+6);rewards+=" +6 arrows.";}
  if(fight.enemies.some(enemy=>enemy.klass==="Archer")&&state.weapons.some(weapon=>weapon.type==="Bow")){state.arrows=Math.min(30,(state.arrows||14)+4);rewards+=" Archer dropped 4 arrows.";}
  if(levels)rewards+=` You leveled up! Current skillpoints: ${state.skillPoints}.`;
  state.combat=null;room.cleared=true;
  if(fight.boss){state.currentFloor.bossCleared=true;state.floorsCleared++;rewards+=" The way to the next floor opens.";}
  message(rewards,"reward");render();
}

function gainXp(amount){state.xp+=amount;let count=0;while(state.xp>=xpToNext()){state.xp-=xpToNext();state.level++;state.skillPoints++;state.maxHp+=20;state.maxMana+=10;state.hp=state.maxHp;state.mana=state.maxMana;count++;}return count;}
function xpToNext(){return state.level<9?200+(state.level-1)*100:Math.round(1000*Math.pow(1.3,state.level-9));}

function makeLootWeapon(){
  let family=state.class||choice(["warrior","archer","mage"]);
  if(state.devMode&&Math.random()<0.6)family=choice(["warrior","archer","mage"]);
  const rarity=state.devMode?choice(RARITIES.slice(2)):choice(["Common","Common","Uncommon","Rare","Epic"]);
  const entries=WEAPONS[family];
  const entry=family==="warrior"?choice(entries):entries[0];
  const result=createWeapon(entry,rarity,state.floor);
  if(family==="warrior"&&rarity!=="Common"){
    const catalogNames={"Rare":["Pyrefang","Rimepiercer","Gale Talons"],"Epic":["Hellflame Twins","Heart of Winter","Tempest Needles"],"Legendary":["Solfang","Voidkiss","Dragonsteel"],"Mythic":["Ignis, Fang of the First Flame","Absolute Zero","Zephyr's Last Breath"],"Divine":["The Merciful King","Fang of the First Flame","The Empty Sky"]};
    result.name=choice(catalogNames[rarity]||["Emberfang","Glacier Needle","Whisperwind"]);result.file=`${slug(result.name)}.png`;
  }
  return result;
}
function makeLoot(){const rarity=state.devMode?choice(RARITIES.slice(2)):choice(["Common","Uncommon","Rare","Rare","Epic"]);if(Math.random()<0.52)return{kind:"weapon",value:makeLootWeapon()};const mana=Math.random()<0.4;return{kind:"item",value:{name:`${rarity} ${mana?"Mana":"Healing"} Potion`,type:mana?"mana":"health",amount:mana?18+state.floor*3:25+state.floor*5,quantity:1,rarity}};}

function die(){state.hp=0;state.combat=null;state.deaths++;message(`${state.name} has fallen. The run is over.`,"danger");modal="death";render();}

function openInventory(){
  modal="inventory";render();
}
function equipWeapon(index){const weapon=state.weapons[index];if(!weapon)return;state.weapon=weapon;const family=weapon.type==="Bow"||weapon.type==="Crossbow"?"archer":weapon.type==="Staff"||weapon.type==="Wand"?"mage":"warrior";state.class=family;message(`${weapon.name} equipped. Class changed to ${CLASS_NAMES[family]}.`);modal=null;render();}
function showModal(){
  const old=screen.querySelector(".modal-backdrop");if(old)old.remove();
  let content="";
  if(modal==="inventory"){
    content=`<section class="modal" role="dialog" aria-modal="true" aria-labelledby="inventory-title"><div class="modal-heading"><div><p class="section-kicker">Pack &amp; equipment</p><h2 id="inventory-title">Inventory</h2></div><button class="icon-close" data-close-modal aria-label="Close inventory">×</button></div><div class="inventory-tabs"><button class="tab-button active" data-tab="weapons">Weapons (${state.weapons.length})</button><button class="tab-button" data-tab="armor">Armor (${state.armor.length})</button><button class="tab-button" data-tab="items">Items (${state.items.reduce((n,item)=>n+item.quantity,0)})</button></div><div class="inventory-list" id="inventory-list">${renderInventoryItems("weapons")}</div><p class="inventory-gold">${state.gold} gold · ${state.class?escapeHtml(CLASS_NAMES[state.class]):"Class unchosen"}</p></section>`;
  } else if(modal==="shop"){
    content=`<section class="modal" role="dialog" aria-modal="true" aria-labelledby="shop-title"><div class="modal-heading"><div><p class="section-kicker">Floor ${state.floor} merchant</p><h2 id="shop-title">Shop</h2></div><button class="icon-close" data-close-modal aria-label="Close shop">×</button></div><p>Only the shop room on this floor trades goods.</p><div class="shop-list">${state.shopStock.map((item,index)=>`<article class="shop-item">${item.kind==="weapon"?weaponArt(item.value):`<div class="item-art"><span>(art in progress [${escapeHtml(item.value.name)}])</span></div>`}<div><span class="item-meta">${escapeHtml(item.kind==="weapon"?item.value.rarity:item.value.rarity)} ${escapeHtml(item.kind)}</span><strong>${escapeHtml(item.kind==="weapon"?item.value.name:item.value.name)}</strong><p>${item.price} gold</p></div><button class="small-button" data-buy="${index}" ${state.gold<item.price?"disabled":""}>Buy</button></article>`).join("")}</div><div class="shop-footer"><span>${state.gold} gold</span><button class="small-button" data-reroll>Reroll · 15 gold</button></div></section>`;
  } else if(modal==="death"){
    content=`<section class="modal death-modal" role="dialog" aria-modal="true" aria-labelledby="death-title"><p class="section-kicker">Run ended</p><h2 id="death-title">You have fallen.</h2><p>Floors cleared: ${state.floorsCleared} · Level ${state.level}</p><div class="action-grid"><button class="action-button" data-restart>Restart run</button><button class="action-button secondary" data-title>Return to title</button></div></section>`;
  }
  if(!content)return;
  screen.insertAdjacentHTML("beforeend",`<div class="modal-backdrop">${content}</div>`);
  bindArtFallbacks();
  screen.querySelector("[data-close-modal]")?.addEventListener("click",()=>{modal=null;render();});
  screen.querySelectorAll("[data-tab]").forEach(button=>button.addEventListener("click",()=>{screen.querySelectorAll("[data-tab]").forEach(tab=>tab.classList.toggle("active",tab===button));screen.querySelector("#inventory-list").innerHTML=renderInventoryItems(button.dataset.tab);bindGameActions();bindUseItem();}));
  screen.querySelectorAll("[data-equip-weapon]").forEach(button=>button.addEventListener("click",()=>equipWeapon(Number(button.dataset.equipWeapon))));
  bindUseItem();
  screen.querySelectorAll("[data-buy]").forEach(button=>button.addEventListener("click",()=>buyItem(Number(button.dataset.buy))));
  screen.querySelector("[data-reroll]")?.addEventListener("click",rerollShop);
  screen.querySelector("[data-restart]")?.addEventListener("click",()=>newRun(state.name,state.devMode));
  screen.querySelector("[data-title]")?.addEventListener("click",()=>{modal=null;state=null;titleButton.hidden=true;startScreen();});
}

function renderInventoryItems(tab){
  if(tab==="weapons")return state.weapons.length?state.weapons.map((weapon,index)=>weaponCard(weapon,index,weapon===state.weapon)).join(""):`<p class="empty-list">No weapons yet.</p>`;
  if(tab==="armor")return state.armor.length?state.armor.map(item=>`<article class="inventory-item ${rarityClass(item.rarity)}">${itemArt(`Images/Armor/${slug(item.set||"iron")}-${item.slot||"chestplate"}.png`,item.name)}<div class="item-copy"><span class="item-meta">${escapeHtml(item.rarity)} Armor</span><strong>${escapeHtml(item.name)}</strong><span class="item-stats">${item.defense} defense</span></div></article>`).join(""):`<p class="empty-list">No armor collected.</p>`;
  return state.items.length?state.items.map((item,index)=>`<article class="inventory-item ${rarityClass(item.rarity)}">${potionArt(item)}<div class="item-copy"><span class="item-meta">${escapeHtml(item.rarity)} · x${item.quantity}</span><strong>${escapeHtml(item.name)}</strong><span class="item-stats">Restores ${item.amount} ${item.type==="mana"?"mana":"health"}</span></div><button class="small-button" data-use-item="${index}">Use</button></article>`).join(""):`<p class="empty-list">No items in your pack.</p>`;
}

function bindUseItem(){screen.querySelectorAll("[data-use-item]").forEach(button=>button.addEventListener("click",()=>{const item=state.items[Number(button.dataset.useItem)];if(!item)return;if(item.type==="health")state.hp=Math.min(state.maxHp,state.hp+item.amount);else state.mana=Math.min(state.maxMana,state.mana+item.amount);item.quantity--;if(item.quantity<=0)state.items.splice(state.items.indexOf(item),1);message(`Used ${item.name}.`);modal="inventory";render();}));}

function openShop(){
  const room=currentRoom();if(!state.shopStock)state.shopStock=Array.from({length:6},()=>shopItem());modal="shop";render();
}
function shopItem(){const item=Math.random()<0.55?{kind:"weapon",value:makeLootWeapon()}: {kind:"item",value:{name:choice(["Health Potion","Mana Potion"]),type:Math.random()<0.5?"health":"mana",amount:30+state.floor*4,quantity:1,rarity:choice(["Common","Uncommon","Rare"])}};item.price=item.kind==="weapon"?Math.max(12,item.value.damage*3):18+state.floor*3;return item;}
function buyItem(index){const item=state.shopStock[index];if(!item||state.gold<item.price)return;state.gold-=item.price;if(item.kind==="weapon")state.weapons.push(item.value);else state.items.push(item.value);state.shopStock.splice(index,1);message(`Purchased ${item.kind==="weapon"?item.value.name:item.value.name}.`);render();modal="shop";render();}
function rerollShop(){if(state.gold<15){message("Rerolling costs 15 gold.");render();modal="shop";render();return;}state.gold-=15;state.shopStock=Array.from({length:6},()=>shopItem());modal="shop";render();}

function advanceFloor(){state.floor++;state.maxHp+=Math.floor(state.maxHp*0.08);state.hp=Math.min(state.maxHp,state.hp+Math.round(state.maxHp*0.2));state.mana=state.maxMana;state.shopStock=null;state.currentFloor=makeFloor(state.floor);state.currentFloor.rooms[0].visited=true;state.items=state.items.filter(item=>item.quantity>0);message(`Floor ${state.floor}. A new passage opens into the dungeon.`,"story");render();}

titleButton.addEventListener("click",()=>{if(state&&!confirm("Return to the title? Your run is saved in this browser."))return;modal=null;state=null;titleButton.hidden=true;startScreen();});
inventoryButton.addEventListener("click",()=>{if(state&&modal!=="death")openInventory();});
screen.addEventListener("click",event=>{const target=event.target.closest("[data-next-floor]");if(target)advanceFloor();});
startScreen();
