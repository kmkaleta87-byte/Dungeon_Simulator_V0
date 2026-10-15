using System;
using System.Collections.Generic;
using System.Linq;

namespace DungeonSimulation;

public class DungeonMap
{
    // Change these values to control the size and density of the map.
    private const int Width = 9;
    private const int Height = 7;
    private const int RoomCount = 20;
    private static readonly Direction[] DisplayDirections =
    {
        Direction.North,
        Direction.East,
        Direction.South,
        Direction.West
    };

    private readonly Room?[,] grid = new Room?[Height, Width];
    private readonly List<Room> rooms = new();
    private readonly Random random;

    public Room CurrentRoom { get; private set; } = null!;

    private DungeonMap(Random random)
    {
        this.random = random;
    }

    public static DungeonMap Generate(int floor = 1, int shopUpgradeLevel = 0)
    {
        DungeonMap map = new(Random.Shared);
        map.CreateRooms(floor);
        map.AssignRoomTypes(floor);
        foreach (Room room in map.rooms)
        {
            if (room.Type == RoomType.ShopRoom)
            {
                room.ShopStock.AddRange(ShopGenerator.CreateStock(floor, shopUpgradeLevel));
                break;
            }
        }
        map.ConnectRooms();
        map.CurrentRoom = map.rooms[0];
        map.CurrentRoom.Visit();
        return map;
    }

    public MapSaveData ToSave()
    {
        MapSaveData saved = new() { CurrentRow = CurrentRoom.Row, CurrentColumn = CurrentRoom.Column };
        foreach (Room room in rooms)
        {
            saved.Rooms.Add(new RoomSaveData
            {
                Row = room.Row,
                Column = room.Column,
                Type = room.Type,
                Visited = room.Visited,
                TrapRevealed = room.TrapRevealed,
                Cleared = room.Cleared,
                FountainUsed = room.FountainUsed,
                ShopRerollCount = room.ShopRerollCount,
                Enemies = room.EncounterEnemies.Select(SaveSystem.SaveEnemy).ToList(),
                ShopStock = room.ShopStock.Select(drop => drop == null ? null : SaveSystem.SaveLootDrop(drop)).ToList()
            });
        }
        return saved;
    }

    public static DungeonMap FromSave(MapSaveData saved)
    {
        DungeonMap map = new(Random.Shared);
        foreach (RoomSaveData roomData in saved.Rooms)
        {
            Room room = new(roomData.Row, roomData.Column, roomData.Type);
            room.RestoreState(roomData);
            foreach (LootDropSaveData? drop in roomData.ShopStock)
                room.ShopStock.Add(drop == null ? null : SaveSystem.RestoreLootDrop(drop));
            map.grid[room.Row, room.Column] = room;
            map.rooms.Add(room);
        }
        map.ConnectRooms();
        map.CurrentRoom = map.rooms.FirstOrDefault(room =>
            room.Row == saved.CurrentRow && room.Column == saved.CurrentColumn) ?? map.rooms[0];
        map.CurrentRoom.Visit();
        return map;
    }

    public static bool IsValidSaveData(MapSaveData? saved)
    {
        if (saved?.Rooms == null || saved.Rooms.Count == 0)
        {
            return false;
        }

        HashSet<(int Row, int Column)> coordinates = new();
        foreach (RoomSaveData? room in saved.Rooms)
        {
            if (room == null || room.Row < 0 || room.Row >= Height ||
                room.Column < 0 || room.Column >= Width ||
                !Enum.IsDefined(room.Type) || !coordinates.Add((room.Row, room.Column)) ||
                room.Enemies == null || room.ShopStock == null ||
                room.Enemies.Any(enemy => enemy == null))
            {
                return false;
            }
        }

        return coordinates.Contains((saved.CurrentRow, saved.CurrentColumn));
    }

    private void CreateRooms(int floor)
    {
        int startRow = Height / 2;
        int startColumn = Width / 2;
        AddRoom(startRow, startColumn, floor == 1 ? RoomType.StartingRoom : RoomType.EmptyRoom);

        // Grow from existing rooms so every generated room is reachable.
        int failedAttempts = 0;
        while (rooms.Count < RoomCount && failedAttempts < 10000)
        {
            Room source = rooms[random.Next(rooms.Count)];
            Direction direction = (Direction)random.Next(4);
            int row = source.Row;
            int column = source.Column;
            MoveCoordinates(direction, ref row, ref column);

            if (IsInsideMap(row, column) && grid[row, column] == null)
            {
                AddRoom(row, column, RoomType.EnemyRoom1);
                failedAttempts = 0;
            }
            else
            {
                failedAttempts++;
            }
        }
    }

    private void AssignRoomTypes(int floor)
    {
        List<Room> candidates = new(rooms);
        candidates.Remove(rooms[0]);

        // Put the boss in a far-away room to give the generated map a goal.
        Room bossRoom = candidates[0];
        foreach (Room room in candidates)
        {
            if (DistanceFromStart(room) > DistanceFromStart(bossRoom))
            {
                bossRoom = room;
            }
        }

        bossRoom.Type = RoomType.BossRoom;
        candidates.Remove(bossRoom);
        Shuffle(candidates);

        List<RoomType> requiredTypes = new()
        {
            RoomType.TreasureRoom,
            RoomType.WeaponTreasureRoom,
            RoomType.FountainRoom,
            RoomType.ShopRoom,
            RoomType.EnemyRoom1
        };

        if (floor >= 2)
        {
            requiredTypes.Add(RoomType.EnemyRoom2);
        }

        if (floor >= 3)
        {
            requiredTypes.Add(RoomType.EnemyRoom3);
        }

        if (floor >= 4)
        {
            requiredTypes.Add(RoomType.EnemyRoom4);
        }

        requiredTypes.Add(RoomType.TrapRoom);

        if (floor >= 3)
        {
            requiredTypes.Add(RoomType.EliteRoom);
        }

        for (int i = 0; i < requiredTypes.Count && i < candidates.Count; i++)
        {
            candidates[i].Type = requiredTypes[i];
        }

        for (int i = requiredTypes.Count; i < candidates.Count; i++)
        {
            List<RoomType> extraTypes = new()
            {
                RoomType.EnemyRoom1,
                RoomType.EnemyRoom1,
                RoomType.EnemyRoom1,
                RoomType.EnemyRoom1,
                RoomType.EnemyRoom1,
                RoomType.EmptyRoom,
                RoomType.EmptyRoom,
                RoomType.EmptyRoom,
                RoomType.TreasureRoom,
                RoomType.TrapRoom
            };

            if (floor >= 2)
            {
                extraTypes.Add(RoomType.EnemyRoom2);
                extraTypes.Add(RoomType.EnemyRoom2);
            }

            if (floor >= 3)
            {
                extraTypes.Add(RoomType.EnemyRoom3);
                extraTypes.Add(RoomType.EnemyRoom3);
            }

            if (floor >= 4)
            {
                extraTypes.Add(RoomType.EnemyRoom4);
                extraTypes.Add(RoomType.EnemyRoom4);
            }

            candidates[i].Type = floor >= 3 && random.Next(100) < 15
                ? RoomType.EliteRoom
                : extraTypes[random.Next(extraTypes.Count)];
        }
    }

    private void ConnectRooms()
    {
        foreach (Room room in rooms)
        {
            AddConnection(room, Direction.North, room.Row - 1, room.Column);
            AddConnection(room, Direction.East, room.Row, room.Column + 1);
            AddConnection(room, Direction.South, room.Row + 1, room.Column);
            AddConnection(room, Direction.West, room.Row, room.Column - 1);
        }
    }

    private void AddConnection(Room room, Direction direction, int row, int column)
    {
        if (IsInsideMap(row, column) && grid[row, column] is Room connectedRoom)
        {
            room.Connections[direction] = connectedRoom;
        }
    }

    private void AddRoom(int row, int column, RoomType type)
    {
        Room room = new(row, column, type);
        grid[row, column] = room;
        rooms.Add(room);
    }

    private int DistanceFromStart(Room room)
    {
        Room start = rooms[0];
        return Math.Abs(room.Row - start.Row) + Math.Abs(room.Column - start.Column);
    }

    private void Shuffle(List<Room> list)
    {
        for (int i = list.Count - 1; i > 0; i--)
        {
            int swapIndex = random.Next(i + 1);
            (list[i], list[swapIndex]) = (list[swapIndex], list[i]);
        }
    }

    private static void MoveCoordinates(Direction direction, ref int row, ref int column)
    {
        switch (direction)
        {
            case Direction.North: row--; break;
            case Direction.East: column++; break;
            case Direction.South: row++; break;
            case Direction.West: column--; break;
        }
    }

    private static bool IsInsideMap(int row, int column)
    {
        return row >= 0 && row < Height && column >= 0 && column < Width;
    }

    public void Display()
    {
        Console.WriteLine("Dungeon Map");
        Console.WriteLine("-----------");

        for (int row = 0; row < Height; row++)
        {
            for (int column = 0; column < Width; column++)
            {
                Room? room = grid[row, column];
                Console.Write(room == null ? " . " : room == CurrentRoom ? " @ " : room.Visited ? $" {room.DisplaySymbol} " : " ? ");
            }
            Console.WriteLine();
        }

        Console.WriteLine();
        Console.WriteLine("@ You  ? Unvisited room  O Empty room  . No room  Visited rooms show their symbols");
    }

    public void DisplayCurrentRoom()
    {
        Console.WriteLine($"You are in: {CurrentRoom.DisplayName}");
        Console.WriteLine("Map controls:");
        foreach (Direction direction in DisplayDirections)
        {
            if (CurrentRoom.Connections.TryGetValue(direction, out Room? room))
            {
                string roomName = room.Visited ? room.DisplayName : "Unvisited Room";
                Console.WriteLine($"  {direction.ToString()[0]} - {roomName}");
            }
            else
            {
                Console.WriteLine($"  {direction.ToString()[0]} - N/A");
            }
        }
        Console.WriteLine("Move with N, E, S, or W. You can also enter a room name.");
    }

    public bool TryMove(string input, out string message)
    {
        Room? destination = FindDestination(input);
        if (destination == null)
        {
            message = "That room is not connected to your current room.";
            return false;
        }

        destination.Visit();
        CurrentRoom = destination;
        message = $"You moved to the {CurrentRoom.Name}.";
        return true;
    }

    public bool IsBossRoomDestination(string input)
    {
        return FindDestination(input)?.Type == RoomType.BossRoom;
    }

    private Room? FindDestination(string input)
    {
        string choice = input.Trim();

        if (int.TryParse(choice, out int option) && option >= 1 && option <= CurrentRoom.Connections.Count)
        {
            int connectionNumber = 1;
            foreach (Room connectedRoom in CurrentRoom.Connections.Values)
            {
                if (connectionNumber++ == option)
                {
                    return connectedRoom;
                }
            }
        }

        if (TryParseDirection(choice, out Direction direction) && CurrentRoom.Connections.ContainsKey(direction))
        {
            return CurrentRoom.Connections[direction];
        }

        foreach (Room room in CurrentRoom.Connections.Values)
        {
            if (room.Name.Equals(choice, StringComparison.OrdinalIgnoreCase))
            {
                return room;
            }
        }

        return null;
    }

    private static bool TryParseDirection(string input, out Direction direction)
    {
        switch (input.Trim().ToLowerInvariant())
        {
            case "n":
            case "north": direction = Direction.North; return true;
            case "e":
            case "east": direction = Direction.East; return true;
            case "s":
            case "south": direction = Direction.South; return true;
            case "w":
            case "west": direction = Direction.West; return true;
            default: direction = Direction.North; return false;
        }
    }
}
