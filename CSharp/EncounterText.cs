using System;

namespace DungeonSimulation;

public class EncounterText
{
    public string Message { get; }
    public bool EnemyActsFirst { get; }

    public EncounterText(string message, bool enemyActsFirst = false)
    {
        Message = message;
        EnemyActsFirst = enemyActsFirst;
    }
}

public static class EncounterGenerator
{
    public static EncounterText Create(Enemy enemy)
    {
        if (enemy.IsBoss)
        {
            return RandomBossEncounter(enemy);
        }

        if (enemy.IsElite)
        {
            return RandomEliteEncounter(enemy);
        }

        return enemy.Race switch
        {
            EnemyRace.Goblin => RandomGoblinEncounter(enemy),
            EnemyRace.Skeleton => RandomSkeletonEncounter(enemy),
            EnemyRace.Specter => RandomSpecterEncounter(enemy),
            EnemyRace.Vampire => RandomVampireEncounter(enemy),
            EnemyRace.Werewolf => RandomWerewolfEncounter(enemy),
            EnemyRace.Golem => RandomGolemEncounter(enemy),
            _ => new EncounterText($"The {enemy.Name} steps into your path.")
        };
    }

    private static EncounterText RandomGoblinEncounter(Enemy enemy)
    {
        return Random.Shared.Next(10) switch
        {
            0 => new EncounterText($"A {enemy.Name.ToLowerInvariant()} jumps on you from above!", true),
            < 5 => new EncounterText($"You hear giggling in the dark. A {enemy.Name.ToLowerInvariant()} steps into the torchlight."),
            _ => new EncounterText($"A stone skitters across the floor. The {enemy.Name.ToLowerInvariant()} who threw it grins at you.")
        };
    }

    private static EncounterText RandomArcherEncounter(Enemy enemy)
    {
        return Random.Shared.Next(10) switch
        {
            0 => new EncounterText($"You spot a flash of fletching just before the {enemy.Name.ToLowerInvariant()} draws its bow.", true),
            < 5 => new EncounterText($"An arrow thunks into the wall beside your head. The {enemy.Name.ToLowerInvariant()} has already found its perch."),
            _ => new EncounterText($"A bowstring creaks somewhere ahead. The {enemy.Name.ToLowerInvariant()} steps from behind a pillar.")
        };
    }

    private static EncounterText RandomSkeletonEncounter(Enemy enemy)
    {
        return Random.Shared.Next(2) == 0
            ? new EncounterText($"Bones assemble in the dust. The {enemy.Name.ToLowerInvariant()} turns its empty sockets toward you.")
            : new EncounterText($"A bowstring snaps somewhere in the dark. The {enemy.Name.ToLowerInvariant()} is already waiting.");
    }

    private static EncounterText RandomSpecterEncounter(Enemy enemy)
    {
        return new EncounterText($"The torchlight bends away from a drifting shape. The {enemy.Name.ToLowerInvariant()} has no footsteps to announce it.");
    }

    private static EncounterText RandomVampireEncounter(Enemy enemy)
    {
        return new EncounterText($"A pale figure steps from the shadows and smiles at the sound of your heartbeat. It is a {enemy.Name.ToLowerInvariant()}.");
    }

    private static EncounterText RandomWerewolfEncounter(Enemy enemy)
    {
        return new EncounterText($"A howl rolls through the corridor. The {enemy.Name.ToLowerInvariant()} lowers its stance and watches your hands.");
    }

    private static EncounterText RandomGolemEncounter(Enemy enemy)
    {
        return new EncounterText($"Stone grinds against stone. The {enemy.Name.ToLowerInvariant()} pulls itself upright and blocks the way.");
    }

    private static EncounterText RandomMageEncounter(Enemy enemy)
    {
        return Random.Shared.Next(3) switch
        {
            0 => new EncounterText($"A spell circle ignites beneath your boots. The {enemy.Name.ToLowerInvariant()} is already chanting."),
            1 => new EncounterText($"Whispers gather in the air as the {enemy.Name.ToLowerInvariant()} raises its staff."),
            _ => new EncounterText($"A cold voice asks your name. The {enemy.Name.ToLowerInvariant()} waits for your answer.")
        };
    }

    private static EncounterText RandomBruteEncounter(Enemy enemy)
    {
        return Random.Shared.Next(3) switch
        {
            0 => new EncounterText($"The {enemy.Name.ToLowerInvariant()} tears a chain from the wall and charges!", true),
            1 => new EncounterText($"Dust falls from the ceiling as the {enemy.Name.ToLowerInvariant()} blocks the passage."),
            _ => new EncounterText($"A low growl rolls through the room. The {enemy.Name.ToLowerInvariant()} turns toward you.")
        };
    }

    private static EncounterText RandomEliteEncounter(Enemy enemy)
    {
        return Random.Shared.Next(10) switch
        {
            0 => new EncounterText($"The {enemy.Name.ToLowerInvariant()} drops from a balcony above you!", true),
            < 5 => new EncounterText($"A horn sounds once. The {enemy.Name.ToLowerInvariant()} closes the door behind you."),
            _ => new EncounterText($"The {enemy.Name.ToLowerInvariant()} studies your weapon before drawing its own.")
        };
    }

    private static EncounterText RandomBossEncounter(Enemy enemy)
    {
        if (enemy.SpecialAbility == "Necromancy")
        {
            return new EncounterText("The room is covered in old funeral ribbons. A figure behind the bone altar lifts one hand, and the dead begin knocking from beneath the floor.");
        }

        if (enemy.SpecialAbility == "TwinBond")
        {
            return new EncounterText("Two shadows move behind the room's red curtains. When the curtains part, two matching figures step forward and smile at exactly the same time.");
        }

        if (enemy.SpecialAbility == "GlassCannon")
        {
            return new EncounterText($"Every candle in the room goes out except one. In its thin circle of light stands {enemy.Name}, wrapped in cracked armor and carrying a weapon that hums with reckless power.");
        }

        return enemy.Race switch
        {
            EnemyRace.Vampire => new EncounterText("An ominous presence gathers behind a large red curtain at the back of the room. The fabric slowly parts, revealing a pale smile and two bright eyes."),
            EnemyRace.Skeleton => new EncounterText("The throne is empty, but the bones piled beneath it begin assembling themselves into a crowned figure. The crown is still wet with grave soil."),
            EnemyRace.Goblin => new EncounterText("A feast has been laid across the far table, though every plate is empty. A small hand reaches up from beneath the tablecloth and pulls the whole table aside."),
            EnemyRace.Specter => new EncounterText("Your reflection disappears from the polished floor. A second silhouette remains where yours should be, then turns to face you."),
            EnemyRace.Werewolf => new EncounterText("The moonlight above the broken ceiling turns red. A howl answers from inside the room, followed by the slow scrape of claws across stone."),
            EnemyRace.Golem => new EncounterText("The walls are carved with the same face over and over. Stone breaks apart at the center of the room, and that face opens its eyes."),
            _ => new EncounterText("The room seems empty until the treasure mound in the center rises like a breathing creature.")
        };
    }
}
