using System;
using System.Linq;

namespace DungeonSimulation;

class Program
{
    static void Main()
    {
        GameStatistics statistics = new();

        while (true)
        {
            if (!Console.IsOutputRedirected)
            {
                Console.Clear();
            }

            Console.WriteLine("========================================");
            Console.WriteLine("          DUNGEON SIMULATION");
            Console.WriteLine("========================================");
            Console.WriteLine("1. Start Game");
            Console.WriteLine("2. Settings");
            Console.WriteLine("3. Index");
            Console.WriteLine("4. Quit");
            Console.Write("Choose an option: ");

            string? rawChoice = Console.ReadLine();
            if (rawChoice == null)
            {
                return;
            }

            string choice = rawChoice.Trim();
            if (choice == "1")
            {
                if (ChooseSaveSlot(out int slot, out SaveData? loadedSave))
                {
                    bool devMode = slot == 4;
                    string characterName = loadedSave?.Player.Name ?? PromptForCharacterName() ?? "";
                    if (characterName.Length == 0)
                    {
                        continue;
                    }
                    ClearForGameplay();
                    PlayGame(characterName, statistics, devMode, slot, loadedSave);
                    LootGenerator.DevMode = false;
                }
            }
            else if (choice == "2")
            {
                SettingsMenu(statistics);
            }
            else if (choice == "3")
            {
                IndexMenu();
            }
            else if (choice == "4" || choice.Equals("q", StringComparison.OrdinalIgnoreCase))
            {
                return;
            }
        }
    }

    private static bool ChooseSaveSlot(out int selectedSlot, out SaveData? loadedSave)
    {
        selectedSlot = 0;
        loadedSave = null;
        while (true)
        {
            Console.WriteLine();
            Console.WriteLine("SAVE SLOTS");
            for (int displaySlot = 1; displaySlot <= 4; displaySlot++)
                Console.WriteLine($"{displaySlot}. {SaveSystem.GetSlotLabel(displaySlot)} - {SaveSystem.DescribeSlot(displaySlot)}");
            Console.WriteLine("Choose a slot number, type 'delete slot 1' (use 4 for Developer), or 'back'.");
            Console.Write("Save slots: ");
            string input = Console.ReadLine()?.Trim() ?? "";
            if (input.Equals("back", StringComparison.OrdinalIgnoreCase) || input.Equals("q", StringComparison.OrdinalIgnoreCase))
                return false;

            if (input.StartsWith("delete slot ", StringComparison.OrdinalIgnoreCase) &&
                int.TryParse(input["delete slot ".Length..].Trim(), out int deleteSlot) &&
                SaveSystem.IsValidSlot(deleteSlot))
            {
                if (SaveSystem.Load(deleteSlot) == null)
                {
                    Console.WriteLine("That slot is empty or unreadable.");
                    continue;
                }
                Console.Write($"Delete {SaveSystem.GetSlotLabel(deleteSlot)}? Type YES to confirm: ");
                string confirmation = Console.ReadLine()?.Trim() ?? "";
                if (confirmation.Equals("YES", StringComparison.Ordinal))
                {
                    if (SaveSystem.Delete(deleteSlot))
                        Console.WriteLine("Save deleted.");
                    else
                        Console.WriteLine("The save could not be deleted.");
                }
                else
                {
                    Console.WriteLine("Deletion cancelled.");
                }
                continue;
            }

            if (!int.TryParse(input, out int slot) || !SaveSystem.IsValidSlot(slot))
            {
                Console.WriteLine("Choose slot 1, 2, 3, Developer (4), or back.");
                continue;
            }

            SaveData? existing = SaveSystem.Load(slot);
            if (existing == null && SaveSystem.DescribeSlot(slot) == "Save unreadable")
            {
                Console.WriteLine("This save cannot be read. Delete it with the two-step delete command before reusing the slot.");
                continue;
            }

            if (existing != null)
            {
                Console.Write($"Load {existing.Player.Name} (Floor {existing.Dungeon.CurrentFloor}, Level {existing.Player.Level}), or start a new run in this slot? (load/new/back): ");
                string action = Console.ReadLine()?.Trim() ?? "";
                if (action.Equals("load", StringComparison.OrdinalIgnoreCase) || action == "1")
                {
                    loadedSave = existing;
                    selectedSlot = slot;
                    return true;
                }
                if (action.Equals("new", StringComparison.OrdinalIgnoreCase) || action == "2")
                {
                    Console.Write($"This replaces the current save. Type 'overwrite slot {slot}' to confirm: ");
                    string confirmation = Console.ReadLine()?.Trim() ?? "";
                    if (!confirmation.Equals($"overwrite slot {slot}", StringComparison.OrdinalIgnoreCase))
                    {
                        Console.WriteLine("Overwrite cancelled.");
                        continue;
                    }
                }
                else
                {
                    continue;
                }
            }

            selectedSlot = slot;
            return true;
        }
    }

    private static void ClearForGameplay()
    {
        if (Console.IsOutputRedirected)
        {
            Console.Write("\u001b[2J\u001b[H");
            return;
        }

        Console.Clear();
    }

    private static void IndexMenu()
    {
        while (true)
        {
            if (!Console.IsOutputRedirected)
            {
                Console.Clear();
            }

            Console.WriteLine("INDEX");
            Console.WriteLine("=====");
            Console.WriteLine("1. See Warrior Weapon details");
            Console.WriteLine("2. See Archer Weapon details");
            Console.WriteLine("3. See Mage Weapon details");
            Console.WriteLine("4. See Armor details");
            Console.WriteLine("5. See Item details");
            Console.WriteLine("6. See Effect details");
            Console.WriteLine("7. Return to main menu");
            Console.Write("Index: ");
            string? rawInput = Console.ReadLine();
            if (rawInput == null || rawInput.Trim() is "" or "7" or "back")
            {
                return;
            }

            switch (rawInput.Trim())
            {
                case "1": WeaponIndexMenu("WARRIOR WEAPONS", WarriorWeaponCatalog.GetIndexEntries().ToList()); break;
                case "2": WeaponIndexMenu("ARCHER WEAPONS", ArcherWeaponCatalog.GetIndexEntries().ToList()); break;
                case "3": WeaponIndexMenu("MAGE WEAPONS", MageWeaponCatalog.GetIndexEntries().ToList()); break;
                case "4": ShowArmorIndex(); break;
                case "5": ShowItemIndex(); break;
                case "6": ShowEffectIndex(); break;
            }
        }
    }

    private static void WeaponIndexMenu(string title, List<WeaponIndexEntry> weapons)
    {
        while (true)
        {
            List<string> lines = weapons
                .Select(weapon => $"{weapon.Rarity} {weapon.Name} [{weapon.Type}] | {weapon.Element} | Effect: {CombatEffectIcons.GetAttackPrefix(weapon.Effect)}{weapon.Effect}")
                .ToList();
            ConsoleUi.DisplayBox(title, lines);
            Console.WriteLine("Type 'inspect [weapon name]' for the full description, or 'back'.");
            Console.Write("Weapon index: ");
            string? rawInput = Console.ReadLine();
            if (rawInput == null || rawInput.Trim().Length == 0 || rawInput.Trim().Equals("back", StringComparison.OrdinalIgnoreCase))
            {
                return;
            }

            string input = rawInput.Trim();
            if (!input.StartsWith("inspect ", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            string search = input[8..].Trim();
            WeaponIndexEntry? weapon = weapons.FirstOrDefault(candidate => candidate.Name.Equals(search, StringComparison.OrdinalIgnoreCase))
                ?? weapons.FirstOrDefault(candidate => candidate.Name.Contains(search, StringComparison.OrdinalIgnoreCase));
            if (weapon == null)
            {
                Console.WriteLine("No weapon with that name was found. Press Enter to continue.");
                Console.ReadLine();
                continue;
            }

            ConsoleUi.DisplayBox("WEAPON DETAIL", new[]
            {
                $"Name: {weapon.Name}", $"Rarity: {weapon.Rarity}", $"Type: {weapon.Type}",
                $"Element: {weapon.Element}", $"Effect: {CombatEffectIcons.GetAttackPrefix(weapon.Effect)}{weapon.Effect}",
                $"Description: {weapon.Description}"
            }, ConsoleColor.Yellow);
            Console.WriteLine("The effect glossary explains what this effect does.");
            Console.WriteLine("Press Enter to continue.");
            Console.ReadLine();
        }
    }

    private static void ShowArmorIndex()
    {
        ConsoleUi.DisplayBox("ARMOR DETAILS", new[]
        {
            "Armor slots: Head, Chest, Legs, Feet.",
            "Armor provides defense, damage reduction, health bonuses, and gold value.",
            "Matching all four pieces from the same set grants a damage reduction bonus.",
            "Armor can appear in every rarity from Common through Divine.",
            "Current sets: Iron, Steel, Knightsteel, Runed Plate, Dragonforged, Starwoven, Celestial."
        });
        Console.WriteLine("Press Enter to continue.");
        Console.ReadLine();
    }

    private static void ShowItemIndex()
    {
        ConsoleUi.DisplayBox("ITEM DETAILS", new[]
        {
            "Healing Potion: restores health and can be used outside combat.",
            "Small Healing Potion: a basic early-dungeon healing item.",
            "Arrows: ammunition used by Bows and Crossbows.",
            "Items can stack in the inventory and have a gold value for shops."
        });
        Console.WriteLine("Press Enter to continue.");
        Console.ReadLine();
    }

    private static void ShowEffectIndex()
    {
        List<string> effectLines = Enum.GetValues<CombatEffectType>()
            .Select(effect => $"{CombatEffectIcons.GetIcon(effect)} {effect}: {GetEffectDescription(effect)}")
            .ToList();
        ConsoleUi.DisplayBox("EFFECT DETAILS", effectLines, ConsoleColor.Cyan);
        Console.WriteLine("Press Enter to continue.");
        Console.ReadLine();
    }

    private static string? PromptForCharacterName()
    {
        while (true)
        {
            Console.WriteLine();
            Console.Write("Enter your character's name, or type 'back' to return: ");
            string name = Console.ReadLine()?.Trim() ?? "";
            if (name.Equals("back", StringComparison.OrdinalIgnoreCase) ||
                name.Equals("q", StringComparison.OrdinalIgnoreCase))
            {
                return null;
            }

            if (name.Length > 0)
            {
                return name;
            }

            Console.WriteLine("Your character needs a name.");
        }
    }

    private static bool PromptForDevMode()
    {
        while (true)
        {
            Console.Write("Enable developer mode with much higher weapon rarity odds? (y/n): ");
            string? choice = Console.ReadLine()?.Trim();
            if (choice == null || choice.Equals("n", StringComparison.OrdinalIgnoreCase) || choice.Equals("no", StringComparison.OrdinalIgnoreCase))
            {
                return false;
            }
            if (choice.Equals("y", StringComparison.OrdinalIgnoreCase) || choice.Equals("yes", StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
            Console.WriteLine("Enter y or n.");
        }
    }

    private static string GetEffectDescription(CombatEffectType effect)
    {
        return effect switch
        {
            CombatEffectType.Burn => "Damage over time.",
            CombatEffectType.Freeze => "Builds stacks until the target becomes frozen.",
            CombatEffectType.Gust => "Pushes or pulls enemies.",
            CombatEffectType.Root => "Prevents movement temporarily.",
            CombatEffectType.Poison => "Stacking damage over time.",
            CombatEffectType.Blind => "Reduces enemy accuracy.",
            CombatEffectType.Void => "Damage that partially ignores defenses.",
            CombatEffectType.Shock => "Lightning that can chain between enemies.",
            CombatEffectType.Bleed => "Physical damage over time.",
            CombatEffectType.LifeSteal => "Restores health from damage dealt.",
            CombatEffectType.ManaSteal => "Restores mana from damage dealt.",
            CombatEffectType.Execution => "Deals more damage against weakened enemies.",
            CombatEffectType.Momentum => "Consecutive attacks increase damage.",
            CombatEffectType.Marked => "Marked targets take increased damage.",
            CombatEffectType.Thorns => "Attackers take damage when striking.",
            CombatEffectType.Chain => "An attack can jump to another enemy.",
            CombatEffectType.Pierce => "A projectile can continue through an enemy.",
            CombatEffectType.Ricochet => "A projectile can bounce to another target.",
            CombatEffectType.Multishot => "Fires additional projectiles.",
            CombatEffectType.Penetration => "A stronger form of Pierce.",
            CombatEffectType.Headshot => "Weak-point hits deal greatly increased damage.",
            CombatEffectType.Snipe => "Damage increases with distance.",
            CombatEffectType.Focus => "Staying still builds accuracy and damage.",
            CombatEffectType.Draw => "Charging an attack increases its power.",
            CombatEffectType.Overdraw => "A fully charged attack can exceed normal damage.",
            CombatEffectType.Volley => "Fires many projectiles into an area.",
            CombatEffectType.Trap => "Places a hidden projectile or magic trap.",
            CombatEffectType.Pin => "Temporarily pins an enemy in place.",
            CombatEffectType.Cripple => "Reduces enemy movement speed.",
            CombatEffectType.Mark => "Makes a target vulnerable to weapon attacks.",
            CombatEffectType.Homing => "Projectiles curve toward enemies.",
            CombatEffectType.PiercingShot => "A charged projectile travels through a line of enemies.",
            CombatEffectType.RicochetShot => "A projectile seeks additional targets after impact.",
            CombatEffectType.Afterimage => "Repeats a previous attack after a delay.",
            CombatEffectType.AmmoGeneration => "Certain conditions generate ammunition.",
            CombatEffectType.Salvo => "Stores attacks and releases them together.",
            CombatEffectType.ExecutionBolt => "Deals increased damage below a health threshold.",
            CombatEffectType.RangeScaling => "Damage scales with attack distance.",
            CombatEffectType.Quiver => "Stores special shots that can be cycled.",
            CombatEffectType.Scatter => "A projectile splits into smaller projectiles.",
            CombatEffectType.SpellEcho => "A spell has a chance to repeat.",
            CombatEffectType.SpellPower => "Increases spell damage or effectiveness.",
            CombatEffectType.ManaSurge => "Temporarily increases maximum mana and regeneration.",
            CombatEffectType.Overcast => "Spends extra mana to increase spell power.",
            CombatEffectType.CooldownReduction => "Reduces spell cooldowns.",
            CombatEffectType.ArcaneCharge => "Casting builds stacks that empower the next spell.",
            CombatEffectType.SpellSplit => "Turns one spell into multiple weaker projectiles.",
            CombatEffectType.Conjure => "Creates a temporary magical object or creature.",
            CombatEffectType.Channel => "Holding an attack continuously casts the spell.",
            CombatEffectType.SpellRadius => "Increases the area affected by spells.",
            CombatEffectType.DelayedCast => "Activates after a short delay.",
            CombatEffectType.ManaShield => "Converts some incoming damage into mana loss.",
            CombatEffectType.Teleport => "Instantly moves the Mage a short distance.",
            CombatEffectType.ElementalConversion => "Converts spell damage into another element.",
            _ => "A mysterious weapon effect."
        };
    }

    private static void SettingsMenu(GameStatistics statistics)
    {
        while (true)
        {
            if (!Console.IsOutputRedirected)
            {
                Console.Clear();
            }

            Console.WriteLine("SETTINGS");
            Console.WriteLine("1. View all-time session stats");
            Console.WriteLine("2. Back to menu");
            Console.Write("Choose an option: ");

            string? settingsChoice = Console.ReadLine()?.Trim();
            if (settingsChoice == null)
            {
                return;
            }

            switch (settingsChoice)
            {
                case "1":
                    Console.WriteLine();
                    Console.WriteLine("ALL-TIME SESSION STATS");
                    Console.WriteLine($"Runs started: {statistics.RunsStarted}");
                    Console.WriteLine($"Floors cleared: {statistics.FloorsCleared}");
                    Console.WriteLine($"Enemies defeated: {statistics.EnemiesDefeated}");
                    Console.WriteLine($"Bosses defeated: {statistics.BossesDefeated}");
                    Console.WriteLine($"Gold collected: {statistics.GoldCollected}");
                    Console.WriteLine("Press Enter to continue.");
                    Console.ReadLine();
                    break;
                case "2": return;
            }
        }
    }

    private static void PlayGame(string characterName, GameStatistics statistics, bool devMode, int saveSlot, SaveData? loadedSave)
    {
        LootGenerator.DevMode = devMode;
        DungeonRun dungeon;
        Player player;
        if (loadedSave != null)
        {
            (player, dungeon) = SaveSystem.Restore(loadedSave);
        }
        else
        {
            statistics.RecordRunStarted();
            dungeon = new();
            player = new(characterName);
            StartingRoom.Reset();
        }
        DungeonMap map = dungeon.Map;
        CombatSession? combat = null;
        string lastMessage = loadedSave == null
            ? "You wake in a cold stone room. Rain whispers against the ceiling somewhere above."
            : $"Your saved descent resumes on floor {dungeon.CurrentFloor}.";

        while (true)
        {
            if (!SaveSystem.Save(saveSlot, player, dungeon, out string saveError))
                lastMessage = saveError;
            if (!Console.IsOutputRedirected)
            {
                Console.Clear();
            }

            if (combat == null)
            {
                map.Display();
                Console.WriteLine();
                Console.WriteLine($"FLOOR: {dungeon.CurrentFloor} | FLOORS CLEARED: {dungeon.FloorsCleared}");
                ConsoleUi.DisplayPlayerStats(player);
                map.DisplayCurrentRoom();
                ConsoleUi.DisplayContext(lastMessage);
            }
            else
            {
                ConsoleUi.DisplayCombatScreen(player, combat);
                Console.WriteLine($"FLOOR: {dungeon.CurrentFloor} | FLOORS CLEARED: {dungeon.FloorsCleared}");
                ConsoleUi.DisplayContext(lastMessage);
            }

            if (combat != null)
            {
                Console.WriteLine(combat.GetOptions());
                Console.Write("Combat action: ");
                string? combatInput = Console.ReadLine();
                if (combatInput == null)
                {
                    return;
                }

                if (combatInput.Trim().Equals("q", StringComparison.OrdinalIgnoreCase) ||
                    combatInput.Trim().Equals("quit", StringComparison.OrdinalIgnoreCase))
                {
                    combat = null;
                    lastMessage = "You return to the menu.";
                    continue;
                }

                int goldBeforeTurn = player.Inventory.Gold;
                CombatTurnResult turn = combat.TakeTurn(combatInput);
                lastMessage = turn.Message;
                statistics.RecordGoldCollected(Math.Max(0, player.Inventory.Gold - goldBeforeTurn));

                if (turn.CombatEnded)
                {
                    if (turn.PlayerWon)
                    {
                        ConsoleUi.DisplayContext(turn.Message);
                        Console.WriteLine("Press Enter to continue.");
                        Console.ReadLine();

                        statistics.RecordEnemiesDefeated(combat.Enemies.Count(enemy => !enemy.IsAlive));
                        bool defeatedBoss = map.CurrentRoom.Type == RoomType.BossRoom;
                        if (defeatedBoss)
                        {
                            statistics.RecordBossDefeated();
                        }
                        map.CurrentRoom.Clear();
                        combat = null;

                        if (defeatedBoss)
                        {
                            int clearedFloor = dungeon.CurrentFloor;
                            statistics.RecordFloorCleared();
                            dungeon.AdvanceToNextFloor(player);
                            map = dungeon.Map;
                            lastMessage = $"The boss of floor {clearedFloor} is defeated. The dungeon reshapes around you, and the way to floor {dungeon.CurrentFloor} opens.";
                        }
                    }
                    else if (!turn.Fled)
                    {
                        ConsoleUi.DisplayContext(turn.Message, ConsoleColor.Red);
                        Console.WriteLine();
                        Console.WriteLine("1. Restart run");
                        Console.WriteLine("2. Return to main menu");
                        Console.Write("Choose an option: ");
                        string deathChoice = Console.ReadLine()?.Trim() ?? "";

                        if (deathChoice == "1" || deathChoice.Equals("restart", StringComparison.OrdinalIgnoreCase))
                        {
                            statistics.RecordRunStarted();
                            dungeon = new DungeonRun();
                            map = dungeon.Map;
                            player = new Player(characterName);
                            StartingRoom.Reset();
                            combat = null;
                            lastMessage = "A new descent begins. The dungeon waits at ground zero.";
                        }
                        else
                        {
                            return;
                        }
                    }
                    else
                    {
                        combat = null;
                    }
                }

                continue;
            }

            if (map.CurrentRoom.Type == RoomType.StartingRoom)
            {
                Console.WriteLine(StartingRoom.Instructions);
            }

            string roomInstructions = RoomInteractions.GetInstructions(map.CurrentRoom.Type);
            if (roomInstructions.Length > 0)
            {
                Console.WriteLine(roomInstructions);
            }

            if (CombatSystem.IsCombatRoom(map.CurrentRoom.Type))
            {
                if (map.CurrentRoom.Cleared)
                {
                    Console.WriteLine("The room is quiet. The enemy here has already been defeated.");
                }
                else
                {
                    if (map.CurrentRoom.EncounterEnemies.Count == 0)
                    {
                        map.CurrentRoom.EncounterEnemies.AddRange(EnemyFactory.CreateEncounter(map.CurrentRoom.Type, dungeon.CurrentFloor));
                    }

                    foreach (Enemy enemy in map.CurrentRoom.EncounterEnemies)
                    {
                        Console.Write("Enemy: ");
                        ConsoleUi.WriteEnemyName(enemy);
                        Console.Write(" | HP: ");
                        ConsoleUi.WriteHealth(enemy.Health, enemy.MaxHealth);
                        Console.WriteLine();
                    }
                    Console.WriteLine("Type 'fight' to re-engage, or choose a room to leave.");
                }
            }

            Console.WriteLine();
            Console.Write("Choose a room, inspect something, fight, use inventory, or quit: ");

            string? input = Console.ReadLine();
            if (input == null)
            {
                return;
            }

            if (input.Trim().Equals("q", StringComparison.OrdinalIgnoreCase) ||
                input.Trim().Equals("quit", StringComparison.OrdinalIgnoreCase))
            {
                return;
            }

            if (map.CurrentRoom.Type == RoomType.StartingRoom)
            {
                if (StartingRoom.TryInspect(input, player, out string inspectMessage))
                {
                    lastMessage = inspectMessage;
                    continue;
                }
            }

            if (input.Trim().Equals("use inventory", StringComparison.OrdinalIgnoreCase) ||
                input.Trim().Equals("inventory", StringComparison.OrdinalIgnoreCase))
            {
                OpenInventoryScreen(player, out lastMessage);
                continue;
            }

            if (map.CurrentRoom.Type == RoomType.ShopRoom &&
                input.Trim().Equals("shop", StringComparison.OrdinalIgnoreCase))
            {
                OpenShopScreen(map.CurrentRoom, player, dungeon, out lastMessage);
                continue;
            }

            if (InventoryCommands.TryHandle(input, player, out string inventoryMessage))
            {
                lastMessage = inventoryMessage;
                continue;
            }

            if (CombatSystem.IsCombatRoom(map.CurrentRoom.Type) &&
                !map.CurrentRoom.Cleared &&
                input.Trim().Equals("fight", StringComparison.OrdinalIgnoreCase))
            {
                combat = BeginCombat(map.CurrentRoom, player, dungeon.CurrentFloor, out lastMessage);
                continue;
            }

            if (RoomInteractions.TryInspect(map.CurrentRoom, player, input, out string roomMessage))
            {
                lastMessage = roomMessage;
                continue;
            }

            if (map.CurrentRoom.Type == RoomType.StartingRoom && !player.ClassChosen)
            {
                lastMessage = StartingRoom.CannotLeaveMessage;
                continue;
            }

            if (map.IsBossRoomDestination(input))
            {
                Console.Write("This room holds a boss. Enter anyway? (y/n): ");
                string? confirmation = Console.ReadLine()?.Trim();
                if (!string.Equals(confirmation, "y", StringComparison.OrdinalIgnoreCase) &&
                    !string.Equals(confirmation, "yes", StringComparison.OrdinalIgnoreCase))
                {
                    lastMessage = "You decide to leave the boss room unopened for now.";
                    continue;
                }
            }

            bool moved = map.TryMove(input, out lastMessage);
            if (moved && CombatSystem.IsCombatRoom(map.CurrentRoom.Type) && !map.CurrentRoom.Cleared)
            {
                combat = BeginCombat(map.CurrentRoom, player, dungeon.CurrentFloor, out lastMessage);
            }
        }
    }

    private static void OpenInventoryScreen(Player player, out string message)
    {
        message = "You close your inventory.";

        while (true)
        {
            if (!Console.IsOutputRedirected)
            {
                Console.Clear();
            }

            Console.WriteLine("========================================");
            Console.WriteLine("               INVENTORY");
            Console.WriteLine("========================================");
            ConsoleUi.DisplayPlayerStats(player);
            Console.WriteLine();
            Console.WriteLine(InventoryCommands.GetSummary(player.Inventory));
            Console.WriteLine("Commands: equip weapon [name], equip armor [name], use [item name], skills, back");
            Console.Write("Inventory: ");

            string input = Console.ReadLine()?.Trim() ?? "";
            if (input.Equals("back", StringComparison.OrdinalIgnoreCase) ||
                input.Equals("q", StringComparison.OrdinalIgnoreCase) ||
                input.Equals("close", StringComparison.OrdinalIgnoreCase))
            {
                return;
            }

            if (input.Equals("skills", StringComparison.OrdinalIgnoreCase) || input.Equals("skill points", StringComparison.OrdinalIgnoreCase))
            {
                OpenSkillMenu(player, out message);
                continue;
            }

            if (InventoryCommands.TryHandle(input, player, out string inventoryMessage))
            {
                message = inventoryMessage;
            }
            else
            {
                message = "Use a command shown above, or type back to return.";
            }

            Console.WriteLine();
            Console.WriteLine(message);
            Console.WriteLine("Press Enter to continue.");
            Console.ReadLine();
        }
    }

    private static void OpenSkillMenu(Player player, out string message)
    {
        message = "You return to your inventory.";
        while (true)
        {
            if (!Console.IsOutputRedirected)
            {
                Console.Clear();
            }

            Console.WriteLine("PLAYER SKILLS AND ADVANCED STATS");
            Console.WriteLine($"Unspent Skill Points: {player.SkillPoints}");
            ConsoleUi.DisplayBox("SPEND 1 POINT WITH 'spend [stat]'", new[]
            {
                $"STR: {player.Strength} - Increases base damage for non-Mage weapons.",
                $"DEX: {player.Dexterity} (effective {player.EffectiveDexterity}) - Improves initiative speed; shields reduce Ranger DEX by 3.",
                $"CON: {player.Constitution} - Adds 10 maximum health per point.",
                $"INT: {player.Intelligence} - Adds 5 maximum mana and increases Mage damage.",
                $"WIS: {player.Wisdom} - Improves mana restored by Focus.",
                $"CHA: {player.Charisma} - Discounts shop prices by 2% per point above 10.",
                $"Speed: {player.Speed} - Adds directly to initiative speed.",
                $"Crit: {player.CriticalChance:P0} - Adds 1% critical chance per point."
            }, ConsoleColor.Cyan);
            Console.WriteLine($"Respec all spent points: type 'respec' ({player.RespecCost} gold). Type 'back' to return.");
            Console.Write("Skills: ");
            string? input = Console.ReadLine()?.Trim();
            if (input == null || input.Equals("back", StringComparison.OrdinalIgnoreCase) || input.Equals("q", StringComparison.OrdinalIgnoreCase))
            {
                return;
            }

            if (input.StartsWith("spend ", StringComparison.OrdinalIgnoreCase))
            {
                if (player.SpendSkillPoint(input[6..], out message))
                {
                    Console.WriteLine(message);
                }
                else
                {
                    Console.WriteLine(message);
                }
            }
            else if (input.Equals("respec", StringComparison.OrdinalIgnoreCase))
            {
                int cost = player.RespecCost;
                if (!player.HasInvestedSkillPoints)
                {
                    player.Respec(out message);
                }
                else if (player.Inventory.Gold >= cost && player.Respec(out message) && player.Inventory.SpendGold(cost))
                {
                    message = $"You paid {cost} gold. {message}";
                }
                else
                {
                    message = player.Inventory.Gold < cost
                        ? $"Respec costs {cost} gold; you have {player.Inventory.Gold}."
                        : message;
                }
                Console.WriteLine(message);
            }
            else
            {
                message = "Use 'spend [stat]' or type back.";
                Console.WriteLine(message);
            }

            Console.WriteLine("Press Enter to continue.");
            Console.ReadLine();
        }
    }

    private static void OpenShopScreen(Room room, Player player, DungeonRun dungeon, out string message)
    {
        message = "You leave the shop.";

        while (true)
        {
            if (!Console.IsOutputRedirected)
            {
                Console.Clear();
            }

            Console.WriteLine("========================================");
            Console.WriteLine("                 SHOP");
            Console.WriteLine("========================================");
            ConsoleUi.DisplayPlayerStats(player);
            Console.WriteLine($"Shop loot upgrade: {dungeon.ShopLootUpgradeLevel} | Next cost: {dungeon.ShopLootUpgradeCost} gold");
            Console.WriteLine($"Reroll cost: {ShopSystem.GetRerollPrice(room)} gold");
            Console.WriteLine();
            Console.WriteLine("Stock:");
            for (int i = 0; i < room.ShopStock.Count; i++)
            {
                LootDrop? drop = room.ShopStock[i];
                if (drop?.Rarity == Rarity.Divine && player.Inventory.HasDivine(drop.DisplayName))
                {
                    drop = LootGenerator.GenerateShopDrop(dungeon.CurrentFloor, dungeon.ShopLootUpgradeLevel, player.Inventory);
                    room.ShopStock[i] = drop;
                }
                if (drop == null)
                {
                    Console.WriteLine($"  {i + 1}. SOLD OUT");
                    continue;
                }

                string kind = drop.Weapon != null ? $"Weapon: {drop.Weapon.Type}" :
                    drop.Armor != null ? $"Armor: {drop.Armor.Slot}" : "Item";
                Console.Write($"  {i + 1}. ");
                ConsoleUi.WriteRarity(drop.Rarity, $"{drop.DisplayName} [{drop.Rarity}]");
                Console.WriteLine($" ({kind}) - {ShopSystem.GetPrice(drop, player)} gold");
            }

            Console.WriteLine("Commands: buy [1-6], sell, reroll, upgrade, back");
            Console.Write("Shop: ");
            string input = Console.ReadLine()?.Trim() ?? "";
            if (input.Equals("back", StringComparison.OrdinalIgnoreCase) ||
                input.Equals("q", StringComparison.OrdinalIgnoreCase) ||
                input.Equals("close", StringComparison.OrdinalIgnoreCase))
            {
                return;
            }

            bool handled;
            if (input.StartsWith("buy ", StringComparison.OrdinalIgnoreCase))
            {
                handled = ShopSystem.TryBuy(room, player, input, out message);
            }
            else if (input.Equals("reroll", StringComparison.OrdinalIgnoreCase))
            {
                handled = ShopSystem.TryReroll(room, player, dungeon.CurrentFloor, dungeon.ShopLootUpgradeLevel, out message);
            }
            else if (input.Equals("upgrade", StringComparison.OrdinalIgnoreCase))
            {
                handled = ShopSystem.TryUpgrade(room, player, dungeon, out message);
            }
            else if (input.Equals("sell", StringComparison.OrdinalIgnoreCase))
            {
                string selection = OpenSellMenu(player);
                handled = selection.Length > 0 && ShopSystem.TrySell(player, $"sell {selection}", out message);
                if (selection.Length == 0)
                {
                    message = "You leave the sell menu without selling anything.";
                }
            }
            else if (input.StartsWith("sell ", StringComparison.OrdinalIgnoreCase))
            {
                handled = ShopSystem.TrySell(player, input, out message);
            }
            else
            {
                handled = false;
                message = "Use a shop command shown above, or type back to leave.";
            }

            if (handled || message.Length > 0)
            {
                Console.WriteLine();
                Console.WriteLine(message);
                Console.WriteLine("Press Enter to continue.");
                Console.ReadLine();
            }
        }
    }

    private static string OpenSellMenu(Player player)
    {
        while (true)
        {
            Console.WriteLine();
            Console.WriteLine("YOUR INVENTORY FOR SALE (half listed gold value)");
            for (int i = 0; i < player.Inventory.Weapons.Count; i++)
                Console.WriteLine($"weapon {i + 1}. {player.Inventory.Weapons[i].Name} [{player.Inventory.Weapons[i].Rarity}] - {Math.Max(1, player.Inventory.Weapons[i].GoldValue / 2)} gold");
            for (int i = 0; i < player.Inventory.Armor.Count; i++)
                Console.WriteLine($"armor {i + 1}. {player.Inventory.Armor[i].Name} [{player.Inventory.Armor[i].Rarity}] - {Math.Max(1, player.Inventory.Armor[i].GoldValue / 2)} gold");
            for (int i = 0; i < player.Inventory.Items.Count; i++)
                Console.WriteLine($"item {i + 1}. {player.Inventory.Items[i].Name} x{player.Inventory.Items[i].Quantity} [{player.Inventory.Items[i].Rarity}] - {Math.Max(1, player.Inventory.Items[i].GoldValue / 2)} gold each");
            Console.Write("Enter weapon/armor/item number, or back: ");
            string value = Console.ReadLine()?.Trim() ?? "back";
            if (value.Equals("back", StringComparison.OrdinalIgnoreCase) || value.Length == 0)
                return "";
            string[] parts = value.Split(' ', 2, StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length == 2 && new[] { "weapon", "armor", "item" }.Contains(parts[0].ToLowerInvariant()) && int.TryParse(parts[1], out _))
                return value;
            Console.WriteLine("Choose a listed category and number, such as 'weapon 1'.");
        }
    }

    private static CombatSession BeginCombat(Room room, Player player, int floor, out string message)
    {
        if (room.EncounterEnemies.Count == 0)
        {
            room.EncounterEnemies.AddRange(EnemyFactory.CreateEncounter(room.Type, floor));
        }

        Enemy firstEnemy = room.EncounterEnemies[0];
        EncounterText encounter = EncounterGenerator.Create(firstEnemy);
        CombatSession session = new(player, room.EncounterEnemies, floor);
        message = $"{encounter.Message}\n{session.Begin(encounter.EnemyActsFirst)}";
        return session;
    }
}
