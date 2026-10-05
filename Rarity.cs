namespace DungeonSimulation;

public enum Rarity
{
    Common,
    Uncommon,
    Rare,
    Epic,
    Legendary,
    Mythic,
    Divine
}

public static class RarityInfo
{
    public static string GetName(Rarity rarity) => rarity.ToString();

    public static double GetMultiplier(Rarity rarity)
    {
        return rarity switch
        {
            Rarity.Common => 1.0,
            Rarity.Uncommon => 1.25,
            Rarity.Rare => 1.6,
            Rarity.Epic => 2.1,
            Rarity.Legendary => 2.8,
            Rarity.Mythic => 3.7,
            Rarity.Divine => 5.0,
            _ => 1.0
        };
    }
}
