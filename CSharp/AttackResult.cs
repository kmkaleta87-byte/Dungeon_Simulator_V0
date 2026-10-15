namespace DungeonSimulation;

public class AttackResult
{
    public bool Successful { get; }
    public bool CriticalHit { get; }
    public int Damage { get; }
    public string Message { get; }

    public AttackResult(bool successful, bool criticalHit, int damage, string message)
    {
        Successful = successful;
        CriticalHit = criticalHit;
        Damage = damage;
        Message = message;
    }
}
