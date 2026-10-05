namespace DungeonSimulation;

public class DungeonRun
{
    public int CurrentFloor { get; private set; } = 1;
    public int FloorsCleared { get; private set; }
    public int ShopLootUpgradeLevel { get; set; }
    public int ShopLootUpgradeCost => ShopLootUpgradeLevel >= 25 ? int.MaxValue : 100 * (1 << ShopLootUpgradeLevel);
    public DungeonMap Map { get; private set; } = DungeonMap.Generate(1, 0);

    public void AdvanceToNextFloor(Player player)
    {
        FloorsCleared++;
        CurrentFloor++;
        Map = DungeonMap.Generate(CurrentFloor, ShopLootUpgradeLevel);
        player.RestoreForNewFloor();
    }

    public void ReturnToGroundZero(Player player)
    {
        CurrentFloor = 1;
        FloorsCleared = 0;
        ShopLootUpgradeLevel = 0;
        Map = DungeonMap.Generate(CurrentFloor, ShopLootUpgradeLevel);
        player.RestoreForNewFloor();
    }

    public void RestoreFromSave(DungeonSaveData saved)
    {
        CurrentFloor = Math.Max(1, saved.CurrentFloor);
        FloorsCleared = Math.Max(0, saved.FloorsCleared);
        ShopLootUpgradeLevel = Math.Clamp(saved.ShopLootUpgradeLevel, 0, 25);
        Map = DungeonMap.FromSave(saved.Map);
    }
}
