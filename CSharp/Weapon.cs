using System.Collections.Generic;

namespace DungeonSimulation;

public enum WeaponType
{
    Sword,
    Dagger,
    Axe,
    Scythe,
    Bow,
    Crossbow,
    Wand,
    Staff
}

public enum WeaponEffect
{
    None,
    Flame,
    Poison,
    Splash
}

public class Weapon
{
    public string Name { get; set; }
    public string Description { get; set; }
    public WeaponType Type { get; set; }
    public Rarity Rarity { get; set; }
    public string SpellName { get; set; }
    public ElementType Element { get; set; }
    public WeaponEffect Effect { get; set; }
    public List<CombatEffectSpec> CombatEffects { get; } = new();
    public List<WeaponAttack> SpecialAttacks { get; } = new();
    public int Damage { get; set; }
    public int Speed { get; set; }
    public double CriticalChance { get; set; }
    public int GoldValue { get; set; }

    // ArrowCapacity is a weapon property; current ammunition belongs to Inventory.
    public int ArrowCapacity { get; }
    public int ManaCost { get; set; }
    public int SpeedModifier { get; set; }

    public Weapon(
        string name,
        WeaponType type,
        int damage,
        int speed,
        double criticalChance = 0,
        int goldValue = 0,
        int arrows = 0,
        int manaCost = 0,
        string description = "",
        Rarity rarity = Rarity.Common,
        string spellName = "",
        ElementType element = ElementType.None,
        WeaponEffect effect = WeaponEffect.None,
        int speedModifier = 0)
    {
        Name = name;
        Type = type;
        Rarity = rarity;
        SpellName = string.IsNullOrWhiteSpace(spellName) ? "Arcane Bolt" : spellName;
        Element = element;
        Effect = effect;
        Damage = damage;
        Speed = speed;
        SpeedModifier = speedModifier;
        CriticalChance = criticalChance;
        GoldValue = goldValue;
        ArrowCapacity = type is WeaponType.Bow or WeaponType.Crossbow ? arrows : 0;
        ManaCost = type is WeaponType.Wand or WeaponType.Staff ? manaCost : 0;
        Description = description;
    }

    public bool CanUse(Player player, int resourceCostOverride = -1)
    {
        int manaCost = resourceCostOverride >= 0 ? resourceCostOverride : ManaCost;
        return Type switch
        {
            WeaponType.Bow or WeaponType.Crossbow => player.Inventory.Arrows > 0,
            WeaponType.Wand or WeaponType.Staff => player.Mana >= manaCost,
            _ => true
        };
    }

    public int CalculateDamage(Player player)
    {
        return player.BaseAttackDamage + Damage;
    }

    public void ConsumeResource(Player player, int resourceCostOverride = -1)
    {
        int manaCost = resourceCostOverride >= 0 ? resourceCostOverride : ManaCost;
        switch (Type)
        {
            case WeaponType.Bow:
            case WeaponType.Crossbow:
                player.Inventory.SpendArrow();
                break;
            case WeaponType.Staff:
            case WeaponType.Wand:
                player.SpendMana(manaCost);
                break;
        }
    }

}
