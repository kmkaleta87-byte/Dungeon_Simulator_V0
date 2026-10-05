namespace DungeonSimulation;

public static class RoomInfo
{
    public static string GetName(RoomType type) => type switch
    {
        RoomType.StartingRoom => "Starting Room",
        RoomType.TreasureRoom => "Treasure Room",
        RoomType.WeaponTreasureRoom => "Armory Treasure Room",
        RoomType.FountainRoom => "Fountain Room",
        RoomType.ShopRoom => "Shop",
        RoomType.EmptyRoom => "Empty Room",
        RoomType.BossRoom => "Boss Room",
        RoomType.EnemyRoom1 => "Enemy Room",
        RoomType.EnemyRoom2 => "Enemy Room",
        RoomType.EnemyRoom3 => "Enemy Room",
        RoomType.EnemyRoom4 => "Enemy Room",
        RoomType.EliteRoom => "Mini Boss / Elite Room",
        RoomType.TrapRoom => "Trap Room",
        _ => "Unknown Room"
    };

    public static char GetSymbol(RoomType type) => type switch
    {
        RoomType.StartingRoom => 'S',
        RoomType.TreasureRoom => 'T',
        RoomType.WeaponTreasureRoom => 'W',
        RoomType.FountainRoom => 'F',
        RoomType.ShopRoom => '$',
        RoomType.EmptyRoom => 'O',
        RoomType.BossRoom => 'B',
        RoomType.EnemyRoom1 => '!',
        RoomType.EnemyRoom2 => '!',
        RoomType.EnemyRoom3 => '!',
        RoomType.EnemyRoom4 => '!',
        RoomType.EliteRoom => 'E',
        RoomType.TrapRoom => '^',
        _ => '?'
    };
}
