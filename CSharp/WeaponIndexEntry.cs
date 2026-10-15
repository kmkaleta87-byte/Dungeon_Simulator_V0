namespace DungeonSimulation;

public sealed record WeaponIndexEntry(
    string Name,
    Rarity Rarity,
    WeaponType Type,
    ElementType Element,
    CombatEffectType Effect,
    string Description);
