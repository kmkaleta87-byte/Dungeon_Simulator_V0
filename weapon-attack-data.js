(function (root) {
  const catalog = root.GAME_INDEX_DATA?.weapons || {};
  const supportedEffects = new Set(["Burn", "Freeze", "Gust", "Root", "Poison", "Blind", "Marked", "Bleed", "Shock", "Pin"]);
  const stageNames = ["", "Measure", "Opening", "Rising", "Signature", "Mythic", "Divine"];
  const elementalNames = {
    Fire: ["Cinder", "Ember", "Flame", "Pyre"], Ice: ["Rime", "Frost", "Glacier", "Winter"],
    Water: ["Tide", "Rime", "Undertow", "Deluge"], Air: ["Gale", "Horizon", "Whisper", "Tempest"],
    Wind: ["Gale", "Zephyr", "Sky", "Tempest"], Nature: ["Root", "Verdant", "Thorn", "Worldtree"],
    Earth: ["Stone", "Fault", "Mountain", "Worldbreak"], Lightning: ["Spark", "Thunder", "Storm", "Skyfire"],
    Poison: ["Venom", "Rot", "Serpent", "Plague"], Dark: ["Eclipse", "Night", "Umbral", "Void"],
    Void: ["Eclipse", "Night", "Abyss", "Void"], Light: ["Dawn", "Radiant", "Halo", "Sun"],
    Physical: ["Keen", "True", "Unbroken", "Peerless"], None: ["Keen", "True", "Unbroken", "Peerless"],
    Arcane: ["Runic", "Elder", "Astral", "Eternal"], Astral: ["Starfall", "Orbit", "Astral", "Eternal"]
  };
  const effectPools = {
    Fire: ["Burn", "Blind", "Marked"], Ice: ["Freeze", "Blind", "Marked"], Water: ["Freeze", "Root", "Gust"],
    Air: ["Gust", "Blind", "Marked"], Wind: ["Gust", "Root", "Bleed"], Nature: ["Root", "Poison", "Marked"],
    Earth: ["Root", "Bleed", "Blind"], Lightning: ["Shock", "Blind", "Marked"], Poison: ["Poison", "Bleed", "Blind"],
    Dark: ["Marked", "Blind", "Poison"], Void: ["Marked", "Blind", "Poison"], Light: ["Marked", "Blind", "Freeze"],
    Physical: ["Bleed", "Marked", "Root"], None: ["Bleed", "Marked", "Root"], Arcane: ["Blind", "Marked", "Freeze"],
    Astral: ["Blind", "Marked", "Gust"]
  };
  const examples = {
    "warrior|The Merciful King|Sword": ["King’s Measure", "Ember Edict", "Crownfire Sweep", "Pardon’s Edge", "Sovereign Pyre", "The Last Mercy"],
    "archer|Artemis, Bow of the Huntress|Bow": ["Huntress’ Draw", "Crescent Pin", "Three-Moon Split", "Silent Quarry", "Artemis’ Pursuit", "Moonless Volley"],
    "mage|Wand of the Frozen King|Wand": ["Winter’s Answer", "Rimeglass Lance", "Whitecourt Shards", "The King’s Stillness", "Throne of Rime", "Absolute Winter"]
  };
  const exampleEffects = {
    "warrior|The Merciful King|Sword": [null, "Blind", "Burn", "Marked", "Burn", "Blind"],
    "archer|Artemis, Bow of the Huntress|Bow": [null, "Pin", "Root", "Marked", "Marked", "Freeze"],
    "mage|Wand of the Frozen King|Wand": [null, "Freeze", "Freeze", "Blind", "Freeze", "Freeze"]
  };

  function hash(value) {
    let result = 2166136261;
    for (const char of value) result = Math.imul(result ^ char.charCodeAt(0), 16777619);
    return result >>> 0;
  }
  function slug(value) {
    return String(value).normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }
  function profileEffect(entry, family, rank, seed) {
    const pool = effectPools[entry.element] || effectPools.Physical;
    const weaponEffect = supportedEffects.has(entry.effect) ? entry.effect : null;
    if (rank === 2 && weaponEffect) return weaponEffect;
    return pool[(seed + rank - 2) % pool.length];
  }
  function makeDescription(entry, attack, rank) {
    const targetText = attack.aoe ? `Strikes all living enemies; secondary targets take ${Math.round(attack.secondaryMultiplier * 100)}% damage.` : "Strikes one enemy.";
    const effectText = attack.effect ? ` On hit, has a ${Math.round(attack.effectChance * 100)}% chance to apply ${attack.effect}.` : "";
    const costText = attack.manaCost ? ` Costs ${attack.manaCost} mana.` : "";
    const gainText = attack.manaGain ? ` Restores up to ${attack.manaGain} mana on a hit.` : "";
    const healText = attack.healOnHit ? ` Restores ${Math.round(attack.healOnHit * 100)}% of damage dealt as health.` : "";
    if (attack.chargesNextAttack) return `Prepare a ${entry.element} ${entry.type.toLowerCase()} attack, empowering your next strike.${costText}`;
    return `${targetText}${effectText}${costText}${gainText}${healText} Cooldown: ${attack.cooldown} turn${attack.cooldown === 1 ? "" : "s"}.`;
  }
  function createAttack(entry, family, rank, seed, baseManaCost, presetName, presetEffect) {
    const element = entry.element || "Physical";
    const flavor = (elementalNames[element] || elementalNames.Physical)[(seed + rank) % (elementalNames[element] || elementalNames.Physical).length];
    const suffix = `${flavor} ${stageNames[rank]}`;
    const identity = `${entry.name} [${entry.rarity} ${family} ${entry.type}]`;
    const name = presetName || (["Mythic", "Divine"].includes(entry.rarity) ? `${identity} — ${suffix}` : `${entry.name} — ${suffix}`);
    const id = `weapon-${slug(entry.rarity)}-${slug(family)}-${slug(entry.type)}-${slug(entry.name)}-${rank}`;
    const attack = {
      id, name, command: id, multiplier: 1, critBonus: 0, cooldown: 0,
      manaCost: 0, manaGain: 0, healOnHit: 0, effect: null, effectChance: 0,
      chargesNextAttack: false, aoe: false, secondaryMultiplier: 0
    };
    const effect = presetEffect !== undefined ? presetEffect : profileEffect(entry, family, rank, seed);
    if (rank === 1) {
      Object.assign(attack, { description: "", multiplier: family === "archer" ? 1.48 : 1.42, critBonus: family === "mage" ? 0.15 : 0.10, chargesNextAttack: true, manaCost: family === "mage" ? Math.max(1, baseManaCost || 5) : 0 });
    } else if (rank === 2) {
      Object.assign(attack, { multiplier: 1.08 + (seed % 5) * 0.08, critBonus: family === "archer" ? 0.17 : 0.08, cooldown: 1, effect, effectChance: 0.55 + (seed % 3) * 0.1, manaGain: family === "archer" ? 1 : 0, manaCost: family === "mage" ? Math.max(1, baseManaCost || 5) + 1 : 0 });
    } else if (rank === 3) {
      Object.assign(attack, { multiplier: family === "archer" ? 0.95 : 0.88, critBonus: 0.05, cooldown: 2, effect, effectChance: 0.55, aoe: true, secondaryMultiplier: 0.4 + (seed % 4) * 0.08, manaGain: family === "archer" ? 2 : 0, manaCost: family === "mage" ? Math.max(1, baseManaCost || 5) + 2 : 0 });
    } else if (rank === 4) {
      Object.assign(attack, { multiplier: 1.55 + (seed % 4) * 0.1, critBonus: 0.12 + (seed % 3) * 0.05, cooldown: 3, effect, effectChance: 0.65 + (seed % 3) * 0.1, manaGain: family === "archer" ? 1 : 0, manaCost: family === "mage" ? Math.max(1, baseManaCost || 5) + 3 : 0 });
    } else if (rank === 5) {
      const area = seed % 2 === 0;
      Object.assign(attack, { multiplier: area ? 1.05 + (seed % 3) * 0.08 : 1.85 + (seed % 4) * 0.1, critBonus: area ? 0.08 : 0.18, cooldown: 4, effect, effectChance: 0.75, aoe: area, secondaryMultiplier: area ? 0.55 + (seed % 3) * 0.08 : 0, manaGain: family === "archer" ? 2 : 0, manaCost: family === "mage" ? Math.max(1, baseManaCost || 5) + 4 : 0, healOnHit: family === "warrior" && seed % 3 === 0 ? 0.04 : 0 });
    } else {
      const area = family !== "warrior" || seed % 2 === 0;
      Object.assign(attack, { multiplier: area ? (family === "mage" ? 1.2 : 1.35) + (seed % 4) * 0.08 : 2.2 + (seed % 4) * 0.1, critBonus: 0.18 + (seed % 3) * 0.04, cooldown: 5, effect, effectChance: 0.85, aoe: area, secondaryMultiplier: area ? 0.65 + (seed % 3) * 0.08 : 0, manaGain: family === "archer" ? 3 : 0, manaCost: family === "mage" ? Math.max(1, baseManaCost || 5) + 6 : 0, healOnHit: family === "warrior" ? 0.06 : 0 });
    }
    if (attack.effect && attack.effect === entry.effect) attack.effectChance = 1;
    attack.description = makeDescription(entry, attack, rank);
    return attack;
  }

  const profiles = Object.create(null);
  for (const [family, entries] of Object.entries(catalog)) {
    for (const entry of entries) {
      if (!["Legendary", "Mythic", "Divine"].includes(entry.rarity)) continue;
      const rankCount = ({ Legendary: 4, Mythic: 5, Divine: 6 })[entry.rarity];
      const seed = hash(`${family}|${entry.name}|${entry.type}|${entry.element || "Physical"}`);
      const exampleKey = `${family}|${entry.name}|${entry.type}`;
      const names = examples[exampleKey] || [];
      const effects = exampleEffects[exampleKey] || [];
      const attacks = Array.from({ length: rankCount }, (_, i) => createAttack(entry, family, i + 1, seed, 5, names[i], effects[i]));
      const key = `${family}|${entry.name}|${entry.type}|${entry.rarity}`;
      profiles[key] = attacks;
    }
  }
  root.GAME_WEAPON_ATTACK_DATA = profiles;
})(window);
