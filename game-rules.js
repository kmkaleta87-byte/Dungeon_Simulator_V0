(function (root) {
  const RARITIES = ["Common", "Uncommon", "Rare", "Epic", "Legendary", "Mythic", "Divine"];
  const RARITY_MULTIPLIERS = [1, 1.25, 1.6, 2.1, 2.8, 3.7, 5];
  const STAT_DEFINITIONS = [
    { key: "str", label: "STR", description: "Increases Warrior damage; returns diminish above 20." },
    { key: "dex", label: "DEX", description: "Improves evasion; especially effective for Archers." },
    { key: "con", label: "CON", description: "Adds maximum health and strengthens Mage Aegis." },
    { key: "int", label: "INT", description: "Adds maximum mana and increases Mage damage." },
    { key: "wis", label: "WIS", description: "Improves mana restored by potions; especially useful to Mages." },
    { key: "cha", label: "CHA", description: "Reduces shop prices by 2% per point above 10." },
    { key: "speed", label: "Speed", description: "Improves your chance to evade attacks." },
    { key: "critChance", label: "Crit", description: "Adds 1% critical chance per point; critical hits deal double damage." }
  ];
  const EFFECT_DEFINITIONS = {
    Burn: ["🔥", "Damage over time; repeated applications build its burn damage.", "damageOverTime", 3],
    Freeze: ["❄️", "Builds stacks; five stacks freeze the target for one turn.", "freeze", 5],
    Gust: ["🌪️", "Disrupts the target, making it lose its next turn.", "stagger", 1],
    Root: ["🌿", "Pins the target in place and prevents its normal dodge.", "root", 2],
    Poison: ["☠️", "Deals stacking damage over time.", "damageOverTime", 4],
    Blind: ["✨", "Reduces the target's accuracy for a short time.", "blind", 2],
    Void: ["🌑", "Dark damage partially bypasses armor.", "pierce", 1],
    Shock: ["⚡", "Lightning arcs damage to another living enemy.", "arc", 1],
    Bleed: ["🩸", "Deals stacking physical damage over time.", "damageOverTime", 3],
    LifeSteal: ["❤️", "Restores health based on damage dealt.", "lifeSteal", 1],
    ManaSteal: ["🔵", "Restores mana based on damage dealt.", "manaSteal", 1],
    Execution: ["☠️", "Deals increased damage to targets below 30% health.", "execution", 1],
    Momentum: ["💨", "Consecutive hits build a small damage bonus.", "momentum", 2],
    Marked: ["🎯", "The target takes increased damage from follow-up attacks.", "marked", 3],
    Thorns: ["🌵", "Reflects a portion of incoming attack damage.", "thorns", 3],
    Chain: ["⛓️", "Carries a portion of the hit to another enemy.", "arc", 1],
    Pierce: ["🗡️", "Improves damage against defended targets.", "pierce", 1],
    Ricochet: ["↗️", "Bounces a portion of the hit to another enemy.", "arc", 1],
    Multishot: ["🏹", "Adds a reduced-damage hit to another enemy.", "splash", 1],
    Penetration: ["🗡️", "Partially ignores enemy damage reduction.", "pierce", 1],
    Headshot: ["🎯", "Improves critical chance and pressures wounded targets.", "precision", 1],
    Snipe: ["🎯", "Improves critical chance and cannot be dodged easily.", "precision", 1],
    Focus: ["◎", "Improves the next attack's damage and critical chance.", "charge", 1],
    Draw: ["🏹", "A prepared shot improves the next attack's damage.", "charge", 1],
    Overdraw: ["🏹", "A forceful shot adds damage at the cost of extra arrows.", "overdraw", 1],
    Volley: ["🏹", "Strikes the full enemy group with reduced secondary damage.", "splash", 1],
    Trap: ["🪤", "Traps the target, preventing its next turn.", "root", 2],
    Pin: ["📌", "Pins the target and removes its normal dodge chance.", "root", 2],
    Cripple: ["🩹", "Weakens the target and makes its attacks less accurate.", "cripple", 2],
    Mark: ["🎯", "Marks the target to receive increased incoming damage.", "marked", 3],
    Homing: ["🧭", "Tracks its target, making the attack difficult to dodge.", "precision", 1],
    PiercingShot: ["🏹", "Pierces defenses and carries through to another enemy.", "piercingShot", 1],
    RicochetShot: ["↗️", "Bounces a reduced-damage shot to another enemy.", "arc", 1],
    Afterimage: ["👤", "Leaves an afterimage that evades one incoming attack.", "evasion", 1],
    AmmoGeneration: ["➕", "Has a chance to recover an arrow after attacking.", "ammo", 1],
    Salvo: ["🏹", "Sends a reduced-damage follow-up shot at another enemy.", "splash", 1],
    ExecutionBolt: ["⚡", "Deals increased damage to targets below 30% health.", "execution", 1],
    RangeScaling: ["↗️", "Long-range power increases the attack's damage.", "damage", 1],
    Quiver: ["🏹", "Expands arrow reserves and supports sustained shots.", "ammo", 1],
    Scatter: ["✴️", "Spreads reduced damage across nearby enemies.", "splash", 1],
    SpellEcho: ["🔮", "Repeats a portion of a spell's damage on its target.", "echo", 1],
    SpellPower: ["✨", "Increases spell damage.", "damage", 1],
    ManaSurge: ["🔵", "Restores mana after a successful attack.", "manaSurge", 1],
    Overcast: ["🔮", "Converts extra mana expenditure into stronger spell damage.", "overcast", 1],
    CooldownReduction: ["⏱️", "Reduces the waiting time on special attacks.", "cooldown", 1],
    ArcaneCharge: ["🔋", "Builds arcane power to improve subsequent spells.", "momentum", 1],
    SpellSplit: ["🔮", "Splits spell damage across an additional enemy.", "splash", 1],
    Conjure: ["🪄", "Conjures a small follow-up hit after the main spell.", "echo", 1],
    Channel: ["🪄", "Improves the next spell's damage after channeling.", "charge", 1],
    SpellRadius: ["⭕", "Extends spell damage to nearby enemies.", "splash", 1],
    DelayedCast: ["⌛", "Stores energy for a stronger later spell.", "charge", 1],
    ManaShield: ["🛡️", "Uses mana to absorb a portion of incoming damage.", "manaShield", 1],
    Teleport: ["✨", "Evades the next incoming attack by shifting position.", "evasion", 1],
    ElementalConversion: ["🔁", "Converts spell damage to match the weapon's element.", "element", 1]
  };
  const EFFECT_DOT_DAMAGE = { Burn: 2, Poison: 2, Bleed: 2 };
  const CLASS_STAT_SYNERGIES = {
    warrior: { str: 1.25, con: 1.15 },
    archer: { dex: 1.25, speed: 1.15 },
    mage: { int: 1.25, con: 1.15, wis: 1.1 }
  };

  function effectiveStat(value, key, playerClass) {
    const stat = Number(value) || 0;
    if (stat <= 10) return stat;
    const firstBand = Math.min(10, stat - 10);
    const diminishingBand = Math.max(0, stat - 20) * 0.5;
    const synergy = CLASS_STAT_SYNERGIES[playerClass]?.[key] || 1;
    return 10 + (firstBand + diminishingBand) * synergy;
  }

  function statSynergy(key, playerClass) {
    return CLASS_STAT_SYNERGIES[playerClass]?.[key] || 1;
  }

  function statPointGain(player, key) {
    const value = Number(player[key]) || 0;
    const before = effectiveStat(value, key, player.class);
    const after = effectiveStat(value + 1, key, player.class);
    return after - before;
  }

  function entryRoomType(floor) {
    return floor === 1 ? "start" : "empty";
  }

  function spendSkillPoint(player, stat) {
    const definition = STAT_DEFINITIONS.find(item => item.key.toLowerCase() === String(stat).toLowerCase());
    if (!definition) return { success: false, message: "Choose STR, DEX, CON, INT, WIS, CHA, Speed, or Crit." };
    if (player.skillPoints <= 0) return { success: false, message: "You have no skill points to spend." };
    if (definition.key === "critChance" && player.critChance >= 1) {
      return { success: false, message: "Critical chance is already at its 100% limit." };
    }

    const gain = definition.key === "critChance" ? (player.critChance < 0.2 ? 0.01 : 0.005) : statPointGain(player, definition.key);
    if (definition.key === "critChance") player.critChance = Math.min(1, player.critChance + gain);
    else player[definition.key] += 1;
    player.skillPoints--;

    if (definition.key === "con") {
      const resourceGain = Math.max(1, Math.round(10 * gain));
      player.maxHp += resourceGain;
      player.baseMaxHp = (player.baseMaxHp ?? player.maxHp - resourceGain) + resourceGain;
      player.hp = Math.min(player.maxHp, player.hp + resourceGain);
    } else if (definition.key === "int") {
      const resourceGain = Math.max(1, Math.round(5 * gain));
      player.maxMana += resourceGain;
      player.mana = Math.min(player.maxMana, player.mana + resourceGain);
    }
    return { success: true, message: `You improved ${definition.label}. ${player.skillPoints} skill point(s) remain.` };
  }

  function chooseCatalogWeapon(family, rarity, catalog = root.GAME_INDEX_DATA.weapons, random = Math.random, excludedNames = []) {
    let entries = catalog[family].filter(entry => entry.rarity === rarity && !excludedNames.includes(entry.name));
    if (!entries.length) entries = catalog[family].filter(entry => entry.rarity === rarity);
    if (!entries.length) throw new Error(`No ${rarity} ${family} weapons are defined.`);
    return entries[Math.min(entries.length - 1, Math.floor(random() * entries.length))];
  }

  function createCatalogWeapon(entry, floor = 1) {
    const tier = Math.max(0, RARITIES.indexOf(entry.rarity));
    const family = ["Bow", "Crossbow"].includes(entry.type) ? "archer" : ["Wand", "Staff"].includes(entry.type) ? "mage" : "warrior";
    const baseDamage = family === "warrior"
      ? ({ Dagger: 7, Sword: 8, Axe: 9, Scythe: 10 }[entry.type] || 8)
      : family === "archer" ? (entry.type === "Crossbow" ? 8 : 7) : (entry.type === "Staff" ? 8 : 7);
    const ranged = family === "archer";
    const weapon = {
      name: entry.name, type: entry.type, rarity: entry.rarity, file: entry.file,
      baseDamage,
      damage: Math.max(1, Math.round((baseDamage + floor) * RARITY_MULTIPLIERS[tier] * (1 + (floor - 1) * 0.08))),
      crit: (family === "archer" ? 0.08 : 0.03) + tier * 0.015,
      speed: entry.type === "Dagger" || entry.type === "Bow" ? 12 : entry.type === "Crossbow" ? 9 : 10,
      element: entry.element, effect: entry.effect, description: entry.description,
      arrows: ranged ? (entry.type === "Bow" ? 14 : 18) : 0,
      manaCost: family === "mage" ? Math.max(1, 3 + Math.floor((floor - 1) / 3)) : 0
    };
    weapon.attacks = createWeaponAttacks(family, entry.rarity, entry.type, entry.element, weapon.manaCost);
    return weapon;
  }

  function createWeaponAttacks(family, rarity, type, element, baseManaCost = 0) {
    const tier = RARITIES.indexOf(rarity);
    if (tier <= 0) return [];
    const attack = (name, command, description, multiplier, critBonus, cooldown, effect, options = {}) => ({
      name, command, description, multiplier, critBonus, cooldown, effect,
      manaCost: options.manaCost || 0, manaGain: options.manaGain || 0, chargesNextAttack: Boolean(options.chargesNextAttack),
      aoe: Boolean(options.aoe), secondaryMultiplier: options.secondaryMultiplier ?? 0.0
    });

    if (family === "warrior") {
      const attacks = [attack("Measured Charge", "charge", "Prepare your next basic strike for 50% more damage and +10% crit chance.", 1.5, 0.10, 0, "Momentum", { chargesNextAttack: true })];
      if (tier >= 2) attacks.push(attack("Weapon Technique", "technique", `A ${type.toLowerCase()} technique that applies ${type === "Dagger" ? "Bleed" : type === "Axe" ? "Bleed" : type === "Scythe" ? "Gust" : "Marked"}.`, type === "Dagger" ? 0.8 : type === "Axe" ? 1.6 : type === "Scythe" ? 1.2 : 1.35, type === "Dagger" ? 0.20 : 0.10, 1, type === "Scythe" ? "Gust" : type === "Sword" ? "Marked" : "Bleed"));
      if (tier >= 3) attacks.push(attack("Sundering Strike", "sunder", "A committed strike that weakens the target's defenses.", 1.65, 0.05, 2, elementEffect(element)));
      if (tier >= 4) attacks.push(attack("King's Verdict", "verdict", "A decisive blow with a chance to mark the target.", 1.9, 0.15, 3, "Marked"));
      if (tier >= 5) attacks.push(attack("Deathmark", "deathmark", "A precise, high-crit strike that marks its victim.", 1.4, 0.30, 4, "Marked"));
      if (tier >= 6) attacks.push(attack("Crownfall", "crownfall", "A peerless blow with immense force and a gust effect.", 2.7, 0.30, 5, "Gust"));
      return attacks;
    }
    if (family === "archer") {
      const attacks = [attack("Steady Draw", "steady", "Spend this turn lining up your next shot: +50% damage and +20% crit chance.", 1.5, 0.20, 0, "Focus", { chargesNextAttack: true })];
      if (tier >= 2) attacks.push(attack("Pinning Shot", "pinshot", "A precise shot that roots the target and restores 1 mana on hit.", 1.25, 0.15, 1, "Pin", { manaGain: 1 }));
      if (tier >= 3) attacks.push(attack(type === "Bow" ? "Arrowstorm" : "Scatter Volley", type === "Bow" ? "arrowstorm" : "scattervolley", "Strike every enemy; secondary targets take reduced damage and restore 2 mana on a successful volley.", 1.0, 0.05, 2, type === "Bow" ? "Volley" : "Scatter", { aoe: true, secondaryMultiplier: type === "Bow" ? 0.65 : 0.70, manaGain: 2 }));
      if (tier >= 4) attacks.push(attack("Ricochet Barrage", "ricochetbarrage", "A powerful shot ricochets through the enemy group and restores 2 mana on hit.", 1.45, 0.10, 3, "Ricochet", { aoe: true, secondaryMultiplier: 0.80, manaGain: 2 }));
      if (tier >= 5) attacks.push(attack("Worldpiercer", "worldpiercer", "A focused shot with execution pressure that restores 2 mana on hit.", 2.0, 0.15, 4, "ExecutionBolt", { manaGain: 2 }));
      if (tier >= 6) attacks.push(attack("Celestial Barrage", "celestialbarrage", `Call down ${element} arrows over every foe; the impact restores 3 mana.`, 2.5, 0.25, 5, elementEffect(element), { aoe: true, secondaryMultiplier: 1.5, manaGain: 3 }));
      return attacks;
    }
    const attacks = [attack("Arcane Channel", "channel", "Channel energy to empower your next basic spell.", 1.5, 0.15, 0, "SpellPower", { chargesNextAttack: true, manaCost: baseManaCost })];
    if (tier >= 2) attacks.push(attack("Elemental Lance", "elementallance", `A focused ${element} spell pierces the target.`, 1.65, 0.10, 2, elementEffect(element), { manaCost: baseManaCost + 1 }));
    if (tier >= 3) attacks.push(attack("Arc Burst", "arcburst", `Explode with ${element} energy around the target.`, 0.70, 0.05, 2, elementEffect(element), { aoe: true, secondaryMultiplier: 0.35, manaCost: baseManaCost + 2 }));
    if (tier >= 4) attacks.push(attack("Elemental Tempest", "elementaltempest", `Unleash a ${element} storm across the enemy group.`, 0.85, 0.05, 3, elementEffect(element), { aoe: true, secondaryMultiplier: 0.45, manaCost: baseManaCost + 3 }));
    if (tier >= 5) attacks.push(attack("Astral Convergence", "astralconvergence", `Detonate focused ${element} magic across the field.`, 1.0, 0.10, 4, elementEffect(element), { aoe: true, secondaryMultiplier: 0.55, manaCost: baseManaCost + 4 }));
    if (tier >= 6) attacks.push(attack("The World's End", "worldsend", `Open a rift and rain divine ${element} magic on every foe.`, 1.75, 0.20, 5, elementEffect(element), { aoe: true, secondaryMultiplier: 0.80, manaCost: baseManaCost + 6 }));
    return attacks;
  }

  function elementEffect(element) {
    return ({ Fire: "Burn", Ice: "Freeze", Water: "Freeze", Air: "Gust", Wind: "Gust", Nature: "Root", Earth: "Root", Lightning: "Shock", Dark: "Void", Void: "Void", Poison: "Poison", Light: "Marked" })[element] || "SpellPower";
  }

  function createCatalogArmor(entry, floor = 1) {
    const slot = ({ "Head Armor": "head", "Chest Armor": "chest", "Legs Armor": "legs", "Feet Armor": "feet", "Shield Armor": "shield" })[entry.type];
    const tier = Math.max(0, RARITIES.indexOf(entry.rarity));
    const multiplier = RARITY_MULTIPLIERS[tier];
    const slotBonuses = {
      head: { critChance: tier * 0.005 },
      chest: { healthBonus: 0 },
      legs: { dexterity: tier * 0.25 },
      feet: { speed: tier * 0.25 },
      shield: { dexterity: -1 }
    };
    return {
      name: entry.name, rarity: entry.rarity, type: entry.type, slot, set: entry.set,
      file: entry.file, defense: Math.max(1, Math.round((2 + floor) * multiplier)),
      damageReduction: Math.max(1, Math.round((1 + floor / 2) * multiplier)),
      healthBonus: Math.max(0, Math.round(floor * 5 * multiplier) - 3),
      speedModifier: tier >= 4 ? 1 : 0,
      slotBonuses: { ...slotBonuses[slot], ...(slot === "chest" ? { healthBonus: Math.max(0, Math.round(floor * 5 * multiplier) - 3) } : {}) },
      goldValue: Math.max(1, Math.round(10 * multiplier))
    };
  }

  function equipArmor(equipped, armor) {
    return { ...equipped, [armor.slot]: armor };
  }

  function armorSetBonus(equipped) {
    const pieces = [equipped.head, equipped.chest, equipped.legs, equipped.feet];
    if (pieces.some(piece => !piece) || pieces.some(piece => piece.set !== pieces[0].set)) return 0;
    return 2 + Math.max(0, RARITIES.indexOf(pieces[0].rarity));
  }

  function armorDamageReduction(equipped, playerClass) {
    return Object.entries(equipped).reduce((total, [slot, armor]) =>
      total + (slot === "shield" && playerClass === "mage" ? 0 : armor?.damageReduction || 0), 0) + armorSetBonus(equipped);
  }

  function armorBonuses(equipped = {}, playerClass = "warrior") {
    const profile = { damageReduction: armorDamageReduction(equipped, playerClass), healthBonus: 0, critChance: 0, dexterity: 0, speed: 0, thorns: 0, setName: "", setBonus: armorSetBonus(equipped) };
    for (const [slot, armor] of Object.entries(equipped)) {
      if (!armor || (slot === "shield" && playerClass === "mage")) continue;
      const perks = armor.slotBonuses || {};
      profile.healthBonus += perks.healthBonus || armor.healthBonus || 0;
      profile.critChance += perks.critChance || 0;
      profile.dexterity += perks.dexterity || 0;
      profile.speed += perks.speed || armor.speedModifier || 0;
    }
    const pieces = [equipped.head, equipped.chest, equipped.legs, equipped.feet];
    if (profile.setBonus) {
      profile.setName = pieces[0].set;
      profile.dexterity += profile.setBonus * 0.1;
      profile.speed += profile.setBonus * 0.1;
      profile.thorns = Math.min(0.18, 0.05 + Math.max(0, RARITIES.indexOf(pieces[0].rarity)) * 0.015);
    }
    return profile;
  }

  function getEffectDefinition(effect) {
    const definition = EFFECT_DEFINITIONS[effect];
    return definition ? { key: effect, icon: definition[0], description: definition[1], mechanic: definition[2], duration: definition[3] } : null;
  }

  function applyCombatEffect(statuses = {}, effect, damage = 0) {
    const definition = getEffectDefinition(effect);
    if (!definition || !["damageOverTime", "freeze", "stagger", "root", "blind", "marked", "cripple", "manaShield", "evasion", "thorns"].includes(definition.mechanic)) return { ...statuses };
    const statusKey = ({ Pin: "Root", Trap: "Root", Mark: "Marked" })[effect] || effect;
    const current = statuses[effect] || { turns: 0, stacks: 0, potency: 0 };
    const existing = statuses[statusKey] || current;
    const maxStacks = statusKey === "Freeze" ? 5 : ["Burn", "Poison", "Bleed"].includes(statusKey) ? 5 : 1;
    return {
      ...statuses,
      [statusKey]: {
        turns: Math.max(existing.turns || 0, definition.duration),
        stacks: Math.min(maxStacks, (existing.stacks || 0) + 1),
        potency: Math.max(existing.potency, Math.max(1, Math.round(damage * 0.06)))
      }
    };
  }

  function tickCombatEffects(statuses = {}, options = {}) {
    const remaining = {};
    let damage = 0;
    const messages = [];
    for (const [key, current] of Object.entries(statuses)) {
      const definition = getEffectDefinition(key);
      if (!definition) continue;
      const turns = (current.turns || 0) - 1;
      const isDamageOverTime = Boolean(EFFECT_DOT_DAMAGE[key]);
      if (isDamageOverTime && !options.durationOnly) {
        const tickDamage = Math.max(1, (current.stacks || 1) * EFFECT_DOT_DAMAGE[key]);
        damage += tickDamage;
        messages.push({ effect: key, damage: tickDamage });
      }
      if (options.damageOnly && !isDamageOverTime) {
        remaining[key] = { ...current, stacks: current.stacks || 1 };
        continue;
      }
      if (options.durationOnly && isDamageOverTime) {
        remaining[key] = { ...current, stacks: current.stacks || 1 };
        continue;
      }
      if (turns > 0) remaining[key] = { ...current, stacks: current.stacks || 1, turns };
    }
    return { statuses: remaining, damage, messages };
  }

  function createAttackPreview({ player = {}, playerClass = "warrior", weapon = {}, attack = {}, targetCount = 1, charged = null, targetElement = null } = {}) {
    const statKey = playerClass === "mage" ? "int" : "str";
    const stat = effectiveStat(player[statKey] || 0, statKey, playerClass);
    const effect = weapon.effect;
    const attackEffect = attack.effect;
    const critChance = Math.min(1, Math.max(0, (player.critChance || 0) + (weapon.crit || 0) + (weapon.critUpgrade || 0) + (attack.critBonus || 0) + (charged?.critBonus || 0) + (effect === "Focus" ? 0.1 : 0) + (["Headshot", "Snipe"].includes(effect) || ["Headshot", "Snipe"].includes(attackEffect) ? 0.2 : 0)));
    const passiveMultiplier = ({ Penetration: 1.15, Pierce: 1.1, PiercingShot: 1.12, Void: 1.12, SpellPower: 1.12, SpellEcho: 1.08, Focus: 1.08, Draw: 1.12, DelayedCast: 1.15, Overcast: 1.25, RangeScaling: 1.12, Overdraw: 1.25, Momentum: 1 + Math.min(5, player.momentum || 0) * 0.04, ArcaneCharge: 1 + Math.min(5, player.arcaneCharge || 0) * 0.04 })[effect] || 1;
    const matchup = elementMatchup(weapon.element, targetElement);
    const playerDamageScale = player.playerEffects?.Cripple ? 0.85 : 1;
    const primaryDamage = Math.max(1, Math.round((((stat + (weapon.damage || 0) + (weapon.damageUpgrade || 0)) * (attack.multiplier || 1) * (charged?.multiplier || 1) * passiveMultiplier * playerDamageScale) - (attack.targetDamageReduction || 0)) * matchup.multiplier));
    return {
      primaryDamage,
      secondaryDamage: attack.aoe ? Math.max(1, Math.round(primaryDamage * (attack.secondaryMultiplier || 0.5))) : 0,
      criticalDamage: primaryDamage * 2,
      critChance,
      manaCost: (attack.manaCost || (playerClass === "mage" ? weapon.manaCost || 5 : 0)) + (effect === "Overcast" && playerClass === "mage" ? 2 : 0),
      manaGain: Math.max(0, Number(attack.manaGain) || 0),
      ammoCost: ["Bow", "Crossbow"].includes(weapon.type) && !attack.chargesNextAttack ? (effect === "Overdraw" || attack.overdraw ? 2 : 1) : 0,
      cooldown: Math.max(0, (attack.cooldown || 0) - (effect === "CooldownReduction" && attack.cooldown ? 1 : 0)),
      targetCount: attack.aoe ? Math.max(1, targetCount) : 1,
      elementMultiplier: matchup.multiplier,
      elementRelation: matchup.relation,
      effect: attackEffect || effect || null
    };
  }

  function rollLootRarity(roomTier = 1, boss = false, random = Math.random()) {
    const roll = Math.min(999, Math.floor(random * 1000));
    let rarity;
    if (boss) {
      rarity = roll < 150 ? 0 : roll < 330 ? 1 : roll < 510 ? 2 : roll < 670 ? 3 : roll < 820 ? 4 : roll < 980 ? 5 : 6;
      return RARITIES[Math.max(3, rarity)];
    }
    const tables = {
      1: [480, 720, 870, 950, 990, 1000],
      2: [420, 660, 820, 910, 980, 998],
      3: [350, 580, 750, 860, 970, 996],
      4: [280, 500, 680, 810, 930, 994]
    };
    const thresholds = tables[Math.max(1, Math.min(4, roomTier))];
    return RARITIES[thresholds.findIndex(threshold => roll < threshold) < 0 ? 6 : thresholds.findIndex(threshold => roll < threshold)];
  }

  function rollShopRarity(upgradeLevel = 0, random = Math.random()) {
    const roll = Math.min(999, Math.floor(random * 1000));
    const level = Math.max(0, Math.min(5, upgradeLevel));
    const base = [550, 810, 930, 980, 995, 999, 1000];
    const upgraded = [500, 760, 895, 965, 990, 998, 1000];
    const thresholds = base.map((value, index) => Math.round(value + (upgraded[index] - value) * level / 5));
    if (roll < thresholds[0]) return "Common";
    if (roll < thresholds[1]) return "Uncommon";
    if (roll < thresholds[2]) return "Rare";
    if (roll < thresholds[3]) return "Epic";
    if (roll < thresholds[4]) return "Legendary";
    if (roll < thresholds[5]) return "Mythic";
    return "Divine";
  }

  function rollWeaponFamily(random = Math.random, preferredFamily = null) {
    const roll = random();
    if (["warrior", "archer", "mage"].includes(preferredFamily)) {
      if (roll < 0.75) return preferredFamily;
      const alternatives = ["warrior", "archer", "mage"].filter(family => family !== preferredFamily);
      const weights = { warrior: 63, archer: 28, mage: 9 };
      const firstChance = weights[alternatives[0]] / (weights[alternatives[0]] + weights[alternatives[1]]);
      return roll < 0.75 + 0.25 * firstChance ? alternatives[0] : alternatives[1];
    }
    return roll < 0.63 ? "warrior" : roll < 0.91 ? "archer" : "mage";
  }

  function rollLootKind(random = Math.random, playerClass = null) {
    const roll = random();
    if (playerClass === "mage") return roll < 0.54 ? "weapon" : roll < 0.80 ? "armor" : "item";
    if (playerClass === "archer") return roll < 0.58 ? "weapon" : roll < 0.88 ? "armor" : "item";
    if (playerClass === "warrior") return roll < 0.62 ? "weapon" : roll < 0.93 ? "armor" : "item";
    if (roll < 0.6) return "weapon";
    if (roll < 0.9) return "armor";
    return "item";
  }

  function rollPotionType(random = Math.random, playerClass = null) {
    const manaChance = playerClass === "mage" ? 0.72 : playerClass === "archer" ? 0.25 : playerClass === "warrior" ? 0.08 : 0.35;
    return random() < manaChance ? "mana" : "health";
  }

  function rollShopOfferKind(random = Math.random) {
    const roll = random();
    if (roll < 0.45) return "weapon";
    if (roll < 0.8) return "armor";
    return "item";
  }

  function getSpecialAttack(weapon, command) {
    if (["basic", "attack", "heavy", "brace", "disrupt", "heal", "mana", "flee"].includes(command)) return null;
    return weapon?.attacks?.find(attack => attack.command === command) || null;
  }

  function isAttackOnCooldown(cooldowns, command) {
    if (command === "basic" || command === "attack") return false;
    return (Number(cooldowns?.[command]) || 0) > 0;
  }

  function basicAttackFallback(playerClass, weaponType, mana, arrows, manaCost = 5) {
    if (playerClass === "mage" && (Number(mana) || 0) < Math.max(1, Number(manaCost) || 5)) return "mana";
    if (playerClass === "archer" && ["Bow", "Crossbow"].includes(weaponType) && (Number(arrows) || 0) <= 0) return "arrows";
    return null;
  }

  function allEnemiesDefeated(enemies) {
    return Array.isArray(enemies) && enemies.length > 0 && enemies.every(enemy => enemy.hp <= 0);
  }

  function avoidDuplicateDivine(rarity, alreadyOwned) {
    return rarity === "Divine" && alreadyOwned ? "Mythic" : rarity;
  }

  function normalizeElement(element) {
    const value = String(element || "").toLowerCase();
    if (value === "fire" || value === "water") return value[0].toUpperCase() + value.slice(1);
    if (value === "earth" || value === "nature") return "Earth";
    if (value === "wind" || value === "air") return "Wind";
    return null;
  }

  function elementMatchup(attackElement, defenseElement) {
    const attack = normalizeElement(attackElement);
    const defense = normalizeElement(defenseElement);
    if (!attack || !defense || attack === defense) return { multiplier: 1, relation: "neutral" };
    const beats = { Water: "Fire", Earth: "Water", Wind: "Earth", Fire: "Wind" };
    if (beats[attack] === defense) return { multiplier: 1.25, relation: "advantage" };
    if (beats[defense] === attack) return { multiplier: 0.8, relation: "resisted" };
    return { multiplier: 1, relation: "neutral" };
  }

  function chooseEnemyIntent(enemyClass, race, random = Math.random) {
    let options;
    if (enemyClass === "Archer") options = [["shoot", "Shoot", 0.8], ["dodge", "Dodge", 0.2]];
    else if (enemyClass === "Warrior") options = [["attack", "Strike", 0.75], ["guard", "Guard", 0.25]];
    else if (enemyClass === "Mage" && race === "skeleton") options = [["cast", "Bone bolt", 0.75], ["summon", "Summon", 0.25]];
    else if (enemyClass === "Mage" && race === "goblin") options = [["cast", "Hex", 0.7], ["buff", "Rally", 0.3]];
    else if (enemyClass === "Mage") options = [["cast", "Cast", 0.8], ["ward", "Ward", 0.2]];
    else options = [["attack", "Attack", 1]];
    const roll = random();
    let cumulative = 0;
    const selected = options.find(option => (cumulative += option[2]) > roll) || options.at(-1);
    return { key: selected[0], label: selected[1] };
  }

  function hasDisruptibleIntent(enemy) {
    return Boolean(enemy && enemy.hp > 0 && ["cast", "shoot"].includes(enemy.intent?.key));
  }

  function canDisrupt(enemy, cooldown = 0) {
    return hasDisruptibleIntent(enemy) && cooldown <= 0;
  }

  function disruptEnemy(enemy, cooldown = 0) {
    if (!canDisrupt(enemy, cooldown)) return false;
    enemy.intentDisrupted = true;
    return true;
  }

  function consumeDisruptedIntent(enemy) {
    if (!enemy?.intentDisrupted) return false;
    enemy.intentDisrupted = false;
    return true;
  }

  function tickDisruptCooldown(cooldown) {
    return Math.max(0, (Number(cooldown) || 0) - 1);
  }

  function guardDamage(damage, heavy = false) {
    return Math.max(1, Math.round(damage * (heavy ? 0.8 : 0.55)));
  }

  function brace(player) {
    if (player.braced) return false;
    player.braced = true;
    return true;
  }

  function applyBraceToDamage(player, damage) {
    if (!player.braced) return damage;
    player.braced = false;
    return Math.max(1, Math.round(damage * 0.5));
  }

  function createSaveSlots() {
    return { slot1: null, slot2: null, slot3: null, dev: null };
  }

  function writeSaveSlot(slots, slot, save) {
    if (!Object.hasOwn(slots, slot)) throw new Error(`Unknown save slot: ${slot}`);
    slots[slot] = save ? { ...save } : null;
    return slots;
  }

  function describeSaveSlot(slots, slot) {
    const save = slots[slot];
    return save ? `${save.name || "Adventurer"} · Floor ${save.floor || 1} · Level ${save.level || 1}` : "Empty";
  }

  root.DungeonRules = { STAT_DEFINITIONS, effectiveStat, statSynergy, entryRoomType, spendSkillPoint, chooseCatalogWeapon, createCatalogWeapon, createWeaponAttacks, createCatalogArmor, equipArmor, armorSetBonus, armorDamageReduction, armorBonuses, getEffectDefinition, applyCombatEffect, tickCombatEffects, createAttackPreview, rollLootRarity, rollShopRarity, rollWeaponFamily, rollLootKind, rollPotionType, rollShopOfferKind, getSpecialAttack, isAttackOnCooldown, basicAttackFallback, allEnemiesDefeated, avoidDuplicateDivine, elementMatchup, chooseEnemyIntent, hasDisruptibleIntent, canDisrupt, disruptEnemy, consumeDisruptedIntent, tickDisruptCooldown, guardDamage, brace, applyBraceToDamage, createSaveSlots, writeSaveSlot, describeSaveSlot };
})(window);
