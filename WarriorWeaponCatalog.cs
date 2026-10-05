using System;
using System.Collections.Generic;
using System.Linq;

namespace DungeonSimulation;

public sealed class WarriorWeaponDefinition
{
    public string Name { get; }
    public WeaponType Type { get; }
    public ElementType Element { get; }
    public int DamageBonus { get; }
    public double CriticalChanceBonus { get; }
    public int SpeedModifier { get; }
    public CombatEffectType? Effect { get; }
    public string Description { get; }

    public WarriorWeaponDefinition(string name, WeaponType type, ElementType element, string description, int damageBonus = 0, double criticalChanceBonus = 0, int speedModifier = 0, CombatEffectType? effect = null)
    {
        Name = name;
        Type = type;
        Element = element;
        Description = description;
        DamageBonus = damageBonus;
        CriticalChanceBonus = criticalChanceBonus;
        SpeedModifier = speedModifier;
        Effect = effect;
    }
}

public static class WarriorWeaponCatalog
{
    private static readonly Dictionary<Rarity, WarriorWeaponDefinition[]> weapons = new()
    {
        [Rarity.Common] = new[]
        {
            D("Cinder Knife", WeaponType.Dagger, ElementType.Fire, "A warm-handled knife with a faint chance to burn.", CombatEffectType.Burn),
            D("Frostbite Dirk", WeaponType.Dagger, ElementType.Water, "A cold dirk that builds freeze with repeated hits.", CombatEffectType.Freeze),
            D("Breeze Shiv", WeaponType.Dagger, ElementType.Wind, "A light shiv that sends enemies stumbling backward.", CombatEffectType.Gust, speed: 2),
            D("Rootwood Axe", WeaponType.Axe, ElementType.Nature, "A rough axe that can briefly root a target.", CombatEffectType.Root),
            D("Crackle Axe", WeaponType.Axe, ElementType.Wind, "An axe that stores a small shock burst.", CombatEffectType.Shock),
            D("Rotting Hatchet", WeaponType.Axe, ElementType.Nature, "A stained hatchet that carries poison.", CombatEffectType.Poison),
            D("Lantern Blade", WeaponType.Sword, ElementType.Fire, "A blade that favors enemies already below half health.", CombatEffectType.Execution),
            D("Dusksteel Sword", WeaponType.Sword, ElementType.Void, "A dark steel sword with a quiet edge.", CombatEffectType.Void),
            D("Ironfang", WeaponType.Sword, ElementType.None, "A dependable sword with a sharper-than-usual bite.", CombatEffectType.Bleed),
            D("Harvest Scythe", WeaponType.Scythe, ElementType.None, "A simple scythe that returns a little health on impact.", CombatEffectType.LifeSteal),
            D("Ashen Reaper", WeaponType.Scythe, ElementType.Fire, "A scorched scythe that feeds better on burning foes.", CombatEffectType.LifeSteal),
            D("Winter Reaper", WeaponType.Scythe, ElementType.Water, "A frost-rimmed scythe that feeds better on frozen foes.", CombatEffectType.LifeSteal)
        },
        [Rarity.Uncommon] = new[]
        {
            D("Emberfang", WeaponType.Dagger, ElementType.Fire, "Burned enemies take increased dagger damage.", CombatEffectType.Burn),
            D("Glacier Needle", WeaponType.Dagger, ElementType.Water, "Striking a frozen enemy briefly sharpens attack speed.", CombatEffectType.Freeze, speed: 2),
            D("Whisperwind", WeaponType.Dagger, ElementType.Wind, "Attacks can create a small gust.", CombatEffectType.Gust, speed: 3),
            D("Thorncleaver", WeaponType.Axe, ElementType.Nature, "Rooted enemies take bonus axe damage.", CombatEffectType.Root),
            D("Stormsplitter", WeaponType.Axe, ElementType.Wind, "Heavy attacks can chain lightning.", CombatEffectType.Chain, damage: 1),
            D("Venom Hatchet", WeaponType.Axe, ElementType.Nature, "Poisoned enemies lose some of their force.", CombatEffectType.Poison),
            D("Sunsteel", WeaponType.Sword, ElementType.Fire, "A bright sword favored against undead shadows.", CombatEffectType.Marked),
            D("Gloamfang", WeaponType.Sword, ElementType.Void, "A kill briefly sharpens the wielder.", CombatEffectType.Momentum),
            D("Bloodletter", WeaponType.Sword, ElementType.None, "Bleeding enemies return a tiny amount of health.", CombatEffectType.Bleed),
            D("Grave Harvester", WeaponType.Scythe, ElementType.Void, "Life steal increases against weakened enemies.", CombatEffectType.LifeSteal),
            D("Bloomreaper", WeaponType.Scythe, ElementType.Nature, "Killing rooted enemies restores a little health.", CombatEffectType.Root),
            D("Sparking Reaper", WeaponType.Scythe, ElementType.Wind, "Life steal can trigger a shock.", CombatEffectType.Shock)
        },
        [Rarity.Rare] = new[]
        {
            D("Pyrefang", WeaponType.Dagger, ElementType.Fire, "Every third hit applies a powerful burn.", CombatEffectType.Burn, damage: 1),
            D("Rimepiercer", WeaponType.Dagger, ElementType.Water, "Critical hits add several freeze stacks.", CombatEffectType.Freeze),
            D("Gale Talons", WeaponType.Dagger, ElementType.Wind, "Fast attacks create a gust.", CombatEffectType.Gust, speed: 4),
            D("Elderroot Cleaver", WeaponType.Axe, ElementType.Nature, "Heavy attacks can root; rooted enemies take more damage.", CombatEffectType.Root, damage: 2),
            D("Thundermaul Axe", WeaponType.Axe, ElementType.Wind, "Charged attacks release a lightning chain.", CombatEffectType.Chain, damage: 3),
            D("Plaguecutter", WeaponType.Axe, ElementType.Nature, "Poison can stack beyond its normal limit.", CombatEffectType.Poison, damage: 1),
            D("Radiant Edge", WeaponType.Sword, ElementType.Fire, "Attacks occasionally release a short light beam.", CombatEffectType.Marked, damage: 2),
            D("Nightfall Saber", WeaponType.Sword, ElementType.Void, "Kills restore a small amount of mana.", CombatEffectType.ManaSteal, damage: 2),
            D("Crimson Fang", WeaponType.Sword, ElementType.None, "Bleeding enemies take more damage as they weaken.", CombatEffectType.Bleed, damage: 2),
            D("Soulharvest", WeaponType.Scythe, ElementType.Void, "Life steal also restores a little mana.", CombatEffectType.ManaSteal, damage: 2),
            D("Verdant Reaper", WeaponType.Scythe, ElementType.Nature, "Life steal against rooted enemies is greatly increased.", CombatEffectType.LifeSteal, damage: 2),
            D("Storm Reaper", WeaponType.Scythe, ElementType.Wind, "Life steal can release chain lightning.", CombatEffectType.Chain, damage: 2)
        },
        [Rarity.Epic] = new[]
        {
            D("Hellflame Twins", WeaponType.Dagger, ElementType.Fire, "Every fourth attack launches a second flaming dagger.", CombatEffectType.Burn, damage: 2),
            D("Heart of Winter", WeaponType.Dagger, ElementType.Water, "Frozen enemies can be shattered by critical hits.", CombatEffectType.Freeze, damage: 2),
            D("Tempest Needles", WeaponType.Dagger, ElementType.Wind, "Attacks become faster while momentum builds.", CombatEffectType.Momentum, speed: 5),
            D("Worldroot Axe", WeaponType.Axe, ElementType.Nature, "Heavy attacks create roots around the target.", CombatEffectType.Root, damage: 3),
            D("Mjolnir's Splinter", WeaponType.Axe, ElementType.Wind, "Heavy attacks call down chain lightning.", CombatEffectType.Chain, damage: 4),
            D("Blightcleaver", WeaponType.Axe, ElementType.Nature, "Poisoned enemies can spread poison on death.", CombatEffectType.Poison, damage: 2),
            D("Dawnbringer", WeaponType.Sword, ElementType.Fire, "A periodic light burst heals the wielder slightly.", CombatEffectType.LifeSteal, damage: 3),
            D("Eclipse Blade", WeaponType.Sword, ElementType.Void, "Alternates between light and dark damage.", CombatEffectType.Void, damage: 3),
            D("Warlord's Fang", WeaponType.Sword, ElementType.None, "Each consecutive hit grants momentum.", CombatEffectType.Momentum, damage: 3),
            D("Blood Moon", WeaponType.Scythe, ElementType.Void, "Life steal grows stronger as health falls.", CombatEffectType.LifeSteal, damage: 3),
            D("Reaper of Spring", WeaponType.Scythe, ElementType.Nature, "Kills create small healing flowers.", CombatEffectType.LifeSteal, damage: 3),
            D("Thunder Harvest", WeaponType.Scythe, ElementType.Wind, "Life steal can chain lightning through nearby enemies.", CombatEffectType.Chain, damage: 3)
        },
        [Rarity.Legendary] = new[]
        {
            D("Solfang", WeaponType.Dagger, ElementType.Fire, "Critical hits release light blades in three directions.", CombatEffectType.Blind, damage: 3),
            D("Voidkiss", WeaponType.Dagger, ElementType.Void, "Attacks partially ignore armor.", CombatEffectType.Void, damage: 4),
            D("Venom of the Ancient Serpent", WeaponType.Dagger, ElementType.Nature, "Poison stacks deal increasing damage.", CombatEffectType.Poison, damage: 3),
            D("Infernal Executioner", WeaponType.Axe, ElementType.Fire, "Heavy attacks create a fiery shockwave.", CombatEffectType.Burn, damage: 5),
            D("Axe of the Skybreaker", WeaponType.Axe, ElementType.Wind, "Charged attacks summon a vertical tornado.", CombatEffectType.Gust, damage: 5),
            D("Worldsplitter", WeaponType.Axe, ElementType.Nature, "Heavy attacks crack the ground in a line.", CombatEffectType.Root, damage: 5),
            D("Stormfang", WeaponType.Sword, ElementType.Wind, "Every fifth hit summons a lightning strike.", CombatEffectType.Shock, damage: 4),
            D("Frostmourne's Echo", WeaponType.Sword, ElementType.Water, "Frozen enemies leave an ice explosion.", CombatEffectType.Freeze, damage: 4),
            D("Dragonsteel", WeaponType.Sword, ElementType.Fire, "Attacks build Dragonfire toward a flame wave.", CombatEffectType.Burn, damage: 4),
            D("Grave King's Reaper", WeaponType.Scythe, ElementType.Void, "Massive life steal against weakened enemies.", CombatEffectType.Execution, damage: 5),
            D("Worldroot Harvester", WeaponType.Scythe, ElementType.Nature, "Life steal attacks spread roots.", CombatEffectType.Root, damage: 4),
            D("Heaven's Reaper", WeaponType.Scythe, ElementType.Fire, "Life steal attacks release beams of light.", CombatEffectType.LifeSteal, damage: 4)
        },
        [Rarity.Mythic] = new[]
        {
            D("Ignis, Fang of the First Flame", WeaponType.Dagger, ElementType.Fire, "Flame stacks erupt into a fire nova.", CombatEffectType.Burn, damage: 5),
            D("Absolute Zero", WeaponType.Dagger, ElementType.Water, "Maximum freeze can permanently shatter enemies.", CombatEffectType.Freeze, damage: 5),
            D("Zephyr's Last Breath", WeaponType.Dagger, ElementType.Wind, "Attacks increase speed and momentum.", CombatEffectType.Momentum, damage: 4, speed: 6),
            D("Axe of the Worldroot", WeaponType.Axe, ElementType.Nature, "Roots connect nearby enemies and transfer damage.", CombatEffectType.Root, damage: 7),
            D("Heaven's Thunder", WeaponType.Axe, ElementType.Wind, "Every heavy attack summons lightning.", CombatEffectType.Shock, damage: 7),
            D("Plaguefather", WeaponType.Axe, ElementType.Nature, "Poisoned enemies become carriers.", CombatEffectType.Poison, damage: 6),
            D("Solaris", WeaponType.Sword, ElementType.Fire, "Attacks build Radiance toward a light explosion.", CombatEffectType.Marked, damage: 6),
            D("Night's End", WeaponType.Sword, ElementType.Void, "Void attacks partially ignore defenses.", CombatEffectType.Void, damage: 6),
            D("Sword of the Endless Duel", WeaponType.Sword, ElementType.None, "Kills grant permanent momentum for the floor.", CombatEffectType.Momentum, damage: 6),
            D("The Red Harvest", WeaponType.Scythe, ElementType.None, "Life steal grows against enemies already wounded.", CombatEffectType.Execution, damage: 7),
            D("Moonreaper", WeaponType.Scythe, ElementType.Void, "Life steal also steals mana.", CombatEffectType.ManaSteal, damage: 6),
            D("Garden of Death", WeaponType.Scythe, ElementType.Nature, "Kills create flowers that heal nearby allies.", CombatEffectType.LifeSteal, damage: 6)
        },
        [Rarity.Divine] = new[]
        {
            D("The Merciful King", WeaponType.Sword, ElementType.Fire, "A historical blade whose mercy outlived its kingdom.", CombatEffectType.Blind, damage: 10),
            D("Fang of the First Flame", WeaponType.Dagger, ElementType.Fire, "The first warrior's dagger, alive with ancient flame.", CombatEffectType.Burn, damage: 10),
            D("The Empty Sky", WeaponType.Dagger, ElementType.Wind, "An assassin's blade that leaves only wind behind.", CombatEffectType.Gust, damage: 9, speed: 8),
            D("The Fallen Root", WeaponType.Axe, ElementType.Nature, "The first king's axe still remembers the forest.", CombatEffectType.Root, damage: 12),
            D("Stormcrown", WeaponType.Axe, ElementType.Wind, "The heavens struck its wielder and found him standing.", CombatEffectType.Shock, damage: 12),
            D("The Blooming Plague", WeaponType.Axe, ElementType.Nature, "Where it walks, poison flowers follow.", CombatEffectType.Poison, damage: 11),
            D("Excalibur", WeaponType.Sword, ElementType.Fire, "A king's blade that proves its wielder worthy.", CombatEffectType.Marked, damage: 12),
            D("Voidcrown", WeaponType.Sword, ElementType.Void, "A king's sword from a kingdom consumed by the Void.", CombatEffectType.Void, damage: 12),
            D("Absolute Winter", WeaponType.Sword, ElementType.Water, "The Winter King's blade, drawn only once.", CombatEffectType.Freeze, damage: 12),
            D("The Last Reaper", WeaponType.Scythe, ElementType.Void, "Executions restore the wielder and shake the room.", CombatEffectType.Execution, damage: 14),
            D("Gravebloom", WeaponType.Scythe, ElementType.Nature, "Every death makes the world bloom.", CombatEffectType.LifeSteal, damage: 13),
            D("The Fallen Hero", WeaponType.Scythe, ElementType.Fire, "A final stand made into a weapon.", CombatEffectType.LifeSteal, damage: 14)
        }
    };

    public static Weapon Create(Rarity rarity, int level)
    {
        WarriorWeaponDefinition[] options = weapons[rarity];
        WeaponType type = RollType();
        WarriorWeaponDefinition definition = options.FirstOrDefault(option => option.Type == type) ?? options[0];
        double multiplier = RarityInfo.GetMultiplier(rarity);
        int damage = Math.Max(1, (int)Math.Round((3 + level * 2) * multiplier) + definition.DamageBonus);
        Weapon weapon = new(definition.Name, definition.Type, damage, 10, 0.03 + definition.CriticalChanceBonus,
            goldValue: Math.Max(1, (int)Math.Round(12 * multiplier)), description: definition.Description,
            rarity: rarity, element: definition.Element, speedModifier: definition.SpeedModifier);
        if (definition.Effect.HasValue)
        {
            weapon.CombatEffects.Add(CombatEffectCatalog.CreateDefault(definition.Effect.Value));
        }
        AddAttacksForRarity(weapon);
        return weapon;
    }

    private static void AddAttacksForRarity(Weapon weapon)
    {
        if (weapon.Rarity == Rarity.Common) return;

        weapon.SpecialAttacks.Add(new WeaponAttack("Measured Charge", "charge",
            "Spend your turn preparing the next basic attack: +50% damage and +10% crit chance.",
            1.5, criticalChanceBonus: 0.10, chargesNextAttack: true));

        if (weapon.Rarity >= Rarity.Rare)
            weapon.SpecialAttacks.Add(weapon.Type switch
            {
                WeaponType.Dagger => new("Quick Cut", "quickcut", "Fast strike with increased crit chance.", 0.8, 0.20, 1, CombatEffectType.Bleed),
                WeaponType.Axe => new("Crescent Cleave", "crescent", "Forceful swing with increased damage.", 1.6, 0, 2, CombatEffectType.Bleed),
                WeaponType.Scythe => new("Wide Sweep", "widesweep", "Broad strike that can stagger the target.", 1.2, 0.05, 1, CombatEffectType.Gust),
                _ => new("Lunge", "lunge", "Committed thrust with increased damage and crit chance.", 1.35, 0.10, 1, CombatEffectType.Marked)
            });

        if (weapon.Rarity >= Rarity.Epic)
            weapon.SpecialAttacks.Add(weapon.Type switch
            {
                WeaponType.Dagger => new("Backstab", "backstab", "A committed strike with high damage and a chance to blind.", 1.7, 0.10, 2, CombatEffectType.Blind),
                WeaponType.Axe => new("Armor Breaker", "armorbreak", "Crushing strike that partially bypasses defenses.", 1.25, 0.05, 2, CombatEffectType.Void),
                WeaponType.Scythe => new("Reaping Blow", "reap", "Heavy hit with execution pressure against wounded foes.", 1.7, 0.05, 2, CombatEffectType.Execution),
                _ => new("Sundering Strike", "sunder", "Heavy blow that leaves the target marked.", 1.65, 0, 2, CombatEffectType.Marked)
            });

        if (weapon.Rarity >= Rarity.Legendary)
            weapon.SpecialAttacks.Add(weapon.Type switch
            {
                WeaponType.Dagger => new("Phantom Flurry", "flurry", "Rapid cuts with exceptional crit potential.", 1.1, 0.25, 3, CombatEffectType.Bleed, 2),
                WeaponType.Axe => new("Earthsplitter", "earthsplit", "Devastating overhead strike that roots the target.", 2.1, 0.05, 3, CombatEffectType.Root, 2),
                WeaponType.Scythe => new("Soul Reap", "soulreap", "Punishing execution strike against weakened foes.", 2.0, 0.15, 3, CombatEffectType.Execution, 2),
                _ => new("King's Verdict", "verdict", "Decisive blow with marked-target pressure.", 1.9, 0.15, 3, CombatEffectType.Marked, 2)
            });

        if (weapon.Rarity >= Rarity.Mythic)
            weapon.SpecialAttacks.Add(weapon.Type switch
            {
                WeaponType.Dagger => new("Deathmark", "deathmark", "Precise strike with high crit chance that marks its victim.", 1.4, 0.30, 4, CombatEffectType.Marked, 2),
                WeaponType.Axe => new("Worldbreaker", "worldbreaker", "Massive blow with a chance to root and weaken.", 2.4, 0.10, 4, CombatEffectType.Root, 3),
                WeaponType.Scythe => new("Final Harvest", "finalharvest", "Brutal finishing blow with strong execution pressure.", 2.3, 0.20, 4, CombatEffectType.Execution, 3),
                _ => new("Duelist's End", "duelistsend", "Masterful finishing thrust with high crit chance.", 2.1, 0.25, 4, CombatEffectType.Bleed, 3)
            });

        if (weapon.Rarity == Rarity.Divine)
            weapon.SpecialAttacks.Add(weapon.Type switch
            {
                WeaponType.Dagger => new("First Flame", "firstflame", "Near-perfect strike with burn and devastating crit potential.", 2.8, 0.35, 5, CombatEffectType.Burn, 3),
                WeaponType.Axe => new("Heavenfall", "heavenfall", "Colossal strike that shocks and breaks the target's stance.", 3.0, 0.20, 5, CombatEffectType.Shock, 3),
                WeaponType.Scythe => new("The Last Reaping", "lastreaping", "Legendary execution strike against weakened foes.", 2.8, 0.30, 5, CombatEffectType.Execution, 4),
                _ => new("Crownfall", "crownfall", "Peerless blow with immense damage and a gust effect.", 2.7, 0.30, 5, CombatEffectType.Gust, 3)
            });
    }

    public static IEnumerable<WeaponIndexEntry> GetIndexEntries()
    {
        foreach (KeyValuePair<Rarity, WarriorWeaponDefinition[]> rarityGroup in weapons)
        {
            foreach (WarriorWeaponDefinition weapon in rarityGroup.Value)
            {
                yield return new WeaponIndexEntry(weapon.Name, rarityGroup.Key, weapon.Type, weapon.Element,
                    weapon.Effect ?? CombatEffectType.Bleed, weapon.Description);
            }
        }
    }

    public static Weapon CreateStarterSword()
    {
        return new Weapon("Ironfang", WeaponType.Sword, 3, 5, goldValue: 4, description: "A plain warrior's sword with a bite of its own.");
    }

    private static WeaponType RollType()
    {
        int roll = Random.Shared.Next(100);
        return roll switch
        {
            < 50 => WeaponType.Sword,
            < 80 => WeaponType.Dagger,
            < 95 => WeaponType.Axe,
            _ => WeaponType.Scythe
        };
    }

    private static WarriorWeaponDefinition D(string name, WeaponType type, ElementType element, string description, CombatEffectType? effect = null, int damage = 0, int speed = 0)
    {
        return new WarriorWeaponDefinition(name, type, element, description, damage, speedModifier: speed, effect: effect);
    }
}
