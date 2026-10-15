using System;
using System.Collections.Generic;
using System.Linq;

namespace DungeonSimulation;

public sealed class ArcherWeaponDefinition
{
    public string Name { get; }
    public WeaponType Type { get; }
    public ElementType Element { get; }
    public CombatEffectType Effect { get; }
    public int DamageBonus { get; }
    public string Description { get; }

    public ArcherWeaponDefinition(string name, WeaponType type, ElementType element, CombatEffectType effect, int damageBonus, string description)
    {
        Name = name;
        Type = type;
        Element = element;
        Effect = effect;
        DamageBonus = damageBonus;
        Description = description;
    }
}

public static class ArcherWeaponCatalog
{
    private static readonly Dictionary<Rarity, ArcherWeaponDefinition[]> weapons = new()
    {
        [Rarity.Common] = new[]
        {
            B("Emberwood Bow", ElementType.Fire, CombatEffectType.Scatter, 0), B("Frostpine Bow", ElementType.Ice, CombatEffectType.RangeScaling, 0),
            B("Gale String", ElementType.Air, CombatEffectType.Homing, 0), B("Thornbranch Bow", ElementType.Nature, CombatEffectType.Pin, 0),
            B("Stormstring", ElementType.Lightning, CombatEffectType.Afterimage, 1), B("Duskwillow Bow", ElementType.Dark, CombatEffectType.Blind, 0),
            C("Sunbolt Crossbow", ElementType.Light, CombatEffectType.Headshot, 1), C("Venomwood Crossbow", ElementType.Poison, CombatEffectType.Headshot, 1),
            C("Iron Repeater", ElementType.Physical, CombatEffectType.Draw, 0), C("Hunter's Crossbow", ElementType.Physical, CombatEffectType.Snipe, 1),
            C("Stonebolt", ElementType.Earth, CombatEffectType.Gust, 2), C("Ashen Crossbow", ElementType.Fire, CombatEffectType.Overdraw, 1)
        },
        [Rarity.Uncommon] = new[]
        {
            B("Cinderstring", ElementType.Fire, CombatEffectType.Burn, 1), B("Winterglass Bow", ElementType.Ice, CombatEffectType.Pierce, 1),
            B("Zephyr Bow", ElementType.Air, CombatEffectType.Focus, 1), B("Briarbow", ElementType.Nature, CombatEffectType.Mark, 1),
            B("Thunderwood Bow", ElementType.Lightning, CombatEffectType.Pierce, 2), B("Moonshadow Bow", ElementType.Dark, CombatEffectType.Headshot, 1),
            C("Dawnpiercer", ElementType.Light, CombatEffectType.Penetration, 2), C("Serpent's Repeater", ElementType.Poison, CombatEffectType.Momentum, 1),
            C("Falcon's Crossbow", ElementType.Physical, CombatEffectType.Headshot, 1), C("Mountainbreaker", ElementType.Earth, CombatEffectType.Gust, 3),
            C("Windrunner Crossbow", ElementType.Air, CombatEffectType.Draw, 2), C("Blackpowder Crossbow", ElementType.Fire, CombatEffectType.Scatter, 2)
        },
        [Rarity.Rare] = new[]
        {
            B("Dragonbreath Bow", ElementType.Fire, CombatEffectType.Overdraw, 3), B("Glacial Longbow", ElementType.Ice, CombatEffectType.PiercingShot, 3),
            B("Stormcaller", ElementType.Lightning, CombatEffectType.Chain, 3), B("Windpiercer", ElementType.Air, CombatEffectType.RangeScaling, 2),
            B("Heartwood Bow", ElementType.Nature, CombatEffectType.Marked, 3), B("Eclipse Bow", ElementType.Dark, CombatEffectType.Homing, 2),
            C("Sunfall Crossbow", ElementType.Light, CombatEffectType.PiercingShot, 3), C("Plaguebolt", ElementType.Poison, CombatEffectType.Ricochet, 2),
            C("Siege Crossbow", ElementType.Earth, CombatEffectType.Penetration, 4), C("Windlass of the Hunt", ElementType.Air, CombatEffectType.Focus, 2),
            C("Bloodshot Crossbow", ElementType.Physical, CombatEffectType.AmmoGeneration, 2), C("Black Star Crossbow", ElementType.Dark, CombatEffectType.Mark, 2)
        },
        [Rarity.Epic] = new[]
        {
            B("Inferno's Spine", ElementType.Fire, CombatEffectType.Multishot, 4), B("Absolute Winter", ElementType.Ice, CombatEffectType.PiercingShot, 4),
            B("Tempest Bow", ElementType.Air, CombatEffectType.Volley, 4), B("Worldroot Bow", ElementType.Nature, CombatEffectType.Trap, 3),
            B("Thunderheart", ElementType.Lightning, CombatEffectType.Momentum, 4), B("Nightwhisper", ElementType.Dark, CombatEffectType.Focus, 3),
            C("Seraph's Bowgun", ElementType.Light, CombatEffectType.Multishot, 4), C("Venomfang Repeater", ElementType.Poison, CombatEffectType.Ricochet, 4),
            C("Titanbreaker", ElementType.Physical, CombatEffectType.ExecutionBolt, 5), C("Galehammer", ElementType.Air, CombatEffectType.Gust, 4),
            C("Verdant Siegebow", ElementType.Nature, CombatEffectType.Trap, 4), C("Starfall Crossbow", ElementType.Light, CombatEffectType.Volley, 5)
        },
        [Rarity.Legendary] = new[]
        {
            B("The First Flamebow", ElementType.Fire, CombatEffectType.Overdraw, 6), B("Winter's End", ElementType.Ice, CombatEffectType.Penetration, 6),
            B("Heaven's String", ElementType.Lightning, CombatEffectType.Chain, 6), B("The Wind That Hunts", ElementType.Air, CombatEffectType.Homing, 6),
            B("Elderwood's Oath", ElementType.Nature, CombatEffectType.Focus, 6), B("Bow of the Forgotten Moon", ElementType.Dark, CombatEffectType.Ricochet, 6),
            C("Solbreaker", ElementType.Light, CombatEffectType.Penetration, 7), C("The Serpent's Choir", ElementType.Poison, CombatEffectType.Ricochet, 7),
            C("Titan's Last Bolt", ElementType.Physical, CombatEffectType.ExecutionBolt, 8), C("Stormrail", ElementType.Lightning, CombatEffectType.Volley, 7),
            C("Blackroot Ballista", ElementType.Nature, CombatEffectType.Root, 7), C("Doom's Repeater", ElementType.Dark, CombatEffectType.Salvo, 7)
        },
        [Rarity.Mythic] = new[]
        {
            B("Apocalypse Bow", ElementType.Fire, CombatEffectType.Scatter, 9), B("The White Silence", ElementType.Ice, CombatEffectType.Pierce, 9),
            B("Tempest's Eye", ElementType.Air, CombatEffectType.Gust, 8), B("Worldtree's Branch", ElementType.Nature, CombatEffectType.Trap, 9),
            B("Thor's Forgotten Bow", ElementType.Lightning, CombatEffectType.Chain, 9), B("The Eclipse", ElementType.Dark, CombatEffectType.Afterimage, 9),
            C("Judgment of Heaven", ElementType.Light, CombatEffectType.Volley, 10), C("The Rotfang", ElementType.Poison, CombatEffectType.Multishot, 9),
            C("The Last Siege", ElementType.Physical, CombatEffectType.ExecutionBolt, 11), C("Heaven's Arsenal", ElementType.Lightning, CombatEffectType.Salvo, 10),
            C("The Verdant Ballista", ElementType.Nature, CombatEffectType.Pin, 10), C("Night's Thousand Eyes", ElementType.Dark, CombatEffectType.Homing, 10)
        },
        [Rarity.Divine] = new[]
        {
            B("Artemis, Bow of the Huntress", ElementType.Physical, CombatEffectType.Headshot, 14), B("The Bow of the First King", ElementType.Light, CombatEffectType.Multishot, 14),
            B("Yggdrasil's Branch", ElementType.Nature, CombatEffectType.Trap, 14), B("Mjölnir's String", ElementType.Lightning, CombatEffectType.Chain, 15),
            B("The Voidless Bow", ElementType.Dark, CombatEffectType.Penetration, 15), B("The Sunshot", ElementType.Light, CombatEffectType.Snipe, 15),
            C("Gungnir's Heir", ElementType.Lightning, CombatEffectType.Homing, 16), C("The Seraphim's Judgement", ElementType.Light, CombatEffectType.Volley, 16),
            C("The First Dragon's Crossbow", ElementType.Fire, CombatEffectType.Scatter, 17), C("The Worldbreaker", ElementType.Earth, CombatEffectType.Penetration, 17),
            C("The Thousand-Year Hunt", ElementType.Poison, CombatEffectType.Marked, 16), C("Apollo's Last Arrow", ElementType.Light, CombatEffectType.ExecutionBolt, 18)
        }
    };

    public static Weapon Create(Rarity rarity, int level)
    {
        ArcherWeaponDefinition definition = weapons[rarity][Random.Shared.Next(weapons[rarity].Length)];
        double multiplier = RarityInfo.GetMultiplier(rarity);
        int damage = Math.Max(1, (int)Math.Round((3 + level * 2) * multiplier) + definition.DamageBonus);
        int arrows = definition.Type == WeaponType.Bow ? 14 : 18;
        int speed = definition.Type == WeaponType.Bow ? 13 : 9;
        Weapon weapon = new(definition.Name, definition.Type, damage, speed, criticalChance: 0.08,
            goldValue: Math.Max(1, (int)Math.Round(14 * multiplier)), arrows: arrows,
            description: definition.Description, rarity: rarity, element: definition.Element);
        weapon.CombatEffects.Add(CombatEffectCatalog.CreateDefault(definition.Effect, Math.Max(1, (int)rarity)));
        AddAttacksForRarity(weapon);
        return weapon;
    }

    private static void AddAttacksForRarity(Weapon weapon)
    {
        if (weapon.Rarity == Rarity.Common) return;

        weapon.SpecialAttacks.Add(new WeaponAttack("Steady Draw", "steady",
            "Spend your turn lining up the next shot: +50% damage and +20% crit chance.",
            1.5, criticalChanceBonus: 0.20, chargesNextAttack: true));

        if (weapon.Rarity >= Rarity.Rare)
        {
            weapon.SpecialAttacks.Add(new WeaponAttack("Pinning Shot", "pinshot",
                "A precise shot with bonus crit chance that roots the target.",
                1.25, 0.15, 1, CombatEffectType.Pin, Math.Max(1, (int)weapon.Rarity)));
        }

        if (weapon.Rarity >= Rarity.Epic)
        {
            weapon.SpecialAttacks.Add(weapon.Type == WeaponType.Bow
                ? new WeaponAttack("Arrowstorm", "arrowstorm", "Rain arrows across every enemy; secondary targets take 65% damage.",
                    1.0, 0.05, 2, CombatEffectType.Volley, 2, secondaryDamageMultiplier: 0.65)
                : new WeaponAttack("Scatter Volley", "scattervolley", "A spread of bolts strikes every enemy; secondary targets take 70% damage.",
                    1.0, 0, 2, CombatEffectType.Scatter, 2, secondaryDamageMultiplier: 0.70));
        }

        if (weapon.Rarity >= Rarity.Legendary)
        {
            weapon.SpecialAttacks.Add(new WeaponAttack("Ricochet Barrage", "ricochetbarrage",
                "A powerful shot ricochets between the whole enemy group; secondary targets take 80% damage.",
                1.45, 0.10, 3, CombatEffectType.Ricochet, 2, secondaryDamageMultiplier: 0.80));
        }

        if (weapon.Rarity >= Rarity.Mythic)
        {
            weapon.SpecialAttacks.Add(new WeaponAttack("Worldpiercer", "worldpiercer",
                "A focused shot with greatly increased damage and execution pressure.",
                2.0, 0.15, 4, CombatEffectType.ExecutionBolt, 3));
        }

        if (weapon.Rarity == Rarity.Divine)
        {
            CombatEffectType divineEffect = weapon.Element switch
            {
                ElementType.Fire => CombatEffectType.Burn,
                ElementType.Ice => CombatEffectType.Freeze,
                ElementType.Lightning => CombatEffectType.Shock,
                ElementType.Air => CombatEffectType.Gust,
                ElementType.Nature or ElementType.Earth => CombatEffectType.Root,
                ElementType.Dark => CombatEffectType.Void,
                ElementType.Poison => CombatEffectType.Poison,
                ElementType.Light => CombatEffectType.Marked,
                _ => CombatEffectType.Headshot
            };
            weapon.SpecialAttacks.Add(new WeaponAttack("Celestial Barrage", "celestialbarrage",
                $"Call down a constellation of {weapon.Element} arrows over every foe. The main target takes 250% damage; others take 150%, with a powerful {divineEffect} effect.",
                2.5, 0.25, 5, divineEffect, 4, secondaryDamageMultiplier: 1.5));
        }
    }

    public static IEnumerable<WeaponIndexEntry> GetIndexEntries()
    {
        foreach (KeyValuePair<Rarity, ArcherWeaponDefinition[]> rarityGroup in weapons)
        {
            foreach (ArcherWeaponDefinition weapon in rarityGroup.Value)
            {
                yield return new WeaponIndexEntry(weapon.Name, rarityGroup.Key, weapon.Type, weapon.Element,
                    weapon.Effect, weapon.Description);
            }
        }
    }

    private static ArcherWeaponDefinition B(string name, ElementType element, CombatEffectType effect, int damage)
        => new(name, WeaponType.Bow, element, effect, damage, $"A named {element.ToString().ToLowerInvariant()} bow with an archer-exclusive effect: {effect}.");

    private static ArcherWeaponDefinition C(string name, ElementType element, CombatEffectType effect, int damage)
        => new(name, WeaponType.Crossbow, element, effect, damage, $"A named {element.ToString().ToLowerInvariant()} crossbow with an archer-exclusive effect: {effect}.");
}
