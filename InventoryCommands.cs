using System;
using System.Text;

namespace DungeonSimulation;

public static class InventoryCommands
{
    public static bool TryHandle(string input, Player player, out string message)
    {
        string choice = input.Trim();
        string lowerChoice = choice.ToLowerInvariant();

        if (lowerChoice is "inventory" or "i")
        {
            message = GetSummary(player.Inventory);
            return true;
        }

        if (lowerChoice.StartsWith("use item "))
        {
            string itemChoice = choice["use item ".Length..].Trim();
            if (int.TryParse(itemChoice, out int itemIndex))
            {
                player.Inventory.UseItem(itemIndex, player, out message);
            }
            else
            {
                player.Inventory.UseItem(itemChoice, player, out message);
            }
            return true;
        }

        if (lowerChoice.StartsWith("use "))
        {
            player.Inventory.UseItem(choice["use ".Length..].Trim(), player, out message);
            return true;
        }

        if (lowerChoice.StartsWith("equip weapon "))
        {
            string weaponChoice = choice["equip weapon ".Length..].Trim();
            bool equipped = int.TryParse(weaponChoice, out int weaponIndex)
                ? player.Inventory.EquipWeapon(weaponIndex)
                : player.Inventory.EquipWeapon(weaponChoice);
            if (equipped)
            {
                player.UpdateClassFromEquippedWeapon();
                message = $"Equipped {player.Inventory.EquippedWeapon!.Name}.";
            }
            else
            {
                message = "That weapon is not in your inventory. Use its name as shown.";
            }
            return true;
        }

        if (lowerChoice.StartsWith("equip armor "))
        {
            string armorChoice = choice["equip armor ".Length..].Trim();
            Armor? selectedArmor = int.TryParse(armorChoice, out int armorIndex) && armorIndex >= 1 && armorIndex <= player.Inventory.Armor.Count
                ? player.Inventory.Armor[armorIndex - 1]
                : player.Inventory.FindArmor(armorChoice, out Armor? foundArmor) ? foundArmor : null;
            bool equipped = selectedArmor != null && player.Inventory.EquipArmor(selectedArmor.Name);
            if (equipped)
            {
                message = selectedArmor!.Slot == ArmorSlot.Shield && player.Class == PlayerClass.Mage
                    ? "Shield equipped. You cannot cast spells until you remove it."
                    : "Armor equipped.";
            }
            else
            {
                message = "That armor is not in your inventory. Use its name as shown.";
            }
            return true;
        }

        message = "That is not an inventory command.";
        return false;
    }

    public static string GetSummary(Inventory inventory)
    {
        StringBuilder summary = new();
        summary.AppendLine($"Gold: {inventory.Gold}");
        if (inventory.HasBow)
        {
            summary.AppendLine($"Arrows: {inventory.Arrows}/{inventory.MaximumArrows} (shared ammunition)");
        }
        summary.AppendLine($"Matching armor set bonus: +{inventory.MatchingSetBonus} damage reduction");
        summary.AppendLine("Weapons:");

        for (int i = 0; i < inventory.Weapons.Count; i++)
        {
            Weapon weapon = inventory.Weapons[i];
            string equipped = weapon == inventory.EquippedWeapon ? " [EQUIPPED]" : "";
            string element = weapon.Element == ElementType.None ? "" : $" - {weapon.Element}";
            string arrows = weapon.Type is WeaponType.Bow or WeaponType.Crossbow ? $" - Capacity {weapon.ArrowCapacity}" : "";
            summary.AppendLine($"  {i + 1}. {weapon.Rarity} {weapon.Name} [{weapon.Type}] - Damage {weapon.Damage}{element}{arrows}{equipped}");
        }

        if (inventory.Weapons.Count == 0)
        {
            summary.AppendLine("  None");
        }

        summary.AppendLine("Armor:");
        for (int i = 0; i < inventory.Armor.Count; i++)
        {
            Armor armor = inventory.Armor[i];
            bool equipped = inventory.EquippedArmor.TryGetValue(armor.Slot, out Armor? wornArmor) && wornArmor == armor;
            summary.AppendLine($"  {i + 1}. {armor.Rarity} {armor.Name} - Reduction {armor.DamageReduction}{(equipped ? " [EQUIPPED]" : "")}");
        }

        if (inventory.Armor.Count == 0)
        {
            summary.AppendLine("  None");
        }

        summary.AppendLine("Items:");
        if (inventory.Items.Count == 0)
        {
            summary.AppendLine("  None");
        }
        else
        {
            for (int i = 0; i < inventory.Items.Count; i++)
            {
                Item item = inventory.Items[i];
                summary.AppendLine($"  {i + 1}. {item.Rarity} {item.Name} x{item.Quantity}");
            }
        }

        return summary.ToString();
    }
}
