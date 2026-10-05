using System.Collections.Generic;

namespace DungeonSimulation;

public enum ItemType
{
    Potion,
    Material,
    Consumable,
    QuestItem
}

// General inventory items only. Weapons and armor have their own classes.
public class Item
{
    public string Name { get; set; }
    public string Description { get; set; }
    public ItemType Type { get; set; }
    public Rarity Rarity { get; set; }
    public int Quantity { get; set; }
    public int HealingAmount { get; set; }
    public int ManaAmount { get; set; }
    public int GoldValue { get; set; }
    public List<CombatEffectSpec> CombatEffects { get; } = new();

    public Item(
        string name,
        ItemType type,
        int goldValue = 0,
        int quantity = 1,
        string description = "",
        Rarity rarity = Rarity.Common,
        int healingAmount = 0,
        int manaAmount = 0)
    {
        Name = name;
        Type = type;
        Rarity = rarity;
        GoldValue = goldValue;
        Quantity = quantity;
        HealingAmount = healingAmount;
        ManaAmount = manaAmount;
        Description = description;
    }
}
