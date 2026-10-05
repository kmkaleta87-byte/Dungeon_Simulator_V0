namespace DungeonSimulation;

public static class StartingRoom
{
    private static bool closetInspected;
    private static bool deskInspected;
    private static bool weaponChoiceOffered;

    public static string Instructions =>
        "You can inspect the closet or the desk. The desk may have something important. Try 'inspect closet' or 'inspect desk'.";

    public static string CannotLeaveMessage =>
        "The stone doorway does not move. A faint symbol on the lock glows when you reach for it, then fades toward the battered desk. You get the feeling the dungeon expects you to be armed before it lets you pass.";

    public static void Reset()
    {
        closetInspected = false;
        deskInspected = false;
        weaponChoiceOffered = false;
    }

    public static void Restore(bool closet, bool desk, bool choiceOffered)
    {
        closetInspected = closet;
        deskInspected = desk;
        weaponChoiceOffered = choiceOffered;
    }

    public static (bool Closet, bool Desk, bool ChoiceOffered) Capture() =>
        (closetInspected, deskInspected, weaponChoiceOffered);

    public static bool TryInspect(string input, Player player, out string message)
    {
        string choice = input.Trim().ToLowerInvariant();

        if (weaponChoiceOffered && !player.ClassChosen)
        {
            string classChoice = choice.Replace("choose ", "").Trim();
            PlayerClass? selectedClass = classChoice switch
            {
                "1" or "warrior" => PlayerClass.Warrior,
                "2" or "ranger" => PlayerClass.Ranger,
                "3" or "mage" => PlayerClass.Mage,
                _ => null
            };

            if (selectedClass.HasValue)
            {
                player.ChooseClass(selectedClass.Value);
                message = $"You choose the path of the {selectedClass.Value}. Your {player.Inventory.EquippedWeapon!.Name} is ready, and the symbol on the doorway fades.";
                return true;
            }
        }

        if (choice is "closet" or "inspect closet")
        {
            if (closetInspected)
            {
                message = "The closet is empty now. Dust drifts through the pale light.";
                return true;
            }

            Armor armor = new(
                "Iron Chestplate",
                ArmorSlot.Chest,
                defense: 2,
                damageReduction: 1,
                goldValue: 3,
                description: "A plain iron chestplate that has seen better days, but is better than nothing.",
                setName: "Iron");

            player.Inventory.AddArmor(armor);
            player.Inventory.AddItem(new Item(
                "Small Healing Potion",
                ItemType.Potion,
                goldValue: 8,
                description: "A simple red potion found beside the armor.",
                healingAmount: 25));
            closetInspected = true;
            message = "Behind a moth-eaten cloak, you find an iron chestplate and a small healing potion. The armor smells like rain and old smoke, but it fits well enough.";
            return true;
        }

        if (choice is "desk" or "inspect desk")
        {
            if (!deskInspected)
            {
                deskInspected = true;
                weaponChoiceOffered = true;
                message = "Inside the desk is no single weapon, but three possibilities: a sword, a bow, and a staff. Choose one with 'choose warrior', 'choose ranger', or 'choose mage'.";
                return true;
            }

            message = player.ClassChosen
                ? "The desk is empty now. Your chosen weapon is in your hands."
                : "The three weapons wait in the desk. Choose 'warrior', 'ranger', or 'mage'.";
            return true;
        }

        message = "You find nothing to inspect there.";
        return false;
    }
}
