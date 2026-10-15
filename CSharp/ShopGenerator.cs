using System.Collections.Generic;

namespace DungeonSimulation;

public static class ShopGenerator
{
    public static List<LootDrop?> CreateStock(int floor, int upgradeLevel)
    {
        List<LootDrop?> stock = new();
        for (int i = 0; i < 6; i++)
        {
            stock.Add(LootGenerator.GenerateShopDrop(floor, upgradeLevel));
        }

        return stock;
    }
}
