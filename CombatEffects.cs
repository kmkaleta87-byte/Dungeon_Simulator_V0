using System;
using System.Collections.Generic;

namespace DungeonSimulation;

public enum CombatEffectType
{
    Burn,
    Freeze,
    Gust,
    Root,
    Poison,
    Blind,
    Void,
    Shock,
    Bleed,
    LifeSteal,
    ManaSteal,
    Execution,
    Momentum,
    Marked,
    Thorns,
    Chain,
    Pierce,
    Ricochet,
    Multishot,
    Penetration,
    Headshot,
    Snipe,
    Focus,
    Draw,
    Overdraw,
    Volley,
    Trap,
    Pin,
    Cripple,
    Mark,
    Homing,
    PiercingShot,
    RicochetShot,
    Afterimage,
    AmmoGeneration,
    Salvo,
    ExecutionBolt,
    RangeScaling,
    Quiver,
    Scatter,
    SpellEcho,
    SpellPower,
    ManaSurge,
    Overcast,
    CooldownReduction,
    ArcaneCharge,
    SpellSplit,
    Conjure,
    Channel,
    SpellRadius,
    DelayedCast,
    ManaShield,
    Teleport,
    ElementalConversion
}

// Items and weapons can carry these later without needing to know how combat resolves them.
public sealed class CombatEffectSpec
{
    public CombatEffectType Type { get; }
    public int Potency { get; }
    public int DurationTurns { get; }
    public int MaximumStacks { get; }
    public double Chance { get; }

    public CombatEffectSpec(
        CombatEffectType type,
        int potency = 1,
        int durationTurns = 1,
        int maximumStacks = 1,
        double chance = 1.0)
    {
        Type = type;
        Potency = Math.Max(1, potency);
        DurationTurns = Math.Max(1, durationTurns);
        MaximumStacks = Math.Max(1, maximumStacks);
        Chance = Math.Clamp(chance, 0, 1);
    }
}

public sealed class ActiveCombatEffect
{
    public CombatEffectSpec Spec { get; }
    public int RemainingTurns { get; private set; }
    public int Stacks { get; private set; }

    public ActiveCombatEffect(CombatEffectSpec spec)
    {
        Spec = spec;
        RemainingTurns = spec.DurationTurns;
        Stacks = 1;
    }

    public void RefreshOrStack(CombatEffectSpec incoming)
    {
        RemainingTurns = Math.Max(RemainingTurns, incoming.DurationTurns);
        Stacks = Math.Min(Spec.MaximumStacks, Stacks + 1);
    }

    public bool AdvanceTurn()
    {
        RemainingTurns--;
        return RemainingTurns <= 0;
    }

    public void Restore(int remainingTurns, int stacks)
    {
        RemainingTurns = Math.Max(1, remainingTurns);
        Stacks = Math.Clamp(stacks, 1, Spec.MaximumStacks);
    }
}

public sealed class CombatEffectState
{
    private readonly Dictionary<CombatEffectType, ActiveCombatEffect> effects = new();

    public IReadOnlyDictionary<CombatEffectType, ActiveCombatEffect> ActiveEffects => effects;

    public bool Apply(CombatEffectSpec spec)
    {
        if (Random.Shared.NextDouble() > spec.Chance)
        {
            return false;
        }

        if (effects.TryGetValue(spec.Type, out ActiveCombatEffect? active))
        {
            active.RefreshOrStack(spec);
        }
        else
        {
            effects[spec.Type] = new ActiveCombatEffect(spec);
        }

        return true;
    }

    public bool Has(CombatEffectType type) => effects.ContainsKey(type);
    public bool Remove(CombatEffectType type) => effects.Remove(type);

    public void Restore(IEnumerable<EffectSaveData> savedEffects)
    {
        effects.Clear();
        foreach (EffectSaveData saved in savedEffects)
        {
            CombatEffectSpec spec = new(saved.Type, saved.Potency, saved.DurationTurns, saved.MaximumStacks, saved.Chance);
            ActiveCombatEffect active = new(spec);
            active.Restore(saved.RemainingTurns, saved.Stacks);
            effects[saved.Type] = active;
        }
    }

    public int GetStacks(CombatEffectType type)
    {
        return effects.TryGetValue(type, out ActiveCombatEffect? active) ? active.Stacks : 0;
    }

    public void AdvanceTurn()
    {
        List<CombatEffectType> expired = new();
        foreach (KeyValuePair<CombatEffectType, ActiveCombatEffect> effect in effects)
        {
            if (effect.Value.AdvanceTurn())
            {
                expired.Add(effect.Key);
            }
        }

        foreach (CombatEffectType type in expired)
        {
            effects.Remove(type);
        }
    }

    public void Clear() => effects.Clear();
}

public static class CombatEffectCatalog
{
    public static CombatEffectSpec CreateDefault(CombatEffectType type, int potency = 1)
    {
        return type switch
        {
            CombatEffectType.Burn => new(type, potency, 3, 5),
            CombatEffectType.Freeze => new(type, potency, 2, 5),
            CombatEffectType.Gust => new(type, potency, 1),
            CombatEffectType.Root => new(type, potency, 2),
            CombatEffectType.Poison => new(type, potency, 4, 5),
            CombatEffectType.Blind => new(type, potency, 2),
            CombatEffectType.Void => new(type, potency, 1),
            CombatEffectType.Shock => new(type, potency, 1),
            CombatEffectType.Bleed => new(type, potency, 3, 5),
            CombatEffectType.LifeSteal => new(type, potency, 1),
            CombatEffectType.ManaSteal => new(type, potency, 1),
            CombatEffectType.Execution => new(type, potency, 1),
            CombatEffectType.Momentum => new(type, potency, 2, 10),
            CombatEffectType.Marked => new(type, potency, 3),
            CombatEffectType.Thorns => new(type, potency, 3),
            CombatEffectType.Chain => new(type, potency, 1),
            _ => new(type, potency)
        };
    }
}
