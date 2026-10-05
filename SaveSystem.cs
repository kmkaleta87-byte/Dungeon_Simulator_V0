using System;
using System.IO;
using System.Linq;
using System.Text.Json;

namespace DungeonSimulation;

public static class SaveSystem
{
    private static readonly JsonSerializerOptions JsonOptions = new() { WriteIndented = true };
    private static readonly string SaveDirectory = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
        "DungeonSimulation", "Saves");

    public static string GetSlotLabel(int slot) => slot == 4 ? "Developer" : $"Slot {slot}";

    public static bool IsValidSlot(int slot) => slot is >= 1 and <= 4;

    public static SaveData? Load(int slot)
    {
        if (!IsValidSlot(slot)) return null;
        string path = GetPath(slot);
        if (!File.Exists(path)) return null;
        try
        {
            SaveData? save = JsonSerializer.Deserialize<SaveData>(File.ReadAllText(path), JsonOptions);
            return save?.Version == 1 && save.Dungeon.Map.Rooms.Count > 0 ? save : null;
        }
        catch (Exception exception) when (exception is IOException or JsonException or UnauthorizedAccessException)
        {
            return null;
        }
    }

    public static bool Save(int slot, Player player, DungeonRun dungeon, out string error)
    {
        error = "";
        if (!IsValidSlot(slot))
        {
            error = "Invalid save slot.";
            return false;
        }
        string temporaryPath = GetPath(slot) + ".tmp";
        try
        {
            Directory.CreateDirectory(SaveDirectory);
            File.WriteAllText(temporaryPath, JsonSerializer.Serialize(Capture(player, dungeon), JsonOptions));
            File.Move(temporaryPath, GetPath(slot), true);
            return true;
        }
        catch (Exception exception) when (exception is IOException or UnauthorizedAccessException)
        {
            error = $"Could not save: {exception.Message}";
            try { if (File.Exists(temporaryPath)) File.Delete(temporaryPath); } catch (IOException) { }
            return false;
        }
    }

    public static bool Delete(int slot)
    {
        if (!IsValidSlot(slot)) return false;
        string path = GetPath(slot);
        try
        {
            if (!File.Exists(path)) return false;
            File.Delete(path);
            return true;
        }
        catch (IOException) { return false; }
        catch (UnauthorizedAccessException) { return false; }
    }

    public static string DescribeSlot(int slot)
    {
        SaveData? save = Load(slot);
        if (save == null) return File.Exists(GetPath(slot)) ? "Save unreadable" : "Empty";
        return $"{save.Player.Name} | Floor {save.Dungeon.CurrentFloor} | Level {save.Player.Level} | Saved {save.SavedAt.ToLocalTime():g}";
    }

    public static (Player Player, DungeonRun Dungeon) Restore(SaveData saved)
    {
        Player player = new(saved.Player.Name);
        player.RestoreFromSave(saved.Player);
        player.Inventory.RestoreFromSave(saved.Player);
        DungeonRun dungeon = new();
        dungeon.RestoreFromSave(saved.Dungeon);
        StartingRoom.Restore(saved.StartingClosetInspected, saved.StartingDeskInspected, saved.StartingWeaponChoiceOffered);
        return (player, dungeon);
    }

    private static SaveData Capture(Player player, DungeonRun dungeon)
    {
        PlayerSaveData playerData = new()
        {
            Name = player.Name,
            Class = player.Class,
            ClassChosen = player.ClassChosen,
            Level = player.Level,
            Experience = player.Experience,
            SkillPoints = player.SkillPoints,
            Health = player.Health,
            Mana = player.Mana,
            Strength = player.Strength,
            Dexterity = player.Dexterity,
            Constitution = player.Constitution,
            Intelligence = player.Intelligence,
            Wisdom = player.Wisdom,
            Charisma = player.Charisma,
            Speed = player.Speed,
            CriticalChance = player.CriticalChance,
            RespecCount = player.RespecCount,
            Gold = player.Inventory.Gold,
            Arrows = player.Inventory.Arrows,
            EquippedWeaponIndex = player.Inventory.Weapons.IndexOf(player.Inventory.EquippedWeapon!),
            Weapons = player.Inventory.Weapons.Select(SaveWeapon).ToList(),
            Armor = player.Inventory.Armor.Select(SaveArmor).ToList(),
            Items = player.Inventory.Items.Select(SaveItem).ToList()
        };
        foreach (var equipped in player.Inventory.EquippedArmor)
            playerData.EquippedArmor.Add(new EquippedArmorSaveData
            {
                Slot = equipped.Key,
                Index = player.Inventory.Armor.IndexOf(equipped.Value)
            });

        (bool closet, bool desk, bool offered) = StartingRoom.Capture();
        return new SaveData
        {
            Player = playerData,
            StartingClosetInspected = closet,
            StartingDeskInspected = desk,
            StartingWeaponChoiceOffered = offered,
            Dungeon = new DungeonSaveData
            {
                CurrentFloor = dungeon.CurrentFloor,
                FloorsCleared = dungeon.FloorsCleared,
                ShopLootUpgradeLevel = dungeon.ShopLootUpgradeLevel,
                Map = dungeon.Map.ToSave()
            }
        };
    }

    public static EnemySaveData SaveEnemy(Enemy enemy) => new()
    {
        Name = enemy.Name, Race = enemy.Race, Class = enemy.Class, Level = enemy.Level,
        MaxHealth = enemy.MaxHealth, Health = enemy.Health, Damage = enemy.Damage, Speed = enemy.Speed,
        CriticalChance = enemy.CriticalChance, CriticalDamageMultiplier = enemy.CriticalDamageMultiplier,
        PassiveDodgeChance = enemy.PassiveDodgeChance, LifeStealPercent = enemy.LifeStealPercent,
        DamageReduction = enemy.DamageReduction, ExperienceReward = enemy.ExperienceReward,
        GoldReward = enemy.GoldReward, LootTier = enemy.LootTier, SpecialAbility = enemy.SpecialAbility,
        IsElite = enemy.IsElite, IsBoss = enemy.IsBoss, IsUniqueVariant = enemy.IsUniqueVariant,
        IsSummoned = enemy.IsSummoned, Effects = SaveEffects(enemy.Effects)
    };

    public static LootDropSaveData SaveLootDrop(LootDrop drop) => new()
    {
        Gold = drop.Gold,
        Weapon = drop.Weapon == null ? null : SaveWeapon(drop.Weapon),
        Armor = drop.Armor == null ? null : SaveArmor(drop.Armor),
        Item = drop.Item == null ? null : SaveItem(drop.Item)
    };

    public static LootDrop RestoreLootDrop(LootDropSaveData saved)
    {
        if (saved.Weapon != null) return new LootDrop(RestoreWeapon(saved.Weapon), saved.Gold);
        if (saved.Armor != null) return new LootDrop(RestoreArmor(saved.Armor), saved.Gold);
        if (saved.Item != null) return new LootDrop(RestoreItem(saved.Item), saved.Gold);
        return new LootDrop(new Item("Empty", ItemType.Material), saved.Gold);
    }

    private static WeaponSaveData SaveWeapon(Weapon weapon) => new()
    {
        Name = weapon.Name, Description = weapon.Description, Type = weapon.Type, Rarity = weapon.Rarity,
        SpellName = weapon.SpellName, Element = weapon.Element, Effect = weapon.Effect, Damage = weapon.Damage,
        Speed = weapon.Speed, CriticalChance = weapon.CriticalChance, GoldValue = weapon.GoldValue,
        ArrowCapacity = weapon.ArrowCapacity, ManaCost = weapon.ManaCost, SpeedModifier = weapon.SpeedModifier,
        Effects = weapon.CombatEffects.Select(SaveEffect).ToList(),
        Attacks = weapon.SpecialAttacks.Select(attack => new WeaponAttackSaveData
        {
            Name = attack.Name, Command = attack.Command, Description = attack.Description,
            DamageMultiplier = attack.DamageMultiplier, CriticalChanceBonus = attack.CriticalChanceBonus,
            CooldownTurns = attack.CooldownTurns, Effect = attack.Effect, EffectPotency = attack.EffectPotency,
            ChargesNextAttack = attack.ChargesNextAttack, SecondaryDamageMultiplier = attack.SecondaryDamageMultiplier,
            ManaCost = attack.ManaCost
        }).ToList()
    };

    public static Weapon RestoreWeapon(WeaponSaveData saved)
    {
        Weapon weapon = new(saved.Name, saved.Type, saved.Damage, saved.Speed, saved.CriticalChance,
            saved.GoldValue, saved.ArrowCapacity, saved.ManaCost, saved.Description, saved.Rarity,
            saved.SpellName, saved.Element, saved.Effect, saved.SpeedModifier);
        weapon.CombatEffects.AddRange(saved.Effects.Select(RestoreEffect));
        foreach (WeaponAttackSaveData attack in saved.Attacks)
            weapon.SpecialAttacks.Add(new WeaponAttack(attack.Name, attack.Command, attack.Description,
                attack.DamageMultiplier, attack.CriticalChanceBonus, attack.CooldownTurns, attack.Effect,
                attack.EffectPotency, attack.ChargesNextAttack, attack.SecondaryDamageMultiplier, attack.ManaCost));
        return weapon;
    }

    private static ArmorSaveData SaveArmor(Armor armor) => new()
    {
        Name = armor.Name, Description = armor.Description, Slot = armor.Slot, Rarity = armor.Rarity,
        SetName = armor.SetName, Defense = armor.Defense, DamageReduction = armor.DamageReduction,
        HealthBonus = armor.HealthBonus, SpeedModifier = armor.SpeedModifier, GoldValue = armor.GoldValue
    };

    public static Armor RestoreArmor(ArmorSaveData saved) => new(saved.Name, saved.Slot, saved.Defense,
        saved.DamageReduction, saved.HealthBonus, saved.SpeedModifier, saved.GoldValue, saved.Description,
        saved.Rarity, saved.SetName);

    private static ItemSaveData SaveItem(Item item) => new()
    {
        Name = item.Name, Description = item.Description, Type = item.Type, Rarity = item.Rarity,
        Quantity = item.Quantity, HealingAmount = item.HealingAmount, ManaAmount = item.ManaAmount,
        GoldValue = item.GoldValue, Effects = item.CombatEffects.Select(SaveEffect).ToList()
    };

    public static Item RestoreItem(ItemSaveData saved)
    {
        Item item = new(saved.Name, saved.Type, saved.GoldValue, saved.Quantity, saved.Description,
            saved.Rarity, saved.HealingAmount, saved.ManaAmount);
        item.CombatEffects.AddRange(saved.Effects.Select(RestoreEffect));
        return item;
    }

    private static EffectSaveData SaveEffect(CombatEffectSpec effect) => new()
    {
        Type = effect.Type, Potency = effect.Potency, DurationTurns = effect.DurationTurns,
        MaximumStacks = effect.MaximumStacks, Chance = effect.Chance, RemainingTurns = effect.DurationTurns, Stacks = 1
    };

    private static System.Collections.Generic.List<EffectSaveData> SaveEffects(CombatEffectState state) =>
        state.ActiveEffects.Select(pair => new EffectSaveData
        {
            Type = pair.Key, Potency = pair.Value.Spec.Potency, DurationTurns = pair.Value.Spec.DurationTurns,
            MaximumStacks = pair.Value.Spec.MaximumStacks, Chance = pair.Value.Spec.Chance,
            RemainingTurns = pair.Value.RemainingTurns, Stacks = pair.Value.Stacks
        }).ToList();

    private static CombatEffectSpec RestoreEffect(EffectSaveData effect) =>
        new(effect.Type, effect.Potency, effect.DurationTurns, effect.MaximumStacks, effect.Chance);

    private static string GetPath(int slot) => Path.Combine(SaveDirectory, $"slot-{slot}.json");

}
