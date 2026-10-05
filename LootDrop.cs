namespace DungeonSimulation;

public class LootDrop
{
    public Weapon? Weapon { get; }
    public Armor? Armor { get; }
    public Item? Item { get; }
    public int Gold { get; }
    public Rarity Rarity => Weapon?.Rarity ?? Armor?.Rarity ?? Item?.Rarity ?? Rarity.Common;

    public string DisplayName => Weapon?.Name ?? Armor?.Name ?? Item?.Name ?? "Empty";

    public LootDrop(Weapon weapon, int gold)
    {
        Weapon = weapon;
        Gold = gold;
    }

    public LootDrop(Armor armor, int gold)
    {
        Armor = armor;
        Gold = gold;
    }

    public LootDrop(Item item, int gold)
    {
        Item = item;
        Gold = gold;
    }
}
