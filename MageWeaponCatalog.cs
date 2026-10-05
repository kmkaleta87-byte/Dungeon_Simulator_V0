using System;
using System.Collections.Generic;

namespace DungeonSimulation;

public sealed class MageWeaponDefinition
{
    public string Name { get; }
    public WeaponType Type { get; }
    public ElementType Element { get; }
    public CombatEffectType Effect { get; }
    public int DamageBonus { get; }
    public int ManaCostModifier { get; }
    public string Description { get; }

    public MageWeaponDefinition(string name, WeaponType type, ElementType element, CombatEffectType effect, int damageBonus, int manaCostModifier, string description)
    {
        Name = name;
        Type = type;
        Element = element;
        Effect = effect;
        DamageBonus = damageBonus;
        ManaCostModifier = manaCostModifier;
        Description = description;
    }
}

public static class MageWeaponCatalog
{
    private static readonly Dictionary<Rarity, MageWeaponDefinition[]> weapons = new()
    {
        [Rarity.Common] = new[]
        {
            W("Ember Wand", ElementType.Fire, CombatEffectType.Burn, 0), W("Frost Wand", ElementType.Ice, CombatEffectType.Freeze, 0),
            W("Breezewand", ElementType.Air, CombatEffectType.Gust, 0), W("Rootbranch Wand", ElementType.Nature, CombatEffectType.Root, 0),
            W("Spark Wand", ElementType.Lightning, CombatEffectType.Shock, 1), W("Duskwand", ElementType.Dark, CombatEffectType.Execution, 1),
            S("Apprentice Staff", ElementType.Light, CombatEffectType.SpellPower, 1), S("Venom Staff", ElementType.Poison, CombatEffectType.Poison, 0),
            S("Oak Staff", ElementType.Nature, CombatEffectType.SpellRadius, 1), S("Ironwood Staff", ElementType.Physical, CombatEffectType.ManaSurge, 0),
            S("Ash Staff", ElementType.Fire, CombatEffectType.Burn, 1), S("Moon Staff", ElementType.Dark, CombatEffectType.ManaSurge, 0)
        },
        [Rarity.Uncommon] = new[]
        {
            W("Cinderbranch", ElementType.Fire, CombatEffectType.Burn, 1), W("Rimeglass Wand", ElementType.Ice, CombatEffectType.SpellPower, 1),
            W("Zephyr Wand", ElementType.Air, CombatEffectType.Teleport, 1), W("Thornwand", ElementType.Nature, CombatEffectType.SpellPower, 1),
            W("Stormspark", ElementType.Lightning, CombatEffectType.Chain, 2), W("Shadowneedle", ElementType.Dark, CombatEffectType.Marked, 1),
            S("Staff of Venom", ElementType.Poison, CombatEffectType.Poison, 1), S("Sunbranch Staff", ElementType.Light, CombatEffectType.ManaSteal, 1),
            S("Magician's Staff", ElementType.Arcane, CombatEffectType.ArcaneCharge, 1), S("Wandering Star Staff", ElementType.Light, CombatEffectType.Homing, 1),
            S("Cinderstaff", ElementType.Fire, CombatEffectType.SpellRadius, 1), S("Glacier Staff", ElementType.Ice, CombatEffectType.Freeze, 2)
        },
        [Rarity.Rare] = new[]
        {
            W("Dragon's Tooth", ElementType.Fire, CombatEffectType.Overcast, 3), W("Frozen Fang", ElementType.Ice, CombatEffectType.Freeze, 3),
            W("Windcaller", ElementType.Air, CombatEffectType.Gust, 2), W("Living Root", ElementType.Nature, CombatEffectType.ManaSteal, 2),
            W("Thunderwand", ElementType.Lightning, CombatEffectType.Chain, 3), W("Void Needle", ElementType.Void, CombatEffectType.Void, 3),
            S("Staff of the Serpent", ElementType.Poison, CombatEffectType.Poison, 2), S("Dawnstaff", ElementType.Light, CombatEffectType.Marked, 3),
            S("Staff of Echoes", ElementType.Arcane, CombatEffectType.SpellEcho, 2), S("Manaweaver", ElementType.Arcane, CombatEffectType.ManaSurge, 2),
            S("Staff of the Tempest", ElementType.Air, CombatEffectType.SpellRadius, 3), S("Obsidian Staff", ElementType.Void, CombatEffectType.ManaSteal, 3)
        },
        [Rarity.Epic] = new[]
        {
            W("Infernal Wand", ElementType.Fire, CombatEffectType.Burn, 4), W("Winter's Grasp", ElementType.Ice, CombatEffectType.Freeze, 4),
            W("Eye of the Storm", ElementType.Air, CombatEffectType.Gust, 4), W("Worldroot Wand", ElementType.Nature, CombatEffectType.Root, 4),
            W("Stormwand", ElementType.Lightning, CombatEffectType.Chain, 5), W("Nightfire Wand", ElementType.Dark, CombatEffectType.ElementalConversion, 5),
            S("Staff of the Plague Moon", ElementType.Poison, CombatEffectType.Poison, 4), S("Seraph's Staff", ElementType.Light, CombatEffectType.LifeSteal, 4),
            S("Arcane Overlord", ElementType.Arcane, CombatEffectType.Overcast, 5), S("Staff of Replication", ElementType.Arcane, CombatEffectType.SpellEcho, 5),
            S("Staff of the Four Winds", ElementType.Air, CombatEffectType.SpellPower, 4), S("Blackthorn Staff", ElementType.Nature, CombatEffectType.Root, 5)
        },
        [Rarity.Legendary] = new[]
        {
            W("Wand of the First Flame", ElementType.Fire, CombatEffectType.Overcast, 6), W("Heart of the Glacier", ElementType.Ice, CombatEffectType.Freeze, 6),
            W("Zephyr's Eye", ElementType.Air, CombatEffectType.Afterimage, 6), W("Root of Yggdrasil", ElementType.Nature, CombatEffectType.Root, 6),
            W("Heaven's Spark", ElementType.Lightning, CombatEffectType.Chain, 7), W("Voidtongue", ElementType.Void, CombatEffectType.Void, 7),
            S("Staff of the Serpent King", ElementType.Poison, CombatEffectType.Poison, 6), S("Dawnbringer Staff", ElementType.Light, CombatEffectType.SpellPower, 6),
            S("Archmage's Staff", ElementType.Arcane, CombatEffectType.ManaSurge, 7), S("Staff of a Thousand Spells", ElementType.Arcane, CombatEffectType.ArcaneCharge, 7),
            S("Staff of the Astral Gate", ElementType.Astral, CombatEffectType.Teleport, 6), S("The Mana Furnace", ElementType.Fire, CombatEffectType.Overcast, 7)
        },
        [Rarity.Mythic] = new[]
        {
            W("Apocalypse's Spark", ElementType.Fire, CombatEffectType.Conjure, 9), W("Absolute Zero", ElementType.Ice, CombatEffectType.Freeze, 9),
            W("Eye of the Eternal Storm", ElementType.Air, CombatEffectType.Gust, 9), W("Worldseed", ElementType.Nature, CombatEffectType.Conjure, 9),
            W("The Living Thunder", ElementType.Lightning, CombatEffectType.Chain, 10), W("The Nameless Wand", ElementType.Dark, CombatEffectType.ElementalConversion, 10),
            S("The Plague Crown", ElementType.Poison, CombatEffectType.Poison, 9), S("Staff of the Celestial Sun", ElementType.Light, CombatEffectType.SpellPower, 10),
            S("The Infinite Grimoire", ElementType.Arcane, CombatEffectType.Conjure, 10), S("The Astral Staff", ElementType.Astral, CombatEffectType.Conjure, 10),
            S("The Forbidden Staff", ElementType.Void, CombatEffectType.Overcast, 11), S("The Staff of Creation", ElementType.Nature, CombatEffectType.Conjure, 10)
        },
        [Rarity.Divine] = new[]
        {
            W("Merlin's Wand", ElementType.Arcane, CombatEffectType.SpellEcho, 14), W("The First Flame", ElementType.Fire, CombatEffectType.Burn, 15),
            W("Wand of the Frozen King", ElementType.Ice, CombatEffectType.Freeze, 15), W("The Wand of the Empty Sky", ElementType.Air, CombatEffectType.Teleport, 14),
            W("The Wand of Eight Elements", ElementType.Arcane, CombatEffectType.ElementalConversion, 16), S("Excalibur's Arcane Staff", ElementType.Light, CombatEffectType.ManaShield, 16),
            S("Staff of the World Tree", ElementType.Nature, CombatEffectType.Conjure, 16), S("The Eye of Eternity", ElementType.Astral, CombatEffectType.SpellEcho, 16),
            S("Staff of the Void Emperor", ElementType.Void, CombatEffectType.ManaSteal, 17), S("The Philosopher's Staff", ElementType.Arcane, CombatEffectType.ElementalConversion, 16),
            S("Staff of the First Archmage", ElementType.Arcane, CombatEffectType.SpellPower, 18), S("Aeternus", ElementType.Arcane, CombatEffectType.ManaShield, 20)
        }
    };

    public static Weapon Create(Rarity rarity, int level)
    {
        MageWeaponDefinition definition = weapons[rarity][Random.Shared.Next(weapons[rarity].Length)];
        double multiplier = RarityInfo.GetMultiplier(rarity);
        int damage = Math.Max(1, (int)Math.Round((3 + level * 2) * multiplier) + definition.DamageBonus);
        int manaCost = Math.Max(1, 4 + level + definition.ManaCostModifier);
        Weapon weapon = new(definition.Name, definition.Type, damage, definition.Type == WeaponType.Wand ? 9 : 8,
            criticalChance: 0.03, goldValue: Math.Max(1, (int)Math.Round(14 * multiplier)), manaCost: manaCost,
            description: definition.Description, rarity: rarity, spellName: definition.Name,
            element: definition.Element);
        weapon.CombatEffects.Add(CombatEffectCatalog.CreateDefault(definition.Effect, Math.Max(1, (int)rarity)));
        AddAttacksForRarity(weapon);
        return weapon;
    }

    private static void AddAttacksForRarity(Weapon weapon)
    {
        if (weapon.Rarity == Rarity.Common) return;

        weapon.SpecialAttacks.Add(new WeaponAttack("Arcane Channel", "channel",
            $"Spend your turn channeling ({weapon.ManaCost} mana). Your next basic spell deals +50% damage and gains +15% crit chance.",
            1.5, criticalChanceBonus: 0.15, chargesNextAttack: true, manaCost: weapon.ManaCost));

        if (weapon.Rarity >= Rarity.Rare)
        {
            weapon.SpecialAttacks.Add(new WeaponAttack("Elemental Lance", "elementallance",
                $"A focused {weapon.Element} spell that pierces the target's defenses.",
                1.65, 0.10, 2, GetElementEffect(weapon.Element), Math.Max(1, (int)weapon.Rarity),
                manaCost: weapon.ManaCost + 1));
        }

        if (weapon.Rarity >= Rarity.Epic)
        {
            weapon.SpecialAttacks.Add(new WeaponAttack("Arc Burst", "arcburst",
                $"Explode with {weapon.Element} energy around the target. All other enemies take 35% damage.",
                0.70, 0.05, 2, GetElementEffect(weapon.Element), 2,
                secondaryDamageMultiplier: 0.35, manaCost: weapon.ManaCost + 2));
        }

        if (weapon.Rarity >= Rarity.Legendary)
        {
            weapon.SpecialAttacks.Add(new WeaponAttack("Elemental Tempest", "elementaltempest",
                $"Unleash a storm of {weapon.Element} magic across the enemy group. Other enemies take 45% damage.",
                0.85, 0.05, 3, GetElementEffect(weapon.Element), 3,
                secondaryDamageMultiplier: 0.45, manaCost: weapon.ManaCost + 3));
        }

        if (weapon.Rarity >= Rarity.Mythic)
        {
            weapon.SpecialAttacks.Add(new WeaponAttack("Astral Convergence", "astralconvergence",
                $"Fold the battlefield into a focused {weapon.Element} detonation. Other enemies take 55% damage.",
                1.0, 0.10, 4, GetElementEffect(weapon.Element), 4,
                secondaryDamageMultiplier: 0.55, manaCost: weapon.ManaCost + 4));
        }

        if (weapon.Rarity == Rarity.Divine)
        {
            weapon.SpecialAttacks.Add(new WeaponAttack("The World's End", "worldsend",
                $"Open a rift and rain divine {weapon.Element} magic on every foe. The main target takes 175% damage, others take 80%, and the element erupts at full potency.",
                1.75, 0.20, 5, GetElementEffect(weapon.Element), 5,
                secondaryDamageMultiplier: 0.80, manaCost: weapon.ManaCost + 6));
        }
    }

    private static CombatEffectType GetElementEffect(ElementType element) => element switch
    {
        ElementType.Fire => CombatEffectType.Burn,
        ElementType.Ice => CombatEffectType.Freeze,
        ElementType.Air => CombatEffectType.Gust,
        ElementType.Nature or ElementType.Earth => CombatEffectType.Root,
        ElementType.Lightning => CombatEffectType.Shock,
        ElementType.Dark or ElementType.Void => CombatEffectType.Void,
        ElementType.Poison => CombatEffectType.Poison,
        ElementType.Light => CombatEffectType.Marked,
        _ => CombatEffectType.SpellPower
    };

    public static IEnumerable<WeaponIndexEntry> GetIndexEntries()
    {
        foreach (KeyValuePair<Rarity, MageWeaponDefinition[]> rarityGroup in weapons)
        {
            foreach (MageWeaponDefinition weapon in rarityGroup.Value)
            {
                yield return new WeaponIndexEntry(weapon.Name, rarityGroup.Key, weapon.Type, weapon.Element,
                    weapon.Effect, weapon.Description);
            }
        }
    }

    private static MageWeaponDefinition W(string name, ElementType element, CombatEffectType effect, int damage)
        => new(name, WeaponType.Wand, element, effect, damage, 0, $"A named {element.ToString().ToLowerInvariant()} wand with a Mage-exclusive effect: {effect}.");

    private static MageWeaponDefinition S(string name, ElementType element, CombatEffectType effect, int damage)
        => new(name, WeaponType.Staff, element, effect, damage, 0, $"A named {element.ToString().ToLowerInvariant()} staff with a Mage-exclusive effect: {effect}.");
}
