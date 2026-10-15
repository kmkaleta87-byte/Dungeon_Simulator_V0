using System;
using System.Collections.Generic;
using System.Linq;

namespace DungeonSimulation;

public class Inventory
{
    public List<Weapon> Weapons { get; } = new();
    public List<Armor> Armor { get; } = new();
    public List<Item> Items { get; } = new();
    public int Gold { get; private set; }
    public int Arrows { get; private set; }
    public int MaximumArrows => Weapons.Where(weapon => weapon.Type is WeaponType.Bow or WeaponType.Crossbow)
        .Select(weapon => weapon.ArrowCapacity).DefaultIfEmpty(0).Max();
    public bool HasShield => equippedArmor.ContainsKey(ArmorSlot.Shield);

    public bool HasDivine(string name) => Weapons.Any(item => item.Rarity == Rarity.Divine && item.Name.Equals(name, StringComparison.OrdinalIgnoreCase)) ||
        Armor.Any(item => item.Rarity == Rarity.Divine && item.Name.Equals(name, StringComparison.OrdinalIgnoreCase)) ||
        Items.Any(item => item.Rarity == Rarity.Divine && item.Name.Equals(name, StringComparison.OrdinalIgnoreCase));

    public bool FindWeapon(string name, out Weapon? weapon) { weapon = Weapons.Find(candidate => candidate.Name.Equals(name, StringComparison.OrdinalIgnoreCase)) ?? Weapons.Find(candidate => candidate.Name.Contains(name, StringComparison.OrdinalIgnoreCase)); return weapon != null; }
    public bool FindArmor(string name, out Armor? armor) { armor = Armor.Find(candidate => candidate.Name.Equals(name, StringComparison.OrdinalIgnoreCase)) ?? Armor.Find(candidate => candidate.Name.Contains(name, StringComparison.OrdinalIgnoreCase)); return armor != null; }
    public bool FindItem(string name, out Item? item) { item = Items.Find(candidate => candidate.Name.Equals(name, StringComparison.OrdinalIgnoreCase)) ?? Items.Find(candidate => candidate.Name.Contains(name, StringComparison.OrdinalIgnoreCase)); return item != null; }
    public Weapon? EquippedWeapon { get; private set; }
    private readonly Dictionary<ArmorSlot, Armor> equippedArmor = new();

    public IReadOnlyDictionary<ArmorSlot, Armor> EquippedArmor => equippedArmor;

    public int TotalDamageReduction
    {
        get
        {
            int total = 0;
            foreach (Armor armor in equippedArmor.Values)
            {
                total += armor.DamageReduction;
            }
            return total + MatchingSetBonus;
        }
    }

    public int GetDamageReduction(Player player)
    {
        int total = MatchingSetBonus;
        foreach (Armor armor in equippedArmor.Values)
        {
            if (armor.Slot != ArmorSlot.Shield || player.Class != PlayerClass.Mage)
            {
                total += armor.DamageReduction;
            }
        }
        return total;
    }

    public int MatchingSetBonus
    {
        get
        {
            ArmorSlot[] requiredSlots = { ArmorSlot.Head, ArmorSlot.Chest, ArmorSlot.Legs, ArmorSlot.Feet };
            if (requiredSlots.Any(slot => !equippedArmor.ContainsKey(slot)))
            {
                return 0;
            }

            string setName = equippedArmor[requiredSlots[0]].SetName;
            if (requiredSlots.Any(slot => equippedArmor[slot].SetName != setName))
            {
                return 0;
            }

            return 2 + (int)equippedArmor[requiredSlots[0]].Rarity;
        }
    }

    public void AddWeapon(Weapon weapon)
    {
        if (weapon.Rarity == Rarity.Divine && HasDivine(weapon.Name)) return;
        bool alreadyOwnedRangedWeapon = HasBow;
        Weapons.Add(weapon);
        EquippedWeapon ??= weapon;

        if (weapon.Type is WeaponType.Bow or WeaponType.Crossbow)
        {
            if (!alreadyOwnedRangedWeapon)
            {
                Arrows = weapon.ArrowCapacity;
            }

            Item? looseArrows = Items.Find(item => item.Name.Equals("Arrows", StringComparison.OrdinalIgnoreCase));
            if (looseArrows != null)
            {
                AddArrowsToBow(looseArrows.Quantity);
                Items.Remove(looseArrows);
            }
        }
    }

    public void AddArmor(Armor armor)
    {
        if (armor.Rarity == Rarity.Divine && HasDivine(armor.Name)) return;
        Armor.Add(armor);
        if (!equippedArmor.ContainsKey(armor.Slot))
        {
            equippedArmor[armor.Slot] = armor;
        }
    }

    public void AddItem(Item item)
    {
        if (item.Rarity == Rarity.Divine && HasDivine(item.Name)) return;
        Item? existing = Items.Find(candidate =>
            candidate.Name.Equals(item.Name, StringComparison.OrdinalIgnoreCase) &&
            candidate.Type == item.Type &&
            candidate.Rarity == item.Rarity &&
            candidate.HealingAmount == item.HealingAmount &&
            candidate.HealingPercent == item.HealingPercent &&
            candidate.ManaAmount == item.ManaAmount);

        if (existing == null)
        {
            Items.Add(item);
        }
        else
        {
            existing.Quantity += item.Quantity;
        }
    }

    public bool HasBow => Weapons.Any(weapon => weapon.Type is WeaponType.Bow or WeaponType.Crossbow);

    public int AddArrowsToBow(int amount)
    {
        if (amount <= 0)
        {
            return 0;
        }

        if (!HasBow)
        {
            return 0;
        }

        int previous = Arrows;
        Arrows = Math.Min(MaximumArrows, Arrows + amount);
        return Arrows - previous;
    }

    public void SpendArrow()
    {
        if (Arrows > 0)
        {
            Arrows--;
        }
    }

    public bool EquipWeapon(int index)
    {
        if (index < 1 || index > Weapons.Count)
        {
            return false;
        }

        EquippedWeapon = Weapons[index - 1];
        return true;
    }

    public bool EquipWeapon(string name)
    {
        Weapon? weapon = Weapons.Find(candidate => candidate.Name.Equals(name, StringComparison.OrdinalIgnoreCase))
            ?? Weapons.Find(candidate => candidate.Name.Contains(name, StringComparison.OrdinalIgnoreCase));
        if (weapon == null)
        {
            return false;
        }

        EquippedWeapon = weapon;
        return true;
    }

    public bool EquipArmor(int index)
    {
        if (index < 1 || index > Armor.Count)
        {
            return false;
        }

        Armor armor = Armor[index - 1];
        if (!CanEquipArmor(armor, out _))
        {
            return false;
        }
        equippedArmor[armor.Slot] = armor;
        return true;
    }

    public bool EquipArmor(string name)
    {
        Armor? armor = Armor.Find(candidate => candidate.Name.Equals(name, StringComparison.OrdinalIgnoreCase))
            ?? Armor.Find(candidate => candidate.Name.Contains(name, StringComparison.OrdinalIgnoreCase));
        if (armor == null)
        {
            return false;
        }

        if (!CanEquipArmor(armor, out _))
        {
            return false;
        }

        equippedArmor[armor.Slot] = armor;
        return true;
    }

    public bool CanEquipArmor(Armor armor, out string reason)
    {
        if (armor.Slot != ArmorSlot.Shield)
        {
            reason = "";
            return true;
        }

        if (EquippedWeapon?.Type is WeaponType.Wand or WeaponType.Staff)
        {
            reason = "A Mage can hold a shield, but cannot cast while it is equipped.";
            return true;
        }

        reason = "";
        return true;
    }

    public bool RemoveWeapon(string name, out Weapon? weapon)
    {
        weapon = Weapons.Find(candidate => candidate.Name.Equals(name, StringComparison.OrdinalIgnoreCase))
            ?? Weapons.Find(candidate => candidate.Name.Contains(name, StringComparison.OrdinalIgnoreCase));
        if (weapon == null || !Weapons.Remove(weapon))
        {
            return false;
        }

        if (EquippedWeapon == weapon)
        {
            EquippedWeapon = Weapons.FirstOrDefault();
        }

        return true;
    }

    public bool RemoveArmor(string name, out Armor? armor)
    {
        armor = Armor.Find(candidate => candidate.Name.Equals(name, StringComparison.OrdinalIgnoreCase))
            ?? Armor.Find(candidate => candidate.Name.Contains(name, StringComparison.OrdinalIgnoreCase));
        if (armor == null || !Armor.Remove(armor))
        {
            return false;
        }

        if (equippedArmor.TryGetValue(armor.Slot, out Armor? equipped) && equipped == armor)
        {
            equippedArmor.Remove(armor.Slot);
        }

        return true;
    }

    public bool RemoveItem(string name, out Item? item)
    {
        item = Items.Find(candidate => candidate.Name.Equals(name, StringComparison.OrdinalIgnoreCase))
            ?? Items.Find(candidate => candidate.Name.Contains(name, StringComparison.OrdinalIgnoreCase));
        if (item == null)
        {
            return false;
        }

        Items.Remove(item);
        return true;
    }

    public bool UseItem(int index, Player player, out string message)
    {
        if (index < 1 || index > Items.Count)
        {
            message = "That item number is not in your inventory.";
            return false;
        }

        Item item = Items[index - 1];
        if (item.Type != ItemType.Potion || (item.HealingAmount <= 0 && item.HealingPercent <= 0 && item.ManaAmount <= 0))
        {
            message = $"You cannot use {item.Name} yet.";
            return false;
        }

        bool canHeal = (item.HealingAmount > 0 || item.HealingPercent > 0) && player.Health < player.MaxHealth;
        bool canRestoreMana = item.ManaAmount > 0 && player.Mana < player.MaxMana;
        if (!canHeal && !canRestoreMana)
        {
            string fullResource = (item.HealingAmount > 0 || item.HealingPercent > 0) && item.ManaAmount > 0
                ? "health and mana"
                : item.HealingAmount > 0 || item.HealingPercent > 0 ? "health" : "mana";
            message = $"You are already at full {fullResource}; {item.Name} was not used.";
            return false;
        }

        int healthBefore = player.Health;
        int manaBefore = player.Mana;
        int healingAmount = item.HealingPercent > 0
            ? (int)Math.Ceiling(player.MaxHealth * item.HealingPercent / 100.0)
            : item.HealingAmount;
        player.Heal(healingAmount);
        player.RestoreMana(item.ManaAmount);
        int healed = player.Health - healthBefore;
        int manaRestored = player.Mana - manaBefore;
        item.Quantity--;
        if (item.Quantity <= 0)
        {
            Items.RemoveAt(index - 1);
        }

        message = manaRestored > 0
            ? $"You used {item.Name} and restored {manaRestored} mana."
            : $"You used {item.Name} and restored {healed} health.";
        return true;
    }

    public bool UseItem(string name, Player player, out string message)
    {
        int index = Items.FindIndex(item => item.Name.Equals(name, StringComparison.OrdinalIgnoreCase));
        if (index < 0)
        {
            index = Items.FindIndex(item => item.Name.Contains(name, StringComparison.OrdinalIgnoreCase));
        }

        if (index < 0)
        {
            message = "That item is not in your inventory.";
            return false;
        }

        return UseItem(index + 1, player, out message);
    }

    public void AddGold(int amount)
    {
        if (amount > 0)
        {
            Gold += amount;
        }
    }

    public bool SpendGold(int amount)
    {
        if (amount < 0 || amount > Gold)
        {
            return false;
        }

        Gold -= amount;
        return true;
    }

    public void RestoreFromSave(PlayerSaveData saved)
    {
        Weapons.Clear();
        Armor.Clear();
        Items.Clear();
        equippedArmor.Clear();
        EquippedWeapon = null;
        Gold = Math.Max(0, saved.Gold);
        Arrows = Math.Max(0, saved.Arrows);

        foreach (WeaponSaveData weaponData in saved.Weapons)
            Weapons.Add(SaveSystem.RestoreWeapon(weaponData));
        EquippedWeapon = saved.EquippedWeaponIndex >= 0 && saved.EquippedWeaponIndex < Weapons.Count
            ? Weapons[saved.EquippedWeaponIndex]
            : Weapons.FirstOrDefault();

        foreach (ArmorSaveData armorData in saved.Armor)
            Armor.Add(SaveSystem.RestoreArmor(armorData));
        foreach (EquippedArmorSaveData savedArmor in saved.EquippedArmor)
        {
            if (savedArmor.Index >= 0 && savedArmor.Index < Armor.Count && Armor[savedArmor.Index].Slot == savedArmor.Slot)
                equippedArmor[savedArmor.Slot] = Armor[savedArmor.Index];
        }

        foreach (ItemSaveData itemData in saved.Items)
            Items.Add(SaveSystem.RestoreItem(itemData));
        Arrows = HasBow ? Math.Min(Arrows, MaximumArrows) : 0;
    }
}
