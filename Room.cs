using System.Collections.Generic;
using System.Linq;

namespace DungeonSimulation;

public class Room
{
    public int Row { get; }
    public int Column { get; }
    public RoomType Type { get; set; }
    public bool Visited { get; private set; }
    public bool TrapRevealed { get; private set; }
    public bool Cleared { get; private set; }
    public List<Enemy> EncounterEnemies { get; } = new();
    public List<LootDrop?> ShopStock { get; } = new();
    public int ShopRerollCount { get; set; }
    public bool FountainUsed { get; set; }
    public Dictionary<Direction, Room> Connections { get; } = new();

    public Room(int row, int column, RoomType type)
    {
        Row = row;
        Column = column;
        Type = type;
    }

    public string Name => RoomInfo.GetName(Type);
    public string DisplayName => Type == RoomType.TrapRoom && !TrapRevealed ? "Treasure Room" : Name;
    public char Symbol => RoomInfo.GetSymbol(Type);
    public char DisplaySymbol => Type == RoomType.TrapRoom && !TrapRevealed ? 'T' : Symbol;

    public void Visit()
    {
        Visited = true;
    }

    public void Clear()
    {
        Cleared = true;
    }

    public void RevealTrap()
    {
        TrapRevealed = true;
    }

    public void RestoreState(RoomSaveData saved)
    {
        Visited = saved.Visited;
        TrapRevealed = saved.TrapRevealed;
        Cleared = saved.Cleared;
        FountainUsed = saved.FountainUsed;
        ShopRerollCount = Math.Max(0, saved.ShopRerollCount);
        EncounterEnemies.Clear();
        EncounterEnemies.AddRange(saved.Enemies.Select(Enemy.FromSave));
    }
}
