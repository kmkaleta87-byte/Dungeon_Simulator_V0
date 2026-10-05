namespace DungeonSimulation;

public class GameStatistics
{
    public int RunsStarted { get; private set; }
    public int FloorsCleared { get; private set; }
    public int EnemiesDefeated { get; private set; }
    public int BossesDefeated { get; private set; }
    public int GoldCollected { get; private set; }

    public void RecordRunStarted() => RunsStarted++;
    public void RecordFloorCleared() => FloorsCleared++;
    public void RecordEnemiesDefeated(int amount) => EnemiesDefeated += amount;
    public void RecordBossDefeated() => BossesDefeated++;
    public void RecordGoldCollected(int amount) => GoldCollected += amount;
}
