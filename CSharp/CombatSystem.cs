using System.Text;

namespace DungeonSimulation;

public static class CombatSystem
{
    public static bool IsCombatRoom(RoomType roomType)
    {
        return roomType is RoomType.EnemyRoom1 or RoomType.EnemyRoom2 or RoomType.EnemyRoom3 or RoomType.EnemyRoom4 or RoomType.EliteRoom or RoomType.BossRoom;
    }

    public static CombatResult Fight(Player player, Enemy enemy)
    {
        StringBuilder log = new();
        log.AppendLine($"Combat started: {enemy.Name} ({enemy.Race} {enemy.Class})");

        bool playerActsFirst = player.Speed >= enemy.Speed;
        while (player.IsAlive && enemy.IsAlive)
        {
            if (playerActsFirst)
            {
                if (!PlayerAttack(player, enemy, log))
                {
                    return new CombatResult(false, log.ToString());
                }

                if (enemy.IsAlive)
                {
                    EnemyAttack(player, enemy, log);
                }
            }
            else
            {
                EnemyAttack(player, enemy, log);

                if (player.IsAlive)
                {
                    if (!PlayerAttack(player, enemy, log))
                    {
                        return new CombatResult(false, log.ToString());
                    }
                }
            }
        }

        if (!player.IsAlive)
        {
            log.AppendLine("You were defeated. The dungeon keeps your secrets.");
            return new CombatResult(false, log.ToString());
        }

        LootDrop loot = LootGenerator.Generate(enemy, player.Inventory);
        int levelsGained = player.GainExperience(enemy.ExperienceReward);
        player.Inventory.AddGold(loot.Gold);

        if (loot.Weapon != null)
        {
            player.Inventory.AddWeapon(loot.Weapon);
            log.AppendLine($"The enemy dropped {loot.Weapon.Rarity} {loot.Weapon.Name}.");
        }
        else if (loot.Armor != null)
        {
            player.Inventory.AddArmor(loot.Armor);
            log.AppendLine($"The enemy dropped {loot.Armor.Rarity} {loot.Armor.Name}.");
        }
        else if (loot.Item != null)
        {
            player.Inventory.AddItem(loot.Item);
            log.AppendLine($"The enemy dropped {loot.Item.Rarity} {loot.Item.Name}.");
        }

        log.AppendLine($"You gained {enemy.ExperienceReward} XP and {loot.Gold} gold.");
        if (levelsGained > 0)
        {
            log.AppendLine($"You leveled up! Current skillpoints: {player.SkillPoints}");
        }
        return new CombatResult(true, log.ToString());
    }

    private static bool PlayerAttack(Player player, Enemy enemy, StringBuilder log)
    {
        AttackResult attack = player.DealDamage();
        if (!attack.Successful)
        {
            log.AppendLine(attack.Message);
            return false;
        }

        int damage = enemy.TakeDamage(attack.Damage);
        log.AppendLine($"You dealt {damage} damage. {attack.Message}");
        if (!enemy.IsAlive)
        {
            log.AppendLine($"{enemy.Name} was defeated.");
        }

        return true;
    }

    private static void EnemyAttack(Player player, Enemy enemy, StringBuilder log)
    {
        int damage = enemy.Damage;
        if (Random.Shared.NextDouble() < enemy.CriticalChance)
        {
            damage *= 2;
            log.AppendLine($"{enemy.Name} landed a critical hit!");
        }

        int actualDamage = player.TakeDamage(damage);
        log.AppendLine($"{enemy.Name} dealt {actualDamage} damage.");
    }
}
