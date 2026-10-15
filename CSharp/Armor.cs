namespace DungeonSimulation;

public enum ArmorSlot
{
    Head,
    Chest,
    Legs,
    Feet,
    Shield
}

public class Armor
{
    public string Name { get; set; }
    public string Description { get; set; }
    public ArmorSlot Slot { get; set; }
    public Rarity Rarity { get; set; }
    public string SetName { get; set; }
    public int Defense { get; set; }
    public int DamageReduction { get; set; }
    public int HealthBonus { get; set; }
    public int SpeedModifier { get; set; }
    public int GoldValue { get; set; }

    public Armor(
        string name,
        ArmorSlot slot,
        int defense,
        int damageReduction,
        int healthBonus = 0,
        int speedModifier = 0,
        int goldValue = 0,
        string description = "",
        Rarity rarity = Rarity.Common,
        string setName = "")
    {
        Name = name;
        Slot = slot;
        Rarity = rarity;
        SetName = string.IsNullOrWhiteSpace(setName) ? name : setName;
        Defense = defense;
        DamageReduction = damageReduction;
        HealthBonus = healthBonus;
        SpeedModifier = speedModifier;
        GoldValue = goldValue;
        Description = description;
    }
}
