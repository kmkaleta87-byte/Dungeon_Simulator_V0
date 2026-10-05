namespace DungeonSimulation;

public class CombatResult
{
    public bool PlayerWon { get; }
    public string Message { get; }

    public CombatResult(bool playerWon, string message)
    {
        PlayerWon = playerWon;
        Message = message;
    }
}
