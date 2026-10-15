using System;
using System.Collections.Generic;

namespace DungeonSimulation;

public static class ConsoleUi
{
    private const int BoxWidth = 76;

    public static void DisplayPlayerStats(Player player)
    {
        string weapon = player.Inventory.EquippedWeapon?.Name ?? "None";
        string weaponType = player.Inventory.EquippedWeapon == null ? "" : $" [{player.Inventory.EquippedWeapon.Type}]";
        string playerClass = player.ClassChosen ? player.Class.ToString() : "Unchosen";
        Console.Write($"PLAYER: {player.Name} | Class {playerClass} | Level {player.Level} | HP ");
        WriteColored($"{player.Health}/{player.MaxHealth}", GetHealthColor(player.Health, player.MaxHealth));
        Console.WriteLine($" | Mana {player.Mana}/{player.MaxMana}");
        Console.Write("XP: ");
        WriteColored($"{player.Experience}/{player.ExperienceToNextLevel}", ConsoleColor.Blue);
        Console.Write($" | Skill Points: {player.SkillPoints} | Gold: ");
        WriteColored(player.Inventory.Gold.ToString(), ConsoleColor.Yellow);
        Console.WriteLine();
        string arrows = player.Inventory.EquippedWeapon?.Type is WeaponType.Bow or WeaponType.Crossbow
            ? $" | Arrows: {player.Inventory.Arrows}/{player.Inventory.MaximumArrows}"
            : "";
        Console.WriteLine($"Weapon: {weapon}{weaponType} | Damage: {player.BaseAttackDamage + (player.Inventory.EquippedWeapon?.Damage ?? 0)}{arrows} | Damage Reduction: {player.Inventory.GetDamageReduction(player)}");
    }

    public static void DisplayCombatScreen(Player player, CombatSession combat)
    {
        Console.WriteLine("============================================================");
        Console.WriteLine("                         COMBAT");
        Console.WriteLine("============================================================");
        Console.WriteLine(combat.GetStatus());
        foreach (Enemy enemy in combat.Enemies)
        {
            WriteEnemyName(enemy);
            WriteColored($" | {enemy.Race} {enemy.Class} | Level {enemy.Level} | HP ", ConsoleColor.Red);
            WriteStatusBar(enemy.Health, enemy.MaxHealth);
            WriteColored($" | Speed {enemy.Speed}", ConsoleColor.Red);
            Console.WriteLine();
        }
        Console.WriteLine("------------------------------------------------------------");
        DisplayPlayerStats(player);
        Console.WriteLine("============================================================");
    }

    public static void WriteEnemyName(Enemy enemy)
    {
        WriteColored(enemy.Name, ConsoleColor.Red);
    }

    public static void WriteHealth(int health, int maxHealth)
    {
        WriteColored($"{health}/{maxHealth}", GetHealthColor(health, maxHealth));
    }

    public static void WriteRarity(Rarity rarity, string text)
    {
        ConsoleColor color = rarity switch
        {
            Rarity.Common => ConsoleColor.White,
            Rarity.Uncommon => ConsoleColor.Green,
            Rarity.Rare => ConsoleColor.DarkBlue,
            Rarity.Epic => ConsoleColor.Magenta,
            Rarity.Legendary => ConsoleColor.Yellow,
            Rarity.Mythic => ConsoleColor.Red,
            Rarity.Divine => ConsoleColor.Cyan,
            _ => ConsoleColor.White
        };
        WriteColored(text, color);
    }

    public static void WriteStatusBar(int current, int maximum, int width = 18)
    {
        double ratio = maximum <= 0 ? 0 : Math.Clamp((double)current / maximum, 0, 1);
        int filled = (int)Math.Round(ratio * width);
        Console.Write('[');
        WriteColored(new string('#', filled), GetHealthColor(current, maximum));
        Console.Write(new string('-', width - filled));
        Console.Write($"] {current}/{maximum}");
    }

    private static ConsoleColor GetHealthColor(int health, int maxHealth)
    {
        double percentage = maxHealth <= 0 ? 0 : (double)health / maxHealth;
        return percentage > 0.66 ? ConsoleColor.Green : percentage > 0.33 ? ConsoleColor.Yellow : ConsoleColor.Red;
    }

    private static void WriteColored(string text, ConsoleColor color)
    {
        ConsoleColor previous = Console.ForegroundColor;
        Console.ForegroundColor = color;
        Console.Write(text);
        Console.ForegroundColor = previous;
    }

    public static void DisplayContext(string message, ConsoleColor? color = null)
    {
        ConsoleColor previous = Console.ForegroundColor;
        if (color.HasValue)
        {
            Console.ForegroundColor = color.Value;
        }

        Console.WriteLine();
        Console.WriteLine($"+{new string('-', BoxWidth)}+");
        Console.WriteLine("| CONTEXT" + new string(' ', BoxWidth - 8) + "|");
        Console.WriteLine($"+{new string('-', BoxWidth)}+");

        foreach (string rawLine in message.Split('\n'))
        {
            string line = rawLine.TrimEnd('\r');
            if (line.Length == 0)
            {
                Console.WriteLine("|" + new string(' ', BoxWidth) + "|");
                continue;
            }

            while (line.Length > BoxWidth - 2)
            {
                int splitAt = line.LastIndexOf(' ', BoxWidth - 2);
                if (splitAt <= 0)
                {
                    splitAt = BoxWidth - 2;
                }

                Console.WriteLine($"| {line[..splitAt].PadRight(BoxWidth - 2)} |");
                line = line[splitAt..].TrimStart();
            }

            Console.WriteLine($"| {line.PadRight(BoxWidth - 2)} |");
        }

        Console.WriteLine($"+{new string('-', BoxWidth)}+");
        Console.ForegroundColor = previous;
    }

    public static void DisplayBox(string title, IEnumerable<string> lines, ConsoleColor? color = null)
    {
        ConsoleColor previous = Console.ForegroundColor;
        if (color.HasValue)
        {
            Console.ForegroundColor = color.Value;
        }

        Console.WriteLine();
        Console.WriteLine($"+{new string('-', BoxWidth)}+");
        string heading = $"| {title}";
        Console.WriteLine(heading.PadRight(BoxWidth) + "|");
        Console.WriteLine($"+{new string('-', BoxWidth)}+");

        foreach (string rawLine in lines)
        {
            string line = rawLine ?? "";
            if (line.Length == 0)
            {
                Console.WriteLine("|" + new string(' ', BoxWidth) + "|");
                continue;
            }

            while (line.Length > BoxWidth - 2)
            {
                int splitAt = line.LastIndexOf(' ', BoxWidth - 2);
                if (splitAt <= 0)
                {
                    splitAt = BoxWidth - 2;
                }

                Console.WriteLine($"| {line[..splitAt].PadRight(BoxWidth - 2)} |");
                line = line[splitAt..].TrimStart();
            }

            Console.WriteLine($"| {line.PadRight(BoxWidth - 2)} |");
        }

        Console.WriteLine($"+{new string('-', BoxWidth)}+");
        Console.ForegroundColor = previous;
    }
}
