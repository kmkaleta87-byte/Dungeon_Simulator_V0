using System;
using System.Collections.Generic;

namespace DungeonSimulation;

public class Enemy
{
    public string Name { get; }
    public EnemyRace Race { get; }
    public EnemyClass Class { get; }
    public int Level { get; private set; }
    public int MaxHealth { get; private set; }
    public int Health { get; private set; }
    public int Damage { get; private set; }
    public int Speed { get; private set; }
    public double CriticalChance { get; }
    public double CriticalDamageMultiplier { get; }
    public double PassiveDodgeChance { get; }
    public double LifeStealPercent { get; }
    public int DamageReduction { get; private set; }
    public int ExperienceReward { get; private set; }
    public int GoldReward { get; private set; }
    public int LootTier { get; private set; }
    public string SpecialAbility { get; }
    public bool IsElite { get; }
    public bool IsBoss { get; }
    public bool IsUniqueVariant { get; }
    public bool IsSummoned { get; }
    public CombatEffectState Effects { get; } = new();
    public bool IsAlive => Health > 0;

    public Enemy(
        string name,
        EnemyRace race,
        EnemyClass enemyClass,
        int level,
        int health,
        int damage,
        int speed,
        double criticalChance,
        int experienceReward,
        int goldReward,
        double criticalDamageMultiplier = 2.0,
        double passiveDodgeChance = 0,
        double lifeStealPercent = 0,
        int damageReduction = 0,
        string specialAbility = "",
        bool isElite = false,
        bool isBoss = false,
        bool isUniqueVariant = false,
        bool isSummoned = false)
    {
        Name = name;
        Race = race;
        Class = enemyClass;
        Level = level;
        MaxHealth = health;
        Health = health;
        Damage = damage;
        Speed = speed;
        CriticalChance = criticalChance;
        CriticalDamageMultiplier = criticalDamageMultiplier;
        PassiveDodgeChance = passiveDodgeChance;
        LifeStealPercent = lifeStealPercent;
        DamageReduction = damageReduction;
        ExperienceReward = experienceReward;
        GoldReward = goldReward;
        SpecialAbility = specialAbility;
        IsElite = isElite;
        IsBoss = isBoss;
        IsUniqueVariant = isUniqueVariant;
        IsSummoned = isSummoned;
    }

    public int TakeDamage(int amount, int damageReductionIgnored = 0)
    {
        int effectiveDamageReduction = Math.Max(0, DamageReduction - damageReductionIgnored);
        int reducedDamage = Math.Max(0, amount - effectiveDamageReduction);
        int actualDamage = Math.Min(reducedDamage, Health);
        Health -= actualDamage;
        return actualDamage;
    }

    public void Heal(int amount)
    {
        if (amount > 0)
        {
            Health = Math.Min(MaxHealth, Health + amount);
        }
    }

    public void IncreaseDamage(int amount)
    {
        if (amount > 0)
        {
            Damage += amount;
        }
    }

    public void ScaleForFloor(int floor)
    {
        if (floor <= 1)
        {
            return;
        }

        double multiplier = Math.Pow(1.25, floor - 1);
        Level += floor - 1;
        MaxHealth = Math.Max(1, (int)Math.Round(MaxHealth * multiplier));
        Health = MaxHealth;
        Damage = Math.Max(1, (int)Math.Round(Damage * multiplier));
        Speed += floor - 1;
        DamageReduction = Math.Max(0, (int)Math.Round(DamageReduction * multiplier));
        ExperienceReward = Math.Max(1, (int)Math.Round(ExperienceReward * multiplier));
        GoldReward = Math.Max(1, (int)Math.Round(GoldReward * multiplier));
    }

    public void SetLootTier(int lootTier)
    {
        LootTier = Math.Clamp(lootTier, 0, 4);
    }

    public static Enemy FromSave(EnemySaveData saved)
    {
        Enemy enemy = new(saved.Name, saved.Race, saved.Class, saved.Level, saved.MaxHealth, saved.Damage,
            saved.Speed, saved.CriticalChance, saved.ExperienceReward, saved.GoldReward,
            saved.CriticalDamageMultiplier, saved.PassiveDodgeChance, saved.LifeStealPercent,
            saved.DamageReduction, saved.SpecialAbility, saved.IsElite, saved.IsBoss,
            saved.IsUniqueVariant, saved.IsSummoned);
        enemy.Health = Math.Clamp(saved.Health, 0, saved.MaxHealth);
        enemy.LootTier = saved.LootTier;
        enemy.Effects.Restore(saved.Effects);
        return enemy;
    }
}

public static class EnemyFactory
{
    public static int GetInitialEnemyCount(RoomType roomType)
    {
        return roomType switch
        {
            RoomType.EnemyRoom1 => 1,
            RoomType.EnemyRoom2 => 2,
            RoomType.EnemyRoom3 => 3,
            RoomType.EnemyRoom4 => 4,
            _ => 1
        };
    }

    public static List<Enemy> CreateEncounter(RoomType roomType, int floor)
    {
        if (roomType == RoomType.EliteRoom)
        {
            return new List<Enemy> { CreateElite(floor) };
        }

        if (roomType == RoomType.BossRoom)
        {
            return CreateBossEncounter(floor);
        }

        List<Enemy> enemies = new();
        int count = GetInitialEnemyCount(roomType);
        for (int i = 0; i < count; i++)
        {
            enemies.Add(CreateForRoom(roomType, floor));
        }
        return enemies;
    }

    public static Enemy CreateForRoom(RoomType roomType, int floor = 1)
    {
        Enemy enemy = roomType switch
        {
            RoomType.EnemyRoom1 => CreateRandomRaceEnemy(),
            RoomType.EnemyRoom2 => CreateRandomRaceEnemy(),
            RoomType.EnemyRoom3 => CreateRandomRaceEnemy(),
            RoomType.EnemyRoom4 => CreateRandomRaceEnemy(),
            RoomType.EliteRoom => CreateElite(floor),
            RoomType.BossRoom => CreateBoss(floor),
            _ => CreateSlime()
        };

        if (!enemy.IsElite && !enemy.IsBoss)
        {
            enemy.SetLootTier(GetLootTier(roomType));
            enemy.ScaleForFloor(floor);
        }

        return enemy;
    }

    public static Enemy CreateSummonedSkeleton(int floor)
    {
        Enemy skeleton = new("Summoned Skeleton", EnemyRace.Skeleton, EnemyClass.Basic, 1, 18, 4, 10, 0.02, 10, 1, isSummoned: true);
        skeleton.ScaleForFloor(floor);
        return skeleton;
    }

    private static Enemy CreateElite(int floor)
    {
        Enemy normal = CreateRandomRaceEnemy();
        normal.ScaleForFloor(floor);
        bool unique = Random.Shared.NextDouble() < 0.15;
        double healthMultiplier = 2.0;
        double damageMultiplier = 1.25;
        int goldMultiplier = 2;
        bool glassCannon = Random.Shared.NextDouble() < 0.12;
        string name = glassCannon
            ? $"Glass Cannon {normal.Race} Elite"
            : unique ? $"Unique {normal.Race} Elite" : $"Elite {normal.Name}";

        Enemy elite = new(
            name,
            normal.Race,
            normal.Class,
            normal.Level,
            (int)Math.Round(normal.MaxHealth * healthMultiplier),
            (int)Math.Round(normal.Damage * damageMultiplier),
            normal.Speed,
            Math.Min(1, normal.CriticalChance + (glassCannon ? 0.15 : 0)),
            normal.ExperienceReward * 2,
            normal.GoldReward * goldMultiplier,
            normal.CriticalDamageMultiplier,
            normal.PassiveDodgeChance,
            normal.LifeStealPercent,
            glassCannon ? 0 : normal.DamageReduction + (unique ? 3 : 1),
            specialAbility: glassCannon ? "GlassCannon" : "",
            isElite: true,
            isUniqueVariant: unique || glassCannon);

        elite.SetLootTier(unique ? 4 : 0);
        return elite;
    }

    private static List<Enemy> CreateBossEncounter(int floor)
    {
        int specialRoll = Random.Shared.Next(100);
        if (specialRoll < 12)
        {
            return CreateTwinBosses(floor);
        }

        if (specialRoll < 25)
        {
            return new List<Enemy> { CreateNecromancer(floor) };
        }

        return new List<Enemy> { CreateBoss(floor) };
    }

    private static Enemy CreateBoss(int floor)
    {
        Enemy normal = CreateRandomRaceEnemy();
        normal.ScaleForFloor(floor);
        double healthMultiplier = (floor * 0.5) + 2;
        bool glassCannon = Random.Shared.NextDouble() < 0.1;

        Enemy boss = new(
            glassCannon ? $"The Glass Cannon of {normal.Race}" : CreateBossName(normal.Race),
            normal.Race,
            EnemyClass.Boss,
            normal.Level,
            (int)Math.Round(normal.MaxHealth * healthMultiplier),
            (int)Math.Round(normal.Damage * 1.5),
            normal.Speed,
            Math.Min(1, normal.CriticalChance + (glassCannon ? 0.2 : 0)),
            (int)Math.Round(normal.ExperienceReward * healthMultiplier),
            normal.GoldReward * 5,
            normal.CriticalDamageMultiplier,
            normal.PassiveDodgeChance,
            normal.LifeStealPercent,
            glassCannon ? 0 : normal.DamageReduction + (normal.Race == EnemyRace.Golem ? 4 : 0),
            specialAbility: glassCannon ? "GlassCannon" : GetBossAbility(normal.Race),
            isBoss: true,
            isUniqueVariant: glassCannon);

        boss.SetLootTier(0);
        return boss;
    }

    private static Enemy CreateNecromancer(int floor)
    {
        Enemy normal = CreateSkeletonMage();
        normal.ScaleForFloor(floor);
        double healthMultiplier = (floor * 0.5) + 2;

        Enemy boss = new(
            "The Bone Necromancer",
            EnemyRace.Skeleton,
            EnemyClass.Boss,
            normal.Level,
            (int)Math.Round(normal.MaxHealth * healthMultiplier),
            (int)Math.Round(normal.Damage * 1.5),
            normal.Speed,
            normal.CriticalChance,
            (int)Math.Round(normal.ExperienceReward * healthMultiplier),
            normal.GoldReward * 5,
            normal.CriticalDamageMultiplier,
            normal.PassiveDodgeChance,
            normal.LifeStealPercent,
            normal.DamageReduction,
            specialAbility: "Necromancy",
            isBoss: true,
            isUniqueVariant: true);

        boss.SetLootTier(0);
        return boss;
    }

    private static List<Enemy> CreateTwinBosses(int floor)
    {
        Enemy first = CreateBoss(floor);
        Enemy second = CreateBoss(floor);
        return new List<Enemy>
        {
            new Enemy("The Ashen Twin", first.Race, EnemyClass.Boss, first.Level, first.MaxHealth, first.Damage, first.Speed, first.CriticalChance, first.ExperienceReward, first.GoldReward, first.CriticalDamageMultiplier, first.PassiveDodgeChance, first.LifeStealPercent, first.DamageReduction, specialAbility: "TwinBond", isBoss: true, isUniqueVariant: true),
            new Enemy("The Hollow Twin", second.Race, EnemyClass.Boss, second.Level, second.MaxHealth, second.Damage, second.Speed, second.CriticalChance, second.ExperienceReward, second.GoldReward, second.CriticalDamageMultiplier, second.PassiveDodgeChance, second.LifeStealPercent, second.DamageReduction, specialAbility: "TwinBond", isBoss: true, isUniqueVariant: true)
        };
    }

    private static Enemy CreateRandomRaceEnemy()
    {
        return (EnemyRace)Random.Shared.Next(Enum.GetValues<EnemyRace>().Length) switch
        {
            EnemyRace.Slime => CreateSlime(),
            EnemyRace.Skeleton => CreateSkeleton(),
            EnemyRace.Goblin => CreateGoblin(),
            EnemyRace.Specter => CreateSpecter(),
            EnemyRace.Vampire => CreateVampire(),
            EnemyRace.Werewolf => CreateWerewolf(),
            EnemyRace.Golem => CreateGolem(),
            _ => CreateSlime()
        };
    }

    private static Enemy CreateSlime() => new("Slime", EnemyRace.Slime, EnemyClass.Basic, 1, 45, 6, 6, 0.02, 80, 6);

    private static Enemy CreateSkeleton()
    {
        return Random.Shared.Next(3) switch
        {
            0 => new Enemy("Skeleton Warrior", EnemyRace.Skeleton, EnemyClass.Warrior, 1, 34, 8, 8, 0.04, 100, 8),
            1 => CreateSkeletonMage(),
            _ => new Enemy("Skeleton Archer", EnemyRace.Skeleton, EnemyClass.Archer, 1, 25, 11, 12, 0.08, 120, 10)
        };
    }

    private static Enemy CreateSkeletonMage() => new("Skeleton Mage", EnemyRace.Skeleton, EnemyClass.Mage, 1, 28, 11, 9, 0.1, 125, 11);

    private static Enemy CreateGoblin()
    {
        return Random.Shared.Next(3) switch
        {
            0 => new Enemy("Goblin Warrior", EnemyRace.Goblin, EnemyClass.Warrior, 1, 34, 7, 16, 0.05, 95, 9),
            1 => new Enemy("Goblin Mage", EnemyRace.Goblin, EnemyClass.Mage, 1, 30, 9, 15, 0.08, 115, 12),
            _ => new Enemy("Goblin Archer", EnemyRace.Goblin, EnemyClass.Archer, 1, 28, 9, 18, 0.08, 105, 11)
        };
    }

    private static Enemy CreateSpecter()
    {
        EnemyClass enemyClass = Random.Shared.Next(2) == 0 ? EnemyClass.Warrior : EnemyClass.Mage;
        return new Enemy($"Specter {enemyClass}", EnemyRace.Specter, enemyClass, 1, 38, 9, 13, 0.08, 135, 13, passiveDodgeChance: 0.1);
    }

    private static Enemy CreateVampire()
    {
        EnemyClass enemyClass = Random.Shared.Next(2) == 0 ? EnemyClass.Warrior : EnemyClass.Mage;
        return new Enemy($"Vampire {enemyClass}", EnemyRace.Vampire, enemyClass, 1, 52, 10, 12, 0.1, 180, 20, lifeStealPercent: 0.25);
    }

    private static Enemy CreateWerewolf()
    {
        EnemyClass enemyClass = Random.Shared.Next(2) == 0 ? EnemyClass.Warrior : EnemyClass.Archer;
        return new Enemy($"Werewolf {enemyClass}", EnemyRace.Werewolf, enemyClass, 1, 60, 12, 15, 0.18, 200, 18, criticalDamageMultiplier: 2.5);
    }

    private static Enemy CreateGolem()
    {
        return new Enemy("Golem Warrior", EnemyRace.Golem, EnemyClass.Warrior, 1, 100, 11, 5, 0.03, 220, 22, damageReduction: 5);
    }

    private static string CreateBossName(EnemyRace race)
    {
        return race switch
        {
            EnemyRace.Slime => "The Slime Sovereign",
            EnemyRace.Skeleton => "The Bone Regent",
            EnemyRace.Goblin => "The Goblin King",
            EnemyRace.Specter => "The Veiled Haunt",
            EnemyRace.Vampire => "The Crimson Count",
            EnemyRace.Werewolf => "The Moonfang Alpha",
            EnemyRace.Golem => "The Mountain Heart",
            _ => "The Dungeon Lord"
        };
    }

    private static string GetBossAbility(EnemyRace race)
    {
        return race switch
        {
            EnemyRace.Skeleton => "Bone Command",
            EnemyRace.Goblin => "Warcry",
            EnemyRace.Specter => "Phase Shift",
            EnemyRace.Vampire => "Blood Feast",
            EnemyRace.Werewolf => "Savage Frenzy",
            EnemyRace.Golem => "Stoneguard",
            _ => "Overwhelm"
        };
    }

    private static int GetLootTier(RoomType roomType)
    {
        return roomType switch
        {
            RoomType.EnemyRoom1 => 1,
            RoomType.EnemyRoom2 => 2,
            RoomType.EnemyRoom3 => 3,
            RoomType.EnemyRoom4 => 4,
            _ => 0
        };
    }
}
