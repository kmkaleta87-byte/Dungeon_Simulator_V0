using System;

namespace DungeonSimulation;

public static class ShopSystem
{
    public static int GetPrice(LootDrop drop, Player? player = null)
    {
        int value = drop.Weapon?.GoldValue ?? drop.Armor?.GoldValue ?? drop.Item?.GoldValue ?? 1;
        int price = Math.Max(1, value * 3);
        int charismaDiscountPercent = player == null ? 0 : Math.Min(50, Math.Max(0, player.Charisma - 10) * 2);
        return Math.Max(1, price * (100 - charismaDiscountPercent) / 100);
    }

    public static int GetRerollPrice(Room room) =>
        (int)Math.Min(int.MaxValue, 25L + (long)room.ShopRerollCount * 10);

    public static bool TryBuy(Room room, Player player, string choice, out string message)
    {
        if (!TryGetIndex(choice, out int index) || index < 1 || index > room.ShopStock.Count)
        {
            message = "Choose a shop item number from 1 to 6.";
            return false;
        }

        LootDrop? drop = room.ShopStock[index - 1];
        if (drop == null)
        {
            message = "That shop slot is empty.";
            return false;
        }

        if (drop.Rarity == Rarity.Divine && player.Inventory.HasDivine(drop.DisplayName))
        {
            message = "You already own this Divine item. It remains in the shop.";
            return false;
        }

        int price = GetPrice(drop, player);
        if (!player.Inventory.SpendGold(price))
        {
            message = $"You need {price} gold, but only have {player.Inventory.Gold}.";
            return false;
        }

        AddToInventory(player, drop);
        room.ShopStock[index - 1] = null;
        message = $"You bought {drop.DisplayName} for {price} gold.";
        return true;
    }

    public static bool TryReroll(Room room, Player player, int floor, int upgradeLevel, out string message)
    {
        int price = GetRerollPrice(room);
        if (!player.Inventory.SpendGold(price))
        {
            message = $"Rerolling costs {price} gold, but you only have {player.Inventory.Gold}.";
            return false;
        }

        room.ShopStock.Clear();
        room.ShopStock.AddRange(ShopGenerator.CreateStock(floor, upgradeLevel));
        room.ShopRerollCount++;
        message = $"The shop rerolls its six offerings for {price} gold.";
        return true;
    }

    public static bool TryUpgrade(Room room, Player player, DungeonRun dungeon, out string message)
    {
        int price = dungeon.ShopLootUpgradeCost;
        if (!player.Inventory.SpendGold(price))
        {
            message = $"The permanent shop upgrade costs {price} gold, but you only have {player.Inventory.Gold}.";
            return false;
        }

        dungeon.ShopLootUpgradeLevel++;
        room.ShopStock.Clear();
        room.ShopStock.AddRange(ShopGenerator.CreateStock(dungeon.CurrentFloor, dungeon.ShopLootUpgradeLevel));
        message = $"The shop's loot quality improves. Upgrade level: {dungeon.ShopLootUpgradeLevel}.";
        return true;
    }

    public static bool TrySell(Player player, string input, out string message)
    {
        string[] parts = input.Trim().Split(' ', 3, StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length < 3)
        {
            message = "Sell with 'sell weapon [name]', 'sell armor [name]', or 'sell item [name]'.";
            return false;
        }

        string category = parts[1].ToLowerInvariant();
        string name = parts[2];
        int value;
        string soldName;
        if (category == "weapon")
        {
            Weapon? weapon = int.TryParse(name, out int weaponIndex) && weaponIndex >= 1 && weaponIndex <= player.Inventory.Weapons.Count
                ? player.Inventory.Weapons[weaponIndex - 1] : null;
            if (weapon == null)
            {
                player.Inventory.FindWeapon(name, out weapon);
            }
            if (weapon == null || !player.Inventory.RemoveWeapon(weapon.Name, out Weapon? removedWeapon) || removedWeapon == null)
            {
                message = "That weapon could not be found in your inventory.";
                return false;
            }
            value = Math.Max(1, removedWeapon.GoldValue / 2);
            soldName = removedWeapon.Name;
        }
        else if (category == "armor")
        {
            Armor? armor = int.TryParse(name, out int armorIndex) && armorIndex >= 1 && armorIndex <= player.Inventory.Armor.Count
                ? player.Inventory.Armor[armorIndex - 1] : null;
            if (armor == null)
            {
                player.Inventory.FindArmor(name, out armor);
            }
            if (armor == null || !player.Inventory.RemoveArmor(armor.Name, out Armor? removedArmor) || removedArmor == null)
            {
                message = "That armor could not be found in your inventory.";
                return false;
            }
            value = Math.Max(1, removedArmor.GoldValue / 2);
            soldName = removedArmor.Name;
        }
        else if (category == "item")
        {
            Item? item = int.TryParse(name, out int itemIndex) && itemIndex >= 1 && itemIndex <= player.Inventory.Items.Count
                ? player.Inventory.Items[itemIndex - 1] : null;
            if (item == null)
            {
                player.Inventory.FindItem(name, out item);
            }
            if (item == null)
            {
                message = "That item could not be found in your inventory.";
                return false;
            }
            soldName = item.Name;
            value = Math.Max(1, item.GoldValue / 2);
            if (item.Quantity > 1)
            {
                item.Quantity--;
            }
            else if (!player.Inventory.RemoveItem(item.Name, out _))
            {
                message = "That item could not be found in your inventory.";
                return false;
            }
        }
        else
        {
            message = "That item could not be found in your inventory.";
            return false;
        }

        player.Inventory.AddGold(value);
        message = $"You sold {soldName} for {value} gold.";
        return true;
    }

    private static void AddToInventory(Player player, LootDrop drop)
    {
        if (drop.Weapon != null) player.Inventory.AddWeapon(drop.Weapon);
        else if (drop.Armor != null) player.Inventory.AddArmor(drop.Armor);
        else if (drop.Item != null) player.Inventory.AddItem(drop.Item);
    }

    private static bool TryGetIndex(string choice, out int index)
    {
        string value = choice.Trim();
        if (value.StartsWith("buy ", StringComparison.OrdinalIgnoreCase))
        {
            value = value[4..].Trim();
        }

        return int.TryParse(value, out index);
    }
}
