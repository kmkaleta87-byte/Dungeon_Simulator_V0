using System;

namespace DungeonSimulation;

public static class LootGenerator
{
    public static bool DevMode { get; set; }

    public static LootDrop Generate(Enemy enemy, Inventory? inventory = null)
    {
        Rarity rarity = RollRarity(enemy);
        int gold = enemy.GoldReward + Random.Shared.Next(1, enemy.GoldReward + 1);
        LootDrop drop = Random.Shared.Next(100) switch
        {
            < 30 => new LootDrop(CreateWeapon(rarity, enemy.Level), gold),
            < 50 => new LootDrop(CreateArmor(rarity, enemy.Level), gold),
            _ => new LootDrop(CreateItem(rarity), gold)
        };
        return AvoidDuplicateDivine(drop, inventory, () => GenerateNonDivine(enemy.Level, gold));
    }

    public static Armor CreateArmor(Rarity rarity, int level)
    {
        ArmorSlot slot = (ArmorSlot)Random.Shared.Next(Enum.GetValues<ArmorSlot>().Length);
        double multiplier = RarityInfo.GetMultiplier(rarity);
        int defense = Math.Max(1, (int)Math.Round((2 + level) * multiplier));
        int reduction = Math.Max(1, (int)Math.Round((1 + level / 2.0) * multiplier));
        int healthBonus = Math.Max(0, (int)Math.Round(level * 5 * multiplier) - 3);
        string material = rarity switch
        {
            Rarity.Common => "Iron",
            Rarity.Uncommon => "Steel",
            Rarity.Rare => "Knightsteel",
            Rarity.Epic => "Runed Plate",
            Rarity.Legendary => "Dragonforged",
            Rarity.Mythic => "Starwoven",
            Rarity.Divine => "Celestial",
            _ => "Worn Leather"
        };

        return new Armor(
            $"{RarityInfo.GetName(rarity)} {material} {slot}",
            slot,
            defense,
            reduction,
            healthBonus,
            speedModifier: rarity >= Rarity.Legendary ? 1 : 0,
            goldValue: Math.Max(1, (int)Math.Round(10 * multiplier)),
            description: $"{rarity} armor recovered from a defeated {enemyNameForArmor(rarity)}.",
            rarity: rarity,
            setName: material);
    }

    public static Weapon CreateWeapon(Rarity rarity, int level)
    {
        if (DevMode)
        {
            rarity = (Rarity)Math.Max((int)rarity, (int)RollDevWeaponRarity());
        }

        // Keep the three class weapon families distinct in the shared loot pool.
        int weaponRoll = Random.Shared.Next(100);
        if (weaponRoll < 63)
        {
            return WarriorWeaponCatalog.Create(rarity, level);
        }

        if (weaponRoll < 91)
        {
            return ArcherWeaponCatalog.Create(rarity, level);
        }

        return MageWeaponCatalog.Create(rarity, level);
    }

    private static Rarity RollDevWeaponRarity()
    {
        int roll = Random.Shared.Next(1000);
        return roll switch
        {
            < 50 => Rarity.Common,
            < 150 => Rarity.Uncommon,
            < 300 => Rarity.Rare,
            < 500 => Rarity.Epic,
            < 700 => Rarity.Legendary,
            < 850 => Rarity.Mythic,
            _ => Rarity.Divine
        };
    }

    public static Item CreateItem(Rarity rarity)
    {
        bool manaPotion = Random.Shared.NextDouble() < 0.35;
        double multiplier = RarityInfo.GetMultiplier(rarity);
        return new Item(
            $"{RarityInfo.GetName(rarity)} {(manaPotion ? "Mana" : "Healing")} Potion",
            ItemType.Potion,
            goldValue: Math.Max(1, (int)Math.Round(8 * multiplier)),
            description: manaPotion ? "A blue potion that restores mana." : "A potion with a color that does not occur naturally.",
            rarity: rarity,
            manaAmount: manaPotion ? 12 + (int)Math.Round(8 * multiplier) : 0,
            healingPercent: manaPotion ? 0 : HealthPotionPercent(rarity));
    }

    public static int HealthPotionPercent(Rarity rarity) => rarity switch
    {
        Rarity.Common => 20,
        Rarity.Uncommon => 25,
        Rarity.Rare => 30,
        Rarity.Epic => 40,
        Rarity.Legendary => 50,
        Rarity.Mythic => 65,
        Rarity.Divine => 80,
        _ => 20
    };

    public static LootDrop GenerateShopDrop(int floor, int upgradeLevel, Inventory? inventory = null)
    {
        Rarity rarity = RollShopRarity(upgradeLevel);
        LootDrop drop = Random.Shared.Next(3) switch
        {
            0 => new LootDrop(CreateWeapon(rarity, Math.Max(1, floor)), 0),
            1 => new LootDrop(CreateArmor(rarity, Math.Max(1, floor)), 0),
            _ => new LootDrop(CreateItem(rarity), 0)
        };
        return AvoidDuplicateDivine(drop, inventory, () => GenerateNonDivine(Math.Max(1, floor), 0));
    }

    private static LootDrop GenerateNonDivine(int level, int gold)
    {
        Rarity rarity = (Rarity)Random.Shared.Next((int)Rarity.Divine);
        return Random.Shared.Next(3) switch
        {
            0 => new LootDrop(CreateWeapon(rarity, level), gold),
            1 => new LootDrop(CreateArmor(rarity, level), gold),
            _ => new LootDrop(CreateItem(rarity), gold)
        };
    }

    private static LootDrop AvoidDuplicateDivine(LootDrop drop, Inventory? inventory, Func<LootDrop> fallback)
    {
        return inventory != null && drop.Rarity == Rarity.Divine && inventory.HasDivine(drop.DisplayName)
            ? fallback()
            : drop;
    }

    private static Rarity RollShopRarity(int upgradeLevel)
    {
        int roll = Random.Shared.Next(1000);
        int shift = Math.Min(80, Math.Max(0, upgradeLevel) * 15);
        int legendaryThreshold = 990 - (Math.Min(5, upgradeLevel) * 2);
        int divineThreshold = 1000 - (Math.Min(5, upgradeLevel) * 2);
        int mythicThreshold = divineThreshold - 4;

        if (roll < 450 - shift) return Rarity.Common;
        if (roll < 730 - shift) return Rarity.Uncommon;
        if (roll < 880 - shift) return Rarity.Rare;
        if (roll < 960 - shift) return Rarity.Epic;
        if (roll < legendaryThreshold) return Rarity.Legendary;
        if (roll < mythicThreshold) return Rarity.Mythic;
        return Rarity.Divine;
    }

    private static Rarity RollRarity(Enemy enemy)
    {
        int roll = Random.Shared.Next(1000);

        Rarity rarity = enemy.Class switch
        {
            EnemyClass.Elite => RollEliteRarity(roll, enemy.IsUniqueVariant),
            EnemyClass.Boss => RollBossRarity(roll),
            _ => enemy.LootTier is >= 1 and <= 4
                ? RollEnemyRoomRarity(enemy.LootTier, roll)
                : RollEnemyRoomRarity(1, roll)
        };

        if (enemy.Class == EnemyClass.Elite && rarity < Rarity.Rare)
        {
            rarity = Rarity.Rare;
        }

        if (enemy.Class == EnemyClass.Boss && rarity < Rarity.Epic)
        {
            rarity = Rarity.Epic;
        }

        return rarity;
    }

    private static Rarity RollEliteRarity(int roll, bool unique)
    {
        return unique
            ? roll switch
            {
                < 200 => Rarity.Common,
                < 400 => Rarity.Uncommon,
                < 580 => Rarity.Rare,
                < 730 => Rarity.Epic,
                < 870 => Rarity.Legendary,
                < 990 => Rarity.Mythic,
                _ => Rarity.Divine
            }
            : roll switch
            {
                < 280 => Rarity.Common,
                < 500 => Rarity.Uncommon,
                < 680 => Rarity.Rare,
                < 810 => Rarity.Epic,
                < 930 => Rarity.Legendary,
                < 990 => Rarity.Mythic,
                _ => Rarity.Divine
            };
    }

    private static Rarity RollBossRarity(int roll)
    {
        return roll switch
        {
            < 150 => Rarity.Common,
            < 330 => Rarity.Uncommon,
            < 510 => Rarity.Rare,
            < 670 => Rarity.Epic,
            < 820 => Rarity.Legendary,
            < 980 => Rarity.Mythic,
            _ => Rarity.Divine
        };
    }

    private static Rarity RollEnemyRoomRarity(int roomNumber, int roll)
    {
        return roomNumber switch
        {
            1 => roll switch
            {
                < 480 => Rarity.Common,
                < 720 => Rarity.Uncommon,
                < 870 => Rarity.Rare,
                < 950 => Rarity.Epic,
                < 990 => Rarity.Legendary,
                _ => Rarity.Mythic
            },
            2 => roll switch
            {
                < 420 => Rarity.Common,
                < 660 => Rarity.Uncommon,
                < 820 => Rarity.Rare,
                < 910 => Rarity.Epic,
                < 980 => Rarity.Legendary,
                < 998 => Rarity.Mythic,
                _ => Rarity.Divine
            },
            3 => roll switch
            {
                < 350 => Rarity.Common,
                < 580 => Rarity.Uncommon,
                < 750 => Rarity.Rare,
                < 860 => Rarity.Epic,
                < 970 => Rarity.Legendary,
                < 996 => Rarity.Mythic,
                _ => Rarity.Divine
            },
            _ => roll switch
            {
                < 280 => Rarity.Common,
                < 500 => Rarity.Uncommon,
                < 680 => Rarity.Rare,
                < 810 => Rarity.Epic,
                < 930 => Rarity.Legendary,
                < 994 => Rarity.Mythic,
                _ => Rarity.Divine
            }
        };
    }

    private static string enemyNameForArmor(Rarity rarity)
    {
        return rarity >= Rarity.Legendary ? "an ancient guardian" : "a dungeon enemy";
    }
}
