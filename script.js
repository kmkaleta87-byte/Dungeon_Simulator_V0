const screen = document.querySelector("#game-screen");
const titleButton = document.querySelector("#menu-button");
const indexButton = document.querySelector("#index-button");
const GAME_INDEX_DATA = window.GAME_INDEX_DATA;
const DUNGEON_RULES = window.DungeonRules;
const SAVE_KEY = "dungeon-simulation-browser-save-v1";
const SAVE_SLOTS_KEY = "dungeon-simulation-browser-slots-v1";
const LEADERBOARD_KEY = "dungeon-simulation-local-leaderboard-v1";
const PERSONAL_BESTS_KEY = "dungeon-simulation-personal-bests-v1";
const COMBAT_PACING_KEY = "dungeon-simulation-combat-pacing-v1";
const LEADERBOARD_API = window.LEADERBOARD_API || "";
const LEADERBOARD_DIFFICULTIES = ["easy", "normal", "hard"];
const SAVE_SLOT_IDS = ["slot1", "slot2", "slot3", "dev"];
const CLASS_NAMES = { warrior: "Warrior", archer: "Archer", mage: "Mage" };
const RARITIES = ["Common", "Uncommon", "Rare", "Epic", "Legendary", "Mythic", "Divine"];
const HEALTH_POTION_PERCENT = { Common: 20, Uncommon: 25, Rare: 30, Epic: 40, Legendary: 50, Mythic: 65, Divine: 80 };
const MANA_POTION_PERCENT = { ...HEALTH_POTION_PERCENT };
const DIFFICULTIES = {
  easy: { label: "Easy", enemyHealth: 0.75, enemyDamage: 0.75, xpRequirement: 0.8, shopCost: 0.8 },
  normal: { label: "Normal", enemyHealth: 1.1, enemyDamage: 0.9, xpRequirement: 1, shopCost: 1 },
  hard: { label: "Hard", enemyHealth: 1.45, enemyDamage: 1.1, xpRequirement: 1.4, shopCost: 1.5 }
};
const ELITE_AFFINITIES = ["Fire", "Water", "Earth", "Wind"];
const ELITE_EFFECTS = { Fire: "Burn", Water: "Freeze", Earth: "Cripple", Wind: "Blind" };
const BIOME_FLOORS = 5;
const MILESTONE_BOSS_INTERVAL = 20;
const REGION_DEFINITIONS = [
  { id:"undead", name:"Undead Catacombs", folder:"Undead", races:["skeleton","zombie"], bosses:["The Bone Regent","The Bone Necromancer"], rule:"Skeleton Mages, Quick Casters, and Sharpshooters deal 15% more damage.", briefing:"Skeletons and Zombies stalk these halls. Watch for the Skeletons' stronger ranged and magical attacks." },
  { id:"warrens", name:"Goblin Warrens", folder:"GoblinWarrens", races:["goblin","slime"], bosses:["The Goblin King","The Slime Sovereign"], rule:"Goblin enemies gain 2 DEX.", briefing:"Quick Goblins and stubborn Slimes control the narrow paths. Goblins have higher DEX." },
  { id:"haunted", name:"Haunted Hollows", folder:"HauntedHollows", races:["specter","vampire"], bosses:["The Veiled Haunt","The Crimson Count"], rule:"Specter enemies have a 12% dodge chance.", briefing:"Specters evade attacks while Vampires recover health when their strikes land." },
  { id:"feral-stone", name:"Feral Stone Depths", folder:"FeralStone", races:["werewolf","golem"], bosses:["The Moonfang Alpha","The Mountain Heart"], rule:"Golems reduce incoming damage.", briefing:"Werewolves threaten critical hits, while Golems rely on their natural defense." },
  { id:"ironfang", name:"Ironfang Highlands", folder:"Ironfang", races:["orc","lizardfolk"], bosses:["The Orc Warchief","The Lizard Matriarch"], rule:"Orcs hit harder and Lizardfolk adapt with balanced defenses.", briefing:"Orc warbands and disciplined Lizardfolk patrol the highland passes." },
  { id:"skyfang", name:"Skyfang Aeries", folder:"Skyfang", races:["kobold","harpy"], bosses:["The Kobold Skyking","The Harpy Tempest"], rule:"Kobolds favor ambushes while Harpies strike from the air.", briefing:"Kobold hunters and swift Harpies control the high, narrow ledges." },
  { id:"verdant-veil", name:"Verdant Veil", folder:"VerdantVeil", races:["fae","myconid"], bosses:["The Fae Queen","The Mycelium Heart"], rule:"Fae favor magic; Myconids endure and retaliate.", briefing:"Fae spellcasters and sprawling Myconid colonies guard the living deep." }
];
const REGION_CYCLE_FLOORS = REGION_DEFINITIONS.length * BIOME_FLOORS;
const MILESTONE_BOSS_NAME = "The Threshold Warden";
const ENEMY_TRAITS = {
  slime: "Gelatinous · heavy Brute body",
  skeleton: "Fragile · ranged attacks hit harder",
  goblin: "Quick · high DEX",
  specter: "Evasive · high dodge",
  vampire: "Siphon · heals on landed hits",
  werewolf: "Critical · occasional double damage",
  golem: "Armored · reduces incoming damage",
  zombie: "Sturdy · high health, low speed",
  orc: "Warband · forceful, direct attacks",
  kobold: "Ambusher · quick and evasive",
  harpy: "Aerial · swift ranged pressure",
  fae: "Enchanted · potent magic, fragile body",
  myconid: "Sporebound · resilient with lingering toxins",
  lizardfolk: "Adaptable · balanced offense and defense"
};
const ENEMY_TYPE_PROFILES = [
  { name:"Warrior", family:"Melee", strengths:"Balanced melee damage and durability.", weakness:"No standout specialty; can be outpaced or out-ranged.", status:"Active type" },
  { name:"Archer", family:"Ranged", strengths:"Reliable ranged pressure and some evasion.", weakness:"Less durable than frontline fighters.", status:"Active type" },
  { name:"Mage", family:"Caster", strengths:"Powerful spells and status effects.", weakness:"Low durability and dependence on casting opportunities.", status:"Active type" },
  { name:"Assassin", family:"Melee", strengths:"Very high speed and evasive, disruptive turns.", weakness:"Low health and lower damage per hit.", status:"Active type" },
  { name:"Paladin", family:"Melee", strengths:"High defense with steady, medium damage.", weakness:"Low speed makes its actions easier to anticipate.", status:"Active type" },
  { name:"Quick Caster", family:"Caster", strengths:"Fast, frequent spells with control effects.", weakness:"Lower spell damage and limited durability.", status:"Active type" },
  { name:"Brute", family:"Melee", strengths:"High health and heavy hits.", weakness:"Very low speed and easier to evade.", status:"Active type" },
  { name:"Sharpshooter", family:"Archer variant", strengths:"Accurate, hard-hitting shots with a higher critical-hit rate.", weakness:"Telegraphs shots and has low close-range durability.", status:"Active variant" }
];
const BOSS_PATTERNS = {
  "The Slime Sovereign": [{key:"guard",label:"Gather mass"},{key:"attack",label:"Sovereign Slam",damageMultiplier:1.5},{key:"ward",label:"Gelatinous Guard"}],
  "The Bone Regent": [{key:"guard",label:"Bone Guard"},{key:"cast",label:"Bone Lance",damageMultiplier:1.25},{key:"summon",label:"Raise the Fallen"}],
  "The Goblin King": [{key:"buff",label:"War Cry"},{key:"shoot",label:"Royal Volley"},{key:"attack",label:"King's Strike",damageMultiplier:1.25}],
  "The Veiled Haunt": [{key:"ward",label:"Veil"},{key:"cast",label:"Haunting Burst",damageMultiplier:1.25},{key:"attack",label:"Raking Claw"}],
  "The Crimson Count": [{key:"guard",label:"Crimson Guard"},{key:"cast",label:"Blood Bolt",damageMultiplier:1.3},{key:"attack",label:"Rending Bite"}],
  "The Moonfang Alpha": [{key:"attack",label:"Alpha Pounce",damageMultiplier:1.4},{key:"guard",label:"Circle the Prey"},{key:"attack",label:"Moonfang Rend",damageMultiplier:1.2}],
  "The Mountain Heart": [{key:"guard",label:"Stone Brace"},{key:"attack",label:"Seismic Blow",damageMultiplier:1.6},{key:"guard",label:"Stone Brace"}],
  "The Bone Necromancer": [{key:"summon",label:"Raise the Fallen"},{key:"cast",label:"Grave Bolt",damageMultiplier:1.2},{key:"buff",label:"Dark Benediction"}],
  "The Threshold Warden": [{key:"guard",label:"Seal the Gate"},{key:"cast",label:"Depth Pulse",damageMultiplier:1.5},{key:"summon",label:"Call the Depths"},{key:"attack",label:"Threshold Break",damageMultiplier:1.5}]
};
const PLAYER_EFFECT_DESCRIPTIONS = {
  Burn: "Burn deals damage over time.",
  Freeze: "At five stacks, you lose your next action.",
  Frozen: "You cannot act while frozen.",
  Weakness: "Your attacks deal reduced damage while this lasts.",
  Silence: "You cannot cast spells while this lasts.",
  Cripple: "Your attacks deal 15% less damage while this lasts.",
  Blind: "Your attacks have a 20% chance to miss while this lasts."
};
function floorEnemyScale(floor, growth) { return Math.pow(growth, Math.max(0, floor - 2)); }
function floorEnemyHealthScale(floor) { return 1 + 0.65 * Math.max(0, floor - 2); }
function regionForFloor(floor) {
  const safeFloor=Math.max(1,Math.floor(Number(floor)||1));
  const cycleFloor=(safeFloor-1)%REGION_CYCLE_FLOORS;
  const regionIndex=Math.floor(cycleFloor/BIOME_FLOORS);
  const region=REGION_DEFINITIONS[regionIndex];
  const cycle=Math.floor((safeFloor-1)/REGION_CYCLE_FLOORS)+1;
  const regionStart=safeFloor-cycleFloor%BIOME_FLOORS;
  return {...region,cycle,regionStart,regionEnd:regionStart+BIOME_FLOORS-1,cycleFloor:cycleFloor+1};
}
const WEAPONS = {
  warrior: [["Cinder Knife", "Dagger", "Common", "cinder-knife.png", 7, "Fire"]],
  archer: [["Frayed Hunting Bow", "Bow", "Common", "frayed-hunting-bow.png", 7, "Physical"]],
  mage: [["Cracked Ember Staff", "Staff", "Common", "cracked-ember-staff.png", 8, "Fire"]]
};
const RARITY_MULTIPLIER = [1, 1.25, 1.6, 2.1, 2.8, 3.7, 5];
const EFFECT_DETAILS = [
  ["Burn", "🔥", "Deals damage over time; fire attacks can spread it to nearby enemies."],
  ["Freeze", "❄️", "Builds stacks until the target becomes frozen."],
  ["Frozen", "🧊", "Stops an enemy from acting for two turns."],
  ["Weakness", "⬇️", "Reduces an enemy's attack damage for two turns."],
  ["Silence", "🤫", "Prevents an enemy from casting for two turns."],
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
const ITEM_INDEX = [...GAME_INDEX_DATA.items];
const CLASS_SPELLS = {
  warrior: [
    { id: "warrior-rising-guard", rarity: "Common", name: "Rising Guard", description: "Spend a turn gathering strength; your next attack deals double damage.", manaCost: 5, multiplier: 2, critBonus: 0.05, chargesNextAttack: true, cooldown: 0, element: "Earth" },
    { id: "warrior-steady-breath", rarity: "Common", name: "Steady Breath", description: "Brace yourself, slightly strengthening your next attack.", manaCost: 4, multiplier: 1.35, critBonus: 0.03, chargesNextAttack: true, cooldown: 0, element: "Earth" },
    { id: "warrior-weakening-roar", rarity: "Uncommon", name: "Weakening Roar", description: "Crush one foe's resolve, reducing its attack damage for two turns.", manaCost: 7, multiplier: 0.55, effect: "Weakness", effectChance: 1, cooldown: 1, element: "Wind" },
    { id: "warrior-stone-skin", rarity: "Uncommon", name: "Stone Skin", description: "Gain a brief Thorns ward against an attacker.", manaCost: 7, multiplier: 0, selfEffect: "Thorns", selfOnly: true, cooldown: 2, element: "Earth" },
    { id: "warrior-frostbrand", rarity: "Rare", name: "Frostbrand Seal", description: "Freeze one enemy in place; it loses its next two turns.", manaCost: 11, multiplier: 0.6, effect: "Frozen", effectChance: 1, cooldown: 3, element: "Water" },
    { id: "warrior-crushing-oath", rarity: "Rare", name: "Crushing Oath", description: "A focused blow leaves a foe marked for increased follow-up damage.", manaCost: 10, multiplier: 1.1, effect: "Marked", effectChance: 1, cooldown: 2, element: "Physical" },
    { id: "warrior-iron-tempest", rarity: "Rare", name: "Iron Tempest", description: "Strike several foes with a reduced-damage sweep.", manaCost: 12, multiplier: 0.8, aoe: true, secondaryMultiplier: 0.55, cooldown: 2, element: "Physical" },
    { id: "warrior-earthshaker", rarity: "Epic", name: "Earthshaker Rune", description: "A runic blow staggers one foe and disrupts its next attack.", manaCost: 13, multiplier: 1.1, effect: "Gust", effectChance: 1, cooldown: 2, element: "Earth" },
    { id: "warrior-ashen-circle", rarity: "Epic", name: "Ashen Circle", description: "Burn all foes with a sweeping ember strike.", manaCost: 15, multiplier: 0.85, effect: "Burn", effectChance: 1, aoe: true, secondaryMultiplier: 0.6, cooldown: 3, element: "Fire" },
    { id: "warrior-breaker-mark", rarity: "Epic", name: "Breaker Mark", description: "A heavy hit marks one enemy for increased follow-up damage.", manaCost: 14, multiplier: 1.45, effect: "Marked", effectChance: 1, cooldown: 3, element: "Physical" },
    { id: "warrior-warding-stance", rarity: "Epic", name: "Warding Stance", description: "Gain a stronger Thorns ward before the enemy acts.", manaCost: 15, multiplier: 0, selfEffect: "Thorns", selfOnly: true, cooldown: 3, element: "Earth" },
    { id: "warrior-rootquake", rarity: "Legendary", name: "Rootquake", description: "Root every foe in place, stopping their usual evasive movement.", manaCost: 16, multiplier: 0.7, effect: "Root", effectChance: 1, aoe: true, secondaryMultiplier: 0.65, cooldown: 3, element: "Nature" },
    { id: "warrior-kingbreaker", rarity: "Legendary", name: "Kingbreaker", description: "A precise, high-impact strike that weakens its target.", manaCost: 18, multiplier: 1.8, effect: "Weakness", effectChance: 1, cooldown: 4, element: "Physical" },
    { id: "warrior-cinderwall", rarity: "Legendary", name: "Cinderwall", description: "Burn and weaken the entire enemy group.", manaCost: 19, multiplier: 0.9, effect: "Burn", effectChance: 1, aoe: true, secondaryMultiplier: 0.65, cooldown: 4, element: "Fire" },
    { id: "warrior-iron-vow", rarity: "Mythic", name: "Iron Vow", description: "Raise a thorns ward that reflects part of the next incoming hit.", manaCost: 19, multiplier: 0, selfEffect: "Thorns", selfOnly: true, cooldown: 3, element: "Earth" },
    { id: "warrior-seismic-chain", rarity: "Mythic", name: "Seismic Chain", description: "A crushing sweep roots and damages every enemy.", manaCost: 22, multiplier: 1.25, effect: "Root", effectChance: 1, aoe: true, secondaryMultiplier: 0.75, cooldown: 4, element: "Earth" },
    { id: "warrior-ashen-judgment", rarity: "Mythic", name: "Ashen Judgment", description: "Burn a single target with a devastating strike.", manaCost: 23, multiplier: 2, effect: "Burn", effectChance: 1, cooldown: 4, element: "Fire" },
    { id: "warrior-unbroken-line", rarity: "Mythic", name: "Unbroken Line", description: "Gain a heavy Thorns ward that lasts through several attacks.", manaCost: 24, multiplier: 0, selfEffect: "Thorns", selfOnly: true, cooldown: 4, element: "Earth" },
    { id: "warrior-titans-decree", rarity: "Divine", name: "Titan's Decree", description: "Weaken the entire enemy group, reducing their attack damage.", manaCost: 24, multiplier: 0.85, effect: "Weakness", effectChance: 1, aoe: true, secondaryMultiplier: 0.7, cooldown: 4, element: "Fire" }
    ,{ id: "warrior-worlds-anvil", rarity: "Divine", name: "World's Anvil", description: "A titanic strike cripples one foe and marks it for follow-up attacks.", manaCost: 28, multiplier: 2.5, effect: "Marked", effectChance: 1, cooldown: 5, element: "Earth" }
    ,{ id: "warrior-last-bastion", rarity: "Divine", name: "Last Bastion", description: "Surround yourself with a mighty Thorns ward.", manaCost: 27, multiplier: 0, selfEffect: "Thorns", selfOnly: true, cooldown: 5, element: "Earth" },
    { id: "warrior-redoubt-breaker", rarity: "Legendary", name: "Redoubt Breaker", description: "Break through a guard and leave the target staggered.", manaCost: 20, multiplier: 1.7, effect: "Gust", effectChance: 1, targetDamageReduction: 4, cooldown: 4, element: "Physical" },
    { id: "warrior-blood-iron", rarity: "Legendary", name: "Blood Iron", description: "A punishing blow leaves a deep Bleed on one enemy.", manaCost: 19, multiplier: 1.5, effect: "Bleed", effectChance: 1, cooldown: 3, element: "Physical" },
    { id: "warrior-mountain-oath", rarity: "Mythic", name: "Mountain Oath", description: "Fortify yourself with a long-lasting Thorns ward.", manaCost: 25, multiplier: 0, selfEffect: "Thorns", selfOnly: true, cooldown: 4, element: "Earth" },
    { id: "warrior-emberfall", rarity: "Mythic", name: "Emberfall", description: "A fiery sweep burns the entire enemy group.", manaCost: 26, multiplier: 1.3, effect: "Burn", effectChance: 1, aoe: true, secondaryMultiplier: 0.8, cooldown: 4, element: "Fire" },
    { id: "warrior-sun-forged", rarity: "Divine", name: "Sun-Forged Verdict", description: "Strike all foes with a divine blow that marks them.", manaCost: 30, multiplier: 1.7, effect: "Marked", effectChance: 1, aoe: true, secondaryMultiplier: 0.9, cooldown: 5, element: "Light" },
    { id: "warrior-cathedral-fall", rarity: "Divine", name: "Cathedral Fall", description: "A crushing impact roots and staggers the enemy group.", manaCost: 31, multiplier: 1.5, effect: "Root", effectChance: 1, aoe: true, secondaryMultiplier: 0.85, cooldown: 5, element: "Earth" },
    { id: "warrior-red-kingdom", rarity: "Divine", name: "Red Kingdom", description: "Set every foe ablaze with an overwhelming cleave.", manaCost: 33, multiplier: 1.8, effect: "Burn", effectChance: 1, aoe: true, secondaryMultiplier: 0.9, cooldown: 5, element: "Fire" },
    { id: "warrior-final-guard", rarity: "Divine", name: "Final Guard", description: "Raise an immense Thorns ward before the next enemy assault.", manaCost: 32, multiplier: 0, selfEffect: "Thorns", selfOnly: true, cooldown: 5, element: "Earth" }
  ],
  archer: [
    { id: "archer-galesight", rarity: "Common", name: "Galesight Draw", description: "Spend a turn guiding your next shot; it deals double damage and still uses an arrow.", manaCost: 5, multiplier: 2, critBonus: 0.1, chargesNextAttack: true, cooldown: 0, element: "Wind" },
    { id: "archer-quiet-aim", rarity: "Common", name: "Quiet Aim", description: "Steady your aim to empower your next shot.", manaCost: 4, multiplier: 1.35, critBonus: 0.05, chargesNextAttack: true, cooldown: 0, element: "Wind" },
    { id: "archer-thornbind", rarity: "Uncommon", name: "Thornbind Shot", description: "Root one enemy so it cannot evade your attacks.", manaCost: 7, multiplier: 0.7, effect: "Root", effectChance: 1, cooldown: 1, element: "Nature" },
    { id: "archer-dulling-arrow", rarity: "Uncommon", name: "Dulling Arrow", description: "A light shot weakens one foe's attacks for two turns.", manaCost: 7, multiplier: 0.6, effect: "Weakness", effectChance: 1, cooldown: 1, element: "Physical" },
    { id: "archer-hushstring", rarity: "Rare", name: "Hushstring Hex", description: "Cripple a foe, making its attacks less accurate for two turns.", manaCost: 10, multiplier: 0.65, effect: "Cripple", effectChance: 1, cooldown: 2, element: "Wind" },
    { id: "archer-pinpoint-shot", rarity: "Rare", name: "Pinpoint Shot", description: "A high-precision attack marks a target for your next hit.", manaCost: 11, multiplier: 1.25, effect: "Marked", effectChance: 1, critBonus: 0.12, cooldown: 2, element: "Physical" },
    { id: "archer-forked-flight", rarity: "Rare", name: "Forked Flight", description: "A splitting shot clips the whole enemy group.", manaCost: 12, multiplier: 0.8, aoe: true, secondaryMultiplier: 0.55, cooldown: 2, element: "Wind" },
    { id: "archer-hunters-mark", rarity: "Epic", name: "Huntress' Mark", description: "Mark one target to take 20% more damage from follow-up attacks.", manaCost: 13, multiplier: 0.8, effect: "Marked", effectChance: 1, cooldown: 2, element: "Light" },
    { id: "archer-wind-shear", rarity: "Epic", name: "Wind Shear", description: "A gusting volley disrupts every enemy's next action.", manaCost: 15, multiplier: 0.85, effect: "Gust", effectChance: 1, aoe: true, secondaryMultiplier: 0.6, cooldown: 3, element: "Wind" },
    { id: "archer-black-feather", rarity: "Epic", name: "Black Feather", description: "A barbed shot poisons one enemy over time.", manaCost: 14, multiplier: 1, effect: "Poison", effectChance: 1, cooldown: 2, element: "Dark" },
    { id: "archer-vanishing-trail", rarity: "Epic", name: "Vanishing Trail", description: "Evade the next incoming attack with a phantom sidestep.", manaCost: 15, multiplier: 0, selfEffect: "Afterimage", selfOnly: true, cooldown: 3, element: "Wind" },
    { id: "archer-blindcanopy", rarity: "Legendary", name: "Blind Canopy", description: "Blind every enemy, reducing their chance to land attacks.", manaCost: 16, multiplier: 0.7, effect: "Blind", effectChance: 1, aoe: true, secondaryMultiplier: 0.6, cooldown: 3, element: "Wind" },
    { id: "archer-widowmaker", rarity: "Legendary", name: "Widowmaker", description: "A high-crit shot poisons and marks a single target.", manaCost: 19, multiplier: 1.9, critBonus: 0.2, effect: "Poison", effectChance: 1, cooldown: 4, element: "Physical" },
    { id: "archer-storm-feathers", rarity: "Legendary", name: "Storm Feathers", description: "A rapid storm of arrows roots the whole group.", manaCost: 20, multiplier: 1, effect: "Root", effectChance: 1, aoe: true, secondaryMultiplier: 0.7, cooldown: 4, element: "Wind" },
    { id: "archer-phantomstep", rarity: "Mythic", name: "Phantom Step", description: "Leave an afterimage that evades the next incoming hit.", manaCost: 19, multiplier: 0, selfEffect: "Afterimage", selfOnly: true, cooldown: 3, element: "Wind" },
    { id: "archer-starfall-string", rarity: "Mythic", name: "Starfall String", description: "A celestial volley marks and damages every foe.", manaCost: 22, multiplier: 1.15, effect: "Marked", effectChance: 1, aoe: true, secondaryMultiplier: 0.75, cooldown: 4, element: "Light" },
    { id: "archer-hollow-point", rarity: "Mythic", name: "Hollow Point", description: "A devastating shot weakens a foe and pierces its defenses.", manaCost: 23, multiplier: 2.1, effect: "Weakness", effectChance: 1, targetDamageReduction: 4, cooldown: 4, element: "Dark" },
    { id: "archer-horizon-step", rarity: "Mythic", name: "Horizon Step", description: "Gain an afterimage and a brief Thorns ward.", manaCost: 24, multiplier: 0, selfEffect: "Afterimage", selfOnly: true, cooldown: 4, element: "Wind" },
    { id: "archer-moonlessvolley", rarity: "Divine", name: "Moonless Volley", description: "Strike all foes with a binding volley that leaves them rooted.", manaCost: 23, multiplier: 1, effect: "Root", effectChance: 1, aoe: true, secondaryMultiplier: 0.7, cooldown: 4, element: "Water" }
    ,{ id: "archer-worlds-eye", rarity: "Divine", name: "World's Eye", description: "A perfect volley marks every target for devastating follow-up damage.", manaCost: 28, multiplier: 1.5, effect: "Marked", effectChance: 1, aoe: true, secondaryMultiplier: 0.85, cooldown: 5, element: "Light" }
    ,{ id: "archer-silent-extinction", rarity: "Divine", name: "Silent Extinction", description: "A single impossible shot silences and cripples its target.", manaCost: 29, multiplier: 2.7, effect: "Silence", effectChance: 1, cooldown: 5, element: "Dark" },
    { id: "archer-gloam-net", rarity: "Legendary", name: "Gloam Net", description: "A binding spread roots every foe in the field.", manaCost: 20, multiplier: 0.9, effect: "Root", effectChance: 1, aoe: true, secondaryMultiplier: 0.7, cooldown: 4, element: "Dark" },
    { id: "archer-red-fletching", rarity: "Legendary", name: "Red Fletching", description: "A barbed critical shot bleeds its target over time.", manaCost: 19, multiplier: 1.8, critBonus: 0.18, effect: "Bleed", effectChance: 1, cooldown: 4, element: "Physical" },
    { id: "archer-wind-beyond", rarity: "Mythic", name: "Wind Beyond", description: "Slip from sight, evading the next enemy strike.", manaCost: 25, multiplier: 0, selfEffect: "Afterimage", selfOnly: true, cooldown: 4, element: "Wind" },
    { id: "archer-night-orbit", rarity: "Mythic", name: "Night Orbit", description: "A circling volley blinds and weakens the enemy group.", manaCost: 26, multiplier: 1.3, effect: "Blind", effectChance: 1, aoe: true, secondaryMultiplier: 0.8, cooldown: 4, element: "Dark" },
    { id: "archer-zenith-rain", rarity: "Divine", name: "Zenith Rain", description: "A radiant barrage marks every enemy for follow-up hits.", manaCost: 31, multiplier: 1.8, effect: "Marked", effectChance: 1, aoe: true, secondaryMultiplier: 0.9, cooldown: 5, element: "Light" },
    { id: "archer-eclipse-pin", rarity: "Divine", name: "Eclipse Pin", description: "Pin a target beneath a shot that freezes it for two turns.", manaCost: 32, multiplier: 2.4, effect: "Frozen", effectChance: 1, cooldown: 5, element: "Water" },
    { id: "archer-hundred-horizons", rarity: "Divine", name: "Hundred Horizons", description: "A world-spanning storm blinds every foe.", manaCost: 34, multiplier: 1.8, effect: "Blind", effectChance: 1, aoe: true, secondaryMultiplier: 0.9, cooldown: 5, element: "Wind" },
    { id: "archer-last-light", rarity: "Divine", name: "Last Light", description: "A perfect arrow deals massive damage and weakens its target.", manaCost: 33, multiplier: 3, critBonus: 0.25, effect: "Weakness", effectChance: 1, cooldown: 5, element: "Light" }
  ],
  mage: [
    { id: "mage-warding-flame", rarity: "Common", name: "Warding Flame", description: "Burn one target with a quick flame spell.", manaCost: 6, multiplier: 0.7, effect: "Burn", effectChance: 1, cooldown: 1, element: "Fire" },
    { id: "mage-spark-ward", rarity: "Common", name: "Spark Ward", description: "A small spark burns a foe and strengthens your next defense.", manaCost: 5, multiplier: 0.65, effect: "Burn", effectChance: 1, cooldown: 1, element: "Fire" },
    { id: "mage-rimeprison", rarity: "Uncommon", name: "Rime Prison", description: "Freeze one enemy in place for a turn.", manaCost: 8, multiplier: 0, effect: "Frozen", effectChance: 1, cooldown: 2, element: "Water" },
    { id: "mage-frail-thread", rarity: "Uncommon", name: "Frail Thread", description: "Reduce one enemy's damage for two turns.", manaCost: 7, multiplier: 0.55, effect: "Weakness", effectChance: 1, cooldown: 1, element: "Arcane" },
    { id: "mage-weakening-veil", rarity: "Rare", name: "Veil of Frailty", description: "Reduce one enemy's damage for two turns.", manaCost: 11, multiplier: 0.65, effect: "Weakness", effectChance: 1, cooldown: 2, element: "Dark" },
    { id: "mage-brittle-prism", rarity: "Rare", name: "Brittle Prism", description: "A focused shard freezes and damages one target.", manaCost: 12, multiplier: 0.9, effect: "Freeze", effectChance: 1, cooldown: 2, element: "Water" },
    { id: "mage-cinder-orbit", rarity: "Rare", name: "Cinder Orbit", description: "Arcane embers burn every enemy for reduced damage.", manaCost: 13, multiplier: 0.8, effect: "Burn", effectChance: 1, aoe: true, secondaryMultiplier: 0.55, cooldown: 2, element: "Fire" },
    { id: "mage-silence-sigil", rarity: "Epic", name: "Silence Sigil", description: "Silence one foe and cancel its next spell cast.", manaCost: 14, multiplier: 0.8, effect: "Silence", effectChance: 1, cooldown: 2, element: "Arcane" },
    { id: "mage-gravity-well", rarity: "Epic", name: "Gravity Well", description: "Pull enemies together and root the entire group.", manaCost: 16, multiplier: 0.75, effect: "Root", effectChance: 1, aoe: true, secondaryMultiplier: 0.65, cooldown: 3, element: "Void" },
    { id: "mage-mind-fray", rarity: "Epic", name: "Mind Fray", description: "Silence and weaken a single enemy.", manaCost: 16, multiplier: 0.9, effect: "Silence", effectChance: 1, cooldown: 3, element: "Arcane" },
    { id: "mage-prismatic-shell", rarity: "Epic", name: "Prismatic Shell", description: "Gain a Thorns ward while the enemy's next attack is disrupted.", manaCost: 17, multiplier: 0, selfEffect: "Thorns", selfOnly: true, cooldown: 3, element: "Light" },
    { id: "mage-stillwinter", rarity: "Legendary", name: "Stillwinter", description: "Freeze one enemy solid; it loses its next two turns.", manaCost: 17, multiplier: 0.9, effect: "Frozen", effectChance: 1, cooldown: 3, element: "Water" },
    { id: "mage-void-collapse", rarity: "Legendary", name: "Void Collapse", description: "Silence and weaken the whole enemy group.", manaCost: 20, multiplier: 1, effect: "Silence", effectChance: 1, aoe: true, secondaryMultiplier: 0.65, cooldown: 4, element: "Void" },
    { id: "mage-ember-cataclysm", rarity: "Legendary", name: "Ember Cataclysm", description: "A focused inferno burns a single foe for heavy damage.", manaCost: 21, multiplier: 2, effect: "Burn", effectChance: 1, cooldown: 4, element: "Fire" },
    { id: "mage-astralburst", rarity: "Mythic", name: "Astral Burst", description: "Burn every enemy in a wide arcane detonation.", manaCost: 20, multiplier: 1.05, effect: "Burn", effectChance: 1, aoe: true, secondaryMultiplier: 0.7, cooldown: 3, element: "Fire" },
    { id: "mage-glacial-eclipse", rarity: "Mythic", name: "Glacial Eclipse", description: "Freeze one foe and leave the entire group weakened.", manaCost: 24, multiplier: 1.5, effect: "Frozen", effectChance: 1, cooldown: 4, element: "Water" },
    { id: "mage-storm-of-names", rarity: "Mythic", name: "Storm of Names", description: "Silence all enemies as arcane force strikes the group.", manaCost: 25, multiplier: 1.25, effect: "Silence", effectChance: 1, aoe: true, secondaryMultiplier: 0.8, cooldown: 4, element: "Arcane" },
    { id: "mage-aegis-star", rarity: "Mythic", name: "Aegis Star", description: "Surround yourself with a powerful Thorns ward.", manaCost: 24, multiplier: 0, selfEffect: "Thorns", selfOnly: true, cooldown: 4, element: "Light" },
    { id: "mage-nullstar", rarity: "Divine", name: "Nullstar", description: "Seal every foe's magic, preventing their spell casts.", manaCost: 25, multiplier: 1.15, effect: "Silence", effectChance: 1, aoe: true, secondaryMultiplier: 0.75, cooldown: 4, element: "Dark" }
    ,{ id: "mage-primeval-zero", rarity: "Divine", name: "Primeval Zero", description: "Erase a target's next two turns beneath absolute frost.", manaCost: 30, multiplier: 2.2, effect: "Frozen", effectChance: 1, cooldown: 5, element: "Water" }
    ,{ id: "mage-worldfire", rarity: "Divine", name: "Worldfire", description: "Burn and weaken every foe in a divine conflagration.", manaCost: 32, multiplier: 1.6, effect: "Burn", effectChance: 1, aoe: true, secondaryMultiplier: 0.85, cooldown: 5, element: "Fire" },
    { id: "mage-kingdom-of-ash", rarity: "Legendary", name: "Kingdom of Ash", description: "A spreading fire burns every foe for several turns.", manaCost: 20, multiplier: 0.95, effect: "Burn", effectChance: 1, aoe: true, secondaryMultiplier: 0.7, cooldown: 4, element: "Fire" },
    { id: "mage-quiet-annihilation", rarity: "Legendary", name: "Quiet Annihilation", description: "Silence one enemy and strike with concentrated void energy.", manaCost: 21, multiplier: 1.8, effect: "Silence", effectChance: 1, cooldown: 4, element: "Void" },
    { id: "mage-frozen-script", rarity: "Mythic", name: "Frozen Script", description: "Freeze a foe solid and silence its allies.", manaCost: 26, multiplier: 1.5, effect: "Frozen", effectChance: 1, aoe: true, secondaryMultiplier: 0.7, cooldown: 4, element: "Water" },
    { id: "mage-ashen-mandala", rarity: "Mythic", name: "Ashen Mandala", description: "Burn and weaken every enemy in a broad spell circle.", manaCost: 27, multiplier: 1.4, effect: "Burn", effectChance: 1, aoe: true, secondaryMultiplier: 0.85, cooldown: 4, element: "Fire" },
    { id: "mage-heavens-quiet", rarity: "Divine", name: "Heaven's Quiet", description: "Silence the enemy group beneath a divine wave.", manaCost: 34, multiplier: 1.9, effect: "Silence", effectChance: 1, aoe: true, secondaryMultiplier: 0.9, cooldown: 5, element: "Light" },
    { id: "mage-white-absence", rarity: "Divine", name: "White Absence", description: "Freeze one foe and root all others in absolute winter.", manaCost: 35, multiplier: 2.6, effect: "Frozen", effectChance: 1, aoe: true, secondaryMultiplier: 0.75, cooldown: 5, element: "Water" },
    { id: "mage-black-sun", rarity: "Divine", name: "Black Sun", description: "A void detonation weakens and burns every enemy.", manaCost: 37, multiplier: 2, effect: "Burn", effectChance: 1, aoe: true, secondaryMultiplier: 0.95, cooldown: 5, element: "Dark" },
    { id: "mage-eternal-aegis", rarity: "Divine", name: "Eternal Aegis", description: "Wrap yourself in a powerful ward that punishes attackers.", manaCost: 36, multiplier: 0, selfEffect: "Thorns", selfOnly: true, cooldown: 5, element: "Light" }
  ]
};
const SPELL_RARITY_DURATION={Common:1,Uncommon:1,Rare:2,Epic:2,Legendary:3,Mythic:3,Divine:4};
const SPELL_MANA_PERCENT={Legendary:0.24,Mythic:0.32,Divine:0.40};
const SPELL_EFFECT_TEXT={Frozen:"freeze the target and stop its turns",Weakness:"reduce the target’s attack damage",Silence:"prevent spellcasting",Root:"prevent normal evasion",Marked:"increase follow-up damage",Burn:"apply a burning damage-over-time effect",Poison:"apply a poison damage-over-time effect",Bleed:"apply a bleeding damage-over-time effect",Blind:"reduce attack accuracy",Cripple:"reduce accuracy and damage",Gust:"disrupt the target’s next action"};
for(const [className,spells] of Object.entries(CLASS_SPELLS))for(const spell of spells){
  spell.multiplier=0;spell.critBonus=0;spell.duration=SPELL_RARITY_DURATION[spell.rarity]||1;
  if(spell.chargesNextAttack){delete spell.chargesNextAttack;spell.selfOnly=true;spell.selfEffect=className==="archer"?"Afterimage":"Thorns";spell.description=className==="archer"?"Evade the next incoming attack.":"Brace for the next hit with a Thorns ward.";}
  if(SPELL_MANA_PERCENT[spell.rarity])spell.manaPercent=SPELL_MANA_PERCENT[spell.rarity];
  if(spell.selfEffect&&!spell.chargesNextAttack)spell.description=`${spell.selfEffect==="Afterimage"?"Evade the next incoming attack":"Reflect part of incoming damage with Thorns"} for ${spell.duration} turn${spell.duration===1?"":"s"}.`;
  else if(spell.effect)spell.description=`${spell.aoe?"All foes":"One foe"}: ${SPELL_EFFECT_TEXT[spell.effect]||spell.effect} for ${spell.duration} turn${spell.duration===1?"":"s"}.`;
}
const ROOM_LABELS = {
  start: "Starting Room", enemy: "Enemy Room", empty: "Empty Room", treasure: "Treasure Room",
  weapon: "Weapon Cache", fountain: "Fountain Room", shop: "Shop Room", trap: "Treasure Room", boss: "Boss Room"
};
const roomNames = {
  slime: [["Slime Brute", "Brute"]],
  skeleton: [["Skeleton Warrior", "Warrior"], ["Skeleton Paladin", "Paladin"], ["Skeleton Sharpshooter", "Sharpshooter"], ["Skeleton Quick Caster", "Quick Caster"], ["Skeleton Mage", "Mage"]],
  goblin: [["Goblin Warrior", "Warrior"], ["Goblin Archer", "Archer"], ["Goblin Sharpshooter", "Sharpshooter"], ["Goblin Mage", "Mage"], ["Goblin Assassin", "Assassin"], ["Goblin Paladin", "Paladin"], ["Goblin Quick Caster", "Quick Caster"], ["Goblin Brute", "Brute"]],
  zombie: [["Zombie Brute", "Brute"], ["Zombie Warrior", "Warrior"]],
  specter: [["Specter Assassin", "Assassin"], ["Specter Mage", "Mage"], ["Specter Quick Caster", "Quick Caster"]],
  vampire: [["Vampire Assassin", "Assassin"], ["Vampire Paladin", "Paladin"], ["Vampire Mage", "Mage"]],
  werewolf: [["Werewolf Brute", "Brute"], ["Werewolf Assassin", "Assassin"], ["Werewolf Warrior", "Warrior"]],
  golem: [["Golem Brute", "Brute"], ["Golem Paladin", "Paladin"]],
  orc: [["Orc Warrior", "Warrior"], ["Orc Brute", "Brute"], ["Orc Paladin", "Paladin"]],
  kobold: [["Kobold Assassin", "Assassin"], ["Kobold Sharpshooter", "Sharpshooter"]],
  harpy: [["Harpy Archer", "Archer"], ["Harpy Sharpshooter", "Sharpshooter"], ["Harpy Assassin", "Assassin"]],
  fae: [["Fae Assassin", "Assassin"], ["Fae Quick Caster", "Quick Caster"], ["Fae Mage", "Mage"]],
  myconid: [["Myconid Brute", "Brute"], ["Myconid Mage", "Mage"]],
  lizardfolk: [["Lizardfolk Warrior", "Warrior"], ["Lizardfolk Archer", "Archer"], ["Lizardfolk Paladin", "Paladin"]]
};
const BOSS_RACES = {"The Slime Sovereign":"slime","The Bone Regent":"skeleton","The Goblin King":"goblin","The Veiled Haunt":"specter","The Crimson Count":"vampire","The Moonfang Alpha":"werewolf","The Mountain Heart":"golem","The Bone Necromancer":"skeleton","The Orc Warchief":"orc","The Lizard Matriarch":"lizardfolk","The Kobold Skyking":"kobold","The Harpy Tempest":"harpy","The Fae Queen":"fae","The Mycelium Heart":"myconid"};

let state = null;
let modal = null;
let shopTab = "weapons";
let indexCategory = "warrior";
let selectedIndexItem = null;
let inventoryWeaponFamily = "warrior";
let inventoryCategory = "weapons";
let weaponSort = { key: "rarity", direction: "desc" };
let itemSort = { key: "rarity", direction: "desc" };
let leaderboardDifficulty = "normal";
let leaderboardEntries = [];
let leaderboardStatus = "idle";
let leaderboardRequest = 0;
let pendingCombatAction = null;
let combatPacing = (() => { try { return localStorage.getItem(COMBAT_PACING_KEY) === "slow" ? "slow" : "fast"; } catch { return "fast"; } })();
let combatResolution = null;
let combatResolutionToken = 0;
let combatVictoryPending = false;
let combatFeedbacks = [];
let enemyHitFlash = false;
let lastFocusedModalName = null;
let modalReturnFocusSelector = null;
let pendingNewRunSlot = null;

screen.addEventListener("keydown", event => {
  const dialog=screen.querySelector('.modal[role="dialog"]');
  if(!dialog)return;
  if(event.key==="Escape"){
    const close=dialog.querySelector("[data-close-modal]");
    if(close){event.preventDefault();close.click();}
    return;
  }
  if(event.key!=="Tab")return;
  const focusable=[...dialog.querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),a[href],[tabindex]:not([tabindex="-1"])')].filter(element=>element.offsetParent!==null);
  if(!focusable.length)return;
  const first=focusable[0],last=focusable[focusable.length-1];
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
});

indexButton.addEventListener("click", () => { modalReturnFocusSelector="#index-button"; modal = "index"; selectedIndexItem = null; showModal(); });
document.querySelector("#leaderboard-button").addEventListener("click", () => { modalReturnFocusSelector="#leaderboard-button"; modal = "leaderboard"; showModal(); });
document.querySelector("#settings-button").addEventListener("click", () => { modalReturnFocusSelector="#settings-button"; modal = "settings"; showModal(); });

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

function clearCombatResolution() {
  combatResolution=null;
  combatVictoryPending=false;
  combatResolutionToken++;
}
function combatActionLabel(action) {
  if(action==="heal")return "health potion";
  if(action==="mana")return "mana potion";
  if(action==="basic"||action==="attack")return state.class==="mage"?"basic spell":state.class==="archer"?"shot":"basic attack";
  if(action==="heavy")return "heavy attack";
  const attack=state.weapon?.attacks?.find(item=>item.command===action)||getEquippedClassSpell(action);
  return attack?.name||action.replace(/-/g," ");
}
function combatResolutionLabel() {
  if(!combatResolution)return state?.combat?.bonusAttackPending?"Bonus action":"Your turn";
  if(combatResolution.phase==="enemy-death")return "Enemy defeated";
  const actionLabel=combatResolution.action?combatActionLabel(combatResolution.action):"";
  return combatResolution.phase==="player-windup"?`Preparing: ${actionLabel}…`:combatResolution.phase==="player-impact"?`Impact: ${actionLabel}.`:combatResolution.phase==="enemy-windup"?`${combatResolution.actor} prepares to act…`:`${combatResolution.actor} acts!`;
}
function combatEffectColor(action) {
  const attack=state?.weapon?.attacks?.find(item=>item.command===action)||getEquippedClassSpell(action);
  const effect=attack?.effect||attack?.selfEffect||state?.weapon?.effect;
  const colors={Burn:"#f06436",Poison:"#72b94d",Bleed:"#c52e43",Shock:"#f3d447",Frozen:"#70c9ec",Freeze:"#70c9ec",Root:"#80a857",Pin:"#80a857",Weakness:"#9273bd",Silence:"#8570a8",Blind:"#6f667b",Cripple:"#96754f",Gust:"#77b9cf",Marked:"#edb74c","Life Steal":"#c94f69","Mana Steal":"#4f91d1",Void:"#65518c"};
  return colors[effect]||"#a7a7a1";
}
function recordCombatFeedback(kind,target,action) {
  const targetIndex=typeof target==="number"?target:state?.combat?.enemies?.indexOf(target);
  if(!Number.isInteger(targetIndex)||targetIndex<0)return;
  if(!combatFeedbacks.some(item=>item.kind===kind&&item.targetIndex===targetIndex))combatFeedbacks.push({kind,targetIndex,action,createdAt:Date.now()});
}
function renderCombatOutcome(targetIndex) {
  return combatFeedbacks.filter(item=>item.targetIndex===targetIndex).map(item=>{
    const elapsed=Math.max(0,Date.now()-(item.createdAt||Date.now()));
    if(elapsed>900)return "";
    const timing=`--outcome-delay:-${elapsed}ms`;
    const color=combatEffectColor(item.action);
    if(item.kind==="miss")return `<div class="combat-outcome-effect outcome-miss" style="--outcome-color:${color};${timing}" aria-hidden="true"><span class="outcome-slashes ${item.action==="heavy"?"single":""}"><i></i>${item.action==="heavy"?"":"<i></i>"}</span></div><strong class="combat-miss-popup" style="--outcome-delay:-${elapsed}ms">Miss!</strong>`;
    if(item.kind==="blocked"){
      const attack=state?.weapon?.attacks?.find(entry=>entry.command===item.action)||getEquippedClassSpell(item.action);
      const spell=state?.class==="mage"||attack?.spell;
      const impact=spell?`<span class="blocked-spell"></span>`:`<span class="blocked-slashes ${item.action==="heavy"?"single":""}"><i></i>${item.action==="heavy"?"":"<i></i>"}</span>`;
      return `<div class="combat-outcome-effect outcome-blocked" style="--outcome-color:${color};${timing}" aria-hidden="true"><svg class="outcome-shield" viewBox="0 0 100 120"><path d="M50 5 91 20v34c0 27-15 46-41 61C24 100 9 81 9 54V20Z"/></svg>${impact}</div>`;
    }
    return "";
  }).join("");
}
function renderEnemyHitFlash() {
  if(!enemyHitFlash)return "";
  enemyHitFlash=false;
  return '<div class="screen-edge-flash" aria-hidden="true"></div>';
}

function animateMenuSwap(element) {
  if (!element || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  element.classList.remove("menu-content-swap");
  void element.offsetWidth;
  element.classList.add("menu-content-swap");
  element.addEventListener("animationend", () => element.classList.remove("menu-content-swap"), { once: true });
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
function isResumableSave(saved) {
  if (!saved || typeof saved !== "object" || Array.isArray(saved) ||
      !Number.isInteger(saved.floor) || saved.floor < 1 ||
      !Number.isInteger(saved.level) || saved.level < 1 ||
      !Array.isArray(saved.log) ||
      !saved.currentFloor || typeof saved.currentFloor !== "object" ||
      !Array.isArray(saved.currentFloor.rooms) || !saved.currentFloor.rooms.length) return false;
  const rooms = saved.currentFloor.rooms;
  return rooms.every(room => room && typeof room === "object" &&
      (typeof room.id === "string" || Number.isInteger(room.id)) &&
      Number.isInteger(room.x) && room.x >= 0 && room.x < 7 &&
      Number.isInteger(room.y) && room.y >= 0 && room.y < 7 &&
      typeof room.type === "string") &&
    rooms.some(room => room.id === saved.currentFloor.currentId);
}
function save() {
  try {
    if (!state) return;
    const slots = loadSaveSlots();
    DUNGEON_RULES.writeSaveSlot(slots, SAVE_SLOT_IDS.includes(state.saveSlot) ? state.saveSlot : "slot1", state);
    localStorage.setItem(SAVE_SLOTS_KEY, JSON.stringify(slots));
  } catch { /* Browser storage may be disabled. */ }
}

function persistRunSubmission(run) {
  try {
    if (!run?.submissionId || !SAVE_SLOT_IDS.includes(run.saveSlot)) return;
    const slots = loadSaveSlots();
    const saved = slots[run.saveSlot];
    if (!saved || saved.submissionId !== run.submissionId) return;
    saved.leaderboardSubmitted = run.leaderboardSubmitted;
    saved.runSubmissionStatus = run.runSubmissionStatus;
    localStorage.setItem(SAVE_SLOTS_KEY, JSON.stringify(slots));
  } catch { /* Browser storage may be disabled. */ }
}
function refreshRunSubmissionView(run) {
  if (state?.submissionId !== run?.submissionId) return;
  state.leaderboardSubmitted = run.leaderboardSubmitted;
  state.runSubmissionStatus = run.runSubmissionStatus;
  if (["death", "run-end"].includes(modal)) render();
}

function normalizeLeaderboardDifficulty(value) {
  const normalized=String(value||"").trim().toLowerCase();
  return LEADERBOARD_DIFFICULTIES.find(key=>key===normalized||DIFFICULTIES[key].label.toLowerCase()===normalized)||null;
}

function validateLeaderboardEntries(entries, limit = 100) {
  if (!Array.isArray(entries)) return [];
  const allowedClasses = [...Object.values(CLASS_NAMES), "Unchosen"];
  return entries.filter(entry => entry && typeof entry === "object" &&
    typeof entry.name === "string" && Number.isInteger(entry.floors) && entry.floors > 0 && entry.floors <= 100000 &&
    Number.isInteger(entry.level) && entry.level > 0 && entry.level <= 100000 &&
    allowedClasses.includes(entry.className) && normalizeLeaderboardDifficulty(entry.difficulty) !== null &&
    typeof entry.date === "number" && Number.isFinite(entry.date) && entry.name.trim().length > 0 && entry.name.length <= 22)
    .map(entry=>({...entry,difficulty:normalizeLeaderboardDifficulty(entry.difficulty)}))
    .sort((a, b) => b.floors - a.floors || b.level - a.level || a.date - b.date)
    .slice(0, limit);
}

function loadLeaderboard(difficulty = leaderboardDifficulty) {
  try {
    const entries = JSON.parse(localStorage.getItem(LEADERBOARD_KEY) || "[]");
    return validateLeaderboardEntries(entries, Number.MAX_SAFE_INTEGER).filter(entry => entry.difficulty.toLowerCase() === difficulty)
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

function changeArrowCount(amount) {
  const before = Math.max(0, Math.floor(Number(state.arrows) || 0));
  state.arrows = Math.max(0, Math.min(30, before + Math.trunc(Number(amount) || 0)));
  return state.arrows - before;
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

function saveLocalLeaderboardEntry(run) {
  let entries = [];
  try { entries = JSON.parse(localStorage.getItem(LEADERBOARD_KEY) || "[]"); } catch { /* Ignore malformed legacy records. */ }
  if (!Array.isArray(entries)) entries = [];
  const entry = {
    name: String(run.name || "Adventurer").trim().slice(0, 22) || "Adventurer",
    className: CLASS_NAMES[run.chosenClass || run.class] || "Unchosen",
    difficulty: run.difficulty,
    floors: run.floorsCleared,
    level: Number.isInteger(run.level) && run.level > 0 ? run.level : 1,
    date: Date.now()
  };
  const all = validateLeaderboardEntries([...validateLeaderboardEntries(entries, Number.MAX_SAFE_INTEGER), entry], Number.MAX_SAFE_INTEGER);
  const topScores = LEADERBOARD_DIFFICULTIES.flatMap(difficulty => all.filter(score => score.difficulty === difficulty).slice(0, 100));
  try { localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(topScores)); return true; }
  catch { return false; }
}

function submitCompletedRun(run) {
  if (!run || run.devMode || run.leaderboardSubmitted || !LEADERBOARD_DIFFICULTIES.includes(run.difficulty) || !Number.isInteger(run.floorsCleared) || run.floorsCleared < 1 || run.floorsCleared > 100000) return;
  run.submissionId ||= `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
  run.leaderboardSubmitted = true;
  run.runSubmissionStatus = LEADERBOARD_API ? "Submitting final score to the global board…" : "Global leaderboard is not configured; personal best is saved on this device.";
  if (!LEADERBOARD_API) { saveLocalLeaderboardEntry(run); return; }
  fetch(`${LEADERBOARD_API.replace(/\/$/, "")}/scores`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: String(run.name || "Adventurer").trim().slice(0, 22) || "Adventurer", className: CLASS_NAMES[run.chosenClass || run.class] || "Unchosen", difficulty: run.difficulty, floors: run.floorsCleared, level: run.level || 1 })
  }).then(async response => {
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Score submission failed");
    if (data.result === "invalid") throw new Error("The server rejected this score as invalid.");
    run.runSubmissionStatus = data.result === "accepted" ? "Your score earned a place on the global top 100." : "Personal best saved. This score did not make the global top 100.";
    persistRunSubmission(run);
    if (data.result === "accepted" && modal === "leaderboard") refreshGlobalLeaderboard(run.difficulty);
    refreshRunSubmissionView(run);
  }).catch(error => {
    run.leaderboardSubmitted = false;
    run.runSubmissionStatus = `Personal best saved. Global submission failed: ${error.message}`;
    persistRunSubmission(run);
    refreshRunSubmissionView(run);
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
  if (board) {
    board.innerHTML = markup.match(/<div class="leaderboard-board">([\s\S]*)<\/div>$/)?.[1] || "";
    animateMenuSwap(board);
  }
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
    rarity, weapon.type, weapon.element, weapon.manaCost || 0, weapon.name
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

function addInventoryItem(item) {
  const isPotion = item && ["health", "mana"].includes(item.type);
  if (isPotion) {
    item.quantity = Math.max(1, Math.floor(Number(item.quantity) || 1));
    item.shopValue = Number(item.shopValue) > 0 ? Number(item.shopValue) : potionShopPrice(item.rarity);
    const stack = state.items.find(existing => existing.type === item.type && existing.name === item.name && existing.rarity === item.rarity && Number(existing.amount) === Number(item.amount));
    if (stack) {
      const stackQuantity=Math.max(1,Math.floor(Number(stack.quantity)||1));
      const stackValue=Number(stack.shopValue)>0?Number(stack.shopValue):potionShopPrice(stack.rarity);
      stack.shopValue=(stackValue*stackQuantity+item.shopValue*item.quantity)/(stackQuantity+item.quantity);
      stack.quantity = stackQuantity + item.quantity;
      return stack;
    }
  }
  state.items.push(item);
  return item;
}

function createClassSpellScroll(className, rarity="Common", starterOnly=false, excludedSpellIds=[]) {
  const catalog=CLASS_SPELLS[className]||CLASS_SPELLS.warrior;
  const available=catalog.filter(spell=>!excludedSpellIds.includes(spell.id));
  const matching=available.filter(spell=>spell.rarity===rarity);
  const template=starterOnly?matching[0]:choice(matching.length?matching:available);
  if(!template)return null;
  return {...template,id:`${template.id}-${Date.now()}-${Math.floor(Math.random()*1e9)}`,spellId:template.id,rarity:template.rarity,className,
    command:`class-spell-${slug(template.id)}`,name:`${template.rarity} ${template.name} Scroll`,spellName:template.name,
    quantity:1,kind:"classSpell",classSpell:true,file:"spell-scroll.svg"};
}
function refreshClassSpellProfile(spell){
  if(!spell)return;
  const spellId=spell.spellId||Object.values(CLASS_SPELLS).flat().find(entry=>spell.id===entry.id||spell.id?.startsWith(`${entry.id}-`))?.id;
  const owner=spell.className||Object.keys(CLASS_SPELLS).find(key=>CLASS_SPELLS[key].some(entry=>entry.id===spellId));
  const profile=CLASS_SPELLS[owner]?.find(entry=>entry.id===spellId);
  if(!profile)return;
  const instanceId=spell.id;
  Object.assign(spell,{...profile,id:instanceId||`${profile.id}-${Date.now()}`,spellId:profile.id,className:owner,spellName:profile.name,command:`class-spell-${slug(profile.id)}`,classSpell:true,kind:"classSpell",name:`${profile.rarity} ${profile.name} Scroll`,file:"spell-scroll.svg"});
}
function migrateBrowserSave() {
  if (!state) return;
  state.saveSlot ||= state.devMode ? "dev" : "slot1";
  if(!DIFFICULTIES[state.difficulty])state.difficulty="normal";
  if(state.combat?.enemies)for(const enemy of state.combat.enemies){
    if((enemy.damageScaleVersion||0)<2){enemy.damage=Math.max(1,Math.round(enemy.damage*floorEnemyScale(state.floor||1,1.28)/floorEnemyScale(state.floor||1,1.1)));enemy.damageScaleVersion=2;}
    if((enemy.healthScaleVersion||0)<1){
      const floor=state.floor||1;
      let healthRatio=floorEnemyHealthScale(floor)/floorEnemyScale(floor,1.35);
      if(enemy.boss)healthRatio*=(2+floor*0.15)/(2+floor*0.5);
      enemy.maxHp=Math.max(1,Math.round(enemy.maxHp*healthRatio));
      enemy.hp=enemy.hp>0?Math.max(1,Math.round(enemy.hp*healthRatio)):0;
      enemy.healthScaleVersion=1;
    }
  }
  state.inventoryNotice ??= false;
  state.spells ||= [];
  for(const spell of state.spells)refreshClassSpellProfile(spell);
  state.equippedSpellId ||= null;
  if(state.equippedSpellId&&!state.spells.some(spell=>spell.id===state.equippedSpellId))state.equippedSpellId=null;
  state.shopLootUpgradeLevel ??= 0;
  if(Array.isArray(state.shopStock))state.shopStock=state.shopStock.map(item=>{if(item?.kind==="spell")item.kind="classSpell";if(item?.kind==="classSpell")refreshClassSpellProfile(item.value);return item;});
  state.chosenClass ||= state.class || null;
  state.class=state.chosenClass;
  state.defenseCooldowns ||= { aegis: 0, block: 0, dodge: 0 };
  state.activeDefense ||= null;
  state.runStats ||= { enemiesDefeated: 0, damageDealt: 0, damageTaken: 0, fights: [] };
  state.equippedArmor ||= {};
  state.weapons ||= [];
  state.armor ||= [];
  const savedItems = state.items || [];
  state.items = [];
  for (const item of savedItems) {
    if(item&&["health","mana"].includes(item.type)){
      item.rarity=RARITIES.includes(item.rarity)?item.rarity:"Common";
      item.name=`${item.rarity} ${item.type==="mana"?"Mana":"Health"} Potion`;
      if(item.type==="mana")item.amount=0;
    }
    addInventoryItem(item);
  }
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
    weapon.level ??= 1;
    weapon.upgradeFloor ??= state.floor || 1;
    weapon.upgradesThisFloor ??= 0;
    weapon.damageUpgrade ??= 0;
    weapon.critUpgrade ??= 0;
    weapon.effectChance ??= 0.2;
    weapon.speedUpgrade ??= 0;
    const family = DUNGEON_RULES.weaponFamilyForType(weapon.type) || "warrior";
    const profileKey = `${family}|${weapon.name}|${weapon.type}|${weapon.rarity || "Common"}`;
    if (window.GAME_WEAPON_ATTACK_DATA?.[profileKey] || !weapon.attacks) weapon.attacks = DUNGEON_RULES.createWeaponAttacks(
      family, weapon.rarity || "Common", weapon.type, weapon.element || "Physical", weapon.manaCost || 0, weapon.name
    );
  }
  if (state.weapon) {
    const family = DUNGEON_RULES.weaponFamilyForType(state.weapon.type) || "warrior";
    const profileKey = `${family}|${state.weapon.name}|${state.weapon.type}|${state.weapon.rarity || "Common"}`;
    if (window.GAME_WEAPON_ATTACK_DATA?.[profileKey] || !state.weapon.attacks) state.weapon.attacks = DUNGEON_RULES.createWeaponAttacks(
      family, state.weapon.rarity || "Common", state.weapon.type, state.weapon.element || "Physical", state.weapon.manaCost || 0, state.weapon.name
    );
  }
  if (state.weapon) {
    state.weapon.level ??= 1; state.weapon.upgradeFloor ??= state.floor || 1;
    state.weapon.upgradesThisFloor ??= 0; state.weapon.damageUpgrade ??= 0;
    state.weapon.critUpgrade ??= 0; state.weapon.effectChance ??= 0.2;
    state.weapon.speedUpgrade ??= 0;
  }
  updateArmorBonuses();
}

function makeEnemy(floor, boss = false, index = 0) {
  const region=regionForFloor(floor);
  const milestoneBoss=boss&&floor%MILESTONE_BOSS_INTERVAL===0;
  const name = boss ? (milestoneBoss?MILESTONE_BOSS_NAME:index === 1 ? "The Hollow Twin" : choice(region.bosses)) : null;
  const race = boss ? (BOSS_RACES[name]||choice(region.races)) : choice(region.races);
  const template = roomNames[race];
  const variant = Array.isArray(template[0]) ? choice(template) : template;
  const enemyName=boss?name:variant[0];
  const klass = boss ? "Boss" : variant[1];
  const baseHp = race === "golem" ? 95 : race === "werewolf" ? 58 : race === "slime" ? 42 : ["orc","myconid"].includes(race) ? 48 : 32;
  const difficulty=DIFFICULTIES[state?.difficulty]||DIFFICULTIES.normal;
  const raceHealthScale=race==="skeleton"?0.8:race==="specter"?0.92:race==="zombie"?1.25:race==="fae"?0.85:race==="myconid"?1.2:1;
  const typeHealthScale=({Assassin:0.78,Paladin:1.18,"Quick Caster":0.82,Brute:1.45,Sharpshooter:0.82})[klass]||1;
  const hp = Math.round((boss ? baseHp * (floor * 0.15 + 2) * 1.5 * (milestoneBoss?1.5:1) : baseHp*raceHealthScale*typeHealthScale) * floorEnemyHealthScale(floor) * difficulty.enemyHealth);
  const baseDamage = race === "golem" ? 9 : race === "werewolf" ? 10 : ["orc","harpy"].includes(race) ? 8 : 7;
  const damageScale=({Assassin:0.78,Paladin:0.95,"Quick Caster":0.78,Brute:1.35,Sharpshooter:1.2})[klass]||(race==="werewolf"?1.1:1);
  const element = ({ slime: "Water", skeleton: "Earth", goblin: "Wind", vampire: "Fire", werewolf: "Earth", golem: "Earth", orc:"Fire", kobold:"Wind", harpy:"Wind", fae:"Nature", myconid:"Nature", lizardfolk:"Water" })[race] || "None";
  const dex = Math.max(1, 8 + ({goblin:2,specter:2,vampire:1,werewolf:2,golem:-1,zombie:-1,kobold:2,harpy:2,fae:1,myconid:-1,orc:-1,lizardfolk:1})[race] + ({Archer:2,Sharpshooter:2,Assassin:4,"Quick Caster":2,Mage:1,Paladin:-1,Brute:-3})[klass] + (boss?2:0));
  const regionDamageBonus=region.id==="undead"&&race==="skeleton"&&["Sharpshooter","Mage","Quick Caster"].includes(klass)?1.15:1;
  const regionDexBonus=region.id==="warrens"&&race==="goblin"?2:0;
  const easyBossDamageScale=state?.difficulty==="easy"&&boss?0.55:1;
  const typeDefense=klass==="Paladin"?Math.max(1,Math.round((2+floor*0.15)*difficulty.enemyHealth)):0;
  const dodge=Math.min(0.35,(race==="specter"?0.12:race==="kobold"?0.07:0)+(klass==="Assassin"?0.16:klass==="Archer"?0.05:klass==="Sharpshooter"?0.01:0.02));
  const critChance=({Assassin:0.12,Sharpshooter:0.2})[klass]||(race==="werewolf"?0.1:0);
  return { name:enemyName, race, klass, element, dex:dex+regionDexBonus, maxHp: hp, hp, damage: Math.max(1,Math.round(baseDamage * damageScale * regionDamageBonus * (boss ? 1.5 * (milestoneBoss?1.25:1) : 1) * floorEnemyScale(floor, 1.28) * difficulty.enemyDamage * easyBossDamageScale)), damageReduction:race==="golem"?Math.max(1,Math.round((1+floor*0.35)*difficulty.enemyHealth)):typeDefense, dodge, critChance, lifeSteal:race==="vampire"?0.12:0, boss, milestoneBoss, elite: false, gold: Math.round((8 + floor * 2) * (boss ? 5 : 1)), xp: Math.round((50 + floor * 24) * (boss ? (floor * 0.5 + 2) : 1)), damageScaleVersion:2, healthScaleVersion:1 };
}

function assignRunChoice(floor,rooms,random=Math.random){
  if(floor<2||random()>=0.45)return null;
  const candidates=rooms.filter(room=>room.type==="enemy"&&!room.routeChoice&&room.enemyCount>0&&room.enemyCount<4);
  if(!candidates.length)return null;
  const room=candidates[Math.min(candidates.length-1,Math.floor(random()*candidates.length))];
  room.routeChoice=true;
  return room;
}

function assignEnemyFormation(enemies,random=Math.random){
  if(enemies.length<2||random()>=0.45)return false;
  const guardianIndex=enemies.findIndex(enemy=>enemy.klass==="Warrior");
  const protectedIndex=enemies.findIndex((enemy,index)=>index!==guardianIndex&&["Archer","Sharpshooter","Mage","Quick Caster"].includes(enemy.klass));
  if(guardianIndex<0||protectedIndex<0)return false;
  enemies[guardianIndex].formationRole="Vanguard";
  enemies[protectedIndex].protectedByIndex=guardianIndex;
  return true;
}

function bossPattern(name){return BOSS_PATTERNS[name]||[{key:"guard",label:"Brace"},{key:"attack",label:"Heavy Strike",damageMultiplier:1.4},{key:"cast",label:"Burst",damageMultiplier:1.2}];}
function nextBossIntent(enemy){const pattern=bossPattern(enemy.name);const intent=pattern[(enemy.bossTurn||0)%pattern.length];enemy.bossTurn=(enemy.bossTurn||0)+1;return{...intent};}
function enemyTrait(enemy){return ENEMY_TRAITS[enemy?.race]||"No special trait";}

function eliteChanceForFloor(floor) {
  return floor < 5 ? 0 : Math.min(0.3, 0.03 * (floor - 4));
}

function applyEliteAffinities(enemies, floor, random = Math.random) {
  for (const enemy of enemies) {
    if (enemy.boss || random() >= eliteChanceForFloor(floor)) continue;
    enemy.elite = true;
    enemy.affinity = ELITE_AFFINITIES[Math.floor(random() * ELITE_AFFINITIES.length)];
    enemy.affinityEffect = ELITE_EFFECTS[enemy.affinity];
    enemy.raceElement = enemy.element;
    enemy.element = enemy.affinity;
  }
  return enemies;
}

function eliteCrowdReductionChance(floor) {
  return floor < 5 || floor >= 15 ? 0 : 0.5 * (15 - floor) / 10;
}

function compensateEliteCrowd(enemies, floor, random = Math.random) {
  if (enemies.length !== 4 || !enemies.some(enemy => enemy.elite) || random() >= eliteCrowdReductionChance(floor)) return false;
  let removeIndex = enemies.findIndex(enemy => !enemy.elite);
  if (removeIndex < 0) removeIndex = enemies.length - 1;
  enemies.splice(removeIndex, 1);
  return true;
}

function makeRoom(type, x, y, id) {
  return { id, type, x, y, visited: false, cleared: false, searched: false, trapRevealed: false, fountainUsed: false, fountainSaved: false, connections: [] };
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
  assignRunChoice(floor,rooms);
  const region=regionForFloor(floor);
  return { number: floor, regionId:region.id, regionCycle:region.cycle, width, height, rooms, currentId: start.id, bossCleared: false };
}

function newRun(name, devMode = false, saveSlot = "slot1", difficulty = "normal") {
  const playerName=String(name||"").trim();
  if(!playerName||!DIFFICULTIES[difficulty])return;
  clearCombatResolution();
  combatFeedbacks=[];
  enemyHitFlash=false;
  modal=null;
  state = {
    name: playerName, devMode, saveSlot, difficulty, inventoryNotice: false, shopLootUpgradeLevel: 0, floor: 1, level: 1, xp: 0, skillPoints: 0, hp: 100, maxHp: 100,
    mana: 50, maxMana: 50, gold: 0, str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10,
    speed: 10, critChance: 0.05, class: null, chosenClass: null, weapon: null, weapons: [], armor: [], items: [], spells: [], equippedSpellId: null,
    currentFloor: makeFloor(1), combat: null, deaths: 0, floorsCleared: 0, milestonePending:false, runEnded:false, log: [],
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
  indexButton.disabled = false;
  document.querySelector("#leaderboard-button").disabled = false;
  document.querySelector("#settings-button").disabled = false;
  const slots = loadSaveSlots();
  screen.innerHTML = `<div class="title-screen"><div class="title-copy"><p class="eyebrow">A dungeon adventure</p><h2>Every room<br>is a choice.</h2><p>Explore a shifting dungeon, search what you find, and fight your way toward the next floor.</p><button class="secondary-button" data-open-leaderboard>View highest floors</button>${renderPersonalBests()}</div><div class="start-form"><p class="form-kicker">Choose a save slot</p><p class="save-slot-intro">Continue an expedition or start a new run in any slot.</p><div class="save-slots">${SAVE_SLOT_IDS.map(slot=>{const saved=slots[slot];const resumable=isResumableSave(saved);const label=slot==="dev"?"Dev slot":`Slot ${slot.slice(-1)}`;return `<article class="save-slot ${saved?"save-slot-filled":"save-slot-empty"}"><div><strong>${label}</strong><span>${saved&&!resumable?"This save is incomplete or damaged; delete it or start a new run.":escapeHtml(DUNGEON_RULES.describeSaveSlot(slots,slot))}${saved&&resumable?` · ${DIFFICULTIES[saved.difficulty]?.label||"Normal"}`:""}</span></div><div class="save-slot-actions">${resumable?`<button class="small-button continue-button" data-continue-slot="${slot}">Continue</button>`:""}<button class="small-button start-run-button" data-new-slot="${slot}">${saved?"New run":"Start run"}</button>${saved?`<button class="text-button" data-delete-slot="${slot}">Delete</button>`:""}</div></article>`;}).join("")}</div><p class="fine-print">Run saves are stored in this browser. Global leaderboard records are separate; Dev-slot runs do not count.</p></div></div>`;
  screen.querySelector("[data-open-leaderboard]")?.addEventListener("click", () => { modalReturnFocusSelector="[data-open-leaderboard]"; modal = "leaderboard"; showModal(); });
  screen.querySelectorAll("[data-new-slot]").forEach(button=>button.addEventListener("click",()=>{
    const slot=button.dataset.newSlot;const slotLabel=slot==="dev"?"dev":slot.slice(-1);const existing=slots[slot];
    if(existing&&!window.confirm(`Start a new run in ${slotLabel==="dev"?"the dev slot":`slot ${slotLabel}`}? This will replace ${DUNGEON_RULES.describeSaveSlot(slots,slot)}.`))return;
    pendingNewRunSlot=slot;
    modalReturnFocusSelector=`[data-new-slot="${slot}"]`;
    modal="new-run";
    showModal();
  }));
  screen.querySelectorAll("[data-continue-slot]").forEach(button=>button.addEventListener("click",()=>{const saved=slots[button.dataset.continueSlot];if(!isResumableSave(saved)){startScreen();return;}state=saved;state.saveSlot=button.dataset.continueSlot;state.runStats ||= {enemiesDefeated:0,damageDealt:0,damageTaken:0,fights:[]};if(state.leaderboardSubmitted&&state.runSubmissionStatus?.startsWith("Submitting final score")){state.leaderboardSubmitted=false;state.runSubmissionStatus="Global submission status is unknown: the previous request did not return before this run was reopened. You can retry the score submission.";}modal=state.runEnded?"run-end":state.milestonePending?"milestone":state.hp<=0?"death":null;render();}));
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

function regionRaceNames(region=regionForFloor(state?.floor||1)){
  const raceNames={slime:"Slimes",skeleton:"Skeletons",goblin:"Goblins",zombie:"Zombies",specter:"Specters",vampire:"Vampires",werewolf:"Werewolves",golem:"Golems",orc:"Orcs",kobold:"Kobolds",harpy:"Harpies",fae:"Fae",myconid:"Myconids",lizardfolk:"Lizardfolk"};
  return region.races.map(race=>raceNames[race]||race).join(" · ");
}

function regionRaceRoles(region){
  return region.races.map(race=>{
    const variants=roomNames[race]||[];
    const roles=[...new Set(variants.map(variant=>variant[1]))];
    return `${race[0].toUpperCase()+race.slice(1)}: ${roles.join(", ")}`;
  }).join(" · ");
}

function renderRegionBriefing(region=regionForFloor(state.floor)){
  return `<aside class="region-briefing region-${escapeHtml(region.id)}" aria-label="Current region briefing"><img class="region-background-art" src="Images/Floors/${escapeHtml(region.folder)}/environment-background.png" alt="" aria-hidden="true"><img class="region-details-overlay" src="Images/Floors/${escapeHtml(region.folder)}/environment-overlay.png" alt="" aria-hidden="true"><img class="region-emblem" src="Images/UI/Regions/${escapeHtml(region.id)}-emblem.png" alt="" aria-hidden="true"><div class="region-briefing-copy"><p class="section-kicker">Region ${region.cycle} · Floors ${region.regionStart}–${region.regionEnd}</p><h3>${escapeHtml(region.name)}</h3><p><strong>Known enemies:</strong> ${escapeHtml(regionRaceNames(region))}</p><p><strong>Regional rule:</strong> ${escapeHtml(region.rule)}</p></div></aside>`;
}

function renderMap() {
  const floor = state.currentFloor;
  const region=regionForFloor(state.floor);
  const byCoord = new Map(floor.rooms.map(room => [`${room.x},${room.y}`, room]));
  const byId = new Map(floor.rooms.map(room => [room.id, room]));
  const available = new Set(getConnected().map(({room}) => room.id));
  const directions = ["north", "east", "south", "west"];
  const connectionsFor = room => {
    const recorded = Array.isArray(room.connections) ? room.connections.filter(connection => byId.has(connection.id)) : [];
    if (recorded.length) return recorded;
    const offsets = { north:[0,-1], east:[1,0], south:[0,1], west:[-1,0] };
    return directions.flatMap(direction => {
      const [dx,dy] = offsets[direction];
      const neighbor = byCoord.get(`${room.x+dx},${room.y+dy}`);
      return neighbor ? [{id:neighbor.id,direction}] : [];
    });
  };
  let html = `<div class="map-area"><img class="region-map-overlay" src="Images/Floors/${escapeHtml(region.folder)}/map-overlay.png" alt="" aria-hidden="true"><div class="map-grid" role="group" aria-label="Floor map. Highlighted rooms are reachable from your current location.">`;
  for (let y=0; y<7; y++) for (let x=0; x<7; x++) {
    const room = byCoord.get(`${x},${y}`);
    if (!room) html += `<span class="map-cell void" aria-hidden="true"></span>`;
    else {
      const current = room.id === floor.currentId;
      const revealed = room.visited || current;
      const title = revealed ? ROOM_LABELS[room.type] : "Unexplored room";
      const isAvailable = available.has(room.id);
      const connectors = (room.visited || current) ? connectionsFor(room).map(connection => `<i class="map-link map-link-${escapeHtml(connection.direction)}" aria-hidden="true"></i>`).join("") : "";
    const classes = ["map-cell",`room-${slug(room.type)}`,revealed?"visited":"unvisited",current?"current":"",isAvailable?"available":"",revealed&&room.type==="boss"?"boss-cell":""].filter(Boolean).join(" ");
      const art = revealed ? `<img class="room-tile-art" src="${mapRoomImage(room)}" alt="" aria-hidden="true">` : "";
      const marker = current ? `<img class="player-marker" src="Images/player.png" alt="" aria-hidden="true">` : "";
      if (current) html += `<span class="${classes}" aria-current="location" aria-label="Current room: ${escapeHtml(title)}" title="You are here · ${escapeHtml(title)}">${connectors}${art}${marker}</span>`;
      else if (isAvailable) html += `<button class="${classes}" data-move="${escapeHtml(room.id)}" aria-label="Move to ${escapeHtml(title)}" title="Reachable · ${escapeHtml(title)}">${connectors}${art}</button>`;
      else html += `<span class="${classes}" aria-label="${escapeHtml(title)}" title="${escapeHtml(title)}">${connectors}${art}</span>`;
    }
  }
  return html + `</div><div class="map-legend"><span><i class="legend-marker player-key"></i>You</span><span><i class="legend-marker route-key"></i>Reachable</span><span><i class="legend-marker room-key"></i>Visited</span><span><i class="legend-marker fog-key"></i>Unexplored</span></div></div>`;
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
    "The Mountain Heart": "mountain-heart", "The Bone Necromancer": "bone-necromancer", "The Ashen Twin": "ashen-twin", "The Hollow Twin": "hollow-twin",
    "The Orc Warchief": "orc-warchief", "The Lizard Matriarch": "lizard-matriarch", "The Kobold Skyking": "kobold-skyking",
    "The Harpy Tempest": "harpy-tempest", "The Fae Queen": "fae-queen", "The Mycelium Heart": "mycelium-heart"
  };
  const regularFile = enemy.summoned ? "summoned-skeleton.svg" : `${slug(enemy.race || enemy.name)}-${slug(enemy.klass || "warrior")}.svg`;
  const file = enemy.boss ? `${enemy.name===MILESTONE_BOSS_NAME?"floor-20-milestone-boss":bossArt[enemy.name] || slug(enemy.name)}.svg` : regularFile;
  const folder = enemy.boss ? "Bosses" : "Races";
  const portraitLabel=enemy.boss?"Boss":enemy.race?enemy.race[0].toUpperCase()+enemy.race.slice(1):enemy.klass;
  return `<div class="item-art enemy-portrait"><img src="Images/Enemies/${folder}/${escapeHtml(file)}" alt="${escapeHtml(enemy.name)}"><span><b>${escapeHtml(portraitLabel)}</b><small>${escapeHtml(enemy.klass)}</small></span></div>`;
}

function potionArt(item) {
  const mana=item.type==="mana"||/mana/i.test(item.name);
  const rarity=(item.rarity||"common").toLowerCase();
  const type=mana?"mana":"health";
  const file = ["mythic","divine"].includes(rarity) ? `${rarity}-${type}-potion.svg` : mana ? "mana-potion.png" : "small-health-potion.png";
  return `<div class="item-art potion-art potion-${rarity}"><img src="Images/Items/Potions/${file}" alt="${escapeHtml(item.name)}"><span>${escapeHtml(item.name)}</span></div>`;
}

function elementBadge(element) {
  const label=element && element!=="None" ? element : "Physical";
  const file=slug(label);
  return `<span class="element-badge element-${file}"><img src="Images/UI/Elements/${file}.svg" alt="" aria-hidden="true"><span>${escapeHtml(label)}</span></span>`;
}

function bindArtFallbacks(root = screen) {
  root.querySelectorAll(".room-tile-art").forEach(img => {
    img.addEventListener("error", () => { img.hidden = true; }, { once: true });
    if (img.complete && img.naturalWidth === 0) img.hidden = true;
  });
  root.querySelectorAll(".region-background-art,.region-details-overlay,.region-emblem,.region-map-overlay").forEach(img=>{
    img.addEventListener("error",()=>{img.hidden=true;},{once:true});
    if(img.complete&&img.naturalWidth===0)img.hidden=true;
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
  const offClass=Boolean(state.chosenClass && family!==state.chosenClass);
  const equippedLabel = equipped ? `<span class="equipped-tag">Equipped</span>` : `<button class="small-button" data-equip-weapon="${index}">Equip</button>`;
  const ammo = ["Bow","Crossbow"].includes(weapon.type) ? ` · ${state.arrows ?? 0} shared arrows` : "";
  return `<article class="inventory-item ${rarityClass(weapon.rarity)}">${weaponArt(weapon)}<div class="item-copy"><span class="item-meta">${escapeHtml(weapon.rarity)} ${escapeHtml(weapon.type)} · ${elementBadge(weapon.element)}</span><strong>${escapeHtml(weapon.name)}</strong><span class="item-stats">${weapon.damage+(weapon.damageUpgrade||0)} weapon damage · ${Math.round(((weapon.crit||0)+(weapon.critUpgrade||0))*100)}% weapon crit${ammo}${weapon.level>1?` · Lv ${weapon.level}`:""}${offClass?" · Off-class damage: 75%":""}</span></div><div class="inventory-item-actions">${equippedLabel}<button class="small-button" data-inventory-sell="weapon" data-sell-index="${index}" ${equipped?"disabled title=\"Equip another weapon before selling this one\"":""}>Sell · ${sellValue(weapon,"weapon")}g</button></div></article>`;
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
  return `<button class="inventory-button" data-open-inventory type="button" ${combatResolution?"disabled":""}>Inventory ${state.inventoryNotice?'<span class="inventory-notice" aria-label="New equipment">!</span>':""}</button>`;
}
function combatActionIcon(kind) {
  const icons = {
    weapon:'<path d="m5 19 10-10m-2-2 2-2 4 4-2 2M4 20l3-1-2-2-1 3Z"/><path d="m9 15 2 2"/>',
    heavy:'<path d="m5 19 10-10m-2-2 2-2 4 4-2 2M4 20l3-1-2-2-1 3Z"/><path d="M17 2v3m4-1-2 2m2 2h-3"/>',
    ranged:'<path d="M5 3c8 3 8 15 0 18M5 3l14 9-14 9M19 12h3"/>',
    magic:'<path d="m5 19 9-9m-2-2 2-2 4 4-2 2M4 20l3-1-2-2-1 3Z"/><path d="m18 3 .6 1.6L20 5l-1.4.5L18 7l-.6-1.5L16 5l1.4-.4L18 3Z"/>',
    area:'<circle cx="12" cy="12" r="2"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3M4.9 4.9 7 7m10 10 2.1 2.1m0-14.2L17 7M7 17l-2.1 2.1"/>',
    control:'<path d="M4 5h16v11h-8l-5 4v-4H4z"/><path d="M8 9h8m-8 3h5"/>',
    defense:'<path d="M12 2 20 5v6c0 5-3 8-8 11-5-3-8-6-8-11V5l8-3Z"/><path d="m8 12 3 3 5-6"/>',
    health:'<path d="M20.8 8.5c0 5-8.8 11-8.8 11s-8.8-6-8.8-11a4.6 4.6 0 0 1 8.8-1.7 4.6 4.6 0 0 1 8.8 1.7Z"/><path d="M12 9v6m-3-3h6"/>',
    mana:'<path d="M12 2S5 10 5 15a7 7 0 0 0 14 0c0-5-7-13-7-13Z"/><path d="M9 14h6m-3-3v6"/>',
    escape:'<path d="M4 20V4h10v16M14 12h7m-3-3 3 3-3 3"/><circle cx="10" cy="12" r=".8" fill="currentColor" stroke="none"/>'
  };
  return `<svg class="action-glyph" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[kind]||icons.weapon}</svg>`;
}
function combatActionButton(label, hint, {kind="weapon", attribute="attack", command="basic", className="", disabled=false, title=""}={}) {
  const locked=Boolean(combatResolution);
  return `<button class="action-button ${className}" data-${attribute}="${escapeHtml(command)}" ${disabled||locked?`disabled${title?` title="${escapeHtml(title)}"`:""}`:""}><span class="action-icon">${combatActionIcon(kind)}</span><span class="action-copy"><strong>${escapeHtml(label)}</strong><small>${escapeHtml(hint)}</small></span></button>`;
}
function attackButtonSummary(attack,preview,resource="Ready"){
  const damage=attack.spell?0:Math.max(0,Math.round((preview.rawPrimaryDamage||0)*(preview.elementMultiplier||1)));
  const effect=attack.selfEffect||attack.effect;
  const duration=attack.duration||DUNGEON_RULES.getEffectDefinition(effect)?.duration;
  return [attack.spell?"Effect spell":`${damage} damage`,effect?`${effect}${duration?` · ${duration}t`:""}`:null,attack.aoe?"All foes":null,resource].filter(Boolean).join(" · ");
}
function getActions() {
  if(state.runEnded)return `<p class="prompt-note">This run has ended. Return to the title to start another run.</p>`;
  const room = currentRoom();
  if (state.combat) {
    const weapon = state.weapon;
    const weaponClass=weaponFamily(weapon);
    const usesMana=DUNGEON_RULES.weaponUsesMana(weapon,state.class);
    const freeMageBasic=state.class==="mage";
    const spellBlocked = usesMana && state.equippedArmor?.shield;
    const noArrows=["Bow","Crossbow"].includes(weapon?.type)&&state.arrows<(weapon?.effect==="Overdraw"?2:1);
    const basicFallback = spellBlocked ? "shield" : (usesMana&&!freeMageBasic?DUNGEON_RULES.basicAttackFallback(state.class,weapon?.type,state.mana,state.arrows,(weapon?.manaCost||5)+(weapon?.effect==="Overcast"?2:0)):null)||(noArrows?"arrows":null);
    const basicLabel = weaponClass === "mage" ? "Basic spell" : weaponClass === "archer" ? "Basic shot" : "Basic attack";
    const arrowsOut = ["Bow", "Crossbow"].includes(weapon?.type) && state.arrows < (weapon?.effect==="Overdraw"?2:1) && !basicFallback;
    const manaCost = freeMageBasic?0:usesMana?(weapon?.manaCost||5)+(weapon?.effect==="Overcast"?2:0):0;
    const equippedSpell=state.spells?.find(spell=>spell.id===state.equippedSpellId);
    const actionHint=(cooldown, manaCost, ammoCost, blocked=false)=>cooldown?`Cooldown · ${cooldown}t`:blocked?"Blocked by shield":state.mana<manaCost?`Need ${manaCost} mana`:state.arrows<ammoCost?"Need arrows":manaCost?`Ready · ${manaCost} mana`:ammoCost?`Ready · ${ammoCost} arrow${ammoCost===1?"":"s"}`:"Ready";
    const specials = [...(weapon?.attacks || []), ...(equippedSpell?[classSpellAttack(equippedSpell)]:[])].map(attack => {
      const cooldown = DUNGEON_RULES.isAttackOnCooldown(state.attackCooldowns,attack.command) ? state.attackCooldowns[attack.command] : 0;
      const preview = attackPreview(attack);
      const disabled = cooldown > 0 || (!attack.spell && usesMana && spellBlocked) || state.mana < preview.manaCost || (preview.ammoCost > 0 && state.arrows < preview.ammoCost);
      const statusHint=actionHint(cooldown,preview.manaCost,preview.ammoCost,!attack.spell&&usesMana&&spellBlocked);
      const percentCost=attack.spell&&attack.manaPercent?`${Math.round(attack.manaPercent*(attack.offClass?1.5:1)*100)}% mana · ${preview.manaCost}`:null;
      const hint=percentCost?`${statusHint} · ${percentCost}`:statusHint;
      const kind=attack.spell?"magic":attack.aoe?"area":["Bow","Crossbow"].includes(weapon?.type)?"ranged":"weapon";
      return combatActionButton(attack.name,attackButtonSummary(attack,preview,hint),{kind,command:attack.command,className:"special-action",disabled,title:disabled?hint:""});
    }).join("");
    const selectedEnemy=state.combat.enemies[state.target];
    const disruptable=DUNGEON_RULES.hasDisruptibleIntent(selectedEnemy);
    const disruptCooldown=state.disruptCooldown||0;
    const defense=classDefenseOption();
    const defenseCooldown=defense?(state.defenseCooldowns?.[defense.action]||0):0;
    const defenseHint=!defense?"":defenseCooldown?`Cooldown · ${defenseCooldown}t`:defense.action==="aegis"&&state.equippedArmor?.shield?"Blocked by shield":defense.action==="aegis"&&state.mana<8?"Need 8 mana":"Ready";
    const defenseAction=defense?combatActionButton(defense.label,defenseHint,{kind:"defense",command:defense.action,className:"action-defense",disabled:defense.disabled,title:defenseHint}):"";
    const disruptAction=disruptable?combatActionButton("Disrupt",disruptCooldown?`Cooldown · ${disruptCooldown}t`:"Cancel intent",{kind:"control",command:"disrupt",className:"action-control",disabled:!DUNGEON_RULES.canDisrupt(selectedEnemy,disruptCooldown),title:"Cancel the telegraphed action"}):"";
    const basicDisabled=(usesMana&&!freeMageBasic&&state.mana<manaCost&&!basicFallback)||arrowsOut;
    const basicFallbackName=usesMana?"Staff strike":"Unarmed jab";
    const basicResource=basicFallback?"Reduced damage":basicDisabled?(arrowsOut?"Need arrows":`Need ${manaCost} mana`):freeMageBasic?"Free · +5 mana on hit":["Bow","Crossbow"].includes(weapon?.type)?`Ready · 1 arrow · ${state.arrows||0} left`:"Ready";
    const cannotFlee=state.combat.boss;
    const healthCount=state.items.filter(item=>item.type==="health"&&item.quantity>0).reduce((sum,item)=>sum+item.quantity,0);
    const manaCount=state.items.filter(item=>item.type==="mana"&&item.quantity>0).reduce((sum,item)=>sum+item.quantity,0);
    const basicKind=weaponClass==="mage"?"magic":weaponClass==="archer"?"ranged":"weapon";
    const basicAttack={name:basicFallback?basicFallbackName:basicLabel,multiplier:basicFallback?0.5:1,critBonus:0,effect:weapon?.effect}; const basicPreview=attackPreview(basicAttack,1,state.combat.enemies[state.target]); const basicHint=attackButtonSummary(basicAttack,basicPreview,basicResource); const heavyAttack={name:"Heavy attack",multiplier:1.5,critBonus:0.1,cooldown:2}; const heavyPreview=attackPreview(heavyAttack,1,state.combat.enemies[state.target]);
    return `<div class="action-grid">${combatActionButton(basicFallback?basicFallbackName:basicLabel,basicHint,{kind:basicKind,command:"basic",className:"action-primary",disabled:basicDisabled,title:basicResource})}${state.class==="warrior"?combatActionButton("Heavy attack",attackButtonSummary(heavyAttack,heavyPreview,state.cooldown?`Cooldown · ${state.cooldown}t`:"Ready"),{kind:"heavy",command:"heavy",className:"action-heavy",disabled:state.cooldown>0,title:"A stronger melee attack; 2-turn cooldown"}):""}${specials}${disruptAction}${defenseAction}${combatActionButton("Health potion",healthCount?`×${healthCount} available`:"None available",{kind:"health",attribute:"action",command:"heal",className:"action-item",disabled:!healthCount})}${combatActionButton("Mana potion",manaCount?`×${manaCount} available`:"None available",{kind:"mana",attribute:"action",command:"mana",className:"action-mana",disabled:!manaCount})}${combatActionButton(cannotFlee?"Flee unavailable":"Flee",cannotFlee?"Boss fight":"40% chance",{kind:"escape",attribute:"action",command:"flee",className:"action-escape",disabled:cannotFlee,title:cannotFlee?"Fleeing is unavailable during a boss fight":""})}</div>`;
  }
  if (room.type === "boss" && room.cleared) {
    if(state.milestonePending)return `<p class="prompt-note">The milestone decision is open. Choose whether to end the run or continue.</p>`;
    return `<p class="prompt-note">The chamber falls quiet. The stair to the next floor is open.</p><div class="action-grid"><button class="action-button" data-next-floor>Descend to floor ${state.floor + 1}</button></div>`;
  }
  if(room.type==="enemy"&&room.routeChoice&&!room.routeChoiceMade)return `<p class="prompt-note">Two routes split through this chamber. One is quiet with a small reward; the other leads to a tougher fight with better loot.</p><div class="action-grid"><button class="action-button" data-action="route-safe">Take the safe route<small>Leave without a fight · small gold reward</small></button><button class="action-button" data-action="route-risky">Take the challenge<small>More enemies · tougher fight · guaranteed loot</small></button></div>`;
  if (room.type === "start") return `<div class="action-grid"><button class="action-button" data-action="inspect-desk">Inspect the desk</button><button class="action-button" data-action="inspect-closet">Inspect the closet</button></div>${state.starter.classOffer && !state.class ? `<div class="class-choice"><p>The desk holds three forgotten weapons. Choose one.</p><div class="action-grid"><button class="action-button" data-class="warrior">Warrior · Sword</button><button class="action-button" data-class="archer">Archer · Bow</button><button class="action-button" data-class="mage">Mage · Staff</button></div></div>` : ""}`;
  if (room.type === "treasure" || room.type === "trap" || room.type === "weapon") return `<div class="action-grid"><button class="action-button" data-action="inspect-chest">Inspect chest</button><button class="action-button secondary" data-action="inspect-floor">Inspect floor</button></div>`;
  if (room.type === "fountain") return room.fountainUsed
    ? `<p class="prompt-note">The fountain has dried up. Keep moving.</p><div class="action-grid"><button class="action-button" disabled>Fountain dried up</button></div>`
    : `<p class="prompt-note">${room.fountainSaved ? "The untouched fountain is still here when you need it." : "A clear fountain offers a chance to recover."}</p><div class="action-grid"><button class="action-button" data-action="drink-fountain">Drink from fountain</button><button class="action-button secondary" data-action="save-fountain">Save for later</button></div>`;
  if (room.type === "shop") return `<div class="action-grid"><button class="action-button" data-action="shop">Browse shop</button></div>`;
  if (room.type === "boss") return `<p class="prompt-note">A heavy presence presses from beyond the sealed doorway.</p><div class="action-grid"><button class="action-button boss-action" data-action="enter-boss">Enter boss chamber</button></div>`;
  return `<p class="prompt-note">Nothing here asks for your attention.</p>`;
}

function effectiveStat(key) {
  return DUNGEON_RULES.effectiveStat(state[key], key, state.chosenClass || state.class);
}

function previewModifiers(preview){
  const target=state.combat?.enemies[state.target];
  const notes=[];
  if(target?.protectedByIndex!==undefined&&state.combat?.enemies[target.protectedByIndex]?.hp>0)notes.push("intercepted by vanguard");
  if(target?.damageReduction)notes.push(`vs defense ${target.damageReduction}`);
  if(target?.intent?.key==="guard")notes.push("Guard");
  if(target?.intent?.key==="ward")notes.push("Ward");
  return notes.length?` · ${notes.join(" · ")}`:"";
}

function statValueLabel(stat) {
  if(stat.key==="critChance")return `${Math.round(state.critChance*100)}%`;
  const effective=Math.round(effectiveStat(stat.key)*10)/10;
  return `${effective} effective · ${state[stat.key]} raw`;
}

function statDescription(stat) {
  const synergy=DUNGEON_RULES.statSynergy(stat.key,state.chosenClass||state.class);
  const classNote=synergy>1?` ${CLASS_NAMES[state.chosenClass||state.class]} synergy: +${Math.round((synergy-1)*100)}% benefit.`:"";
  const cost=DUNGEON_RULES.skillPointCost(state,stat.key);
  return `${stat.description}${classNote} Next upgrade costs ${cost} skill point${cost===1?"":"s"}.`;
}

function enemyIncomingDamage(enemy) {
  const scale = enemy.intent?.damageMultiplier || (enemy.intent?.key === "cast" ? 1.15 : enemy.intent?.key === "shoot" ? 0.9 : enemy.intent?.key === "heavy" ? 1.25 : 1);
  const raw = Math.round(enemy.damage * scale);
  const reduction = DUNGEON_RULES.armorDamageReduction(state.equippedArmor || {}, state.class);
  return Math.max(1, Math.round(raw * (1 - reduction)));
}

function healthPotionRestore(item) {
  const percent = HEALTH_POTION_PERCENT[item.rarity] || HEALTH_POTION_PERCENT.Common;
  return Math.ceil(state.maxHp * percent / 100);
}

function manaPotionRestore(item) {
  const percent = MANA_POTION_PERCENT[item.rarity] || MANA_POTION_PERCENT.Common;
  return Math.ceil(state.maxMana * percent / 100) + Math.max(0,effectiveStat("wis")-10);
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

function renderLog() { return `<section class="context-box" aria-label="Recent events"><div class="context-heading">Recent events <span>Expedition log</span></div><div class="context-output" role="log" aria-live="polite">${state.log.map((entry,index) => `<p class="${escapeHtml(entry.tone || "")} ${index===0?"latest":""}">${escapeHtml(entry.text)}</p>`).join("")}</div></section>`; }

function renderEncounterResult(room) {
  const latest=state.log?.[0]?.text||"";
  const reward=latest.match(/^Victory\. \+(\d+) gold and \+(\d+) XP\./);
  if(!room?.cleared||room.type!=="enemy"||!reward)return "";
  const leveled=latest.includes("You leveled up!");
  return `<aside class="encounter-result ${leveled?"level-up":""}" role="status"><span class="result-stamp">Victory</span><strong>+${reward[1]} gold <i>·</i> +${reward[2]} XP</strong>${leveled?`<span class="level-up-note">Level up · ${state.skillPoints} skill point${state.skillPoints===1?"":"s"} to spend</span>`:""}<small>Loot details are in the expedition log.</small></aside>`;
}

function renderPlayerIdentity() {
  const kind=state.class==="mage"?"magic":state.class==="archer"?"ranged":"weapon";
  return `<div class="player-identity"><span class="player-role-mark">${combatActionIcon(kind)}</span><div><span class="section-kicker">Your character</span><strong>${escapeHtml(state.name||"Adventurer")}</strong><small>${escapeHtml(CLASS_NAMES[state.class]||"Adventurer")}${state.weapon?` · ${escapeHtml(state.weapon.name)}`:""}</small></div></div>`;
}

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

function captureUiVitals() {
  return {
    inCombat: Boolean(state?.combat),
    enemies: Array.from(screen.querySelectorAll(".enemy-card[data-enemy-index]")).map(card => ({ index: Number(card.dataset.enemyIndex), name: card.dataset.enemyName || "", hp: Number(card.dataset.hp), effects: card.dataset.effects || "" })),
    health: Number(screen.querySelector('[data-resource="health"]')?.dataset.value),
    mana: Number(screen.querySelector('[data-resource="mana"]')?.dataset.value),
    log: Array.from(screen.querySelectorAll(".context-output p")).map(entry => entry.textContent || "")
  };
}

function appendImpact(element, text, className) {
  if (!element || typeof document.createElement !== "function") return;
  const impact = document.createElement("span");
  impact.className = `impact-number ${className}`;
  impact.setAttribute("aria-hidden", "true");
  impact.textContent = text;
  element.appendChild(impact);
}

function applyUiFeedback(previous) {
  if (!previous?.inCombat || !state?.combat) { pendingCombatAction = null; return; }
  const recentEvents = (state.log || []).filter(entry => !previous.log.includes(entry.text)).slice(0, 8);
  const critical = recentEvents.some(entry => /hits .* critically|uses .* critically|strikes .* critically/i.test(entry.text));
  const action = pendingCombatAction || "attack";
  const spellAction = (state.spells || []).some(spell => spell.command === action) || (state.weapon?.attacks || []).some(attack => attack.command === action && attack.spell);
  for (const card of screen.querySelectorAll(".enemy-card[data-enemy-index]")) {
    const old = previous.enemies.find(enemy => enemy.index === Number(card.dataset.enemyIndex));
    const current = Number(card.dataset.hp);
    if (!old) continue;
    if (Number.isFinite(old.hp) && Number.isFinite(current) && current < old.hp) {
      const amount = old.hp - current;
      card.classList.add("impact", action === "heavy" ? "impact-heavy" : spellAction ? "impact-magic" : "impact-weapon");
      const enemyCritical = recentEvents.some(entry => entry.text.includes(old.name) && /critically/i.test(entry.text));
      appendImpact(card, enemyCritical ? `CRIT −${amount}` : `−${amount}`, `impact-damage ${enemyCritical ? "is-critical" : ""}`);
    }
    if (old.effects !== (card.dataset.effects || "")) card.querySelector(".status-list")?.classList.add("status-updated");
  }
  const hpRow = screen.querySelector('[data-resource="health"]');
  const manaRow = screen.querySelector('[data-resource="mana"]');
  const nowHealth = Number(hpRow?.dataset.value);
  const nowMana = Number(manaRow?.dataset.value);
  if (hpRow && Number.isFinite(previous.health) && Number.isFinite(nowHealth) && nowHealth !== previous.health) {
    const amount = Math.abs(nowHealth - previous.health);
    const gain = nowHealth > previous.health;
    hpRow.classList.add(gain ? "resource-gain" : "resource-loss");
    appendImpact(hpRow, `${gain ? "+" : "−"}${amount}`, gain ? "impact-heal" : "impact-damage");
  }
  if (manaRow && Number.isFinite(previous.mana) && Number.isFinite(nowMana) && nowMana !== previous.mana) {
    const amount = Math.abs(nowMana - previous.mana);
    const gain = nowMana > previous.mana;
    manaRow.classList.add(gain ? "resource-gain" : "resource-loss");
    appendImpact(manaRow, `${gain ? "+" : "−"}${amount}`, "impact-mana");
  }
  const avoidance = recentEvents.find(entry => /evade|dodges the attack|misses|disrupted|frozen solid|silenced and cannot/i.test(entry.text));
  if (avoidance) {
    const target = screen.querySelectorAll(".enemy-card[data-enemy-index]");
    const namedEnemy = Array.from(target).find(card => avoidance.text.includes(card.dataset.enemyName || ""));
    if (namedEnemy && /dodges the attack|reads your movement|misses/i.test(avoidance.text)) {
      namedEnemy.classList.add("enemy-evaded");
      if(!combatFeedbacks.some(item=>item.kind==="miss"&&item.targetIndex===Number(namedEnemy.dataset.enemyIndex)))appendImpact(namedEnemy, "EVADE", "impact-evade");
    } else if (/You evade/i.test(avoidance.text)) {
      hpRow?.classList.add("resource-evade");
      appendImpact(hpRow, "EVADE", "impact-evade");
    } else if (namedEnemy) {
      namedEnemy.classList.add("enemy-interrupted");
      appendImpact(namedEnemy, "STOPPED", "impact-block");
    }
  }
  const blocked = recentEvents.find(entry => /shield absorbs|Aegis absorbs|You brace behind your shield/i.test(entry.text));
  if (blocked) {
    hpRow?.classList.add("resource-block");
    appendImpact(hpRow, "BLOCK", "impact-block");
  }
  pendingCombatAction = null;
}

function render(persistRun = true) {
  if (!state) return startScreen();
  const previousVitals = captureUiVitals();
  const modalView=captureModalView();
  migrateBrowserSave();
  ensureSkillStats();
  state.runStats ||= {enemiesDefeated:0,damageDealt:0,damageTaken:0,fights:[]};
  state.milestonePending=Boolean(state.milestonePending);
  state.runEnded=Boolean(state.runEnded);
  if(state.runEnded)modal="run-end";
  else if(state.milestonePending&&!modal)modal="milestone";
  if(!modal)lastFocusedModalName=null;
  const region=regionForFloor(state.floor);
  titleButton.hidden = false;
  indexButton.hidden = modal === "death";
  indexButton.disabled=Boolean(combatResolution);
  document.querySelector("#leaderboard-button").disabled=Boolean(combatResolution);
  document.querySelector("#settings-button").disabled=Boolean(combatResolution);
  const room = currentRoom();
  const aliveEnemies = state.combat?.enemies.map((enemy, index) => ({ enemy, index })).filter(item => item.enemy.hp > 0) || [];
  screen.innerHTML = `<div class="run-topline"><span>Floor ${state.floor} · ${escapeHtml(region.name)}</span><span>${escapeHtml(state.name)}</span><span>${DIFFICULTIES[state.difficulty]?.label||"Normal"} · Level ${state.level}${state.skillPoints ? ` · ${state.skillPoints} skill point${state.skillPoints === 1 ? "" : "s"}` : ""}</span><div class="run-shortcuts"><button class="small-button" data-open-recap>Run record</button><button class="small-button" data-open-leaderboard>Leaderboard</button><button class="small-button" data-end-run ${state.floorsCleared<1||state.runEnded?"disabled":""}>End run</button></div></div>${renderEnemyHitFlash()}
    <div class="game-layout">
      <aside class="player-panel">
        ${state.combat?renderPlayerIdentity():""}
        <div class="player-stats">
          <div class="stat-row" data-resource="health" data-value="${state.hp}"><div class="stat-label"><span>Health</span><b>${state.hp} / ${state.maxHp}</b></div><div class="meter"><i class="hp-fill" style="width:${Math.max(0,state.hp/state.maxHp*100)}%"></i></div></div>
          <div class="stat-row" data-resource="mana" data-value="${state.mana}"><div class="stat-label"><span>Mana</span><b>${state.mana} / ${state.maxMana}</b></div><div class="meter"><i class="mana-fill" style="width:${Math.max(0,state.mana/state.maxMana*100)}%"></i></div></div>
          <div class="resource-line"><span class="xp-color">XP ${state.xp} / ${xpToNext()}<i class="xp-meter"><b style="width:${Math.min(100,state.xp/xpToNext()*100)}%"></b></i></span><span class="gold-color">${state.gold} <small>gold</small></span></div>
        </div>
        ${state.weapon ? `<div class="equipped-weapon">${weaponArt(state.weapon,true)}<div><span class="item-meta">${escapeHtml(state.class)} · ${escapeHtml(state.weapon.rarity)} ${escapeHtml(state.weapon.type)}</span><strong>${escapeHtml(state.weapon.name)}</strong><span>${state.weapon.damage+(state.weapon.damageUpgrade||0)} damage · ${elementBadge(state.weapon.element)}</span>${["Bow","Crossbow"].includes(state.weapon.type) ? `<span>${state.arrows ?? 0} arrows</span>` : ""}</div></div>` : `<p class="no-weapon">No weapon equipped</p>`}
        <div class="equipped-armor">${["head","chest","legs","feet","shield"].map(slot=>`<span>${slot}: ${state.equippedArmor[slot]?escapeHtml(state.equippedArmor[slot].name):"empty"}</span>`).join("")}<span class="armor-bonus">${armorSummaryText()}</span></div>
        ${renderLog()}
      </aside>
      <section class="play-panel">${renderRegionBriefing(region)}${state.combat ? renderCombat(aliveEnemies) : renderRoomView(room)}</section>
    </div>`;
  if(combatResolution){
    screen.querySelectorAll("[data-target]").forEach(button=>button.disabled=true);
    if(Number.isInteger(combatResolution.enemyIndex))screen.querySelectorAll(".enemy-card[data-enemy-index]")[combatResolution.enemyIndex]?.classList.add("resolving-enemy");
  }
  applyUiFeedback(previousVitals);
  screen.querySelector("[data-open-leaderboard]")?.addEventListener("click", () => { modalReturnFocusSelector="[data-open-leaderboard]"; modal = "leaderboard"; showModal(); });
  screen.querySelector("[data-end-run]")?.addEventListener("click",endRunEarly);
  bindGameActions();
  bindArtFallbacks();
  if (modal) showModal();
  restoreModalView(modalView);
  if(persistRun)save();
}

function renderRoomView(room) {
  return `${renderEncounterResult(room)}<div class="exploration-layout"><div class="room-heading"><div><p class="section-kicker">Floor ${state.floor} · ${room.type === "start" ? "Beginning" : "Room"}</p><h2>${escapeHtml(room.visited ? (room.type === "trap" && !room.trapRevealed ? "Treasure Room" : ROOM_LABELS[room.type]) : "Unknown Room")}</h2></div><span class="room-index">${room.x+1}.${room.y+1}</span></div>${renderMap()}${renderMovement()}<div class="room-actions"><h3>Actions</h3>${getActions()}</div></div>`;
}

function updateCombatResolutionPresentation() {
  const view=screen.querySelector(".combat-view");
  if(!view||!combatResolution)return false;
  view.className=`combat-view combat-resolving stage-${combatResolution.phase}`;
  const indicator=view.querySelector(".turn-indicator");
  if(indicator)indicator.textContent=combatResolutionLabel();
  const heading=view.querySelector(".room-actions h3");
  if(heading)heading.textContent="Resolving turn";
  view.querySelectorAll("button").forEach(button=>{button.disabled=true;});
  document.querySelector("#index-button").disabled=true;
  document.querySelector("#leaderboard-button").disabled=true;
  document.querySelector("#settings-button").disabled=true;
  view.querySelectorAll(".enemy-card.resolving-enemy").forEach(card=>card.classList.remove("resolving-enemy"));
  if(Number.isInteger(combatResolution.enemyIndex))view.querySelectorAll(".enemy-card[data-enemy-index]")[combatResolution.enemyIndex]?.classList.add("resolving-enemy");
  fadeDefeatedEnemyCards();
  view.querySelectorAll(".player-attack-vfx").forEach(effect=>effect.remove());
  if(["player-windup","player-impact"].includes(combatResolution.phase))view.querySelectorAll(".combat-outcome-effect,.combat-miss-popup").forEach(effect=>effect.remove());
  if(combatResolution.phase==="player-impact"){
    const target=view.querySelector(`.enemy-card[data-enemy-index="${state.target}"]`);
    if(target){
      target.insertAdjacentHTML("afterbegin",renderPlayerAttackVfx(state.target));
      configureArrowTrajectory(target.querySelector(".player-attack-vfx"),target);
    }
  }
  return true;
}

function refreshCombatResolutionReadout(refreshActions=false) {
  if(!state?.combat)return;
  const view=screen.querySelector(".combat-view");
  if(!view)return;
  const staging=document.createElement("div");
  staging.innerHTML=renderCombat(state.combat.enemies.map((enemy,index)=>({enemy,index})).filter(item=>item.enemy.hp>0));
  const nextEnemies=staging.querySelector(".enemy-list");
  const enemyList=view.querySelector(".enemy-list");
  fadeDefeatedEnemyCards();
  if(nextEnemies&&enemyList){
    const existing=new Map(Array.from(enemyList.querySelectorAll(".enemy-card[data-enemy-index]"),card=>[card.dataset.enemyIndex,card]));
    for(const card of Array.from(enemyList.querySelectorAll(".enemy-card[data-enemy-index]"))){
      const enemy=state.combat.enemies[Number(card.dataset.enemyIndex)];
      if(!nextEnemies.querySelector(`.enemy-card[data-enemy-index="${card.dataset.enemyIndex}"]`)&&enemy?.hp>0)card.remove();
    }
    for(const nextCard of nextEnemies.querySelectorAll(".enemy-card[data-enemy-index]")){
      const card=existing.get(nextCard.dataset.enemyIndex);
      if(card&&card.dataset.signature===nextCard.dataset.signature)continue;
      if(card)card.replaceWith(nextCard);else enemyList.appendChild(nextCard);
      nextCard.querySelectorAll("[data-target]").forEach(button=>{
        button.disabled=Boolean(combatResolution);
        button.addEventListener("click",()=>{if(combatResolution)return;state.target=Number(button.dataset.target);render();});
      });
    }
  }
  const statuses=view.querySelector(".player-combat-statuses");
  const nextStatuses=staging.querySelector(".player-combat-statuses");
  if(statuses&&nextStatuses)statuses.innerHTML=nextStatuses.innerHTML;
  for(const [key,value,max] of [["health",state.hp,state.maxHp],["mana",state.mana,state.maxMana]]){
    const row=screen.querySelector(`[data-resource="${key}"]`);
    if(!row)continue;
    row.dataset.value=value;
    const label=row.querySelector(".stat-label b");
    if(label)label.textContent=`${value} / ${max}`;
    const fill=row.querySelector(".meter i");
    if(fill)fill.style.width=`${Math.max(0,value/max*100)}%`;
  }
  const log=screen.querySelector(".context-output");
  const nextLog=staging.ownerDocument.createElement("div");
  nextLog.innerHTML=renderLog();
  const logOutput=nextLog.querySelector(".context-output");
  if(log&&logOutput)log.innerHTML=logOutput.innerHTML;
  view.className=`combat-view ${combatResolution?`combat-resolving stage-${combatResolution.phase}`:""}`;
  const indicator=view.querySelector(".turn-indicator");
  if(indicator)indicator.textContent=combatResolutionLabel();
  view.querySelectorAll(".enemy-card[data-enemy-index]").forEach(card=>{
    if(Number.isInteger(combatResolution?.enemyIndex)&&Number(card.dataset.enemyIndex)===combatResolution.enemyIndex)card.classList.add("resolving-enemy");
  });
  view.querySelectorAll("[data-target]").forEach(button=>button.disabled=Boolean(combatResolution));
  const actions=view.querySelector(".room-actions");
  const nextActions=staging.querySelector(".room-actions");
  if(refreshActions&&actions&&nextActions){
    actions.innerHTML=nextActions.innerHTML;
    actions.querySelectorAll("[data-action]").forEach(button=>button.addEventListener("click",()=>{pendingCombatAction=state.combat?button.dataset.action:null;act(button.dataset.action);}));
    actions.querySelectorAll("[data-attack]").forEach(button=>button.addEventListener("click",()=>{pendingCombatAction=button.dataset.attack;combatAction(button.dataset.attack);}));
  }
  const heading=view.querySelector(".room-actions h3");
  if(heading)heading.textContent=combatResolution?"Resolving turn":"Your turn";
  view.classList.toggle("combat-resolving",Boolean(combatResolution));
  view.classList.toggle("stage-enemy-windup",combatResolution?.phase==="enemy-windup");
  view.classList.toggle("stage-enemy-impact",combatResolution?.phase==="enemy-impact");
  for(const selector of ["#index-button","#leaderboard-button","#settings-button"]){const button=document.querySelector(selector);if(button)button.disabled=Boolean(combatResolution);}
  if(enemyHitFlash){
    enemyHitFlash=false;
    const flash=document.createElement("div");
    flash.className="screen-edge-flash";
    flash.setAttribute("aria-hidden","true");
    screen.appendChild(flash);
  }
}

function renderCombat(enemies) {
  const equippedSpell=state.spells?.find(spell=>spell.id===state.equippedSpellId);
  const attacks = state.weapon?.attacks || [];
  const targetCount = state.combat?.enemies.filter(enemy => enemy.hp > 0).length || 1;
  const basic = { name: state.class === "mage" ? "Basic spell" : state.class === "archer" ? "Basic shot" : "Basic attack", multiplier: 1, critBonus: 0, cooldown: 0, effect: state.weapon?.effect || null, manaGain: state.class === "archer" ? 1 : 0, freeBasic: state.class === "mage" };
  const listedAttacks = [basic, ...attacks, ...(equippedSpell?[classSpellAttack(equippedSpell)]:[])];
  if (state.class === "warrior") listedAttacks.splice(1, 0, { name: "Heavy attack", multiplier: 1.5, critBonus: 0.1, cooldown: 2, effect: null });
  const enemyCards = enemies.map(({ enemy, index }) => {
    const intent = enemy.intent || { label: "Preparing", key: "" };
    const hint = intent.key === "guard" ? " · reduces incoming damage" : intent.key === "dodge" ? " · evades your next attack" : intent.key === "aim" ? " · next turn's shot deals extra damage" : "";
    const incoming=enemyIncomingDamage(enemy);
    const preview=["attack","shoot","cast","heavy"].includes(intent.key)?`<span class="incoming-damage">Potential hit: ${incoming}</span>`:"";
    const eliteBadge=enemy.elite?`<span class="elite-tag">Elite · ${escapeHtml(enemy.affinity)} affinity</span>`:"";
    const affinityTelegraph=enemy.elite&&["attack","shoot","cast","heavy"].includes(intent.key)?` · ${escapeHtml(enemy.affinityEffect)} has a 15% chance on hit`:"";
    const relation=DUNGEON_RULES.elementMatchup(state.weapon?.element,enemy.element).relation;
    const protector=enemy.protectedByIndex===undefined?null:state.combat.enemies[enemy.protectedByIndex];
    const formation=enemy.formationRole?`<p class="formation-note">Vanguard · intercepts single-target attacks on its ally</p>`:protector?.hp>0?`<p class="formation-note">Protected by ${escapeHtml(protector.name)} · single-target attacks are intercepted</p>`:protector?`<p class="formation-note">Vanguard fallen · no longer protected</p>`:"";
    const pattern=enemy.boss?`<p class="boss-pattern">Pattern: ${bossPattern(enemy.name).map(step=>escapeHtml(step.label)).join(" → ")}</p>`:"";
    const signature=JSON.stringify([enemy.hp,enemy.maxHp,enemy.damage,enemy.intent,enemy.effects,enemy.aimedShot,enemy.damageReduction,enemy.protectedByIndex,state.target===index]);
    return `<article class="enemy-card ${enemy.boss ? "boss-enemy" : ""} ${enemy.elite ? "elite-enemy" : ""} ${state.target === index ? "target-selected" : ""}" data-enemy-index="${index}" data-enemy-name="${escapeHtml(enemy.name)}" data-effects="${escapeHtml(Object.keys(enemy.effects||{}).sort().join(","))}" data-hp="${enemy.hp}" data-signature="${escapeHtml(signature)}">${renderCombatOutcome(index)}${renderPlayerAttackVfx(index)}${enemyArt(enemy)}<div class="enemy-information"><div class="enemy-name"><strong>${escapeHtml(enemy.name)}</strong><span>${escapeHtml(enemy.klass)}</span></div>${eliteBadge}<div class="enemy-health"><span>${enemy.hp} / ${enemy.maxHp} HP</span><i><b style="width:${Math.max(0, enemy.hp / enemy.maxHp * 100)}%"></b></i></div><p>${enemy.damage} damage · ${Math.round(enemy.dodge * 100)}% dodge · ${enemy.element?elementBadge(enemy.element):"Neutral"}${enemy.damageReduction?` · ${enemy.damageReduction} defense`:""}</p><p class="enemy-trait">${escapeHtml(enemyTrait(enemy))} · ${escapeHtml(relation)}</p>${formation}${pattern}<p class="enemy-intent intent-${slug(intent.key||"preparing")}"><span>Intent</span> <strong>${escapeHtml(intent.label)}</strong>${hint}${affinityTelegraph} ${preview}</p>${renderStatusBadges(enemy.effects)}</div><button class="small-button target-button" data-target="${index}">${state.target === index ? "Targeted" : "Target"}</button></article>`;
  }).join("");
  const attackInfo = state.showWeaponInfo ? `<div class="weapon-attack-info">${listedAttacks.map(attack => {
    const preview = attackPreview(attack, targetCount);
    const matchup = ` · elemental ${preview.elementRelation}${previewModifiers(preview)}`;
    const baseDamage=attack.spell?0:Math.max(0,Math.round((preview.rawPrimaryDamage||0)*(preview.elementMultiplier||1)));
    const effect=attack.selfEffect||attack.effect;
    const effectLength=attack.duration||DUNGEON_RULES.getEffectDefinition(effect)?.duration;
    return `<article><strong>${elementBadge(attack.element||state.weapon?.element||"Physical")} ${escapeHtml(attack.name)}</strong><span>${escapeHtml(attack.description || "A reliable basic strike.")}</span><small>${attack.spell?"Effect spell":`${baseDamage} damage`}${attack.aoe?" · all foes":" · one target"}${effect?` · ${escapeHtml(effect)}${effectLength?` ${effectLength}t`:""}`:""}${preview.cooldown?` · ${preview.cooldown}t cooldown`:""}${preview.manaCost?` · ${attack.spell?classSpellCostLabel(equippedSpell):`${preview.manaCost} mana`}`:""}${preview.ammoCost?` · ${preview.ammoCost} arrow${preview.ammoCost===1?"":"s"}`:""}</small></article>`;
  }).join("")}</div>` : "";
  const resolutionLabel=combatResolutionLabel();
  return `<div class="combat-view ${combatResolution?`combat-resolving stage-${combatResolution.phase}`:""}"><div class="combat-header"><div><p class="section-kicker">Combat · Floor ${state.floor}</p><h2>Fight</h2></div><span class="turn-indicator" aria-live="polite">${escapeHtml(resolutionLabel)}</span></div><div class="enemy-list">${enemyCards}</div><div class="player-combat-statuses">${renderPlayerCombatStatuses()}</div><div class="combat-info"><span>Weapon: ${escapeHtml(state.weapon?.name || "None")}</span><button class="small-button" data-toggle-weapon-info>${state.showWeaponInfo ? "Hide attack info" : "Attack info"}</button></div>${attackInfo}${state.combat?.bonusAttackPending?`<p class="bonus-action-prompt">You’re too fast! Choose one attack before the enemies act.</p>`:""}<div class="combat-toolbar">${inventoryButtonMarkup()}</div><div class="room-actions"><h3>${combatResolution?"Resolving turn":"Your turn"}</h3>${getActions()}</div></div>`;
}

function renderPlayerAttackVfx(targetIndex) {
  if (!combatResolution || combatResolution.phase !== "player-impact" || targetIndex !== state?.target) return "";
  const action = combatResolution.action;
  const attack = state.weapon?.attacks?.find(item => item.command === action) || getEquippedClassSpell(action);
  const isEnemyAttack = ["basic", "attack", "heavy"].includes(action) || Boolean(attack && !attack.selfOnly && (attack.effect || attack.multiplier > 0));
  if (!isEnemyAttack) return "";
  const color = combatEffectColor(action);
  const symbol=attack?.effect||attack?.selfEffect||state.weapon?.effect||"default";
  if (state?.class === "mage" || attack?.spell) {
    return `<div class="player-attack-vfx mage-attack-vfx" style="--attack-color:${color}" aria-hidden="true"><span class="spell-sigil-ring"></span><span class="spell-sigil-symbol">${effectIcon(symbol)}</span></div>`;
  }
  if(state?.class==="archer"){
    return `<div class="player-attack-vfx archer-attack-vfx" style="--attack-color:${color}" aria-hidden="true"><svg class="flying-arrow" viewBox="0 0 180 42"><path class="arrow-feather" d="M8 15 28 21 8 27 17 21Z"/><path class="arrow-shaft" d="M15 21h139"/><path class="arrow-head" d="m143 12 32 9-32 9 7-9Z"/><path class="arrow-edge" d="m143 12 7 9-7 9"/></svg><span class="arrow-impact-circle"><span>${effectIcon(symbol)}</span></span></div>`;
  }
  const heavy = combatResolution.action === "heavy";
  return `<div class="player-attack-vfx warrior-attack-vfx${heavy ? " heavy" : ""}" style="--attack-color:${color}" aria-hidden="true"><span class="warrior-slashes ${heavy?"single":""}"><i></i>${heavy?"":"<i></i>"}</span></div>`;
}

function configureArrowTrajectory(effect,target) {
  const arrow=effect?.querySelector(".flying-arrow");
  if(!arrow||!target)return;
  const rect=target.getBoundingClientRect();
  const centerX=rect.left+rect.width/2;
  const centerY=rect.top+rect.height/2;
  const height=window.innerHeight||600;
  arrow.style.setProperty("--arrow-start-x",`${-centerX}px`);
  arrow.style.setProperty("--arrow-mid-x",`${-centerX*0.62}px`);
  arrow.style.setProperty("--arrow-near-x",`${-centerX*0.22}px`);
  arrow.style.setProperty("--arrow-dive-x",`${-centerX*0.08}px`);
  arrow.style.setProperty("--arrow-start-y",`${height*0.72-centerY}px`);
  arrow.style.setProperty("--arrow-peak-y",`${height*0.25-centerY}px`);
  arrow.style.setProperty("--arrow-dive-y",`${height*0.4-centerY}px`);
}

function fadeDefeatedEnemyCards() {
  if(!state?.combat)return;
  const reducedMotion=window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  state.combat.enemies.forEach((enemy,index)=>{
    if(enemy.hp>0)return;
    const card=screen.querySelector(`.enemy-card[data-enemy-index="${index}"]`);
    if(!card||card.dataset.deathFadeStarted)return;
    card.dataset.deathFadeStarted="true";
    card.classList.add("enemy-defeated");
    window.setTimeout(()=>card.remove(),reducedMotion?100:520);
  });
}

function attackPreview(attack, targetCount = state.combat?.enemies.filter(enemy=>enemy.hp>0).length || 1, target = state.combat?.enemies[state.target], weaponOverride = state.weapon, chargedOverride = state.chargedAttack) {
  if(target?.protectedByIndex!==undefined){const guard=state.combat?.enemies[target.protectedByIndex];if(guard?.hp>0)target=guard;}
  const armor = DUNGEON_RULES.armorBonuses(state.equippedArmor || {}, state.class);
  const preview = DUNGEON_RULES.createAttackPreview({
    player: { ...state, critChance: state.critChance + armor.critChance }, playerClass: state.class,
    weapon: attack.spell ? {} : (weaponOverride || {}), attack, targetCount, charged: chargedOverride,
    targetElement: target?.element
  });
  if(target){
  preview.defensePierce=!attack.spell&&["Void","Penetration","Pierce","PiercingShot"].includes(weaponOverride?.effect)?0.5:0;
    const reduction=Math.max(0,(target.damageReduction||0)*(1-preview.defensePierce));
    const applyPreviewMitigation=raw=>{
      let damage=Math.max(1,Math.round(raw*preview.elementMultiplier-reduction));
      if(target.intent?.key==="guard")damage=DUNGEON_RULES.guardDamage(damage,attack.name==="Heavy attack");
      if(target.intent?.key==="ward")damage=Math.max(1,Math.round(damage*0.7));
      if(target.effects?.Marked)damage=Math.round(damage*1.2);
      if(["Execution","ExecutionBolt"].includes(attack.effect)||["Execution","ExecutionBolt"].includes(weaponOverride?.effect))if(target.hp/target.maxHp<=0.3)damage=Math.round(damage*1.5);
      return damage;
    };
    preview.primaryDamage=applyPreviewMitigation(preview.rawPrimaryDamage-(attack.targetDamageReduction||0));
    preview.secondaryDamage=attack.aoe?applyPreviewMitigation(preview.rawPrimaryDamage*(attack.secondaryMultiplier||0.5)):0;
    preview.criticalDamage=preview.primaryDamage*2;
  }
  if (attack.spell) { preview.manaCost=attack.manaCost||0; preview.ammoCost=0; }
  if (!attack.spell && weaponFamily(weaponOverride) === "archer" && attack.chargesNextAttack) preview.ammoCost = 0;
  return preview;
}

function renderStatusBadges(effects = {}, targetSide = "enemy") {
  const badges = Object.entries(effects || {}).map(([key,value])=>[key,typeof value==="number"?{turns:value,stacks:1}:value]).filter(([, value]) => value && typeof value === "object" && Number(value.turns) > 0).map(([key, value]) => {
    const info = DUNGEON_RULES.getEffectDefinition(key);
    if (!info) return "";
    const stacks = value.stacks > 1 ? ` ×${value.stacks}` : "";
    const description=targetSide==="player"?(PLAYER_EFFECT_DESCRIPTIONS[key]||info.description):info.description;
    const positive=targetSide==="player"&&["LifeSteal","ManaSteal","Momentum","Thorns","Focus","Draw","Overdraw","Afterimage","Teleport","ArcaneCharge","ManaShield"].includes(key);
    return `<span class="status-badge ${positive?"status-positive":"status-negative"}" title="${escapeHtml(description)}" aria-label="${escapeHtml(`${key}${stacks}, ${value.turns} turns. ${description}`)}">${effectIcon(key)}<span>${escapeHtml(key)}${stacks}</span><small>${value.turns}t</small></span>`;
  }).join("");
  return badges ? `<div class="status-list" aria-label="Active effects">${badges}</div>` : "";
}

function renderPlayerCombatStatuses() {
  const effects=renderStatusBadges(state.playerEffects,"player");
  const brace=state.braced?`<div class="status-list" aria-label="Player stance"><span class="status-badge">Brace · next hit halved</span></div>`:"";
  return `${effects}${brace}`;
}

function armorSummaryText() {
  const bonus=DUNGEON_RULES.armorBonuses(state.equippedArmor||{},state.class);
  const details=[`${Math.round(bonus.damageReduction*100)}% damage reduction`];
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
  screen.querySelectorAll("[data-action]").forEach(button=>button.addEventListener("click",()=>{pendingCombatAction=state.combat?button.dataset.action:null;act(button.dataset.action);}));
  screen.querySelectorAll("[data-class]").forEach(button=>button.addEventListener("click",()=>chooseClass(button.dataset.class)));
  screen.querySelectorAll("[data-move]").forEach(button=>button.addEventListener("click",()=>moveTo(button.dataset.move)));
  screen.querySelectorAll("[data-target]").forEach(button=>button.addEventListener("click",()=>{state.target=Number(button.dataset.target);render();}));
  screen.querySelectorAll("[data-equip-weapon]").forEach(button=>button.addEventListener("click",()=>equipWeapon(Number(button.dataset.equipWeapon))));
  screen.querySelectorAll("[data-equip-armor]").forEach(button=>button.addEventListener("click",()=>equipArmor(Number(button.dataset.equipArmor))));
  screen.querySelectorAll("[data-attack]").forEach(button=>button.addEventListener("click",()=>{pendingCombatAction=button.dataset.attack;combatAction(button.dataset.attack);}));
  screen.querySelector("[data-toggle-weapon-info]")?.addEventListener("click",()=>{state.showWeaponInfo=!state.showWeaponInfo;render();});
  screen.querySelectorAll("[data-open-skills]").forEach(button=>button.addEventListener("click",openSkills));
  screen.querySelectorAll("[data-open-recap]").forEach(button=>button.addEventListener("click",()=>{modalReturnFocusSelector="[data-open-recap]";modal="recap";render();}));
  screen.querySelectorAll("[data-spend-stat]").forEach(button=>button.addEventListener("click",()=>spendSkillPoint(button.dataset.spendStat)));
}

function ensureSkillStats() {
  for (const key of ["str", "dex", "con", "int", "wis", "cha"]) state[key] ??= 10;
  state.speed ??= state.playerSpeed ?? 10;
  state.critChance ??= 0.05;
}

function openSkills() { if(modal==="inventory")modalReturnFocusSelector="[data-open-inventory]"; modal = "skills"; render(); }

function refreshSkillsModal() {
  if(modal!=="skills")return false;
  const skillsModal=screen.querySelector(".skills-modal");
  if(!skillsModal)return false;
  const points=skillsModal.querySelector(".skill-points strong");
  if(points)points.textContent=String(state.skillPoints);
  for(const stat of DUNGEON_RULES.STAT_DEFINITIONS){
    const row=skillsModal.querySelector(`[data-skill-row="${stat.key}"]`);
    if(!row)return false;
    const value=row.querySelector("strong");
    const description=row.querySelector("p");
    const button=row.querySelector("[data-spend-stat]");
    const cost=DUNGEON_RULES.skillPointCost(state,stat.key);
    if(value)value.textContent=`${stat.label}: ${statValueLabel(stat)}`;
    if(description)description.textContent=`${statDescription(stat)}${stat.key==="dex"&&state.class==="archer"&&state.equippedArmor?.shield?" Equipped shield penalty applied.":""}`;
    if(button){
      button.textContent=`Improve · ${cost} SP`;
      button.disabled=state.skillPoints<cost||(stat.key==="critChance"&&state.critChance>=1);
    }
  }
  save();
  return true;
}

function spendSkillPoint(stat) {
  const result = DUNGEON_RULES.spendSkillPoint(state, stat);
  message(result.message, result.success ? "reward" : "");
  if(!refreshSkillsModal())render();
}

function chooseClass(className) {
  if (!WEAPONS[className] || (state.chosenClass && state.chosenClass !== className)) return;
  state.class=className;
  state.chosenClass=className;
  const entries = WEAPONS[className];
  state.weapon=createWeapon(entries[0]);
  state.weapons=[state.weapon];
  const starterSpell=createClassSpellScroll(className,"Uncommon",true);
  state.spells=[starterSpell];state.equippedSpellId=starterSpell.id;
  state.inventoryNotice=true;
  if(className==="archer")state.arrows=14;
  state.starter.classOffer=false;
  message(`You choose the ${CLASS_NAMES[className]} path, take the ${state.weapon.name}, and learn ${starterSpell.spellName}.`, "story"); render();
}

function act(action) {
  if(state.runEnded)return;
  const room=currentRoom();
  if (action==="inspect-desk") { state.starter.desk=true; state.starter.classOffer=true; message("Inside the desk is no single weapon, but three possibilities: a sword, a bow, and a staff. Choose your class before leaving.","story"); render(); return; }
  if (action==="inspect-closet") { if(state.starter.closet){message("The closet is empty now.");} else {state.starter.closet=true;const chest=ARMOR_INDEX.find(item=>item.name==="Common Iron Chest");const armor=DUNGEON_RULES.createCatalogArmor(chest,1);armor.name="Iron Chestplate";state.armor.push(armor);state.inventoryNotice=true;equipCollectedArmor(armor);addInventoryItem({name:"Common Health Potion",rarity:"Common",type:"health",amount:25,quantity:1});message("Behind a moth-eaten cloak, you find an iron chestplate and a Common Health Potion.");} render();return; }
  if (action==="inventory") { openInventory(); return; }
  if (action==="inspect-chest") { inspectChest(room); render(); return; }
  if (action==="inspect-floor") { room.trapRevealed=true; message(room.type==="trap"?"A fine seam in the floor gives away the hidden mechanism.":"You check the floor. Dust, stone, and old scratches.");render();return; }
  if (action==="save-fountain") { if(room.fountainUsed){message("The fountain has dried up. Keep moving.");render();return;}room.fountainSaved=true;message("You leave the fountain untouched. It will be here if you need it later.");render();return; }
  if (action==="drink-fountain") { if(room.fountainUsed){message("The fountain has dried up. Keep moving.");render();return;}const healed=state.maxHp-state.hp;state.hp=state.maxHp;room.fountainUsed=true;room.fountainSaved=false;message(healed?`You drink from the fountain and restore ${healed} health. It dries up; keep moving.`:"You drink from the fountain, but you were already at full health. It dries up; keep moving.");render();return; }
  if (action==="shop") { openShop(); return; }
  if (action==="enter-boss") { startCombat(true); return; }
  if (action==="route-safe"||action==="route-risky") { chooseRoute(action==="route-safe"); return; }
  if (["attack","heavy","aim","heal","mana","flee"].includes(action)) { combatAction(action); return; }
}

function chooseRoute(safe){
  const room=currentRoom();
  if(!room?.routeChoice||room.routeChoiceMade||room.type!=="enemy")return;
  room.routeChoiceMade=true;
  if(safe){
    const reward=12+state.floor*5;
    state.gold+=reward;room.type="empty";room.cleared=true;
    message(`You take the quiet route and find ${reward} gold. No fight, and no further reward.` ,"reward");render();return;
  }
  room.riskyChoice=true;
  room.enemyCount=Math.min(4,(room.enemyCount||1)+1);
  message("You take the challenge. More foes stir, and the survivors carry better rewards.","danger");
  startCombat(false);
}

function inspectChest(room) {
  if(room.searched){message("The chest has already been searched.");return;}
  room.searched=true;
  if(room.type==="trap") {
    room.trapRevealed=true;
    const outcome=randomInt(3);
    if(outcome===0){const speed=effectiveStat("speed")+Math.max(0,(state.weapon?.speed||10)-10)+DUNGEON_RULES.armorBonuses(state.equippedArmor||{},state.class).speed;const difficulty=24+Math.floor(Math.max(0,state.floor-1)/4);const check=randomInt(20)+1+speed;if(check>=difficulty)message("You move quickly and slip past the chest’s hidden blade. It snaps shut against the stone.","story");else{const damage=Math.min(Math.max(0,state.hp-1),Math.max(1,Math.round(state.maxHp*0.15)));state.hp-=damage;state.runStats.damageTaken+=damage;message(`You are too slow to avoid the chest’s hidden blade. It cuts away ${damage} health, but leaves you standing.`,"danger");}}
    else if(outcome===1){const stolen=Math.min(state.gold,Math.ceil(state.gold/2));state.gold-=stolen;message(`The trapped chest springs. A hidden mechanism steals ${stolen} gold.`,"danger");}
    else {const loot=makeLoot();grantLoot(loot);message(`You avoid the mechanism and find ${loot.kind==="weapon"?`${loot.value.rarity} ${loot.value.name}`:loot.kind==="armor"?`${loot.value.rarity} ${loot.value.name}`:itemNameWithRarity(loot.value)}.`);}
  } else if(room.type==="weapon") { const weapon=makeLootWeapon(null,"Rare");if(weapon){state.weapons.push(weapon);state.inventoryNotice=true;message(`Inside, you find a ${lootRewardName(weapon)} (${weapon.type}).`);}else message("The weapon cache is empty; you already own every design it held."); }
  else {
    const goldFound=35+state.floor*12;
    state.gold+=goldFound;
    const foundPotion=Math.random()<0.35;
    if(foundPotion)addInventoryItem({name:"Common Health Potion",type:"health",amount:25,quantity:1,rarity:"Common"});
    let foundSpell=null;
    if(state.class&&Math.random()<0.1){foundSpell=createClassSpellScroll(state.class,DUNGEON_RULES.rollFloorLootRarity(state.floor,false,Math.random),false,(state.spells||[]).map(spell=>spell.spellId).filter(Boolean));if(foundSpell)grantLoot({kind:"classSpell",value:foundSpell});}
    let chestMessage=foundPotion?`Inside the chest, you find a Common Health Potion and ${goldFound} gold coins.`:`The chest holds ${goldFound} gold coins; its healing supplies have long since been taken.`;
    if(foundSpell)chestMessage+=` You also find a ${foundSpell.rarity} ${foundSpell.spellName} scroll.`;
    message(chestMessage);
  }
  if(room.type==="trap"&&state.class&&Math.random()<0.1){const scroll=createClassSpellScroll(state.class,DUNGEON_RULES.rollFloorLootRarity(state.floor,false,Math.random),false,(state.spells||[]).map(spell=>spell.spellId).filter(Boolean));if(scroll){grantLoot({kind:"classSpell",value:scroll});message(`Among the chest's contents, you find ${lootRewardName(scroll)}.`,"reward");}}
}

function roomTypeForFloor(room) {
  if(room.type==="enemy") {
    const floor=state.floor; const eligible=Math.min(4,Math.max(1,floor)); room.enemyCount=room.enemyCount||randomInt(eligible)+1;
  }
  return room.type;
}

function moveTo(id) {
  if(state.combat||state.runEnded||state.milestonePending)return;
  if(!state.class && currentRoom().type==="start"){message("The stone doorway will not move. The desk’s three weapons seem to be the key.","story");render();return;}
  const next=findRoom(id); if(!next || !getConnected().some(connection=>connection.room.id===id))return;
  if(next.type==="boss") { message("The doorway to the boss chamber is open, but you can choose when to enter."); state.currentFloor.currentId=id;next.visited=true;render();return; }
  state.currentFloor.currentId=id; next.visited=true; roomTypeForFloor(next);
  const name=next.routeChoice&&!next.routeChoiceMade?"forked chamber":next.type==="trap"&&!next.trapRevealed?"Treasure Room":ROOM_LABELS[next.type];
  message(`You enter ${name.toLowerCase()}.`, next.type==="enemy"?"story":"");
  if(next.type==="enemy"&&!next.cleared&&(!next.routeChoice||next.routeChoiceMade)) startCombat(false);
  else render();
}

function startCombat(boss) {
  const room=currentRoom();
  const count=boss?1:(room.enemyCount||1);
  const enemies=Array.from({length:count},(_,index)=>makeEnemy(state.floor,boss,index));
  if(room.riskyChoice)for(const enemy of enemies){enemy.maxHp=Math.round(enemy.maxHp*1.25);enemy.hp=enemy.maxHp;enemy.damage=Math.round(enemy.damage*1.2);}
  if(!boss){applyEliteAffinities(enemies,state.floor);compensateEliteCrowd(enemies,state.floor);}
  const hasFormation=!boss&&assignEnemyFormation(enemies);
  combatFeedbacks=[];enemyHitFlash=false;state.combat={enemies,boss,log:[],damageDealt:0,damageTaken:0,summonedCount:0};state.cooldown=0;state.attackCooldowns={};state.defenseCooldowns={aegis:0,block:0,dodge:0};state.activeDefense=null;state.disruptCooldown=0;state.braced=false;state.aimed=false;state.target=0;
  for(const enemy of enemies){if(boss){enemy.bossTurn=0;enemy.intent=nextBossIntent(enemy);}else enemy.intent=DUNGEON_RULES.chooseEnemyIntent(enemy.klass,enemy.race);}
  const enemy=enemies[0];
  const displayedName=enemy.elite?`${enemy.affinity} Elite ${enemy.name}`:enemy.name;
  const opening=boss?(enemy.milestoneBoss?`Milestone boss: ${displayedName}. Its repeating pattern is ${bossPattern(displayedName).map(intent=>intent.label).join(" → ")}.`:`${displayedName} begins its pattern: ${bossPattern(displayedName).map(intent=>intent.label).join(" → ")}.`):
    hasFormation?`${displayedName} enters in formation. A vanguard covers a ranged ally.`:choice([`${displayedName} leaps from the dark!`,`A scrape of stone, then ${displayedName} blocks the way.`,`Something rushes at you through the doorway: ${displayedName}!`,`You hear a sharp cry as ${displayedName} attacks!`]);
  message(opening,"danger"); render();
}

function getEquippedClassSpell(command){const spell=state?.spells?.find(item=>item.id===state.equippedSpellId&&item.command===command);return classSpellAttack(spell);}

function classSpellManaCost(spell){const base=spell.manaPercent?Math.ceil(state.maxMana*spell.manaPercent):(spell.manaCost||0);return Math.ceil(base*(state.class&&spell.className!==state.class?1.5:1));}
function classSpellCostLabel(spell){return spell.manaPercent?`${Math.round(spell.manaPercent*100)}% max mana${state.class&&spell.className!==state.class?" · off-class cost +50%":""}`:`${spell.manaCost} mana${state.class&&spell.className!==state.class?" · off-class cost +50%":""}`;}
function classSpellAttack(spell){if(!spell)return null;const offClass=Boolean(state.class&&spell.className!==state.class);return{...spell,name:spell.spellName,spell:true,element:spell.element||"Arcane",offClass,multiplier:0,manaCost:classSpellManaCost(spell),duration:spell.duration||SPELL_RARITY_DURATION[spell.rarity]||1};}

function combatAction(action) {
  if (combatResolution) return;
  if (typeof window.setTimeout !== "function" || modal) return combatActionNow(action);
  const token = ++combatResolutionToken;
  combatFeedbacks = [];
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const delay = reducedMotion ? 0 : combatPacing === "slow" ? 520 : 150;
  combatResolution = { phase: "player-windup", actor: "You", action, token };
  if(!updateCombatResolutionPresentation())render();
  window.setTimeout(() => {
    if (token !== combatResolutionToken || !state?.combat) { clearCombatResolution(); return; }
    combatResolution = { phase: "player-impact", actor: "You", action, token };
    pendingCombatAction = action;
    if(!updateCombatResolutionPresentation())render();
    window.setTimeout(() => {
      if (token !== combatResolutionToken || !state?.combat) { clearCombatResolution(); return; }
      combatResolution = null;
      combatActionNow(action);
      if (!combatResolution) render();
    }, reducedMotion ? 90 : state.class === "archer" ? 690 : state.class === "mage" ? 150 : state.class === "warrior" && action === "heavy" ? 330 : state.class === "warrior" ? 220 : 180);
  }, delay);
}

function combatActionNow(action) {
  combatFeedbacks=[];
  const fight=state.combat; if(!fight)return;
  const wasBonusAttack=Boolean(fight.bonusAttackPending);
  if(wasBonusAttack && !["basic","attack"].includes(action) && !DUNGEON_RULES.getSpecialAttack(state.weapon,action) && !getEquippedClassSpell(action)){message("You’re too fast! Choose an attack before the enemies act.");render();return;}
  if(DUNGEON_RULES.allEnemiesDefeated(fight.enemies)){winFight();return;}
  if(state.playerEffects?.Freeze?.stacks>=5){
    delete state.playerEffects.Freeze;
    message("Freeze takes hold. You lose this action.","danger");
    enemyTurn();return;
  }
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
  if(action==="flee") { if(fight.boss){message("The boss chamber seals behind you. You cannot flee this fight.","danger");render();return;} if(Math.random()<0.4){state.combat=null;state.braced=false;message("You slip past the enemy and retreat to the previous room.","story");render();return;} message(`${enemy.name} blocks your path and stops you from escaping!` ,"danger");enemyTurn();return; }
  if(action==="heal"||action==="mana") { const type=action==="heal"?"health":"mana";const itemIndex=state.items.findIndex(it=>it.type===type && it.quantity>0);if(itemIndex<0){message(`No ${type} potion in your inventory.`);render();return;}const item=state.items[itemIndex];item.quantity--;if(type==="health")state.hp=Math.min(state.maxHp,state.hp+healthPotionRestore(item));else state.mana=Math.min(state.maxMana,state.mana+manaPotionRestore(item));if(item.quantity<=0)state.items.splice(itemIndex,1);message(`You use a ${item.name}. Your turn passes.`);enemyTurn();return; }
  const weapon=state.weapon; if(!weapon){message("You need a weapon before you can attack.");render();return;}
  const spell=getEquippedClassSpell(action);
  const special=DUNGEON_RULES.getSpecialAttack(weapon,action)||spell;
  const isSpellCast=Boolean(spell);
  const isBasic=action==="basic"||action==="attack";
  const isHeavy=action==="heavy";
  const usesMana=DUNGEON_RULES.weaponUsesMana(weapon,state.class)||isSpellCast;
  const freeMageBasic=state.class==="mage";
  const spellBlocked=usesMana&&state.equippedArmor?.shield&&!isSpellCast;
  const noArrows=["Bow","Crossbow"].includes(weapon.type)&&state.arrows<(weapon.effect==="Overdraw"?2:1);
  const basicFallback=isBasic&&spellBlocked?"shield":isBasic&&usesMana&&!freeMageBasic?DUNGEON_RULES.basicAttackFallback(state.class,weapon.type,state.mana,state.arrows,(weapon.manaCost||5)+(weapon.effect==="Overcast"?2:0))||(noArrows?"arrows":null):isBasic&&noArrows?"arrows":null;
  const attack=special|| (isHeavy?{name:"Heavy attack",multiplier:1.5,critBonus:0.10,cooldown:2}:isBasic?{name:basicFallback&&usesMana?"Staff strike":basicFallback==="arrows"?"Unarmed jab":"Basic attack",multiplier:basicFallback?0.5:1,critBonus:0,cooldown:0}:null);
  if(!attack){message("That attack is not available for this weapon.");render();return;}
  if(special&&DUNGEON_RULES.isAttackOnCooldown(state.attackCooldowns,action)){message(`${attack.name} is cooling down for ${state.attackCooldowns[action]} turn(s).`);render();return;}
  if(spellBlocked&&!basicFallback){message("You cannot cast while a shield is equipped.");render();return;}
  if(special?.chargesNextAttack){
    if(wasBonusAttack){message("Use a direct attack for your extra action.");render();return;}
    if(usesMana){const cost=(special.manaCost||weapon.manaCost||5)+(weapon.effect==="Overcast"&&!isSpellCast?2:0);if(state.mana<cost){message(`Not enough mana. Channeling costs ${cost}.`);render();return;}state.mana-=cost;}
    state.chargedAttack={multiplier:special.multiplier,critBonus:special.critBonus};
    message(`${special.name} is ready. Your next basic attack is empowered.`);enemyTurn();return;
  }
  const manaCost=isSpellCast?(special.manaCost||0):isBasic&&freeMageBasic?0:usesMana&&!basicFallback?(special?.manaCost||weapon.manaCost||5)+(weapon.effect==="Overcast"?2:0):0;
  if(state.mana<manaCost){message(`Not enough mana. This spell costs ${manaCost} mana.`);render();return;}
  if(manaCost)state.mana-=manaCost;
  const arrowCost=["Bow","Crossbow"].includes(weapon.type)&&!basicFallback&&!isSpellCast&&!special?.selfOnly?(weapon.effect==="Overdraw"?2:1):0;
  if(arrowCost){state.arrows??=0;if(state.arrows<arrowCost){message(`Not enough arrows. This shot costs ${arrowCost}.`);render();return;}changeArrowCount(-arrowCost);}
  if(!special?.aoe&&!special?.selfOnly&&enemy.protectedByIndex!==undefined){const guardian=fight.enemies[enemy.protectedByIndex];if(guardian?.hp>0){message(`${guardian.name} intercepts the attack meant for ${enemy.name}.`,"story");recordCombatFeedback("blocked",guardian,action);enemy=guardian;}}
  const charged=state.chargedAttack||{multiplier:1,critBonus:0};
  const multiplier=attack.multiplier*charged.multiplier;
  const armorBonuses=DUNGEON_RULES.armorBonuses(state.equippedArmor||{},state.class);
  const crit=Math.min(1,state.critChance+armorBonuses.critChance+(isSpellCast?0:(weapon.crit||0)+(weapon.critUpgrade||0))+(attack.critBonus||0)+charged.critBonus+(!isSpellCast&&weapon.effect==="Focus"?0.1:0)+(!isSpellCast&&["Headshot","Snipe"].includes(weapon.effect)||["Headshot","Snipe"].includes(attack.effect)?0.2:0));
  const targets=special?.selfOnly?[]:special?.aoe?fight.enemies.filter(candidate=>candidate.hp>0):[enemy];
  let landed=Boolean(special?.selfOnly);
  let attackDamageDealt=0;
  for(const target of targets){
    if(state.playerEffects?.Blind&&Math.random()<0.2){message(`Blindness makes your ${attack.name.toLowerCase()} miss.` ,"danger");recordCombatFeedback("miss",target,action);continue;}
    const tracksTarget=["Homing","Snipe","Headshot"].includes(weapon.effect)||["Homing","Snipe","Headshot"].includes(attack.effect);
    if(target.intent?.key==="dodge"&&!target.effects?.Root&&!tracksTarget){target.intentDodging=true;message(`${target.name} reads your movement and evades the attack!`,"danger");recordCombatFeedback("miss",target,action);continue;}
    if(Math.random()<target.dodge&&!target.effects?.Root&&!tracksTarget){message(`${target.name} dodges the attack!`,"danger");recordCombatFeedback("miss",target,action);continue;}
    landed=true;
  const passiveBonus=isSpellCast?1:({Penetration:1.15,Pierce:1.10,PiercingShot:1.12,Void:1.12,SpellPower:1.12,SpellEcho:1.08,Focus:1.08,Draw:1.12,DelayedCast:1.15,Overcast:1.25,RangeScaling:1.12,ArcaneCharge:1+Math.min(5,state.arcaneCharge||0)*0.04,Overdraw:1.25})[weapon.effect]||1;
    const momentumBonus=!isSpellCast&&weapon.effect==="Momentum"?1+Math.min(5,state.momentum||0)*0.04:1;
    const defensePierce=["Void","Penetration","Pierce","PiercingShot"].includes(weapon.effect)?0.5:0;
    const matchup=DUNGEON_RULES.elementMatchup(special?.element||weapon.element,target.element);
    const crippleScale=state.playerEffects?.Cripple?0.85:1;
    const classPenalty=isSpellCast?1:DUNGEON_RULES.weaponDamageMultiplier(state.class,weapon);
    const spellStat=state.class==="mage"?effectiveStat("int"):state.class==="archer"?effectiveStat("dex"):effectiveStat("str");
    const rawDamage=(spellStat+(isSpellCast?0:weapon.damage+(weapon.damageUpgrade||0)))*multiplier*(isSpellCast?1:passiveBonus*momentumBonus)*crippleScale*classPenalty*(target===enemy?1:special.secondaryMultiplier||0.5)*matchup.multiplier;
    const armorReduction=Math.max(0,target.damageReduction||0);
    let damage=isSpellCast?0:Math.max(1,Math.round(rawDamage-(target.damageReduction||0)*(1-defensePierce)));
    const guardReduced=target.intent?.key==="guard";
    const wardReduced=target.intent?.key==="ward";
    if(guardReduced||wardReduced)recordCombatFeedback("blocked",target,action);
    if(guardReduced)damage=DUNGEON_RULES.guardDamage(damage,isHeavy);
    if(wardReduced)damage=Math.max(1,Math.round(damage*0.7));
    if(target.effects?.Marked)damage=Math.round(damage*1.2);
    if(["Execution","ExecutionBolt"].includes(special?.effect)||["Execution","ExecutionBolt"].includes(weapon.effect))if(target.hp/target.maxHp<=0.3)damage=Math.round(damage*1.5);
    const isCrit=Math.random()<crit;if(isCrit)damage*=2;
    const reasons=[];
    reasons.push(`elemental ${matchup.relation}`);
    if(armorReduction)reasons.push(`enemy defense ${Math.round(armorReduction*(1-defensePierce))} applied`);
    if(guardReduced)reasons.push("Guard");
    if(wardReduced)reasons.push("Ward");
    if(classPenalty<1)reasons.push("off-class damage penalty");
    const detail=reasons.length?` (${reasons.join("; ")})`:"";
    const dealt=damage?applyEnemyDamage(target,damage,`${attack.name} hits ${target.name}${isCrit?" critically":""}${detail}`):0;
    attackDamageDealt+=dealt;
    let applied=isSpellCast?null:weapon.effect||null;
    if(!isSpellCast&&weapon.effect==="Thorns")state.playerEffects=DUNGEON_RULES.applyCombatEffect(state.playerEffects||{},"Thorns",damage);
    else if(!isSpellCast&&weapon.effect)applyWeaponEffect(target,weapon.effect,damage,!special?.aoe);
    if(special?.effect&&(isSpellCast||special.effect!==weapon.effect)){const upgradeBonus=isSpellCast?0:Math.max(0,(weapon.effectChance??0.2)-0.2);const chance=Math.min(1,(special.effectChance??0.2)+upgradeBonus);if(Math.random()<chance){applyWeaponEffect(target,special.effect,damage,!special.aoe,isSpellCast?special.duration:null);applied=special.effect;}else message(`${special.effect} did not trigger.`);}
    if((!isSpellCast&&weapon.effect==="LifeSteal")||special?.effect==="LifeSteal")state.hp=Math.min(state.maxHp,state.hp+Math.max(1,Math.round(damage*0.05)));
    if((!isSpellCast&&weapon.effect==="ManaSteal")||special?.effect==="ManaSteal")state.mana=Math.min(state.maxMana,state.mana+Math.max(1,Math.round(damage*0.05)));
    if(!isSpellCast&&weapon.effect==="ManaSurge")state.mana=Math.min(state.maxMana,state.mana+Math.max(1,Math.round(damage*0.08)));
    if(!isSpellCast&&weapon.effect==="ArcaneCharge")state.arcaneCharge=Math.min(5,(state.arcaneCharge||0)+1);
    if(!isSpellCast&&weapon.effect==="Momentum")state.momentum=Math.min(5,(state.momentum||0)+1);
    if(!isSpellCast&&(weapon.effect==="Afterimage"||weapon.effect==="Teleport"))state.playerEffects=DUNGEON_RULES.applyCombatEffect(state.playerEffects||{},"Afterimage",damage);
    if(!isSpellCast&&["SpellEcho","Conjure"].includes(weapon.effect)&&target.hp>0){const echo=Math.max(1,Math.round(damage*(weapon.effect==="Conjure"?0.2:0.3)));applyEnemyDamage(target,echo,`${weapon.effect==="Conjure"?"Conjured wisp":"Spell Echo"} adds damage to ${target.name}`);}
    if(applied)message(`Effect applied: ${applied}${matchup.relation!=="neutral"?` · elemental ${matchup.relation}`:""}.`);
  }
  if(isSpellCast&&special?.selfEffect){state.playerEffects=DUNGEON_RULES.applyCombatEffect(state.playerEffects||{},special.selfEffect,attackDamageDealt,special.duration);message(`${special.selfEffect} surrounds you for ${special.duration||1} turn${special.duration===1?"":"s"}.`,"reward");}
  if(landed&&special?.healOnHit&&attackDamageDealt){const restored=Math.min(state.maxHp-state.hp,Math.max(1,Math.round(attackDamageDealt*special.healOnHit)));if(restored){state.hp+=restored;message(`${attack.name} restores ${restored} health.`,"reward");}}
  const manaGain=basicFallback||isSpellCast?0:Math.max(0,Math.floor(Number(attack.manaGain)||(state.class==="mage"&&isBasic?5:state.class==="archer"&&weaponFamily(weapon)==="archer"&&isBasic?1:0)));
  if(arrowCost)message(`You spend ${arrowCost} arrow${arrowCost===1?"":"s"}. ${state.arrows} shared arrow${state.arrows===1?" remains":"s remain"}.`);
  if(landed&&manaGain){const restored=Math.min(manaGain,state.maxMana-state.mana);state.mana+=restored;if(restored)message(`Your attack restores ${restored} mana.`,"reward");}
  if(landed&&weapon.effect==="AmmoGeneration"&&Math.random()<0.2){const recovered=changeArrowCount(1);if(recovered)message(`Ammo Generation recovers ${recovered} arrow${recovered===1?"":"s"}.`);}
  if(landed&&weapon.effect==="Quiver"&&Math.random()<0.25){const recovered=changeArrowCount(2);if(recovered)message(`Quiver recovers ${recovered} arrow${recovered===1?"":"s"}.`);}
  state.chargedAttack=null;
  if(!isSpellCast&&weapon.effect==="Channel"&&landed){state.chargedAttack={multiplier:1.25,critBonus:0.05};message("Channel stores power for your next attack.");}
  state.aimed=false;
  if(special?.cooldown){const effectiveCooldown=Math.max(0,special.cooldown-(weapon.effect==="CooldownReduction"?1:0));if(effectiveCooldown)state.attackCooldowns[action]=effectiveCooldown+1;}
  if(isHeavy)state.cooldown=3;
  if(DUNGEON_RULES.allEnemiesDefeated(fight.enemies)){winFight();return;}
  if(wasBonusAttack){fight.bonusAttackPending=false;enemyTurn();return;}
  const living=fight.enemies.filter(candidate=>candidate.hp>0);
  const averageEnemyDex=living.reduce((sum,candidate)=>sum+(candidate.dex||8),0)/Math.max(1,living.length);
  if(living.length&&effectiveStat("dex")>=2*averageEnemyDex&&Math.random()<0.5){fight.bonusAttackPending=true;message("You’re too fast! Attack again before the enemies.","reward");render();return;}
  enemyTurn();
}

function resolveEnemyTurnAction(enemy) {
  processEnemyEffects(enemy);if(enemy.hp<=0)return;
  if(enemy.effects?.Frozen?.turns>0){message(`${enemy.name} is frozen solid and loses this turn.`,"story");return;}
  if(DUNGEON_RULES.consumeDisruptedIntent(enemy)){message(`${enemy.name}'s telegraphed action is disrupted.`,"story");return;}
  if(enemy.effects?.Silence&&["cast","shoot"].includes(enemy.intent?.key)){message(`${enemy.name} is silenced and cannot use its ranged attack this turn.`,"story");return;}
  if(enemy.effects?.Gust){delete enemy.effects.Gust;message(`${enemy.name} reels from the gust and loses its turn.`,"story");return;}
  if(enemy.effects?.Freeze&&enemy.effects.Freeze.stacks>=5){delete enemy.effects.Freeze;message(`${enemy.name} is frozen solid and loses its turn.`,"story");return;}
  if(enemy.intentDodging){enemy.intentDodging=false;message(`${enemy.name} spends its turn repositioning after the dodge.`,"story");return;}
  if(enemy.intent?.key==="dodge"){message(`${enemy.name} slips out of reach and repositions.`,"story");return;}
  if(enemy.intent?.key==="aim"){enemy.aimedShot=true;message(`${enemy.name} steadies its aim for a powerful shot.`,"danger");return;}
  if(enemy.intent?.key==="guard"){message(`${enemy.name} holds its guard and waits for an opening.`);return;}
  if(enemy.intent?.key==="ward"){message(`${enemy.name}'s ward fades after absorbing part of your attack.`);return;}
  if(enemy.intent?.key==="summon"||enemy.intent?.key==="buff"){
    const summonLimit=state.combat.boss?Math.min(4,1+Math.floor(state.floor/10)):Math.min(3,1+Math.floor(state.floor/8));
    const livingLimit=state.combat.boss?Math.min(7,4+Math.floor(state.floor/10)):Math.min(5,2+Math.floor(state.floor/8));
    if(enemy.intent.key==="summon"&&state.combat.summonedCount<summonLimit&&state.combat.enemies.filter(item=>item.hp>0).length<livingLimit){
      const summon=makeEnemy(state.floor,false,0);if(enemy.race==="skeleton"){summon.name="Lesser Skeleton";summon.race="skeleton";summon.klass="Warrior";summon.element="Earth";}summon.maxHp=Math.max(8,Math.round(summon.maxHp*0.35));summon.hp=summon.maxHp;summon.damage=Math.max(1,Math.round(summon.damage*0.45));summon.gold=0;summon.xp=0;summon.summoned=true;summon.intent=DUNGEON_RULES.chooseEnemyIntent(summon.klass,summon.race);state.combat.enemies.push(summon);state.combat.summonedCount++;message(`${enemy.name} calls ${summon.name.toLowerCase()} into the fight!`,"danger");
    }else if(enemy.intent.key==="buff"){
      for(const ally of state.combat.enemies.filter(item=>item.hp>0))ally.damage=Math.round(ally.damage*1.15);
      message(`${enemy.name} rallies its allies, increasing their damage.`,"danger");
    }else message(`${enemy.name} strains to summon, but its summoning limit is reached.`);
    return;
  }
  const intent=enemy.intent?.key;
  const damageScale=enemy.intent?.damageMultiplier||(intent==="cast"?1.15:intent==="shoot"?0.9:intent==="heavy"?1.25:1);
  const blind=enemy.effects?.Blind||enemy.effects?.Cripple?0.65:1;
  if(Math.random()<enemy.dodge||state.playerEffects?.Afterimage||Math.random()<passiveEvasionChance()||Math.random()>blind){delete state.playerEffects?.Afterimage;message(`You evade ${enemy.name}'s ${intent==="shoot"?"shot":intent==="cast"?"spell":"attack"}.`,"story");}
  else {
    const critical=Math.random()<(enemy.critChance||0);
    const weaknessScale=enemy.effects?.Weakness?0.55:1;
    enemyHitFlash=true;
    const damage=takePlayerDamage(Math.round(enemy.damage*damageScale*weaknessScale)*(critical?2:1),enemy);
    message(enemy.boss?`${enemy.name} uses ${enemy.intent.label}${critical?" critically":""} for ${damage} damage.`:`${enemy.name} ${intent==="shoot"?"shoots":intent==="cast"?"casts":intent==="heavy"?"lands a heavy blow on":"strikes"} you${critical?" critically":""} for ${damage} damage.`,"danger");
    if(enemy.hp<=0)return;
    if(enemy.lifeSteal&&damage>0){const healed=Math.min(enemy.maxHp-enemy.hp,Math.max(1,Math.round(damage*enemy.lifeSteal)));enemy.hp+=healed;if(healed)message(`${enemy.name} siphons ${healed} health.` ,"danger");}
    if(state.hp>0)tryApplyEliteAffinityEffect(enemy,intent,true);
    const thorns=Math.max(DUNGEON_RULES.armorBonuses(state.equippedArmor||{},state.class).thorns,state.playerEffects?.Thorns?0.2:0);
    if(thorns){const reflected=Math.max(1,Math.round(damage*thorns));const dealt=Math.min(enemy.hp,reflected);enemy.hp=Math.max(0,enemy.hp-reflected);state.combat.damageDealt+=dealt;state.runStats.damageDealt+=dealt;message(`Your thorns reflect ${reflected} damage to ${enemy.name}.`);}
    if(state.hp<=0){die();return;}
  }
}

function finishEnemyTurn() {
  if(!state.combat){combatResolution=null;return;}
  if(DUNGEON_RULES.allEnemiesDefeated(state.combat.enemies)){combatResolution=null;winFight();return;}
  const enemies=state.combat.enemies.filter(enemy=>enemy.hp>0);
  for(const enemy of enemies)enemy.effects=DUNGEON_RULES.tickCombatEffects(enemy.effects||{},{durationOnly:true}).statuses;
  for(const enemy of enemies){
    if(enemy.aimedShot){enemy.aimedShot=false;enemy.intent={key:"shoot",label:"Aimed Shot",damageMultiplier:1.5};}
    else enemy.intent=enemy.boss?nextBossIntent(enemy):DUNGEON_RULES.chooseEnemyIntent(enemy.klass,enemy.race);
  }
  if(!tickPlayerCombatEffects()){combatResolution=null;return;}
  for(const [key,value] of Object.entries(state.attackCooldowns||{})){state.attackCooldowns[key]=Math.max(0,value-1);if(!state.attackCooldowns[key])delete state.attackCooldowns[key];}
  for(const key of Object.keys(state.defenseCooldowns||{}))state.defenseCooldowns[key]=Math.max(0,state.defenseCooldowns[key]-1);
  state.activeDefense=null;
  state.cooldown=Math.max(0,(state.cooldown||0)-1);
  state.disruptCooldown=DUNGEON_RULES.tickDisruptCooldown(state.disruptCooldown||0);
  combatResolution=null;
  refreshCombatResolutionReadout(true);
  save();
}

function enemyTurn() {
  if(!state.combat)return;
  if(DUNGEON_RULES.allEnemiesDefeated(state.combat.enemies)){combatResolution=null;winFight();return;}
  state.combat.freshPlayerEffects=[];
  const enemies=state.combat.enemies.filter(enemy=>enemy.hp>0);
  if(typeof window.setTimeout!=="function"){
    for(const enemy of enemies){resolveEnemyTurnAction(enemy);if(!state.combat||state.hp<=0)return;}
    finishEnemyTurn();return;
  }
  const token=++combatResolutionToken;
  const fight=state.combat;
  const reducedMotion=window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const windup=reducedMotion?0:combatPacing==="slow"?850:320;
  const beat=reducedMotion?0:combatPacing==="slow"?300:140;
  let index=0;
  const advance=()=>{
    if(token!==combatResolutionToken||state.combat!==fight)return;
    while(index<enemies.length&&enemies[index].hp<=0)index++;
    if(index>=enemies.length){finishEnemyTurn();return;}
    const enemy=enemies[index++];
    combatResolution={phase:"enemy-windup",actor:enemy.name,enemyIndex:state.combat.enemies.indexOf(enemy),token};
    if(!updateCombatResolutionPresentation())render();
    window.setTimeout(()=>{
      if(token!==combatResolutionToken||state.combat!==fight)return;
      combatResolution={phase:"enemy-impact",actor:enemy.name,enemyIndex:state.combat.enemies.indexOf(enemy),token};
      resolveEnemyTurnAction(enemy);
      if(!state.combat||state.hp<=0){combatResolution=null;return;}
      refreshCombatResolutionReadout();
      window.setTimeout(advance,beat);
    },windup);
  };
  advance();
}

function tryApplyEliteAffinityEffect(enemy,intent,hit,random=Math.random){
  if(!enemy?.elite||!hit||!["attack","shoot","cast"].includes(intent)||!enemy.affinityEffect||random()>=0.15)return false;
  state.playerEffects=DUNGEON_RULES.applyCombatEffect(state.playerEffects||{},enemy.affinityEffect,enemy.damage||1);
  state.combat?.freshPlayerEffects?.push(enemy.affinityEffect);
  message(`${enemy.affinity} affinity inflicts ${enemy.affinityEffect} on you.` ,"danger");
  return true;
}

function tickPlayerCombatEffects(){
  if(!state.playerEffects)return true;
  const fresh=new Set(state.combat?.freshPlayerEffects||[]);
  const freshStatuses=Object.fromEntries([...fresh].filter(effect=>state.playerEffects[effect]).map(effect=>[effect,state.playerEffects[effect]]));
  if(state.combat)state.combat.freshPlayerEffects=[];
  const tick=DUNGEON_RULES.tickCombatEffects(state.playerEffects);
  state.playerEffects=tick.statuses;
  Object.assign(state.playerEffects,freshStatuses);
  for(const entry of tick.messages){
    if(fresh.has(entry.effect))continue;
    const damage=takePlayerDamage(entry.damage);
    message(`${entry.effect} deals ${damage} damage to you.`,"danger");
    if(state.hp<=0){die();return false;}
  }
  return true;
}

function applyWeaponEffect(enemy,effect,damage,allowChain=true,duration=null){
  enemy.effects ||= {};
  enemy.effects=DUNGEON_RULES.applyCombatEffect(enemy.effects,effect,damage,duration);
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
function passiveEvasionChance(){return Math.min(0.5,Math.max(0,effectiveDexterity()-10)*0.01+Math.max(0,effectiveStat("speed")-10)*0.005+Math.max(0,(state.weapon?.speed||10)-10)*0.005);}

function takePlayerDamage(damage, sourceEnemy = null) {
  let incoming=damage;
  if(state.weapon?.effect==="ManaShield"&&state.mana>0){const absorbed=Math.min(4,state.mana,incoming);state.mana-=absorbed;incoming-=absorbed;}
  const reduction=DUNGEON_RULES.armorDamageReduction(state.equippedArmor||{},state.class);
  let afterArmor=Math.max(1,Math.round(incoming*(1-reduction)));
  const defense=state.activeDefense;
  let fullyBlocked=false;
  if(defense?.type==="dodge")afterArmor=Math.max(1,Math.round(afterArmor*0.5));
  else if(defense&&["aegis","block"].includes(defense.type)&&defense.capacity>0){
    const incomingAfterArmor=afterArmor;
    const absorbed=Math.min(defense.capacity,afterArmor);
    defense.capacity-=absorbed;
    afterArmor-=absorbed;
    fullyBlocked=defense.type==="block"&&absorbed>=incomingAfterArmor;
    if(absorbed)message(`${defense.type==="aegis"?"Aegis absorbs":"Your shield absorbs"} ${absorbed} damage${defense.capacity===0?" and breaks":""}.`,defense.capacity===0?"danger":"story");
  }
  if(fullyBlocked&&sourceEnemy&&!defense.counterUsed){
    defense.counterUsed=true;
    const counterWeapon={...(state.weapon||{}),effect:null,element:"None"};
    const preview=attackPreview({multiplier:0.5,critBonus:0,cooldown:0,manaCost:0,ammoCost:0},1,sourceEnemy,counterWeapon,null);
    const counterDamage=Math.max(1,preview.primaryDamage);
    applyEnemyDamage(sourceEnemy,counterDamage,`Shield counter hits ${sourceEnemy.name} for ${counterDamage} damage`);
  }
  const actual=DUNGEON_RULES.applyBraceToDamage(state,afterArmor);
  state.hp=Math.max(0,state.hp-actual);
  if(state.combat){state.combat.damageTaken+=actual;state.runStats.damageTaken+=actual;}
  return actual;
}
function winFight(afterDeathFade=false) {
  if(!state?.combat)return;
  const fallenCards=screen.querySelectorAll(".combat-view .enemy-card[data-enemy-index]");
  const reducedMotion=window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if(fallenCards.length&&!reducedMotion&&!afterDeathFade&&!combatVictoryPending){
    combatVictoryPending=true;
    const token=++combatResolutionToken;
    combatResolution={phase:"enemy-death",actor:"Victory",token};
    updateCombatResolutionPresentation();
    fadeDefeatedEnemyCards();
    window.setTimeout(()=>{
      if(token!==combatResolutionToken||!state?.combat)return;
      combatVictoryPending=false;
      combatResolution=null;
      winFight(true);
    },520);
    return;
  }
  combatVictoryPending=false;
  clearCombatResolution();
  const fight=state.combat; const room=currentRoom();let totalGold=0,totalXp=0;
  for(const enemy of fight.enemies){totalGold+=enemy.gold;totalXp+=enemy.xp;}
  if(room.riskyChoice){totalGold=Math.round(totalGold*1.5);totalXp=Math.round(totalXp*1.5);}
  state.gold+=totalGold;totalXp+=Math.round(totalXp*0.35);const levels=gainXp(totalXp);
  let rewards=`Victory. +${totalGold} gold and +${totalXp} XP.`;
  if(fight.boss||room.riskyChoice||Math.random()<0.8){const lootRarity=DUNGEON_RULES.rollFloorLootRarity(state.floor,fight.boss,Math.random,room.enemyCount||1);const loot=makeLoot(lootRarity,fight);if(loot.kind==="bundle"){for(const reward of loot.items){grantLoot(reward);rewards+=` Loot: ${lootRewardName(reward.value)}.`;}}else{grantLoot(loot);rewards+=` Loot: ${lootRewardName(loot.value)}${loot.kind==="weapon"?` (${loot.value.type})`:loot.kind==="armor"?` (${loot.value.slot})`:""}.`;}if((loot.kind==="weapon"||loot.kind==="armor")&&Math.random()<0.15){const primaryRarity=loot.value.rarity||lootRarity;const potionTier=Math.max(0,RARITIES.indexOf(primaryRarity)-1);const potion=makePotionLoot(RARITIES[potionTier]);grantLoot(potion);rewards+=` Bonus: ${lootRewardName(potion.value)}.`;}}
  if(state.weapons.some(weapon=>["Bow","Crossbow"].includes(weapon.type))&&Math.random()<0.45){const recovered=changeArrowCount(6);if(recovered)rewards+=` +${recovered} arrows.`;}
  if(fight.enemies.some(enemy=>["Archer","Sharpshooter"].includes(enemy.klass))){const recovered=changeArrowCount(4);if(recovered)rewards+=` Archer dropped ${recovered} arrows.`;}
  if(levels)rewards+=` You leveled up! Current skillpoints: ${state.skillPoints}.`;
  const defeated=fight.enemies.filter(enemy=>!enemy.summoned).length;
  state.runStats.enemiesDefeated+=defeated;
  state.runStats.fights.unshift({floor:state.floor,boss:fight.boss,enemies:fight.enemies.map(enemy=>enemy.name),gold:totalGold,xp:totalXp,damageDealt:fight.damageDealt||0,damageTaken:fight.damageTaken||0,rewards,log:[...(fight.log||[])]});
  state.runStats.fights=state.runStats.fights.slice(0,20);
  state.combat=null;state.braced=false;state.activeDefense=null;room.cleared=true;
  if(fight.boss){state.currentFloor.bossCleared=true;state.floorsCleared++;const milestone=state.floor%MILESTONE_BOSS_INTERVAL===0;if(milestone){state.milestonePending=true;rewards+=` Milestone reached: Floor ${state.floor}. Choose whether to end this run or continue.`;}else rewards+=" The way to the next floor opens.";state.runStats.fights[0].rewards=rewards;state.runStats.fights.unshift({floor:state.floor,floorClear:true,milestone,level:state.level,enemiesDefeated:state.runStats.enemiesDefeated,gold:state.gold});state.runStats.fights=state.runStats.fights.slice(0,20);}
  message(rewards,"reward");render();
}

function gainXp(amount){state.xp+=amount;let count=0;while(state.xp>=xpToNext()){state.xp-=xpToNext();state.level++;state.skillPoints++;state.baseMaxHp=(state.baseMaxHp||state.maxHp)+20;state.maxHp=state.baseMaxHp+Object.values(state.equippedArmor||{}).reduce((sum,armor)=>sum+(armor.healthBonus||0),0);state.maxMana+=10;state.hp=Math.min(state.maxHp,state.hp+Math.ceil(state.maxHp*0.5));state.mana=state.maxMana;count++;}return count;}
function xpToNext(){const normal=state.level<9?200+(state.level-1)*100:Math.round(1000*Math.pow(1.3,state.level-9));return Math.round(normal*(DIFFICULTIES[state.difficulty]?.xpRequirement||1));}

function makeLootWeapon(forcedRarity=null,minimumRarity="Common",extraExcludedNames=[]){
  const room=currentRoom();
  let rarity=forcedRarity||DUNGEON_RULES.rollFloorLootRarity(state.floor,Boolean(state.combat?.boss),Math.random,room.enemyCount||1);
  if(RARITIES.indexOf(rarity)<RARITIES.indexOf(minimumRarity))rarity=minimumRarity;
  if(state.devMode&&Math.random()<0.6)rarity=choice(RARITIES.slice(2));
  const ownedNames=new Set([...(state.weapons||[]).map(item=>item.name),...extraExcludedNames]);
  const preferredFamily=DUNGEON_RULES.rollWeaponFamily(Math.random,state.chosenClass||state.class);
  const families=[preferredFamily,...["warrior","archer","mage"].filter(family=>family!==preferredFamily)];
  let candidates=families.flatMap(family=>(GAME_INDEX_DATA.weapons[family]||[]).filter(entry=>entry.rarity===rarity&&!ownedNames.has(entry.name)).map(entry=>({...entry,family})));
  if(!candidates.length){
    candidates=families.flatMap(family=>(GAME_INDEX_DATA.weapons[family]||[]).filter(entry=>!ownedNames.has(entry.name)).map(entry=>({...entry,family})));
    if(candidates.length){
      const targetTier=RARITIES.indexOf(rarity);
      const nearest=Math.min(...candidates.map(entry=>Math.abs(RARITIES.indexOf(entry.rarity)-targetTier)));
      candidates=candidates.filter(entry=>Math.abs(RARITIES.indexOf(entry.rarity)-targetTier)===nearest);
    }
  }
  if(!candidates.length)return null;
  const weaponScore=weapon=>(Number(weapon.damage)||0)*(1+(Number(weapon.crit)||0))*
    (1+Math.min(0.25,(weapon.attacks?.length||0)*0.025));
  const bestByFamily=new Map();
  for(const owned of state.weapons||[]){
    const family=weaponFamily(owned);if(!family)continue;
    bestByFamily.set(family,Math.max(bestByFamily.get(family)||0,weaponScore(owned)));
  }
  const upgrades=candidates.filter(entry=>{
    const candidate=DUNGEON_RULES.createCatalogWeapon(entry,state.floor);
    return !bestByFamily.has(entry.family)||weaponScore(candidate)>bestByFamily.get(entry.family);
  });
  if(upgrades.length)candidates=upgrades;
  const entry=choice(candidates);
  const weapon=DUNGEON_RULES.createCatalogWeapon(entry,state.floor);
  if(weapon.arrows&&state.arrows==null)state.arrows=0;
  return weapon;
}

function lootArmorOwned(){
  return [...new Set([...(state.armor||[]),...Object.values(state.equippedArmor||{})].filter(Boolean))];
}

function armorLootScore(armor){
  return (Number(armor.defense)||0)+DUNGEON_RULES.armorPieceDamageReduction(armor)*100+(Number(armor.healthBonus)||0)*0.1;
}

function makeLootArmor(rarity,allowNonUpgrade=false,extraExcludedNames=[]){
  const owned=lootArmorOwned();
  const ownedNames=new Set([...owned.map(item=>item.name),...extraExcludedNames]);
  const available=ARMOR_INDEX.filter(entry=>!ownedNames.has(entry.name));
  if(!available.length)return null;
  const targetTier=RARITIES.indexOf(rarity);
  const nearestRarity=entries=>{
    if(entries.some(entry=>entry.rarity===rarity))return entries.filter(entry=>entry.rarity===rarity);
    const distance=Math.min(...entries.map(entry=>Math.abs(RARITIES.indexOf(entry.rarity)-targetTier)));
    return entries.filter(entry=>Math.abs(RARITIES.indexOf(entry.rarity)-targetTier)===distance);
  };
  const slotFor=entry=>({"Head Armor":"head","Chest Armor":"chest","Legs Armor":"legs","Feet Armor":"feet","Shield Armor":"shield"})[entry.type];
  const ownedBySlot=new Map();
  for(const armor of owned){
    const slot=armor.slot;if(!slot)continue;
    ownedBySlot.set(slot,Math.max(ownedBySlot.get(slot)||0,armorLootScore(armor)));
  }
  const missingSlots=["head","chest","legs","feet","shield"].filter(slot=>!ownedBySlot.has(slot));
  let candidates=[];
  if(missingSlots.length){
    candidates=nearestRarity(available.filter(entry=>missingSlots.includes(slotFor(entry))));
  }
  if(!candidates.length){
    const upgrades=available.filter(entry=>{
      const armor=DUNGEON_RULES.createCatalogArmor(entry,state.floor);
      return armorLootScore(armor)>(ownedBySlot.get(armor.slot)||0);
    });
    candidates=upgrades.length?nearestRarity(upgrades):allowNonUpgrade?nearestRarity(available):[];
  }
  if(!candidates.length)return null;
  return DUNGEON_RULES.createCatalogArmor(choice(candidates),state.floor);
}

function lootNeedWeights(){
  let weapon=45,armor=40,item=15;
  const ownedBySlot=new Set(lootArmorOwned().map(piece=>piece.slot).filter(Boolean));
  const missingSlots=5-ownedBySlot.size;
  const armorCatchup=Math.min(20,missingSlots*4);
  armor+=armorCatchup;
  weapon-=Math.min(15,armorCatchup);
  const ownedNames=new Set((state.weapons||[]).map(piece=>piece.name));
  const weaponScore=piece=>(Number(piece.damage)||0)*(1+(Number(piece.crit)||0))*(1+Math.min(0.25,(piece.attacks?.length||0)*0.025));
  const hasWeaponUpgrade=(state.weapons||[]).length===0||Object.entries(GAME_INDEX_DATA.weapons).some(([family,entries])=>{
    const owned=(state.weapons||[]).filter(piece=>weaponFamily(piece)===family);
    const best=Math.max(0,...owned.map(weaponScore));
    return entries.some(entry=>{
      if(ownedNames.has(entry.name))return false;
      const candidate=DUNGEON_RULES.createCatalogWeapon(entry,state.floor);
      return !owned.length||weaponScore(candidate)>best;
    });
  });
  if(!hasWeaponUpgrade){const reduced=weapon*0.55;item+=weapon-reduced;weapon=reduced;}
  return{weapon,armor,item};
}

function makeLoot(rarity=null,fight=state.combat){
  rarity=rarity||DUNGEON_RULES.rollFloorLootRarity(state.floor,Boolean(fight?.boss),Math.random,currentRoom().enemyCount||1);
  const eligibleMages=(fight?.enemies||[]).filter(enemy=>["Mage","Quick Caster"].includes(enemy.klass)||/\bMage\b/i.test(enemy.name));
  const mageChance=fight?.boss?0.12:0.025;
  if(state.class&&(eligibleMages.length||fight?.boss)&&Math.random()<mageChance){
    const scroll=createClassSpellScroll(state.class,rarity,false,(state.spells||[]).map(spell=>spell.spellId).filter(Boolean));
    if(scroll){
      if(fight?.boss){
        const partner=Math.random()<0.5?makeLootWeapon(rarity):null;
        return{kind:"bundle",items:[{kind:"classSpell",value:scroll},partner?{kind:"weapon",value:partner}:makePotionLoot(rarity)]};
      }
      return{kind:"classSpell",value:scroll};
    }
  }
  const weights=lootNeedWeights();
  const first=DUNGEON_RULES.rollLootKind(Math.random,state.chosenClass||state.class,weights);
  const order=[first,...["armor","weapon","item"].filter(kind=>kind!==first)];
  for(const kind of order){
    if(kind==="weapon"){
      const weapon=makeLootWeapon(rarity);if(weapon)return{kind:"weapon",value:weapon};
    }else if(kind==="armor"){
      const armor=makeLootArmor(rarity);if(armor)return{kind:"armor",value:armor};
    }else return makePotionLoot(rarity);
  }
  return makePotionLoot(rarity);
}

function makePotionLoot(rarity="Common"){
  const type=DUNGEON_RULES.rollPotionType(Math.random,state.chosenClass||state.class);
  rarity=DUNGEON_RULES.avoidDuplicateDivine(rarity,state.items.some(item=>item.rarity==="Divine"&&item.type===type));
  return{kind:"item",value:{name:`${rarity} ${type==="mana"?"Mana":"Health"} Potion`,type,amount:0,quantity:1,rarity}};
}

function lootRewardName(item){
  const rarity=item?.rarity||"Common";
  let name=item?.spellName?`${item.spellName} Scroll`:item?.name||"Loot";
  if(name.startsWith(`${rarity} `))name=name.slice(rarity.length+1);
  return `${rarity} ${name}`;
}

function grantLoot(loot){
  if(loot.kind==="weapon"){state.weapons.push(loot.value);state.inventoryNotice=true;}
  else if(loot.kind==="armor"){state.armor.push(loot.value);state.inventoryNotice=true;equipCollectedArmor(loot.value);}
  else if(loot.kind==="classSpell"){state.spells||=[];state.spells.push(loot.value);state.inventoryNotice=true;}
  else addInventoryItem(loot.value);
}

function itemNameWithRarity(item) {
  const prefix=`${item.rarity} `;
  return item.name.startsWith(prefix)?item.name:`${prefix}${item.name}`;
}

function die(){clearCombatResolution();state.hp=0;state.braced=false;state.activeDefense=null;if(state.combat){state.runStats.fights.unshift({floor:state.floor,defeat:true,enemies:state.combat.enemies.map(enemy=>enemy.name),damageDealt:state.combat.damageDealt||0,damageTaken:state.combat.damageTaken||0,log:[...(state.combat.log||[])]});state.runStats.fights=state.runStats.fights.slice(0,20);}state.combat=null;state.deaths++;updatePersonalBest(state);submitCompletedRun(state);message(`${state.name} has fallen. The run is over.`,"danger");modal="death";render();}

function openInventory(){
  if(combatResolution)return;
  const returningFromSkills=modal==="skills";
  modalReturnFocusSelector="[data-open-inventory]";
  state.inventoryNotice=false;
  inventoryWeaponFamily=state.class||"warrior";
  if(!returningFromSkills)inventoryCategory="weapons";
  save();
  modal="inventory";render();
}
function equipWeapon(index){const weapon=state.weapons[index];if(!weapon)return;const family=weaponFamily(weapon);if(!family){message("That weapon type cannot be equipped.");modal="inventory";render();return;}state.weapon=weapon;state.class=state.chosenClass||state.class;weapon.attacks ||= DUNGEON_RULES.createWeaponAttacks(family,weapon.rarity,weapon.type,weapon.element||"Physical",weapon.manaCost||0);const offClass=family!==state.class;message(`${weapon.name} equipped${offClass?". Off-class attacks deal 25% less damage.":"."}`);modal="inventory";if(!refreshInventoryModal())render();}
function equipArmor(index){const armor=state.armor[index];if(!armor)return;state.equippedArmor=DUNGEON_RULES.equipArmor(state.equippedArmor||{},armor);updateArmorBonuses();message(`${armor.name} equipped in the ${armor.slot} slot.`);modal="inventory";if(!refreshInventoryModal())render();}
function equipSpell(index){const spell=state.spells[index];if(!spell)return;state.equippedSpellId=spell.id;const profile=classSpellAttack(spell);message(`${spell.spellName} equipped · ${classSpellCostLabel(spell)}.`);modal="inventory";if(!refreshInventoryModal())render();}
function equipBestArmor(){
  const candidates=[...state.armor,...Object.values(state.equippedArmor||{})];
  const equipped={...(state.equippedArmor||{})};
  for(const slot of ["head","chest","legs","feet","shield"]){
    const pieces=candidates.filter(item=>item?.slot===slot);
    pieces.sort((a,b)=>(Number(b.defense)||0)-(Number(a.defense)||0)||DUNGEON_RULES.armorPieceDamageReduction(b)-DUNGEON_RULES.armorPieceDamageReduction(a)||(Number(b.healthBonus)||0)-(Number(a.healthBonus)||0));
    if(pieces[0])equipped[slot]=pieces[0];
  }
  state.equippedArmor=equipped;
  updateArmorBonuses();
  message("Equipped the highest-defense armor available in each slot.");
  modal="inventory";
  if(!refreshInventoryModal())render();
}

function updateInventoryEquipmentSummary(){
  const modalElement=screen.querySelector(".modal[aria-labelledby='inventory-title']");
  if(!modalElement)return;
  const slots=modalElement.querySelector(".equipped-slots");
  if(slots)slots.innerHTML=["head","chest","legs","feet","shield"].map(slot=>`<div><span>${slot}</span><strong>${escapeHtml(state.equippedArmor[slot]?.name||"Empty")}</strong></div>`).join("");
  const summary=modalElement.querySelector(".armor-set-summary");
  if(summary)summary.textContent=armorSummaryText();
}
function weaponShopStats(weapon){
  const family=weaponFamily(weapon);
  const stat=state.class==="mage"?effectiveStat("int"):effectiveStat("str");
  const penalty=DUNGEON_RULES.weaponDamageMultiplier(state.class,weapon);
  const basic=Math.max(1,Math.round((stat+(weapon.damage||0)+(weapon.damageUpgrade||0))*penalty));
  const attacks=(weapon.attacks||[]).map(attack=>attack.name).join(", ")||"Basic attack";
  return `${escapeHtml(weapon.type)} (${family}) · ${weapon.damage+(weapon.damageUpgrade||0)} weapon damage · ${Math.round(((weapon.crit||0)+(weapon.critUpgrade||0))*100)}% crit · ${elementBadge(weapon.element||"Physical")} · ${escapeHtml(attacks)}${penalty<1?" · off-class ×0.75":""}`;
}
function renderShopGearItem(item,index){
  const value=item.value;
  if(item.kind==="classSpell")return `<article class="shop-item ${rarityClass(value.rarity)}">${itemArt(`Images/Items/Spells/${value.file}`,value.name)}<div><span class="item-meta">${escapeHtml(value.rarity)} · ${escapeHtml(CLASS_NAMES[value.className])} class spell</span><strong>${escapeHtml(value.spellName)}</strong><p>${escapeHtml(value.description)} · ${classSpellCostLabel(value)} · ${item.price} gold</p></div><button class="small-button" data-buy="${index}" ${state.gold<item.price?"disabled":""}>Buy</button></article>`;
  const isWeapon=item.kind==="weapon";
  const current=isWeapon?state.weapon:state.equippedArmor?.[value.slot];
  const offered=isWeapon?weaponShopStats(value):`${escapeHtml(value.slot)} · ${value.defense||0} defense · ${Math.round(DUNGEON_RULES.armorPieceDamageReduction(value)*100)}% damage reduction · +${value.healthBonus||0} max HP`;
  const compared=current?(isWeapon?weaponShopStats(current):`${escapeHtml(current.slot)} · ${current.defense||0} defense · ${Math.round(DUNGEON_RULES.armorPieceDamageReduction(current)*100)}% damage reduction · +${current.healthBonus||0} max HP`):"None equipped";
  return `<article class="shop-item ${rarityClass(value.rarity)}">${isWeapon?weaponArt(value):itemArt(`Images/Armor/${value.file}`,value.name)}<div><span class="item-meta">${escapeHtml(value.rarity)} ${escapeHtml(item.kind)}</span><strong>${escapeHtml(value.name)}</strong><p>${item.price} gold</p><div class="shop-comparison"><span><b>New:</b> ${offered}</span><span><b>Equipped:</b> ${compared}</span></div></div><button class="small-button" data-buy="${index}" ${state.gold<item.price?"disabled":""}>Buy</button></article>`;
}
function renderShopTabs(upgradeWeapons){
  const gear=state.shopStock.map((item,index)=>({item,index})).filter(({item})=>item.kind!=="classSpell");
  const spells=state.shopStock.map((item,index)=>({item,index})).filter(({item})=>item.kind==="classSpell");
  const tab=(key,label)=>`<button type="button" role="tab" class="tab-button ${shopTab===key?"active":""}" id="shop-tab-${key}" data-shop-tab="${key}" aria-controls="shop-panel-${key}" aria-selected="${shopTab===key}" tabindex="${shopTab===key?0:-1}">${label}</button>`;
  const panel=(key,contents)=>`<section class="shop-tab-panel" id="shop-panel-${key}" role="tabpanel" tabindex="0" aria-labelledby="shop-tab-${key}" data-shop-panel="${key}" ${shopTab===key?"":"hidden"}>${contents}</section>`;
  const stockUpgrade=`<div class="shop-upgrade"><div><strong>Stock quality · Level ${state.shopLootUpgradeLevel||0}/5</strong><p>Improve the rarity odds for this run. Next upgrade: ${shopUpgradeCost()} gold.</p></div><button class="small-button" data-upgrade-shop ${(state.shopLootUpgradeLevel||0)>=5||state.gold<shopUpgradeCost()?"disabled":""}>Upgrade</button></div>`;
  const weapons=`${stockUpgrade}<h3 class="shop-section-title">Weapons &amp; armor</h3><div class="shop-list">${gear.length?gear.map(({item,index})=>renderShopGearItem(item,index)).join(""):`<p class="empty-list">No weapons or armor in stock.</p>`}</div><details class="sell-inventory"><summary>Sell from inventory</summary>${renderSellList()}</details>`;
  const forge=`<p class="shop-forge-note">Upgrade any weapon you own. Off-class attacks still deal 25% less damage. Upgrade limits reset each floor.</p>${upgradeWeapons.length?`<label class="forge-select-label">Weapon <select data-forge-weapon>${upgradeWeapons.map(({weapon,index})=>`<option value="${index}" ${index===state.upgradeWeaponIndex?"selected":""}>${escapeHtml(weapon.name)} · ${escapeHtml(weapon.rarity)} ${escapeHtml(weapon.type)} · Lv ${weapon.level||1}</option>`).join("")}</select></label>${renderWeaponForge(upgradeWeapons.find(entry=>entry.index===state.upgradeWeaponIndex)?.weapon)}`:`<p class="empty-list">No weapons available to upgrade.</p>`}`;
  const potionStock=(state.shopPotions||[]).map((item,index)=>`<article class="shop-item">${potionArt(item.value)}<div><span class="item-meta">${escapeHtml(item.value.rarity)} potion</span><strong>${escapeHtml(item.value.name)}</strong><p>${item.price} gold</p></div><button class="small-button" data-buy-potion="${index}" ${state.gold<item.price?"disabled":""}>Buy</button></article>`).join("");
  const spellsStock=spells.map(({item,index})=>renderShopGearItem(item,index)).join("");
  const consumables=`<h3 class="shop-section-title">Potions</h3><div class="shop-list shop-potions">${potionStock||`<p class="empty-list">No potions in stock.</p>`}</div><h3 class="shop-section-title">Class spells</h3><div class="shop-list shop-spells">${spellsStock||`<p class="empty-list">No spells in stock.</p>`}</div>`;
  return `<div class="shop-tabs" role="tablist" aria-label="Shop categories">${tab("weapons","Weapons &amp; Armor")}${tab("forge","Forge")}${tab("consumables","Potions &amp; Spells")}</div><div class="shop-tab-content">${panel("weapons",weapons)}${panel("forge",forge)}${panel("consumables",consumables)}</div>`;
}
function showModal(){
  const old=screen.querySelector(".modal-backdrop");if(old)old.remove();
  let content="";
  if(modal==="new-run"){
    const slot=pendingNewRunSlot||"slot1";
    const label=slot==="dev"?"Dev slot":`Slot ${slot.slice(-1)}`;
    content=`<section class="modal new-run-modal" role="dialog" aria-modal="true" aria-labelledby="new-run-title"><div class="modal-heading"><div><p class="section-kicker">New expedition · ${label}</p><h2 id="new-run-title">Create your character</h2></div><button class="icon-close" data-close-modal aria-label="Cancel new run">×</button></div><form class="new-run-form" data-new-run-form><label for="new-run-name">Character name</label><input id="new-run-name" name="name" type="text" maxlength="22" autocomplete="off" required placeholder="Enter a name"><fieldset class="run-difficulty-options"><legend>Choose difficulty <span>(required)</span></legend><label class="run-difficulty-option"><input type="radio" name="new-run-difficulty" value="easy" required><span><strong>Easy</strong><small>Gentler enemies, faster leveling, lower prices.</small></span></label><label class="run-difficulty-option"><input type="radio" name="new-run-difficulty" value="normal" required><span><strong>Normal</strong><small>Standard balance.</small></span></label><label class="run-difficulty-option"><input type="radio" name="new-run-difficulty" value="hard" required><span><strong>Hard</strong><small>Tougher enemies, slower leveling, higher prices.</small></span></label></fieldset><div class="new-run-actions"><button class="action-button" type="submit">Start expedition</button><button class="secondary-button" type="button" data-cancel-new-run>Cancel</button></div></form></section>`;
  } else if(modal==="milestone"){
    const region=regionForFloor(state.floor);
    content=`<section class="modal milestone-modal" role="dialog" aria-modal="true" aria-labelledby="milestone-title"><p class="section-kicker">Milestone boss defeated · Floor ${state.floor}</p><h2 id="milestone-title">The threshold is yours.</h2><p>You have cleared ${state.floorsCleared} floors and reached the end of ${escapeHtml(region.name)}.</p><p>End the run to record this result, or continue into the next region. You can reach another milestone boss after 20 more floors.</p><div class="action-grid"><button class="action-button" data-milestone-end>End run · record score</button><button class="action-button secondary" data-milestone-continue>Continue to floor ${state.floor+1}</button></div></section>`;
  } else if(modal==="run-end"){
    const endedAtMilestone=state.runEndReason==="milestone";
    content=`<section class="modal death-modal" role="dialog" aria-modal="true" aria-labelledby="run-end-title"><p class="section-kicker">Run complete${endedAtMilestone?" · milestone clear":""}</p><h2 id="run-end-title">${endedAtMilestone?`${escapeHtml(state.name)} has conquered the threshold.`:`${escapeHtml(state.name)} ends the expedition.`}</h2><p>Floors cleared: ${state.floorsCleared} · Level ${state.level}</p>${state.devMode?`<p class="run-submission-result">Dev runs do not count toward personal or global records.</p>`:state.runSubmissionStatus?`<p class="run-submission-result">${escapeHtml(state.runSubmissionStatus)}</p>`:"<p class=\"run-submission-result\">Personal best recorded. Global score submission is pending or unavailable.</p>"}${!state.devMode&&(state.runSubmissionStatus?.includes("Global submission failed:")||state.runSubmissionStatus?.startsWith("Global submission status is unknown:"))?'<button class="small-button" data-retry-score>Retry global submission</button>':""}<div class="action-grid"><button class="action-button" data-title>Return to title</button></div></section>`;
  } else if(modal==="inventory"){
    content=`<section class="modal" role="dialog" aria-modal="true" aria-labelledby="inventory-title"><div class="modal-heading"><div><p class="section-kicker">Pack &amp; equipment</p><h2 id="inventory-title">Inventory</h2></div><button class="icon-close" data-close-modal aria-label="Close inventory">×</button></div><div class="inventory-tabs"><button class="tab-button active" data-tab="weapons">Weapons</button><button class="tab-button" data-tab="armor">Armor</button><button class="tab-button" data-tab="items">Items</button><button class="tab-button" data-tab="class-spells">Class Spells</button><button class="tab-button" data-open-skills>Skills${state.skillPoints ? ` (${state.skillPoints} unspent)` : ""}</button></div><div class="equipped-slots">${["head","chest","legs","feet","shield"].map(slot=>`<div><span>${slot}</span><strong>${escapeHtml(state.equippedArmor?.[slot]?.name||"Empty")}</strong></div>`).join("")}</div><p class="armor-set-summary">${escapeHtml(armorSummaryText())}</p><div class="inventory-list" id="inventory-list">${renderInventoryItems("weapons")}</div><p class="inventory-gold">${state.gold} gold · ${state.class?escapeHtml(CLASS_NAMES[state.class]):"Class unchosen"}</p></section>`;
  } else if(modal==="skills"){
    content=`<section class="modal skills-modal" role="dialog" aria-modal="true" aria-labelledby="skills-title"><div class="modal-heading"><div><p class="section-kicker">Character development</p><h2 id="skills-title">Skills &amp; advanced stats</h2></div><button class="icon-close" data-close-modal aria-label="Close skills">×</button></div><p class="skill-points">Unspent skill points: <strong>${state.skillPoints}</strong></p><div class="skill-list">${DUNGEON_RULES.STAT_DEFINITIONS.map(stat=>{const cost=DUNGEON_RULES.skillPointCost(state,stat.key);return `<article class="skill-row" data-skill-row="${stat.key}"><div><strong>${stat.label}: ${statValueLabel(stat)}</strong><p>${statDescription(stat)}${stat.key==="dex"&&state.class==="archer"&&state.equippedArmor?.shield?" Equipped shield penalty applied.":""}</p></div><button class="small-button" data-spend-stat="${stat.key}" ${state.skillPoints<cost || (stat.key === "critChance" && state.critChance>=1) ? "disabled" : ""}>Improve · ${cost} SP</button></article>`;}).join("")}</div><button class="secondary-button skill-inventory-link" data-open-inventory type="button">Return to inventory</button></section>`;
  } else if(modal==="shop"){
    const upgradeWeapons=state.weapons.map((weapon,index)=>({weapon,index})).filter(({weapon})=>weaponFamily(weapon));
    if(!upgradeWeapons.some(entry=>entry.index===state.upgradeWeaponIndex))state.upgradeWeaponIndex=upgradeWeapons.find(entry=>entry.weapon===state.weapon)?.index??upgradeWeapons[0]?.index??-1;
    content=`<section class="modal shop-modal" role="dialog" aria-modal="true" aria-labelledby="shop-title"><div class="modal-heading"><div><p class="section-kicker">Floor ${state.floor} merchant · ${DIFFICULTIES[state.difficulty]?.label||"Normal"}</p><h2 id="shop-title">Shop</h2></div><button class="icon-close" data-close-modal aria-label="Close shop">×</button></div>${renderShopTabs(upgradeWeapons)}<div class="shop-footer"><span>${state.gold} gold</span><button class="small-button" data-reroll ${state.gold<shopRerollCost()?"disabled":""}>Reroll · ${shopRerollCost()} gold</button></div></section>`;
  } else if(modal==="death"){
    content=`<section class="modal death-modal" role="dialog" aria-modal="true" aria-labelledby="death-title"><p class="section-kicker">Run ended</p><h2 id="death-title">You have fallen.</h2><p>Floors cleared: ${state.floorsCleared} · Level ${state.level}</p>${state.devMode?`<p class="run-submission-result">Dev runs do not count toward personal or global records.</p>`:state.runSubmissionStatus?`<p class="run-submission-result">${escapeHtml(state.runSubmissionStatus)}</p>`:""}${!state.devMode&&(state.runSubmissionStatus?.includes("Global submission failed:")||state.runSubmissionStatus?.startsWith("Global submission status is unknown:"))?'<button class="small-button" data-retry-score>Retry global submission</button>':""}<div class="action-grid"><button class="action-button" data-restart>Restart run</button><button class="action-button secondary" data-title>Return to title</button></div></section>`;
  } else if(modal==="recap"){
    const fights=state.runStats?.fights||[];
    content=`<section class="modal recap-modal" role="dialog" aria-modal="true" aria-labelledby="recap-title"><div class="modal-heading"><div><p class="section-kicker">Run record · Floor ${state.floor}</p><h2 id="recap-title">Expedition recap</h2></div><button class="icon-close" data-close-modal aria-label="Close run recap">×</button></div><div class="recap-totals"><span><b>${state.floorsCleared}</b> floors cleared</span><span><b>${state.runStats?.enemiesDefeated||0}</b> enemies defeated</span><span><b>${state.runStats?.damageDealt||0}</b> damage dealt</span><span><b>${state.runStats?.damageTaken||0}</b> damage taken</span></div><div class="recap-list">${fights.length?fights.map((fight,index)=>`<details class="recap-entry" ${index===0?"open":""}><summary>${fight.floorClear?`Floor ${fight.floor} cleared`:fight.defeat?`Defeat on Floor ${fight.floor}`:`Floor ${fight.floor} · ${fight.boss?"Boss fight":"Battle"} · ${fight.enemies.map(escapeHtml).join(", ")}`}</summary>${fight.floorClear?`<p>Level ${fight.level} · ${fight.enemiesDefeated} enemies defeated · ${fight.gold} gold carried</p>`:`<p>${escapeHtml(fight.rewards||"Run ended before victory.")}</p><p>${fight.damageDealt||0} damage dealt · ${fight.damageTaken||0} damage taken</p>`}<div class="recap-log">${(fight.log||[]).map(entry=>`<p class="${escapeHtml(entry.tone||"")}">${escapeHtml(entry.text)}</p>`).join("")||"<p>No battle events recorded.</p>"}</div></details>`).join(""):`<p class="empty-list">No battles recorded yet.</p>`}</div></section>`;
  } else if(modal==="leaderboard"){
    content=`<section class="modal leaderboard-modal" role="dialog" aria-modal="true" aria-labelledby="leaderboard-title"><div class="modal-heading"><div><p class="section-kicker">Global rankings · Top 100</p><h2 id="leaderboard-title">Highest floors</h2></div><button class="icon-close" data-close-modal aria-label="Close leaderboard">×</button></div>${renderLeaderboard()}</section>`;
  } else if(modal==="settings"){
    content=`<section class="modal settings-modal" role="dialog" aria-modal="true" aria-labelledby="settings-title"><div class="modal-heading"><div><p class="section-kicker">Personalize your expedition</p><h2 id="settings-title">Settings</h2></div><button class="icon-close" data-close-modal aria-label="Close settings">×</button></div><fieldset class="combat-pacing-options"><legend>Combat pacing</legend><label class="pacing-option ${combatPacing==="fast"?"selected":""}"><input type="radio" name="combat-pacing" value="fast" data-pacing="fast" ${combatPacing==="fast"?"checked":""}><span><strong>Fast</strong><small>Short cues and quick turns.</small></span></label><label class="pacing-option ${combatPacing==="slow"?"selected":""}"><input type="radio" name="combat-pacing" value="slow" data-pacing="slow" ${combatPacing==="slow"?"checked":""}><span><strong>Slow</strong><small>Longer wind-ups and more time to read each action.</small></span></label></fieldset><p class="settings-note">Reduced-motion preferences minimize combat animation and delays.</p></section>`;
  } else if(modal==="index"){
    content=`<section class="modal index-modal" role="dialog" aria-modal="true" aria-labelledby="index-title"><div class="modal-heading"><div><p class="section-kicker">Field reference</p><h2 id="index-title">Index</h2></div><button class="icon-close" data-close-modal aria-label="Close Index">×</button></div><div class="index-layout"><nav class="index-categories" aria-label="Index categories">${[["guide","Quick Guide"],["regions","Regions"],["enemy-types","Enemy Types"],["warrior","Warrior Weapons"],["archer","Archer Weapons"],["mage","Mage Weapons"],["armor","Armor"],["items","Items"],["effects","Effects"]].map(([key,label])=>`<button class="index-category ${indexCategory===key?"active":""}" data-index-category="${key}">${label}</button>`).join("")}</nav><div class="index-content" id="index-content">${renderIndexCategory()}</div></div></section>`;
  }
  if(!content)return;
  screen.insertAdjacentHTML("beforeend",`<div class="modal-backdrop">${content}</div>`);
  if(lastFocusedModalName!==modal){
    const dialog=screen.querySelector('.modal[role="dialog"]');
    const first=modal==="new-run"?dialog?.querySelector("#new-run-name"):dialog?.querySelector("[data-close-modal]")||dialog?.querySelector('button:not(:disabled),input:not(:disabled),select:not(:disabled)');
    first?.focus?.({preventScroll:true});
    lastFocusedModalName=modal;
  }
  bindArtFallbacks();
  screen.querySelector("[data-new-run-form]")?.addEventListener("submit",event=>{
    event.preventDefault();
    const nameInput=event.currentTarget.querySelector("#new-run-name");
    const name=nameInput?.value.trim()||"";
    const difficulty=event.currentTarget.querySelector('input[name="new-run-difficulty"]:checked')?.value||"";
    if(!name){nameInput?.setCustomValidity("Enter a character name to start.");nameInput?.reportValidity();return;}
    nameInput?.setCustomValidity("");
    if(!DIFFICULTIES[difficulty]){event.currentTarget.reportValidity();return;}
    const slot=pendingNewRunSlot;
    if(!slot)return;
    pendingNewRunSlot=null;
    modal=null;
    lastFocusedModalName=null;
    modalReturnFocusSelector=null;
    newRun(name,slot==="dev",slot,difficulty);
  });
  screen.querySelector("#new-run-name")?.addEventListener("input",event=>event.currentTarget.setCustomValidity(""));
  screen.querySelector("[data-cancel-new-run]")?.addEventListener("click",()=>screen.querySelector(".modal-backdrop [data-close-modal]")?.click());
  screen.querySelectorAll("[name='new-run-difficulty']").forEach(input=>input.addEventListener("change",()=>screen.querySelectorAll(".run-difficulty-option").forEach(label=>label.classList.toggle("selected",label.querySelector("input")?.checked))));
  screen.querySelectorAll("[data-pacing]").forEach(input=>input.addEventListener("change",()=>{combatPacing=input.dataset.pacing==="slow"?"slow":"fast";try{localStorage.setItem(COMBAT_PACING_KEY,combatPacing);}catch{};showModal();}));
  screen.querySelector("[data-close-modal]")?.addEventListener("click",event=>{
    const backdrop=screen.querySelector(".modal-backdrop");
    if(backdrop?.classList.contains("modal-closing"))return;
    const finishClose=()=>{
    const returnSelector=modalReturnFocusSelector;
    if(modal==="new-run")pendingNewRunSlot=null;
    modal=null;lastFocusedModalName=null;render();
    modalReturnFocusSelector=null;
    if(returnSelector){
      const restoreFocus=()=>{
        if(modal)return;
        const returnTarget=screen.querySelector(returnSelector);
        if(returnTarget?.isConnected)returnTarget.focus?.({preventScroll:true});
      };
      if(typeof requestAnimationFrame==="function")requestAnimationFrame(restoreFocus);
      else restoreFocus();
    }
    };
    const reducedMotion=window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if(!backdrop||reducedMotion){finishClose();return;}
    event.currentTarget.blur();
    backdrop.classList.add("modal-closing");
    backdrop.addEventListener("animationend",finishClose,{once:true});
  });
  screen.querySelectorAll("[data-tab]").forEach(button=>button.addEventListener("click",()=>{inventoryCategory=button.dataset.tab;screen.querySelectorAll("[data-tab]").forEach(tab=>tab.classList.toggle("active",tab===button));refreshInventoryList(inventoryCategory);}));
  bindInventoryListActions();
  screen.querySelectorAll("[data-open-skills]").forEach(button=>button.addEventListener("click",openSkills));
  screen.querySelectorAll("[data-spend-stat]").forEach(button=>button.addEventListener("click",()=>spendSkillPoint(button.dataset.spendStat)));
  bindUseItem();
  bindInventoryControls();
  screen.querySelectorAll("[data-buy]").forEach(button=>button.addEventListener("click",()=>buyItem(Number(button.dataset.buy))));
  screen.querySelectorAll("[data-buy-potion]").forEach(button=>button.addEventListener("click",()=>buyPotion(Number(button.dataset.buyPotion))));
  screen.querySelectorAll("[data-sell-type]").forEach(button=>button.addEventListener("click",()=>sellItem(button.dataset.sellType,Number(button.dataset.sellIndex))));
  screen.querySelectorAll("[data-shop-tab]").forEach(button=>{
    button.addEventListener("click",()=>{
      shopTab=button.dataset.shopTab;
      screen.querySelectorAll("[data-shop-tab]").forEach(tab=>{
        const active=tab===button;
        tab.classList.toggle("active",active);
        tab.setAttribute("aria-selected",String(active));
        tab.tabIndex=active?0:-1;
      });
      screen.querySelectorAll("[data-shop-panel]").forEach(panel=>{
        const active=panel.dataset.shopPanel===shopTab;
        panel.hidden=!active;
        if(active)animateMenuSwap(panel);
      });
    });
    button.addEventListener("keydown",event=>{
      const tabs=[...screen.querySelectorAll("[data-shop-tab]")];
      const current=tabs.indexOf(button);
      const next=event.key==="ArrowRight"?(current+1)%tabs.length:event.key==="ArrowLeft"?(current-1+tabs.length)%tabs.length:event.key==="Home"?0:event.key==="End"?tabs.length-1:-1;
      if(next<0)return;
      event.preventDefault();tabs[next].focus();tabs[next].click();
    });
  });
  screen.querySelectorAll("[data-index-category]").forEach(button=>button.addEventListener("click",()=>{indexCategory=button.dataset.indexCategory;selectedIndexItem=null;screen.querySelectorAll("[data-index-category]").forEach(category=>category.classList.toggle("active",category===button));const content=screen.querySelector("#index-content");content.innerHTML=renderIndexCategory();animateMenuSwap(content);bindIndexItems();}));
  screen.querySelectorAll("[data-leaderboard-difficulty]").forEach(button=>button.addEventListener("click",()=>refreshGlobalLeaderboard(button.dataset.leaderboardDifficulty)));
  screen.querySelector("[data-leaderboard-retry]")?.addEventListener("click",()=>refreshGlobalLeaderboard(leaderboardDifficulty));
  if(modal==="leaderboard") refreshGlobalLeaderboard(leaderboardDifficulty);
  bindIndexItems();
  screen.querySelector("[data-reroll]")?.addEventListener("click",rerollShop);
  screen.querySelector("[data-upgrade-shop]")?.addEventListener("click",upgradeShopLoot);
  screen.querySelector("[data-forge-weapon]")?.addEventListener("change",event=>{state.upgradeWeaponIndex=Number(event.target.value);modal="shop";render();});
  screen.querySelectorAll("[data-weapon-upgrade]").forEach(button=>button.addEventListener("click",()=>upgradeWeapon(button.dataset.weaponUpgrade)));
  screen.querySelector("[data-restart]")?.addEventListener("click",()=>newRun(state.name,state.devMode,state.saveSlot,state.difficulty));
  screen.querySelector("[data-retry-score]")?.addEventListener("click",()=>submitCompletedRun(state));
  screen.querySelector("[data-title]")?.addEventListener("click",()=>{modal=null;state=null;titleButton.hidden=true;startScreen();});
  const milestoneDialog=screen.querySelector(".milestone-modal");
  milestoneDialog?.querySelector("[data-milestone-end]")?.addEventListener("click",finishMilestoneRun);
  milestoneDialog?.querySelector("[data-milestone-continue]")?.addEventListener("click",()=>{if(!state?.milestonePending)return;state.milestonePending=false;modal=null;advanceFloor();});
}

function getIndexWeaponEntries(family) {
  return GAME_INDEX_DATA.weapons[family];
}

function effectIcon(effectName) {
  const icons={
    Burn:'<path d="M12 2c1 4-2 5-1 8 1-1 2-2 2-4 4 4 5 7 3 11a6 6 0 0 1-11-2c-1-4 2-7 7-13Z"/><path d="M11 13c-2 2-2 5 1 6 2 0 3-2 2-4"/>',
    Freeze:'<path d="M12 2v20M4 7l16 10M20 7 4 17M9 4l3 2 3-2M9 20l3-2 3 2M4 10l3-1V6M17 18v-3l3-1M4 14l3 1v3M17 6v3l3 1"/>',
    Frozen:'<path d="M12 2v20M4 7l16 10M20 7 4 17M9 4l3 2 3-2M9 20l3-2 3 2"/>',
    Weakness:'<path d="M12 2 20 5v6c0 5-3 8-8 11-5-3-8-6-8-11V5l8-3Z"/><path d="m9 10 3 3 3-3M12 7v6"/>',
    Silence:'<path d="M4 5h16v11h-8l-5 4v-4H4zM8 9l8 4M16 9l-8 4"/>',
    Gust:'<path d="M3 7h13c3 0 3-4 0-4M3 12h17c3 0 3 4 0 4M3 17h8"/>',
    Root:'<path d="M12 21V9m0 5C5 14 5 7 5 7s7 0 7 7Zm0-3c0-6 7-7 7-7s1 7-7 9ZM8 21h8"/>',
    Poison:'<path d="M12 2S5 10 5 15a7 7 0 0 0 14 0c0-5-7-13-7-13Z"/><path d="m9 13 6 5m0-5-6 5"/>',
    Bleed:'<path d="M12 2S5 10 5 15a7 7 0 0 0 14 0c0-5-7-13-7-13Z"/><path d="M9 16c1 2 3 3 5 2"/>',
    Blind:'<path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/><path d="m4 20 16-16"/>',
    Void:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 1v3M23 12h-3M12 23v-3M1 12h3"/>',
    Shock:'<path d="m13 2-9 12h7l-1 8 10-13h-7z"/>',
    LifeSteal:'<path d="M20.8 8.5c0 5-8.8 11-8.8 11s-8.8-6-8.8-11a4.6 4.6 0 0 1 8.8-1.7 4.6 4.6 0 0 1 8.8 1.7Z"/>',
    ManaSteal:'<path d="M12 2S5 10 5 15a7 7 0 0 0 14 0c0-5-7-13-7-13Z"/><path d="M8 15h8m-4-4v8"/>',
    Execution:'<path d="M12 2 21 7v10l-9 5-9-5V7l9-5Z"/><path d="m8 10 2 2m6-2-2 2m-4 4c1 1 3 1 4 0"/>',
    Momentum:'<path d="M3 7h10l-3-3m3 3-3 3M7 12h14l-3-3m3 3-3 3M3 17h10l-3-3m3 3-3 3"/>',
    Marked:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    Thorns:'<path d="M12 22V4m0 7-5-4 1 6-5 1 9 4m0-7 5-4-1 6 5 1-9 4"/>',
    Chain:'<path d="m9 15-2 2a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0m4 2 2-2a4 4 0 0 1 6 6l-4 4a4 4 0 0 1-6 0m-5-5h8"/>',
    default:'<path d="M12 2 21 7v10l-9 5-9-5V7z"/><path d="M8 12h8"/>'
  };
  const key=effectName.replace(/\s/g,"");
  const path=icons[key]||icons.default;
  return `<svg class="effect-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
}

function formatIndexElement(element) { return element === "None" ? "Physical" : element; }
function formatIndexEffect(effect) { return effect.replace(/([a-z])([A-Z])/g,"$1 $2"); }

function renderIndexCategory() {
  if(selectedIndexItem){
    const item=selectedIndexItem;
    return `<button class="index-back" data-index-back>← Back to ${escapeHtml(item.categoryLabel)}</button><div class="index-detail">${item.art||""}<p class="item-meta">${escapeHtml(item.rarity||"")}${item.type?` · ${escapeHtml(item.type)}`:""}</p><h3>${escapeHtml(item.name)}</h3>${item.element?`<p>Element: ${elementBadge(formatIndexElement(item.element))}</p>`:""}${item.damage?`<p>Base damage: ${item.damage}</p>`:""}${item.effect?`<p>Effect: ${effectIcon(item.effect)} ${escapeHtml(formatIndexEffect(item.effect))}</p>`:""}<p>${escapeHtml(item.description||"")}</p></div>`;
  }
  if(["warrior","archer","mage"].includes(indexCategory)){
    const familyLabel=CLASS_NAMES[indexCategory];
    const entries=getIndexWeaponEntries(indexCategory);
    return `<p class="index-intro">${entries.length} ${familyLabel.toLowerCase()} weapon designs.</p><div class="index-list">${entries.map((item,index)=>`<button class="index-entry ${rarityClass(item.rarity)}" data-index-item="${index}"><span class="index-entry-name">${escapeHtml(item.name)}</span><span class="index-entry-meta">${escapeHtml(item.rarity)} ${escapeHtml(item.type)} · ${elementBadge(formatIndexElement(item.element))} · ${effectIcon(item.effect)} ${escapeHtml(formatIndexEffect(item.effect))}</span></button>`).join("")}</div>`;
  }
  if(indexCategory==="armor"||indexCategory==="items"){
    const entries=indexCategory==="armor"?ARMOR_INDEX:ITEM_INDEX;
    return `<p class="index-intro">${entries.length} ${indexCategory==="armor"?"armor pieces.":"items and ammunition."}</p><div class="index-list">${entries.map((item,index)=>`<button class="index-entry ${rarityClass(item.rarity)}" data-index-item="${index}"><span class="index-entry-name">${escapeHtml(item.name)}</span><span class="index-entry-meta">${escapeHtml(item.rarity)} · ${escapeHtml(item.type)}</span></button>`).join("")}</div>`;
  }
  if(indexCategory==="regions")return `<p class="index-intro">The dungeon cycles through ${REGION_DEFINITIONS.length} regions, each five floors long, then repeats every ${REGION_CYCLE_FLOORS} floors with deeper scaling. Enemy pools and race traits vary by region. Every ${MILESTONE_BOSS_INTERVAL}th floor ends with the Threshold Warden, whose defeat lets you end the run or continue.</p><div class="region-index-list">${REGION_DEFINITIONS.map((region,index)=>{const live=regionForFloor(state?.floor||1);return `<article class="region-index-entry ${live.id===region.id?"active":""}"><p class="section-kicker">Floors ${index*BIOME_FLOORS+1}–${(index+1)*BIOME_FLOORS} · repeats every ${REGION_CYCLE_FLOORS} floors</p><h3>${escapeHtml(region.name)}</h3><p><strong>Enemy pool:</strong> ${escapeHtml(regionRaceNames(region))}</p><p><strong>Available roles:</strong> ${escapeHtml(regionRaceRoles(region))}</p><p><strong>Regular bosses:</strong> ${region.bosses.map(escapeHtml).join(" · ")}</p><p><strong>Regional rule:</strong> ${escapeHtml(region.rule)}</p><p>${escapeHtml(region.briefing)}</p></article>`;}).join("")}</div>`;
  if(indexCategory==="enemy-types")return `<p class="index-intro">These enemy roles are active in the dungeon. Race and role combinations depend on the current region.</p><div class="region-index-list">${ENEMY_TYPE_PROFILES.map(profile=>`<article class="region-index-entry"><p class="section-kicker">${escapeHtml(profile.family)} · ${escapeHtml(profile.status)}</p><h3>${escapeHtml(profile.name)}</h3><p><strong>Strength:</strong> ${escapeHtml(profile.strengths)}</p><p><strong>Weakness:</strong> ${escapeHtml(profile.weakness)}</p></article>`).join("")}</div>`;
  if(indexCategory==="guide")return `<p class="index-intro">Quick Guide</p><div class="quick-guide"><section><h3>Class roles</h3><p>Warriors focus on melee and strength, Archers on ranged attacks and speed, and Mages on magic and intelligence. Your chosen class stays fixed when you equip another class's weapon.</p></section><section><h3>Mana and arrows</h3><p>Staffs and wands spend mana, even when used off-class. Bows and crossbows spend from one shared arrow supply. If the resource runs out, a weaker fallback attack remains available.</p></section><section><h3>Elements</h3><p>Fire is weak to Water; Water is weak to Earth or Nature; Earth is weak to Wind; Wind is weak to Fire. Advantage and resistance change final damage.</p></section><section><h3>Fountains</h3><p>Inspect a fountain to learn what it is. Drinking restores health, and you can leave and return before using it.</p></section><section><h3>Off-class weapons</h3><p>You can equip any weapon. Attacks made with a weapon outside your chosen class deal 25% less damage, while its attacks, effects, and resource costs still apply.</p></section><section><h3>Regions and milestones</h3><p>Regions change every five floors and define their enemy pool and signature trait. Every 20th-floor milestone boss gives you the option to end the run and record your score or continue.</p></section></div>`;
  return `<p class="index-intro">Effect glossary</p><div class="index-list effect-list">${EFFECT_DETAILS.map(([name,icon,description])=>`<article class="index-entry effect-entry"><span class="effect-name">${effectIcon(name)}${escapeHtml(name)}</span><span class="index-entry-meta">${escapeHtml(description)}</span></article>`).join("")}</div>`;
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
  return entries.map(item=>({...item,categoryLabel:category==="armor"?"Armor":"Items",art:item.file?(category==="armor"?itemArt(`Images/Armor/${item.file}`,item.name):potionArt({...item,type:/mana/i.test(item.name)?"mana":"health"})): `<div class="item-art"><span>${escapeHtml(item.name)}</span></div>`}));
}

function renderInventoryItems(tab){
  if(tab==="class-spells"){
    const equipped=state.spells?.find(spell=>spell.id===state.equippedSpellId);
    const header=`<p class="armor-set-summary">Equipped class spell (one slot): <strong>${escapeHtml(equipped?.spellName||"None")}</strong> · Class spells cost mana and use your combat turn. Weapon attacks remain listed with your weapon.</p>`;
    const cards=(state.spells||[]).map((spell,index)=>`<article class="inventory-item ${rarityClass(spell.rarity)}">${itemArt(`Images/Items/Spells/${spell.file||"spell-scroll.svg"}`,spell.name)}<div class="item-copy"><span class="item-meta">${escapeHtml(spell.rarity)} · ${escapeHtml(CLASS_NAMES[spell.className]||"Adventurer")} class spell</span><strong>${escapeHtml(spell.spellName||spell.name)}</strong><span class="item-stats">${escapeHtml(spell.description)} · ${classSpellCostLabel(spell)} · ${spell.duration||1} turn effect · ${spell.cooldown?`${spell.cooldown} turn cooldown`:"No cooldown"}${spell.aoe?" · Hits all enemies":" · One target"}${spell.className!==state.class?" · Off-class power reduced":""}</span></div><div class="inventory-item-actions">${spell.id===state.equippedSpellId?`<span class="equipped-tag">Equipped</span><button class="small-button" data-unequip-spell>Unequip</button>`:`<button class="small-button" data-equip-spell="${index}">Equip</button>`}<button class="small-button" data-inventory-sell="spell" data-sell-index="${index}" ${spell.id===state.equippedSpellId?"disabled title=\"Unequip this class spell before selling it\"":""}>Sell · ${sellValue(spell,"spell")}g</button></div></article>`).join("");
    return `${header}${cards||"<p class=\"empty-list\">No class spell scrolls collected. Find one in loot or buy one from a shop.</p>"}`;
  }
  if(tab==="items"){
    const ammunition=renderArrowInventoryItem();
    const rarityOrder=RARITIES;
    const items=state.items.map((item,index)=>({item,index})).sort((a,b)=>{
      const result=itemSort.key==="count"?a.item.quantity-b.item.quantity:rarityOrder.indexOf(a.item.rarity)-rarityOrder.indexOf(b.item.rarity);
      return result?(itemSort.direction==="desc"?-result:result):a.item.name.localeCompare(b.item.name);
    }).map(({item,index})=>{
      const restoration=item.type==="mana"?`Restores ${MANA_POTION_PERCENT[item.rarity]||20}% max MP (${manaPotionRestore(item)} MP now)`:`Restores ${HEALTH_POTION_PERCENT[item.rarity]||20}% max HP (${healthPotionRestore(item)} HP now)`;
      return `<article class="inventory-item ${rarityClass(item.rarity)}">${potionArt(item)}<div class="item-copy"><span class="item-meta">${escapeHtml(item.rarity)} · x${item.quantity}</span><strong>${escapeHtml(item.name)}</strong><span class="item-stats">${restoration}</span></div><div class="inventory-item-actions"><button class="small-button" data-use-item="${index}">Use</button><button class="small-button" data-inventory-sell="item" data-sell-index="${index}">Sell · ${sellValue(item,"item")}g</button></div></article>`;
    }).join("");
    const sortButton=(key,label)=>`<button class="sort-button ${itemSort.key===key?"active":""}" data-item-sort="${key}" aria-label="Sort items by ${label} ${itemSort.key===key?(itemSort.direction==="desc"?"descending":"ascending"):"descending"}">${label} <span>${itemSort.key===key?(itemSort.direction==="desc"?"↓":"↑"):"↕"}</span></button>`;
    const controls=state.items.length?`<div class="weapon-sort-controls item-sort-controls">${sortButton("rarity","Rarity")}${sortButton("count","Count")}</div>`:"";
    return `${ammunition}${controls}${items||(!ammunition?"<p class=\"empty-list\">No items in your pack.</p>":"")}`;
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
  if(tab==="armor")return state.armor.length?`<div class="inventory-toolbar"><button class="small-button" data-equip-best>Equip Best</button></div>${state.armor.map((item,index)=>{const equipped=state.equippedArmor?.[item.slot]===item;return `<article class="inventory-item ${rarityClass(item.rarity)}">${itemArt(`Images/Armor/${item.file||`${slug(item.set||"iron")}-${item.slot}.png`}`,item.name)}<div class="item-copy"><span class="item-meta">${escapeHtml(item.rarity)} · ${escapeHtml(item.slot)} · ${escapeHtml(item.set||"")}</span><strong>${escapeHtml(item.name)}</strong><span class="item-stats">${item.defense} defense · ${Math.round(DUNGEON_RULES.armorPieceDamageReduction(item)*100)}% damage reduction · +${item.healthBonus||0} max HP · ${escapeHtml(armorPerkText(item))}</span></div><div class="inventory-item-actions">${equipped?`<span class="equipped-tag">Equipped</span>`:`<button class="small-button" data-equip-armor="${index}">Equip</button>`}<button class="small-button" data-inventory-sell="armor" data-sell-index="${index}" ${equipped?"disabled title=\"Unequip this armor before selling it\"":""}>Sell · ${sellValue(item,"armor")}g</button></div></article>`;}).join("")}`:`<p class="empty-list">No armor collected.</p>`;
  const ammunition=renderArrowInventoryItem();
  return `${ammunition}${state.items.length?state.items.map((item,index)=>`<article class="inventory-item ${rarityClass(item.rarity)}">${potionArt(item)}<div class="item-copy"><span class="item-meta">${escapeHtml(item.rarity)} · x${item.quantity}</span><strong>${escapeHtml(item.name)}</strong><span class="item-stats">${item.type==="mana"?`Restores ${MANA_POTION_PERCENT[item.rarity]||20}% max MP (${manaPotionRestore(item)} MP now)`: `Restores ${HEALTH_POTION_PERCENT[item.rarity]||20}% max HP (${healthPotionRestore(item)} HP now)`}</span></div><div class="inventory-item-actions"><button class="small-button" data-use-item="${index}">Use</button><button class="small-button" data-inventory-sell="item" data-sell-index="${index}">Sell · ${sellValue(item,"item")}g</button></div></article>`).join(""):`${ammunition?"":"<p class=\"empty-list\">No items in your pack.</p>"}`}`;
}

function renderArrowInventoryItem(){
  const hasBow=state?.class==="archer"||[state?.weapon,...(state?.weapons||[])].some(weapon=>["Bow","Crossbow"].includes(weapon?.type));
  return hasBow?`<article class="inventory-item"><div class="item-art"><span>Arrows</span></div><div class="item-copy"><span class="item-meta">Shared ammunition</span><strong>Arrows</strong><span class="item-stats">${Math.max(0,Math.floor(Number(state.arrows)||0))} shared arrows for bows and crossbows</span></div></article>`:"";
}

function weaponFamily(weapon){return DUNGEON_RULES.weaponFamilyForType(weapon?.type);}

function bindInventoryControls(){
  screen.querySelectorAll("[data-weapon-family]").forEach(button=>button.addEventListener("click",()=>{inventoryWeaponFamily=button.dataset.weaponFamily;refreshInventoryList("weapons");}));
  screen.querySelectorAll("[data-weapon-sort]").forEach(button=>button.addEventListener("click",()=>{
    const key=button.dataset.weaponSort;
    weaponSort=weaponSort.key===key?{key,direction:weaponSort.direction==="desc"?"asc":"desc"}:{key,direction:key==="name"?"asc":"desc"};
    refreshInventoryList("weapons");
  }));
  screen.querySelectorAll("[data-item-sort]").forEach(button=>button.addEventListener("click",()=>{
    const key=button.dataset.itemSort;
    itemSort=itemSort.key===key?{key,direction:itemSort.direction==="desc"?"asc":"desc"}:{key,direction:"desc"};
    refreshInventoryList("items");
  }));
}

function bindInventoryListActions(){
  screen.querySelectorAll("#inventory-list [data-equip-weapon]").forEach(button=>button.addEventListener("click",()=>equipWeapon(Number(button.dataset.equipWeapon))));
  screen.querySelectorAll("#inventory-list [data-equip-armor]").forEach(button=>button.addEventListener("click",()=>equipArmor(Number(button.dataset.equipArmor))));
  screen.querySelector("#inventory-list [data-equip-best]")?.addEventListener("click",equipBestArmor);
  screen.querySelectorAll("#inventory-list [data-equip-spell]").forEach(button=>button.addEventListener("click",()=>equipSpell(Number(button.dataset.equipSpell))));
  screen.querySelector("#inventory-list [data-unequip-spell]")?.addEventListener("click",()=>{state.equippedSpellId=null;message("Your spell is unequipped.");modal="inventory";if(!refreshInventoryModal())render();});
  screen.querySelectorAll("#inventory-list [data-inventory-sell]").forEach(button=>button.addEventListener("click",()=>sellItem(button.dataset.inventorySell,Number(button.dataset.sellIndex),"inventory")));
}

function refreshInventoryList(tab){
  const list=screen.querySelector("#inventory-list");
  if(!list)return;
  const scrollTop=list.scrollTop,scrollLeft=list.scrollLeft;
  list.innerHTML=renderInventoryItems(tab);
  list.scrollTop=scrollTop;list.scrollLeft=scrollLeft;
  animateMenuSwap(list);
  bindInventoryListActions();bindUseItem();bindInventoryControls();
}

function refreshInventoryModal(){
  if(modal!=="inventory")return false;
  const list=screen.querySelector("#inventory-list");
  if(!list)return false;
  const scrollTop=list.scrollTop,scrollLeft=list.scrollLeft;
  refreshInventoryList(inventoryCategory);
  list.scrollTop=scrollTop;list.scrollLeft=scrollLeft;
  screen.querySelectorAll("[data-tab]").forEach(tab=>tab.classList.toggle("active",tab.dataset.tab===inventoryCategory));
  updateInventoryEquipmentSummary();
  const gold=screen.querySelector(".inventory-gold");
  if(gold)gold.textContent=`${state.gold} gold · ${state.class?CLASS_NAMES[state.class]:"Class unchosen"}`;
  save();
  return true;
}

function bindUseItem(){screen.querySelectorAll("[data-use-item]").forEach(button=>button.addEventListener("click",()=>{if(state.combat?.bonusAttackPending){message("Take your extra attack before using an item.");render();return;}const item=state.items[Number(button.dataset.useItem)];if(!item)return;if(item.type==="health")state.hp=Math.min(state.maxHp,state.hp+healthPotionRestore(item));else state.mana=Math.min(state.maxMana,state.mana+manaPotionRestore(item));item.quantity--;if(item.quantity<=0)state.items.splice(state.items.indexOf(item),1);message(`Used ${item.name}.${state.combat?" Your turn passes.":""}`);modal="inventory";if(state.combat)enemyTurn();else render();}));}

function openShop(){
  modalReturnFocusSelector='[data-action="shop"]';
  shopTab="weapons";
  if(!Array.isArray(state.shopStock))state.shopStock=generateShopStock();else{state.shopStock=state.shopStock.filter((item,index,items)=>item.kind!=="classSpell"||items.findIndex(candidate=>candidate.kind==="classSpell")===index);if(!state.shopStock.some(item=>item.kind==="classSpell")){const offer=shopClassSpellOffer();if(offer)state.shopStock.push(offer);}}state.shopScrollAdded=true;if(!Array.isArray(state.shopPotions))state.shopPotions=[shopPotion()].filter(Boolean);else state.shopPotions=state.shopPotions.slice(0,1);modal="shop";render();
}
function generateShopStock(){
  state.shopStock=[];
  for(let index=0;index<5;index++){const offer=shopItem();if(offer)state.shopStock.push(offer);}
  const spell=shopClassSpellOffer();if(spell)state.shopStock.push(spell);
  return state.shopStock;
}
function shopClassSpellOffer(){const rarity=DUNGEON_RULES.rollShopRarity(state.shopLootUpgradeLevel||0,Math.random(),state.floor);const value=createClassSpellScroll(state.chosenClass||state.class||"warrior",rarity,false,(state.spells||[]).map(spell=>spell.spellId).filter(Boolean));if(!value)return null;return{kind:"classSpell",value,price:priceFor(24+state.floor*4+classSpellManaCost(value)*2,value.rarity)};}
function armorShopPrice(armor){const armorBaseValue=Math.max(Number(armor.goldValue)||0,Math.round(((Number(armor.defense)||0)*4+(DUNGEON_RULES.armorPieceDamageReduction(armor)||0)*200+(Number(armor.healthBonus)||0)*0.2)*(1+Math.max(0,state.floor-1)*0.04)));return priceFor(armorBaseValue,armor.rarity);}
function potionShopPrice(rarity="Common"){return priceFor(18+state.floor*3,rarity);}
function shopItem(){
  const rarity=DUNGEON_RULES.rollShopRarity(state.shopLootUpgradeLevel||0,Math.random(),state.floor);
  const weights=lootNeedWeights();const kind=DUNGEON_RULES.rollLootKind(Math.random,state.chosenClass||state.class,{weapon:weights.weapon,armor:weights.armor,item:0});
  const existingNames=(state.shopStock||[]).map(offer=>offer?.value?.name).filter(Boolean);
  if(kind==="weapon"){
    const value=makeLootWeapon(rarity,"Common",existingNames);
    if(value)return{kind:"weapon",value,price:priceFor(value.goldValue||value.damage*5,value.rarity)};
  }
  const armor=makeLootArmor(rarity,true,existingNames);
  if(armor)return{kind:"armor",value:armor,price:armorShopPrice(armor)};
  const weapon=makeLootWeapon(rarity,"Common",existingNames);
  return weapon?{kind:"weapon",value:weapon,price:priceFor(weapon.goldValue||weapon.damage*5,weapon.rarity)}:null;
}
function shopPotion(){const rarity=DUNGEON_RULES.rollShopRarity(state.shopLootUpgradeLevel||0,Math.random(),state.floor);const value=makePotionLoot(rarity).value;return{kind:"item",value,price:potionShopPrice(rarity)};}
function priceFor(base,rarity="Common"){const rarityScale=[1,1.25,1.6,2.2,3,4,7][Math.max(0,RARITIES.indexOf(rarity))];return Math.max(1,Math.round(base*rarityScale*(DIFFICULTIES[state.difficulty]?.shopCost||1)*(1-Math.max(0,effectiveStat("cha")-10)*0.02)));}
function shopRerollCost(){const floorScale=1+Math.max(0,(state.floor||1)-1)*0.08;const upgradeScale=1+Math.max(0,state.shopLootUpgradeLevel||0)*0.12;return Math.round(30*floorScale*upgradeScale*(DIFFICULTIES[state.difficulty]?.shopCost||1));}
function shopUpgradeCost(){return Math.round(100*Math.pow(1.7,state.shopLootUpgradeLevel||0)*(DIFFICULTIES[state.difficulty]?.shopCost||1));}
function weaponUpgradeCost(weapon){return Math.round((5+3*Math.max(0,(state.floor||1)-1))*Math.pow(1.35,weaponUpgradeCount(weapon))*(DIFFICULTIES[state.difficulty]?.shopCost||1));}
function weaponUpgradeCount(weapon){return (weapon.upgradeFloor||state.floor)===state.floor?(weapon.upgradesThisFloor||0):0;}
function renderWeaponForge(weapon){
  if(!weapon)return "";
  const count=weaponUpgradeCount(weapon),cost=weaponUpgradeCost(weapon),disabled=state.gold<cost;
  const choices=[
    ["damage",`Damage +${state.floor} (locked to this floor)`],
    ["crit","Crit +1 percentage point"],
    ["speed","Weapon Speed +2 (improves evasion)"],
    ...(weapon.attacks?.some(attack=>attack.effect)?[["effect","Special-attack effect chance +4 points"]]:[])
  ];
  return `<div class="weapon-forge-status"><span>Level ${weapon.level||1}</span><span>${count} upgrade${count===1?"":"s"} this floor</span><span>${weapon.damage+(weapon.damageUpgrade||0)} damage · ${Math.round(((weapon.crit||0)+(weapon.critUpgrade||0))*100)}% weapon crit · ${Math.round((weapon.effectChance??0.2)*100)}% special-effect chance</span></div><div class="forge-upgrades">${choices.map(([key,label])=>`<button class="small-button" data-weapon-upgrade="${key}" ${disabled?"disabled":""}>${escapeHtml(label)} · ${cost}g</button>`).join("")}</div><p class="forge-cost-note">Next upgrade costs ${cost} gold. The price rises with each purchase and resets at the start of the next floor.</p>`;
}
function upgradeWeapon(upgrade){
  const weapon=state.weapons[Number(state.upgradeWeaponIndex)];
  if(!weapon||!weaponFamily(weapon))return;
  const count=weaponUpgradeCount(weapon),cost=weaponUpgradeCost(weapon);
  if(state.gold<cost)return;
  if(weapon.upgradeFloor!==state.floor){weapon.upgradeFloor=state.floor;weapon.upgradesThisFloor=0;}
  state.gold-=cost;
  if(upgrade==="damage")weapon.damageUpgrade=(weapon.damageUpgrade||0)+state.floor;
  else if(upgrade==="crit")weapon.critUpgrade=(weapon.critUpgrade||0)+0.01;
  else if(upgrade==="speed"){weapon.speed=(weapon.speed||10)+2;weapon.speedUpgrade=(weapon.speedUpgrade||0)+2;}
  else if(upgrade==="effect"&&weapon.attacks?.some(attack=>attack.effect))weapon.effectChance=Math.min(1,(weapon.effectChance??0.2)+0.04);
  else {state.gold+=cost;return;}
  weapon.level=(weapon.level||1)+1;weapon.upgradesThisFloor=(weapon.upgradesThisFloor||0)+1;
  message(`${weapon.name} upgraded: ${upgrade}.` ,"reward");modal="shop";render();
}
function buyItem(index){const item=state.shopStock[index];if(!item||state.gold<item.price)return;state.gold-=item.price;if(item.kind==="armor")item.value.shopPurchasePrice=item.price;if(item.kind==="weapon"){state.weapons.push(item.value);state.inventoryNotice=true;}else if(item.kind==="classSpell"){state.spells||=[];state.spells.push(item.value);state.inventoryNotice=true;}else{state.armor.push(item.value);state.inventoryNotice=true;equipCollectedArmor(item.value);}state.shopStock.splice(index,1);if(item.value.rarity==="Divine"){state.shopStock=state.shopStock.filter(offer=>offer.kind!==item.kind||offer.value.name!==item.value.name);}message(`Purchased ${item.value.name}.`);modal="shop";render();}
function buyPotion(index){const item=state.shopPotions?.[index];if(!item||state.gold<item.price)return;state.gold-=item.price;item.value.shopValue=item.price;addInventoryItem(item.value);state.shopPotions.splice(index,1);message(`Purchased ${item.value.name}.`);modal="shop";render();}
function rerollShop(){const cost=shopRerollCost();if(state.gold<cost){message(`Rerolling costs ${cost} gold.`);modal="shop";render();return;}state.gold-=cost;state.shopStock=generateShopStock();state.shopScrollAdded=true;state.shopPotions=[shopPotion()].filter(Boolean);modal="shop";render();}
function upgradeShopLoot(){if((state.shopLootUpgradeLevel||0)>=5)return;const cost=shopUpgradeCost();if(state.gold<cost)return;state.gold-=cost;state.shopLootUpgradeLevel=(state.shopLootUpgradeLevel||0)+1;state.shopStock=generateShopStock();state.shopScrollAdded=true;state.shopPotions=[shopPotion()].filter(Boolean);message(`Permanent shop stock upgrade increased to level ${state.shopLootUpgradeLevel} for this run.`);modal="shop";render();}

function sellValue(item,kind){
  if(kind==="armor"){const shopPrice=Number(item.shopPurchasePrice)>0?Number(item.shopPurchasePrice):armorShopPrice(item);return Math.max(1,Math.round(shopPrice*0.5));}
  if(kind==="item"&&["health","mana"].includes(item.type)){const shopPrice=Number(item.shopValue)>0?Number(item.shopValue):potionShopPrice(item.rarity);return Math.max(1,Math.round(shopPrice*0.5));}
  const rarityIndex=Math.max(0,RARITIES.indexOf(item.rarity||"Common"));
  const base=kind==="weapon"?Math.max(8,Math.round((item.damage||1)*2.5)):kind==="spell"?Math.max(8,Math.round((item.manaCost||5)*1.5)):Math.max(2,Math.round((item.amount||5)*0.15));
  return Math.max(1,Math.round(base*(1+rarityIndex*0.35)));
}

function renderSellList(){
  const groups=[{kind:"weapon",items:state.weapons},{kind:"armor",items:state.armor},{kind:"item",items:state.items},{kind:"spell",items:state.spells||[]}];
  const entries=groups.flatMap(group=>group.items.map((item,index)=>({item,index,kind:group.kind}))).filter(({item,kind})=>!(kind==="weapon"&&item===state.weapon)&&!(kind==="armor"&&Object.values(state.equippedArmor||{}).includes(item))&&!(kind==="spell"&&item.id===state.equippedSpellId));
  if(!entries.length)return `<p class="empty-list">No unequipped gear or consumables to sell.</p>`;
  return `<div class="sell-list">${entries.map(({item,index,kind})=>`<article class="sell-row"><span>${escapeHtml(item.rarity||"Common")} ${escapeHtml(item.name)}${kind==="item"?` · x${item.quantity}`:""}</span><button class="small-button" data-sell-type="${kind}" data-sell-index="${index}">Sell · ${sellValue(item,kind)} gold</button></article>`).join("")}</div>`;
}

function sellItem(kind,index,returnModal="shop"){
  const list=kind==="weapon"?state.weapons:kind==="armor"?state.armor:kind==="spell"?state.spells:state.items;
  const item=list[index];if(!item)return;
  if(kind==="weapon"&&item===state.weapon)return;
  if(kind==="armor"&&Object.values(state.equippedArmor||{}).includes(item))return;
  if(kind==="spell"&&item.id===state.equippedSpellId)return;
  const value=sellValue(item,kind);
  state.gold+=value;
  if(kind==="item"&&item.quantity>1)item.quantity--;else list.splice(index,1);
  message(`Sold ${item.name} for ${value} gold.`);
  modal=returnModal;
  if(returnModal==="inventory"&&refreshInventoryModal())return;
  render();
}

function finishMilestoneRun(){
  if(!state?.milestonePending||state.floor%MILESTONE_BOSS_INTERVAL!==0||state.runEnded)return;
  state.milestonePending=false;state.runEnded=true;state.runEndReason="milestone";updatePersonalBest(state);submitCompletedRun(state);modal="run-end";message(`Run complete. ${state.floorsCleared} floors cleared.`,"reward");render();
}

function endRunEarly(){
  if(!state||state.runEnded||state.floorsCleared<1||!window.confirm(`Are you sure you want to end this run and submit your score for ${state.floorsCleared} floors cleared?`))return;
  state.combat=null;state.milestonePending=false;state.runEnded=true;state.runEndReason="manual";state.activeDefense=null;state.braced=false;
  updatePersonalBest(state);submitCompletedRun(state);modal="run-end";
  message(`You end the run after clearing ${state.floorsCleared} floors. Your score has been recorded.`,"reward");render();
}

function advanceFloor(){
  if(!state||state.runEnded||state.milestonePending)return;
  const previousRegion=regionForFloor(state.floor);
  state.floor++;state.baseMaxHp=(state.baseMaxHp||state.maxHp)+Math.floor(state.maxHp*0.08);state.maxHp=state.baseMaxHp+DUNGEON_RULES.armorBonuses(state.equippedArmor||{},state.class).healthBonus;state.hp=Math.min(state.maxHp,state.hp+Math.round(state.maxHp*0.2));state.mana=state.maxMana;state.shopStock=null;state.shopPotions=null;state.shopSpell=null;state.shopScrollAdded=false;state.currentFloor=makeFloor(state.floor);state.currentFloor.rooms[0].visited=true;state.items=state.items.filter(item=>item.quantity>0);
  const nextRegion=regionForFloor(state.floor);
  if(previousRegion.id!==nextRegion.id)message(`Region transition: ${nextRegion.name}. Known enemies: ${regionRaceNames(nextRegion)}. Regional rule: ${nextRegion.rule}`,"story");
  else message(`Floor ${state.floor}. You continue through ${nextRegion.name}.`,"story");
  render();
}

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
  animateMenuSwap(target);
  document.querySelectorAll("[data-patch]").forEach(button=>{const active=button.dataset.patch===version;button.classList.toggle("active",active);if(active)button.setAttribute("aria-current","true");else button.removeAttribute("aria-current");});
}

document.querySelectorAll?.("[data-patch]").forEach(button=>button.addEventListener("click",()=>renderPatchNotes(button.dataset.patch)));
renderPatchNotes("v1.7");
