using System;
using System.Collections.Generic;
using System.Linq;

namespace DungeonSimulation;

public static class CombatEffectIcons
{
    public static string GetIcon(CombatEffectType? effect) => effect switch
    {
        CombatEffectType.Burn => "🔥",
        CombatEffectType.Freeze => "❄️",
        CombatEffectType.Gust => "🌪️",
        CombatEffectType.Root => "⛓️",
        CombatEffectType.Poison => "☠️",
        CombatEffectType.Blind => "✨",
        CombatEffectType.Void => "🌑",
        CombatEffectType.Shock => "⚡",
        CombatEffectType.Bleed => "🩸",
        CombatEffectType.LifeSteal => "🧛",
        CombatEffectType.ManaSteal => "🔮",
        CombatEffectType.Execution or CombatEffectType.ExecutionBolt => "💀",
        CombatEffectType.Momentum => "📈",
        CombatEffectType.Marked or CombatEffectType.Mark => "🎯",
        CombatEffectType.Thorns => "🪤",
        CombatEffectType.Chain => "🔁",
        CombatEffectType.Pierce or CombatEffectType.Penetration or CombatEffectType.PiercingShot => "🗡️",
        CombatEffectType.Ricochet or CombatEffectType.RicochetShot => "🪃",
        CombatEffectType.Multishot or CombatEffectType.Scatter or CombatEffectType.Salvo => "💥",
        CombatEffectType.Headshot or CombatEffectType.Focus or CombatEffectType.Snipe => "🎯",
        CombatEffectType.Draw or CombatEffectType.Overdraw or CombatEffectType.Quiver or CombatEffectType.AmmoGeneration => "🏹",
        CombatEffectType.Volley => "🌊",
        CombatEffectType.Trap => "🕸️",
        CombatEffectType.Pin => "⛓️",
        CombatEffectType.Cripple => "🐌",
        CombatEffectType.Homing or CombatEffectType.RangeScaling => "🎯",
        CombatEffectType.Afterimage or CombatEffectType.SpellEcho => "🔁",
        CombatEffectType.SpellPower or CombatEffectType.SpellSplit or CombatEffectType.Conjure or CombatEffectType.ElementalConversion => "🪄",
        CombatEffectType.ManaSurge or CombatEffectType.ArcaneCharge => "🔮",
        CombatEffectType.Overcast or CombatEffectType.CooldownReduction => "⚡",
        CombatEffectType.Channel or CombatEffectType.DelayedCast => "⏳",
        CombatEffectType.SpellRadius => "💣",
        CombatEffectType.ManaShield => "💎",
        CombatEffectType.Teleport => "🌀",
        null => "",
        _ => "✨"
    };

    public static string GetAttackPrefix(CombatEffectType? effect)
        => effect.HasValue ? $"{GetIcon(effect)} " : "";

    public static string GetWeaponEffectIcons(Weapon weapon)
    {
        List<string> icons = weapon.CombatEffects
            .Select(effect => GetIcon(effect.Type))
            .Where(icon => icon.Length > 0)
            .ToList();

        string legacyIcon = weapon.Effect switch
        {
            WeaponEffect.Flame => GetIcon(CombatEffectType.Burn),
            WeaponEffect.Poison => GetIcon(CombatEffectType.Poison),
            WeaponEffect.Splash => "💥",
            _ => ""
        };
        if (legacyIcon.Length > 0)
        {
            icons.Add(legacyIcon);
        }

        return icons.Distinct().Count() == 0 ? "" : string.Concat(icons.Distinct()) + " ";
    }
}
