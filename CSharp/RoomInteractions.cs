using System;
using System.Collections.Generic;

namespace DungeonSimulation;

public static class RoomInteractions
{
    private static readonly HashSet<Room> inspectedRooms = new();

    public static string GetInstructions(RoomType roomType)
    {
        return roomType switch
        {
            RoomType.TreasureRoom => "You can inspect the chest. Try 'inspect chest'.",
            RoomType.WeaponTreasureRoom => "A reinforced chest rests here. Try 'inspect chest'.",
            RoomType.FountainRoom => "A clear fountain fills the room. You may inspect it or type 'drink fountain'.",
            RoomType.ShopRoom => "A merchant waits behind a counter. Type 'shop' to browse, buy, sell, reroll, or upgrade.",
            RoomType.TrapRoom => "A treasure chest sits here. You can inspect the chest or the floor.",
            RoomType.BossRoom => "A heavy presence fills the room. You can inspect the throne. Try 'inspect throne'.",
            _ => ""
        };
    }

    public static bool TryInspect(Room room, Player player, string input, out string message)
    {
        string choice = input.Trim().ToLowerInvariant();

        if (room.Type == RoomType.TreasureRoom && choice is "chest" or "inspect chest")
        {
            if (inspectedRooms.Contains(room))
            {
                message = "The chest is empty now, though the old lock still glints in the torchlight.";
                return true;
            }

            Item potion = new(
                "Small Healing Potion",
                ItemType.Potion,
                goldValue: 8,
                description: "A simple red potion that should restore a small amount of health.",
                healingAmount: 25);

            player.Inventory.AddItem(potion);
            player.Inventory.AddGold(15);
            inspectedRooms.Add(room);
            message = "Inside the chest, beneath a layer of velvet, you find a small healing potion and 15 gold coins. Someone expected to return for them.";
            return true;
        }

        if (room.Type == RoomType.WeaponTreasureRoom && choice is "chest" or "inspect chest")
        {
            if (inspectedRooms.Contains(room))
            {
                message = "The reinforced chest is empty now.";
                return true;
            }

            Rarity rarity = Random.Shared.Next(3) switch
            {
                0 => Rarity.Rare,
                1 => Rarity.Epic,
                _ => Rarity.Legendary
            };
            Weapon weapon = LootGenerator.CreateWeapon(rarity, 1);
            Item potion = new(
                "Large Healing Potion",
                ItemType.Potion,
                goldValue: 30,
                description: "A rare restorative potion that brings a great deal of health back.",
                rarity: Rarity.Rare,
                healingAmount: 60);

            player.Inventory.AddWeapon(weapon);
            player.Inventory.AddItem(potion);
            inspectedRooms.Add(room);
            message = $"The reinforced chest opens around a {weapon.Name} ({weapon.Type}) and a Rare Large Healing Potion. The weapon is added to your inventory.";
            return true;
        }

        if (room.Type == RoomType.FountainRoom && choice is "fountain" or "inspect fountain")
        {
            message = room.FountainUsed
                ? "The fountain is quiet now. Its basin is dry, but the stone still feels warm."
                : "The fountain water glows softly. If you want to drink, type 'drink fountain'.";
            return true;
        }

        if (room.Type == RoomType.FountainRoom && choice is "drink fountain" or "drink")
        {
            if (room.FountainUsed)
            {
                message = "The fountain has already given you its blessing. You may return, but the water no longer moves.";
                return true;
            }

            int healed = player.MaxHealth - player.Health;
            player.Heal(player.MaxHealth);
            room.FountainUsed = true;
            message = healed > 0
                ? $"You drink from the fountain and recover {healed} health. The water remains still, waiting for another visit that may never come."
                : "You drink from the fountain, but you were already at full health. The water remains clear.";
            return true;
        }

        if (room.Type == RoomType.TrapRoom && choice is "floor" or "inspect floor")
        {
            if (inspectedRooms.Contains(room))
            {
                message = "You give the floor a wide berth. The hidden mechanism is still waiting beneath the dust.";
                return true;
            }

            room.RevealTrap();
            inspectedRooms.Add(room);
            message = "You notice a thin seam in the floor just before stepping on it. The trap is armed, but now you know where it is.";
            return true;
        }

        if (room.Type == RoomType.TrapRoom && choice is "chest" or "inspect chest")
        {
            if (inspectedRooms.Contains(room))
            {
                message = "The mimic has gone still. There is nothing left to take from the trapped chest.";
                return true;
            }

            room.RevealTrap();
            inspectedRooms.Add(room);
            int outcome = Random.Shared.Next(3);
            if (outcome == 0)
            {
                int damage = player.TakeDamage(15);
                message = $"The chest snaps at your hand! It was a mimic, and you take {damage} damage before it retreats into the shadows.";
            }
            else if (outcome == 1)
            {
                int stolen = Math.Min(player.Inventory.Gold, Math.Max(1, player.Inventory.Gold / 2));
                player.Inventory.SpendGold(stolen);
                message = $"The chest was trapped. A hidden mechanism steals {stolen} gold before you can stop it.";
            }
            else
            {
                message = "The chest clicks open, but the treasure inside has long since turned to dust. The real trap was your hope.";
            }
            return true;
        }

        if (room.Type == RoomType.BossRoom && choice is "throne" or "inspect throne")
        {
            if (inspectedRooms.Contains(room))
            {
                message = "The throne remains empty, but the darkness behind it feels less empty than before.";
                return true;
            }

            inspectedRooms.Add(room);
            message = "The throne is carved from black stone. A deep scratch across its armrest is fresh, and something enormous has recently left this room.";
            return true;
        }

        message = "You find nothing useful to inspect here.";
        return false;
    }
}
