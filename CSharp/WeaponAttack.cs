namespace DungeonSimulation;

public sealed class WeaponAttack
{
    public string Name { get; }
    public string Command { get; }
    public string Description { get; }
    public double DamageMultiplier { get; }
    public double CriticalChanceBonus { get; }
    public int CooldownTurns { get; }
    public CombatEffectType? Effect { get; }
    public int EffectPotency { get; }
    public bool ChargesNextAttack { get; }
    public double SecondaryDamageMultiplier { get; }
    public bool HitsMultipleEnemies => SecondaryDamageMultiplier > 0;
    public int ManaCost { get; }

    public WeaponAttack(
        string name,
        string command,
        string description,
        double damageMultiplier,
        double criticalChanceBonus = 0,
        int cooldownTurns = 0,
        CombatEffectType? effect = null,
        int effectPotency = 1,
        bool chargesNextAttack = false,
        double secondaryDamageMultiplier = 0,
        int manaCost = 0)
    {
        Name = name;
        Command = command;
        Description = description;
        DamageMultiplier = damageMultiplier;
        CriticalChanceBonus = criticalChanceBonus;
        CooldownTurns = cooldownTurns;
        Effect = effect;
        EffectPotency = effectPotency;
        ChargesNextAttack = chargesNextAttack;
        SecondaryDamageMultiplier = Math.Max(0, secondaryDamageMultiplier);
        ManaCost = Math.Max(0, manaCost);
    }
}
