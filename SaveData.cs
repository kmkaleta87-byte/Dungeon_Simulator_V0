using System;
using System.Collections.Generic;

namespace DungeonSimulation;

public sealed class SaveData
{
    public int Version { get; set; } = 1;
    public DateTime SavedAt { get; set; } = DateTime.UtcNow;
    public PlayerSaveData Player { get; set; } = new();
    public DungeonSaveData Dungeon { get; set; } = new();
    public bool StartingClosetInspected { get; set; }
    public bool StartingDeskInspected { get; set; }
    public bool StartingWeaponChoiceOffered { get; set; }
}

public sealed class PlayerSaveData
{
    public string Name { get; set; } = "Adventurer";
    public PlayerClass Class { get; set; }
    public bool ClassChosen { get; set; }
    public int Level { get; set; } = 1;
    public int Experience { get; set; }
    public int SkillPoints { get; set; }
    public int Health { get; set; }
    public int Mana { get; set; }
    public int Strength { get; set; } = 10;
    public int Dexterity { get; set; } = 10;
    public int Constitution { get; set; } = 10;
    public int Intelligence { get; set; } = 10;
    public int Wisdom { get; set; } = 10;
    public int Charisma { get; set; } = 10;
    public int Speed { get; set; } = 10;
    public double CriticalChance { get; set; } = 0.05;
    public int RespecCount { get; set; }
    public int Gold { get; set; }
    public int Arrows { get; set; }
    public int EquippedWeaponIndex { get; set; } = -1;
    public List<WeaponSaveData> Weapons { get; set; } = new();
    public List<ArmorSaveData> Armor { get; set; } = new();
    public List<EquippedArmorSaveData> EquippedArmor { get; set; } = new();
    public List<ItemSaveData> Items { get; set; } = new();
}

public sealed class DungeonSaveData
{
    public int CurrentFloor { get; set; } = 1;
    public int FloorsCleared { get; set; }
    public int ShopLootUpgradeLevel { get; set; }
    public MapSaveData Map { get; set; } = new();
}

public sealed class MapSaveData
{
    public int CurrentRow { get; set; }
    public int CurrentColumn { get; set; }
    public List<RoomSaveData> Rooms { get; set; } = new();
}

public sealed class RoomSaveData
{
    public int Row { get; set; }
    public int Column { get; set; }
    public RoomType Type { get; set; }
    public bool Visited { get; set; }
    public bool TrapRevealed { get; set; }
    public bool Cleared { get; set; }
    public bool FountainUsed { get; set; }
    public int ShopRerollCount { get; set; }
    public List<EnemySaveData> Enemies { get; set; } = new();
    public List<LootDropSaveData?> ShopStock { get; set; } = new();
}

public sealed class EnemySaveData
{
    public string Name { get; set; } = "";
    public EnemyRace Race { get; set; }
    public EnemyClass Class { get; set; }
    public int Level { get; set; }
    public int MaxHealth { get; set; }
    public int Health { get; set; }
    public int Damage { get; set; }
    public int Speed { get; set; }
    public double CriticalChance { get; set; }
    public double CriticalDamageMultiplier { get; set; } = 2;
    public double PassiveDodgeChance { get; set; }
    public double LifeStealPercent { get; set; }
    public int DamageReduction { get; set; }
    public int ExperienceReward { get; set; }
    public int GoldReward { get; set; }
    public int LootTier { get; set; }
    public string SpecialAbility { get; set; } = "";
    public bool IsElite { get; set; }
    public bool IsBoss { get; set; }
    public bool IsUniqueVariant { get; set; }
    public bool IsSummoned { get; set; }
    public List<EffectSaveData> Effects { get; set; } = new();
}

public sealed class EffectSaveData
{
    public CombatEffectType Type { get; set; }
    public int Potency { get; set; }
    public int DurationTurns { get; set; }
    public int MaximumStacks { get; set; }
    public double Chance { get; set; }
    public int RemainingTurns { get; set; }
    public int Stacks { get; set; }
}

public sealed class WeaponSaveData
{
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public WeaponType Type { get; set; }
    public Rarity Rarity { get; set; }
    public string SpellName { get; set; } = "";
    public ElementType Element { get; set; }
    public WeaponEffect Effect { get; set; }
    public int Damage { get; set; }
    public int Speed { get; set; }
    public double CriticalChance { get; set; }
    public int GoldValue { get; set; }
    public int ArrowCapacity { get; set; }
    public int ManaCost { get; set; }
    public int SpeedModifier { get; set; }
    public List<EffectSaveData> Effects { get; set; } = new();
    public List<WeaponAttackSaveData> Attacks { get; set; } = new();
}

public sealed class WeaponAttackSaveData
{
    public string Name { get; set; } = "";
    public string Command { get; set; } = "";
    public string Description { get; set; } = "";
    public double DamageMultiplier { get; set; }
    public double CriticalChanceBonus { get; set; }
    public int CooldownTurns { get; set; }
    public CombatEffectType? Effect { get; set; }
    public int EffectPotency { get; set; }
    public bool ChargesNextAttack { get; set; }
    public double SecondaryDamageMultiplier { get; set; }
    public int ManaCost { get; set; }
}

public sealed class ArmorSaveData
{
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public ArmorSlot Slot { get; set; }
    public Rarity Rarity { get; set; }
    public string SetName { get; set; } = "";
    public int Defense { get; set; }
    public int DamageReduction { get; set; }
    public int HealthBonus { get; set; }
    public int SpeedModifier { get; set; }
    public int GoldValue { get; set; }
}

public sealed class EquippedArmorSaveData
{
    public ArmorSlot Slot { get; set; }
    public int Index { get; set; }
}

public sealed class ItemSaveData
{
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public ItemType Type { get; set; }
    public Rarity Rarity { get; set; }
    public int Quantity { get; set; }
    public int HealingAmount { get; set; }
    public int HealingPercent { get; set; }
    public int ManaAmount { get; set; }
    public int GoldValue { get; set; }
    public List<EffectSaveData> Effects { get; set; } = new();
}

public sealed class LootDropSaveData
{
    public int Gold { get; set; }
    public WeaponSaveData? Weapon { get; set; }
    public ArmorSaveData? Armor { get; set; }
    public ItemSaveData? Item { get; set; }
}
