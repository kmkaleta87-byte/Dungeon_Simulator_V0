using System;
using System.Collections.Generic;
using System.Text;

namespace DungeonSimulation;

public class CombatTurnResult
{
    public bool CombatEnded { get; }
    public bool PlayerWon { get; }
    public bool Fled { get; }
    public string Message { get; }

    public CombatTurnResult(bool combatEnded, bool playerWon, bool fled, string message)
    {
        CombatEnded = combatEnded;
        PlayerWon = playerWon;
        Fled = fled;
        Message = message;
    }
}

public class CombatSession
{
    private readonly Player player;
    private readonly List<Enemy> enemies;
    private readonly HashSet<Enemy> enemyDodging = new();
    private readonly HashSet<Enemy> enemyBlocking = new();
    private readonly Dictionary<string, int> weaponAttackCooldowns = new(StringComparer.OrdinalIgnoreCase);
    private readonly int floor;
    private double nextAttackMultiplier = 1.0;
    private int heavyCooldown;
    private int aimCooldown;
    private int focusCooldown;
    private double pendingAimCritBonus;

    public IReadOnlyList<Enemy> Enemies => enemies;
    public bool PlayerDefeated => !player.IsAlive;

    public CombatSession(Player player, Enemy enemy, int floor = 1)
        : this(player, new List<Enemy> { enemy }, floor)
    {
    }

    public CombatSession(Player player, List<Enemy> enemies, int floor = 1)
    {
        this.player = player;
        this.enemies = enemies;
        this.floor = floor;
    }

    public string Begin(bool enemyActsFirst)
    {
        int speedAdvantage = enemies.Where(enemy => enemy.IsAlive)
            .Select(enemy => enemy.Speed - player.EffectiveSpeed).DefaultIfEmpty(0).Max();
        bool quickEnemiesActFirst = !enemyActsFirst && speedAdvantage > 0 &&
            Random.Shared.Next(100) < Math.Min(25, 5 + speedAdvantage * 2);
        string opening = enemyActsFirst || quickEnemiesActFirst
            ? "The enemies have the initiative."
            : "You have a moment to act before the enemies commit to their attacks.";

        StringBuilder message = new(opening);
        if (enemyActsFirst)
        {
            message.Append(' ');
            message.Append(EnemyTurns(_ => true));
        }
        else
        {
            if (quickEnemiesActFirst)
            {
                string quickEnemies = EnemyTurns(enemy => enemy.Speed > player.EffectiveSpeed);
                message.Append(' ');
                message.Append(quickEnemies);
            }
        }

        return message.ToString();
    }

    public string GetStatus()
    {
        return $"Enemies remaining: {CountLivingEnemies()} | Player speed: {player.EffectiveSpeed}";
    }

    public string GetOptions()
    {
        Weapon? weapon = player.Inventory.EquippedWeapon;
        StringBuilder options = new();
        options.AppendLine("Enemies:");
        for (int i = 0; i < enemies.Count; i++)
        {
            Enemy enemy = enemies[i];
            string state = enemy.IsAlive
                ? enemyDodging.Contains(enemy) ? " [DODGING]" : enemyBlocking.Contains(enemy) ? " [BLOCKING]" : ""
                : " [DEFEATED]";
            string effects = enemy.Effects.ActiveEffects.Count == 0 ? "" :
                $" [Effects: {string.Join(", ", enemy.Effects.ActiveEffects.Select(effect => $"{effect.Key} x{effect.Value.Stacks} ({effect.Value.RemainingTurns})"))}]";
            options.AppendLine($"  {i + 1}. {enemy.Name} ({enemy.Race} {enemy.Class}) HP {enemy.Health}/{enemy.MaxHealth}{state}{effects}");
        }

        options.AppendLine("Your turn:");
        options.AppendLine("  info - Inspect your equipped weapon's attacks, damage, crit chance, effects, and cooldowns");
        if (weapon == null)
        {
            options.AppendLine("  attack [target] - Try to attack without a weapon");
        }
        else
        {
            string primaryAction = weapon.Type switch
            {
                WeaponType.Bow or WeaponType.Crossbow => "shoot",
                WeaponType.Wand or WeaponType.Staff => "cast",
                WeaponType.Dagger => "stab",
                WeaponType.Axe => "cleave",
                WeaponType.Scythe => "harvest",
                _ => "slash"
            };
            string primaryDescription = weapon.Type switch
            {
                WeaponType.Wand or WeaponType.Staff => $"Use {weapon.SpellName} (costs {weapon.ManaCost} mana)",
                WeaponType.Bow or WeaponType.Crossbow => $"Attack with your {weapon.Name} ({player.Inventory.Arrows}/{player.Inventory.MaximumArrows} arrows)",
                _ => $"Attack with your {weapon.Name}"
            };
            options.AppendLine($"  {CombatEffectIcons.GetWeaponEffectIcons(weapon)}{primaryAction} [target] - {primaryDescription}");

            if (IsWarriorWeapon(weapon.Type))
            {
                foreach (WeaponAttack attack in weapon.SpecialAttacks)
                {
                    int cooldown = weaponAttackCooldowns.GetValueOrDefault(attack.Command);
                    options.AppendLine($"  {CombatEffectIcons.GetAttackPrefix(attack.Effect)}{attack.Command}{(attack.ChargesNextAttack ? "" : " [target]")} - {attack.Name} {CooldownText(cooldown)}");
                }
            }
            else if (IsArcherWeapon(weapon.Type))
            {
                foreach (WeaponAttack attack in weapon.SpecialAttacks)
                {
                    int cooldown = weaponAttackCooldowns.GetValueOrDefault(attack.Command);
                    options.AppendLine($"  {CombatEffectIcons.GetAttackPrefix(attack.Effect)}{attack.Command}{(attack.ChargesNextAttack ? "" : " [target]")} - {attack.Name} {CooldownText(cooldown)}");
                }
            }
            else if (IsMageWeapon(weapon.Type))
            {
                foreach (WeaponAttack attack in weapon.SpecialAttacks)
                {
                    int cooldown = weaponAttackCooldowns.GetValueOrDefault(attack.Command);
                    options.AppendLine($"  {CombatEffectIcons.GetAttackPrefix(attack.Effect)}{attack.Command}{(attack.ChargesNextAttack ? "" : " [target]")} - {attack.Name} {CooldownText(cooldown)}");
                }
                options.AppendLine($"  focus - Restore mana and lose this turn {CooldownText(focusCooldown)}");
            }
            else
            {
                string specialAction = weapon.Type switch
                {
                    WeaponType.Bow or WeaponType.Crossbow => $"aim [target] - Charge the next shot for +20% crit chance and damage {CooldownText(aimCooldown)}",
                    WeaponType.Wand or WeaponType.Staff => $"focus - Restore mana and lose this turn {CooldownText(focusCooldown)}",
                    _ => $"heavy [target] - Deal a heavier strike {CooldownText(heavyCooldown)}"
                };
                options.AppendLine($"  {specialAction}");
            }
        }

        options.AppendLine("  use item 1 - Use a potion and lose this turn");
        options.AppendLine("  inventory - View equipment and items");
        options.AppendLine("  flee - Try to escape");
        return options.ToString();
    }

    public CombatTurnResult TakeTurn(string input)
    {
        string trimmedInput = input.Trim();
        string[] parts = trimmedInput.ToLowerInvariant().Split(' ', StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length == 0)
        {
            return NoEnemyTurn("Choose a combat action.");
        }

        string action = parts[0];
        int targetIndex = GetTargetIndex(parts);

        if (action is "inventory" or "i")
        {
            return NoEnemyTurn(InventoryCommands.GetSummary(player.Inventory));
        }

        if (action == "info")
        {
            return NoEnemyTurn(GetAttackInfo());
        }

        if (trimmedInput.StartsWith("equip weapon ", StringComparison.OrdinalIgnoreCase) ||
            trimmedInput.StartsWith("equip armor ", StringComparison.OrdinalIgnoreCase))
        {
            InventoryCommands.TryHandle(input, player, out string equipMessage);
            return NoEnemyTurn(equipMessage);
        }

        if (action == "flee")
        {
            if (Random.Shared.NextDouble() < 0.5)
            {
                return new CombatTurnResult(true, false, true, "You escaped the fight.");
            }

            return AfterPlayerAction("You failed to escape.");
        }

        if (action == "use" && parts.Length >= 3 && parts[1] == "item")
        {
            if (!int.TryParse(parts[2], out int itemIndex) ||
                !player.Inventory.UseItem(itemIndex, player, out string itemMessage))
            {
                return NoEnemyTurn("That item cannot be used right now.");
            }

            return AfterPlayerAction(itemMessage);
        }

        Weapon? weapon = player.Inventory.EquippedWeapon;
        WeaponAttack? selectedAttack = weapon?.SpecialAttacks.FirstOrDefault(attack =>
            attack.Command.Equals(action, StringComparison.OrdinalIgnoreCase));
        if (action == "heavy" && weapon != null && IsWarriorWeapon(weapon.Type))
        {
            return NoEnemyTurn("This Warrior weapon does not have a Heavy attack. Check 'info' for its available moves.");
        }

        WeaponType? expectedType = selectedAttack != null ? weapon?.Type :
            action == "heavy" ? weapon?.Type : GetWeaponTypeForAction(action);
        if (expectedType == null)
        {
            return NoEnemyTurn("That is not a combat action. Choose one of the listed options.");
        }

        bool rangedActionMatches = (action is "shoot" or "aim") && weapon?.Type is (WeaponType.Bow or WeaponType.Crossbow);
        bool magicActionMatches = (action is "cast" or "focus") && weapon?.Type is (WeaponType.Wand or WeaponType.Staff);
        if (weapon == null || (weapon.Type != expectedType.Value && !rangedActionMatches && !magicActionMatches))
        {
            return NoEnemyTurn("That action does not match your equipped weapon.");
        }

        if (action == "aim" && weapon.Type is WeaponType.Bow or WeaponType.Crossbow)
        {
            return NoEnemyTurn("Aim is replaced by your bow's rarity-based attacks. Type 'info' to inspect them.");
        }

        if (action == "heavy" && !IsWarriorWeapon(weapon.Type))
        {
            return NoEnemyTurn("Heavy is not an attack for this weapon. Check 'info' for its available moves.");
        }

        if (selectedAttack?.ChargesNextAttack == true)
        {
            if (!weapon!.CanUse(player, selectedAttack.ManaCost))
            {
                return NoEnemyTurn(IsMageWeapon(weapon.Type)
                    ? $"You need {selectedAttack.ManaCost} mana to channel this spell; you have {player.Mana}."
                    : "You do not have enough arrows to prepare a shot.");
            }
            if (nextAttackMultiplier > 1.0)
            {
                return NoEnemyTurn("You already have a charged attack ready.");
            }
            nextAttackMultiplier = selectedAttack.DamageMultiplier;
            pendingAimCritBonus += selectedAttack.CriticalChanceBonus;
            player.SpendMana(IsMageWeapon(weapon.Type) ? selectedAttack.ManaCost : 0);
            string nextAttack = IsMageWeapon(weapon.Type) ? "spell" : "basic attack";
            return AfterPlayerAction($"You prepare {selectedAttack.Name}. Your next {nextAttack} gains +{selectedAttack.CriticalChanceBonus:P0} crit chance and deals +{(selectedAttack.DamageMultiplier - 1):P0} damage.");
        }

        if (selectedAttack != null)
        {
            int cooldown = weaponAttackCooldowns.GetValueOrDefault(selectedAttack.Command);
            if (cooldown > 0)
            {
                return NoEnemyTurn($"{selectedAttack.Name} is on cooldown for {cooldown} more turn(s).");
            }
            if (!weapon!.CanUse(player, selectedAttack.ManaCost > 0 ? selectedAttack.ManaCost : -1))
            {
                return NoEnemyTurn(IsMageWeapon(weapon.Type)
                    ? $"That spell costs {selectedAttack.ManaCost} mana; you have {player.Mana}."
                    : "Your quiver is empty. You need arrows to use that attack.");
            }
        }

        if (action == "focus")
        {
            if (focusCooldown > 0)
            {
                return NoEnemyTurn($"Focus is still on cooldown for {focusCooldown} turn(s).");
            }

            int manaRestored = 8 + Math.Max(0, (player.Wisdom - 10) / 2);
            player.RestoreMana(manaRestored);
            focusCooldown = 2;
            return AfterPlayerAction($"You focus through the staff and recover {manaRestored} mana.");
        }

        if (!TryGetLivingEnemy(targetIndex, out Enemy target))
        {
            return NoEnemyTurn("Choose a living enemy number from the list.");
        }

        if (action == "aim")
        {
            if (aimCooldown > 0)
            {
                return NoEnemyTurn($"Aim is still on cooldown for {aimCooldown} turn(s).");
            }

            nextAttackMultiplier = 1.5;
            aimCooldown = 2;
            pendingAimCritBonus = 0.2;
            return AfterPlayerAction($"You take careful aim at {target.Name}. Your next attack has +20% critical chance and deals more damage.");
        }

        if (action == "heavy" && heavyCooldown > 0)
        {
            return NoEnemyTurn($"Heavy strike is still on cooldown for {heavyCooldown} turn(s).");
        }

        if (action == "heavy")
        {
            heavyCooldown = 2;
        }

        if (selectedAttack != null)
        {
            weaponAttackCooldowns[selectedAttack.Command] = selectedAttack.CooldownTurns + 1;
            return PerformAttack(target, selectedAttack.DamageMultiplier,
                selectedAttack.CriticalChanceBonus, selectedAttack, selectedAttack.ManaCost > 0 ? selectedAttack.ManaCost : -1);
        }

        double attackMultiplier = action == "heavy" ? 1.5 : nextAttackMultiplier;
        double criticalChanceBonus = (action == "heavy" ? 0.1 : 0) + pendingAimCritBonus;
        nextAttackMultiplier = 1.0;
        pendingAimCritBonus = 0;
        return PerformAttack(target, attackMultiplier, criticalChanceBonus);
    }

    private CombatTurnResult PerformAttack(Enemy target, double attackMultiplier, double criticalChanceBonus = 0, WeaponAttack? specialAttack = null, int resourceCostOverride = -1)
    {
        AttackResult attack = resourceCostOverride >= 0
            ? player.DealDamage(criticalChanceBonus, resourceCostOverride)
            : player.DealDamage(criticalChanceBonus);
        if (!attack.Successful)
        {
            return NoEnemyTurn(attack.Message);
        }

        int damage = (int)Math.Round(attack.Damage * attackMultiplier);
        Weapon equippedWeapon = player.Inventory.EquippedWeapon!;
        List<string> hitMessages = new();
        bool isAreaAttack = specialAttack?.HitsMultipleEnemies == true;
        IEnumerable<Enemy> targets = isAreaAttack ? enemies.Where(enemy => enemy.IsAlive).ToList() : new[] { target };
        foreach (Enemy hitTarget in targets)
        {
            if (enemyDodging.Remove(hitTarget) || Random.Shared.NextDouble() < hitTarget.PassiveDodgeChance)
            {
                hitMessages.Add($"{hitTarget.Name} dodged the shot.");
                continue;
            }

            int targetDamage = hitTarget == target
                ? damage
                : Math.Max(1, (int)Math.Round(attack.Damage * attackMultiplier * specialAttack!.SecondaryDamageMultiplier));
            bool wasMarked = hitTarget.Effects.Has(CombatEffectType.Marked);
            bool executionReady = hitTarget.Health <= hitTarget.MaxHealth * 0.30 &&
                (equippedWeapon.CombatEffects.Any(effect => effect.Type == CombatEffectType.Execution) || specialAttack?.Effect == CombatEffectType.Execution);
            bool ignoresVoidDefense = equippedWeapon.CombatEffects.Any(effect => effect.Type == CombatEffectType.Void) || specialAttack?.Effect == CombatEffectType.Void;
            string effectMessage = ApplyWeaponEffect(equippedWeapon, hitTarget, ref targetDamage);
            if (specialAttack?.Effect is CombatEffectType specialEffect &&
                hitTarget.Effects.Apply(CombatEffectCatalog.CreateDefault(specialEffect, specialAttack.EffectPotency)))
            {
                effectMessage += $" {specialEffect} applied by {specialAttack.Name}.";
            }
            if (wasMarked)
            {
                targetDamage = (int)Math.Round(targetDamage * 1.2);
                effectMessage += " Marked target takes 20% bonus damage.";
            }
            if (executionReady)
            {
                targetDamage = (int)Math.Round(targetDamage * 1.5);
                effectMessage += " Execution deals 50% bonus damage to the weakened target.";
            }
            if (enemyBlocking.Remove(hitTarget))
            {
                targetDamage = Math.Max(1, (int)Math.Round(targetDamage * 0.4));
            }

            int ignoredDefense = ignoresVoidDefense ? hitTarget.DamageReduction / 2 : 0;
            int actualDamage = hitTarget.TakeDamage(targetDamage, ignoredDefense);
            int lifeStealPotency = equippedWeapon.CombatEffects
                .Where(effect => effect.Type == CombatEffectType.LifeSteal).Select(effect => effect.Potency).DefaultIfEmpty(0).Max();
            int manaStealPotency = equippedWeapon.CombatEffects
                .Where(effect => effect.Type == CombatEffectType.ManaSteal).Select(effect => effect.Potency).DefaultIfEmpty(0).Max();
            if (specialAttack?.Effect == CombatEffectType.LifeSteal) lifeStealPotency = Math.Max(lifeStealPotency, specialAttack.EffectPotency);
            if (specialAttack?.Effect == CombatEffectType.ManaSteal) manaStealPotency = Math.Max(manaStealPotency, specialAttack.EffectPotency);
            int healthRestored = (int)Math.Round(actualDamage * Math.Min(0.5, lifeStealPotency * 0.05));
            int manaRestored = (int)Math.Round(actualDamage * Math.Min(0.5, manaStealPotency * 0.05));
            player.Heal(healthRestored);
            player.RestoreMana(manaRestored);
            if (healthRestored > 0) effectMessage += $" Life steal restores {healthRestored} health.";
            if (manaRestored > 0) effectMessage += $" Mana steal restores {manaRestored} mana.";
            hitMessages.Add(hitTarget == target
                ? $"You dealt {actualDamage} damage to {hitTarget.Name}. {attack.Message}{effectMessage}"
                : $"The area attack hits {hitTarget.Name} for {actualDamage} damage.{effectMessage}");
        }

        string attackMessage = string.Join(" ", hitMessages);
        if (attackMessage.Length == 0)
        {
            attackMessage = "Every enemy avoided the attack.";
        }
        if (CountLivingEnemies() == 0)
        {
            return Win(attackMessage);
        }

        return AfterPlayerAction(attackMessage);
    }

    private CombatTurnResult AfterPlayerAction(string message)
    {
        StringBuilder roundMessage = new(message);
        string slowerEnemies = EnemyTurns(enemy => enemy.Speed <= player.EffectiveSpeed);
        if (slowerEnemies.Length > 0)
        {
            roundMessage.Append(' ');
            roundMessage.Append(slowerEnemies);
        }

        string fasterEnemies = EnemyTurns(enemy => enemy.Speed > player.EffectiveSpeed);
        if (fasterEnemies.Length > 0)
        {
            roundMessage.Append(' ');
            roundMessage.Append(fasterEnemies);
        }

        ReduceCooldowns();
        if (!player.IsAlive)
        {
            return new CombatTurnResult(true, false, false, $"{roundMessage}\nYou were defeated.");
        }

        if (CountLivingEnemies() == 0)
        {
            return Win(roundMessage.ToString());
        }

        return new CombatTurnResult(false, false, false, roundMessage.ToString());
    }

    private string EnemyTurns(Func<Enemy, bool> shouldAct)
    {
        StringBuilder messages = new();
        List<Enemy> currentEnemies = new(enemies);
        currentEnemies.Sort((left, right) => right.Speed.CompareTo(left.Speed));

        foreach (Enemy enemy in currentEnemies)
        {
            if (!enemy.IsAlive || !shouldAct(enemy) || !player.IsAlive)
            {
                continue;
            }

            string message = EnemyTurn(enemy);
            if (message.Length > 0)
            {
                messages.Append(message);
                messages.Append(' ');
            }
        }

        return messages.ToString().TrimEnd();
    }

    private string EnemyTurn(Enemy enemy)
    {
        enemyDodging.Remove(enemy);
        enemyBlocking.Remove(enemy);

        string damageOverTime = ApplyDamageOverTime(enemy);
        if (!enemy.IsAlive)
        {
            return $"{damageOverTime} {enemy.Name} falls to its wounds.";
        }

        if (enemy.Effects.GetStacks(CombatEffectType.Freeze) >= 5)
        {
            enemy.Effects.Remove(CombatEffectType.Freeze);
            enemy.Effects.AdvanceTurn();
            return $"{damageOverTime} {enemy.Name} is frozen solid and loses its turn.";
        }

        string action = ChooseEnemyAction(enemy);
        enemy.Effects.AdvanceTurn();
        return string.IsNullOrWhiteSpace(damageOverTime) ? action : $"{damageOverTime} {action}";
    }

    private string ChooseEnemyAction(Enemy enemy)
    {
        if (enemy.IsBoss && enemy.SpecialAbility == "Necromancy" && Random.Shared.NextDouble() < 0.35)
        {
            Enemy skeleton = EnemyFactory.CreateSummonedSkeleton(Math.Max(1, floor));
            enemies.Add(skeleton);
            return $"{enemy.Name} raises a weak skeleton from the floor. There are now {CountLivingEnemies()} enemies.";
        }

        if (enemy.IsBoss && enemy.SpecialAbility == "TwinBond" && Random.Shared.NextDouble() < 0.25)
        {
            foreach (Enemy ally in enemies.Where(candidate => candidate != enemy && candidate.IsBoss && candidate.IsAlive))
            {
                ally.Heal(Math.Max(1, ally.MaxHealth / 10));
            }

            return $"{enemy.Name} calls to its twin, restoring a little of their shared strength.";
        }

        switch (enemy.Class)
        {
            case EnemyClass.Archer:
                if (!enemy.Effects.Has(CombatEffectType.Root) && Random.Shared.NextDouble() < 0.1)
                {
                    enemyDodging.Add(enemy);
                    return $"{enemy.Name} shifts into a defensive stance and will dodge the next attack.";
                }
                return EnemyAttack(enemy, "fires an arrow");

            case EnemyClass.Mage:
                if (enemy.Race == EnemyRace.Skeleton && Random.Shared.NextDouble() < 0.35 && CanSummon(enemy))
                {
                    Enemy skeleton = EnemyFactory.CreateSummonedSkeleton(Math.Max(1, floor));
                    enemies.Add(skeleton);
                    return $"{enemy.Name} summons a weak skeleton. There are now {CountLivingEnemies()} enemies.";
                }

                if (enemy.Race == EnemyRace.Goblin && Random.Shared.NextDouble() < 0.35)
                {
                    enemy.IncreaseDamage(3);
                    return $"{enemy.Name} screams a taunt and rallies itself. Its damage increases.";
                }

                return EnemyAttack(enemy, "casts a spell");

            case EnemyClass.Warrior:
                if (Random.Shared.NextDouble() < 0.3)
                {
                    enemyBlocking.Add(enemy);
                    return $"{enemy.Name} raises its guard. Your next attack will deal reduced damage.";
                }
                return EnemyAttack(enemy, "swings heavily");

            case EnemyClass.Elite:
            case EnemyClass.Boss:
                if (Random.Shared.NextDouble() < 0.25)
                {
                    enemyBlocking.Add(enemy);
                    return $"{enemy.Name} braces for impact. Your next attack will deal reduced damage.";
                }
                return EnemyAttack(enemy, "strikes with practiced force");

            default:
                return EnemyAttack(enemy, "attacks");
        }
    }

    private static string ApplyDamageOverTime(Enemy enemy)
    {
        List<string> ticks = new();
        foreach (KeyValuePair<CombatEffectType, ActiveCombatEffect> effect in enemy.Effects.ActiveEffects.ToList())
        {
            if (effect.Key is not (CombatEffectType.Burn or CombatEffectType.Poison or CombatEffectType.Bleed))
            {
                continue;
            }

            int damage = effect.Value.Spec.Potency + effect.Value.Stacks - 1;
            int dealt = enemy.TakeDamage(damage, enemy.DamageReduction);
            if (dealt > 0)
            {
                ticks.Add($"{effect.Key} deals {dealt} damage to {enemy.Name}.");
            }
        }

        return string.Join(" ", ticks);
    }

    private bool CanSummon(Enemy summoner)
    {
        int summonLimit = summoner.IsBoss ? 4 : 2;
        return enemies.Count(enemy => enemy.IsSummoned && enemy.IsAlive) < summonLimit;
    }

    private string EnemyAttack(Enemy enemy, string action)
    {
        if (enemy.Effects.Has(CombatEffectType.Blind) && Random.Shared.NextDouble() < 0.35)
        {
            return $"{enemy.Name} misses while blinded.";
        }

        int damage = enemy.Damage;
        bool critical = Random.Shared.NextDouble() < enemy.CriticalChance;
        if (critical) damage = (int)Math.Round(damage * enemy.CriticalDamageMultiplier);

        int actualDamage = player.TakeDamage(damage);
        int lifeSteal = (int)Math.Round(actualDamage * enemy.LifeStealPercent);
        if (lifeSteal > 0)
        {
            enemy.Heal(lifeSteal);
        }

        return critical
            ? $"{enemy.Name} {action} and lands a critical hit for {actualDamage} damage{LifeStealText(lifeSteal)}."
            : $"{enemy.Name} {action} for {actualDamage} damage{LifeStealText(lifeSteal)}.";
    }

    private static string LifeStealText(int lifeSteal)
    {
        return lifeSteal > 0 ? $" and steals {lifeSteal} health" : "";
    }

    private CombatTurnResult Win(string message)
    {
        StringBuilder result = new(message);
        result.AppendLine();
        result.AppendLine("All enemies were defeated.");

        foreach (Enemy enemy in enemies)
        {
            int levelsGained = player.GainExperience(enemy.ExperienceReward);
            if (levelsGained > 0)
            {
                result.AppendLine($"You leveled up! Current skillpoints: {player.SkillPoints}");
            }
            LootDrop loot = LootGenerator.Generate(enemy, player.Inventory);
            player.Inventory.AddGold(loot.Gold);
            result.AppendLine($"{enemy.Name}: +{enemy.ExperienceReward} XP, +{loot.Gold} gold.");

            if (enemy.Class == EnemyClass.Archer || player.Inventory.HasBow)
            {
                int arrowAmount = 3 + Random.Shared.Next(4);
                if (player.Inventory.HasBow)
                {
                    int arrowsAdded = player.Inventory.AddArrowsToBow(arrowAmount);
                    result.AppendLine(arrowsAdded > 0
                        ? $"Arrows: +{arrowsAdded} ({player.Inventory.Arrows}/{player.Inventory.MaximumArrows})."
                        : "Your shared quiver is already full.");
                }
                else if (enemy.Class == EnemyClass.Archer)
                {
                    player.Inventory.AddItem(new Item("Arrows", ItemType.Material, goldValue: 1, quantity: arrowAmount, description: "A bundle of usable arrows."));
                    result.AppendLine($"Arrows: +{arrowAmount}.");
                }
            }

            if (loot.Weapon != null)
            {
                player.Inventory.AddWeapon(loot.Weapon);
                result.AppendLine($"Loot: {loot.Weapon.Name} ({loot.Weapon.Type}, {loot.Weapon.Rarity}).");
            }
            else if (loot.Armor != null)
            {
                player.Inventory.AddArmor(loot.Armor);
                result.AppendLine($"Loot: {loot.Armor.Name} ({loot.Armor.Slot}, {loot.Armor.Rarity}).");
            }
            else if (loot.Item != null)
            {
                player.Inventory.AddItem(loot.Item);
                result.AppendLine($"Loot: {loot.Item.Name} ({loot.Item.Rarity}).");
            }
        }

        return new CombatTurnResult(true, true, false, result.ToString());
    }

    private bool TryGetLivingEnemy(int targetIndex, out Enemy target)
    {
        if (targetIndex >= 1 && targetIndex <= enemies.Count && enemies[targetIndex - 1].IsAlive)
        {
            target = enemies[targetIndex - 1];
            return true;
        }

        foreach (Enemy enemy in enemies)
        {
            if (enemy.IsAlive)
            {
                target = enemy;
                return true;
            }
        }

        target = null!;
        return false;
    }

    private int GetTargetIndex(string[] parts)
    {
        if (parts.Length > 1 && int.TryParse(parts[^1], out int index))
        {
            return index;
        }

        return 0;
    }

    private int CountLivingEnemies()
    {
        int count = 0;
        foreach (Enemy enemy in enemies)
        {
            if (enemy.IsAlive) count++;
        }
        return count;
    }

    private void ReduceCooldowns()
    {
        if (heavyCooldown > 0) heavyCooldown--;
        if (aimCooldown > 0) aimCooldown--;
        if (focusCooldown > 0) focusCooldown--;
        foreach (string command in weaponAttackCooldowns.Keys.ToList())
        {
            if (weaponAttackCooldowns[command] > 0) weaponAttackCooldowns[command]--;
        }
    }

    private string GetAttackInfo()
    {
        Weapon? weapon = player.Inventory.EquippedWeapon;
        if (weapon == null)
        {
            return "No weapon is equipped.";
        }

        StringBuilder info = new();
        info.AppendLine($"{weapon.Name} [{weapon.Rarity} {weapon.Type}]");
        int basicDamage = weapon.CalculateDamage(player);
        double basicCrit = Math.Clamp(player.CriticalChance + weapon.CriticalChance, 0, 1);
        string basicCost = IsMageWeapon(weapon.Type) ? $" | Mana {weapon.ManaCost}" : "";
        info.AppendLine($"Basic attack: {GetBasicActionName(weapon.Type)} | Damage {basicDamage} (crit {basicDamage * (int)Player.CriticalDamageMultiplier}) | Crit {basicCrit:P0}{basicCost}");
        if (weapon.CombatEffects.Count > 0)
        {
            info.AppendLine($"Basic attack effects: {string.Join(", ", weapon.CombatEffects.Select(effect => $"{effect.Type} ({effect.Chance:P0}, potency {effect.Potency})"))}");
        }

        foreach (WeaponAttack attack in weapon.SpecialAttacks)
        {
            if (attack.ChargesNextAttack)
            {
                string channelCost = IsMageWeapon(weapon.Type) ? $" Costs {attack.ManaCost} mana now and the basic spell cost again on release." : "";
                info.AppendLine($"{attack.Name} ('{attack.Command}'): {attack.Description} Next hit x{attack.DamageMultiplier:0.##}, +{attack.CriticalChanceBonus:P0} crit; costs your turn to charge.{channelCost}");
                continue;
            }

            int damage = (int)Math.Round(weapon.CalculateDamage(player) * attack.DamageMultiplier);
            double crit = Math.Clamp(player.CriticalChance + weapon.CriticalChance + attack.CriticalChanceBonus, 0, 1);
            int criticalDamage = (int)Math.Round(damage * Player.CriticalDamageMultiplier);
            string effect = attack.Effect?.ToString() ?? "No special effect";
            int cooldown = weaponAttackCooldowns.GetValueOrDefault(attack.Command);
            string area = attack.HitsMultipleEnemies ? $", area attack (others x{attack.SecondaryDamageMultiplier:0.##})" : "";
            string manaCost = IsMageWeapon(weapon.Type) ? $", mana {attack.ManaCost}" : "";
            info.AppendLine($"{attack.Name} ('{attack.Command} [target]'): {attack.Description} Damage {damage} (crit {criticalDamage}, x{attack.DamageMultiplier:0.##}), crit {crit:P0}, effect {effect} (potency {attack.EffectPotency}){area}{manaCost}, cooldown {attack.CooldownTurns} turn(s){(cooldown > 0 ? $", currently {cooldown}" : "; ready")}.");
        }

        if (weapon.SpecialAttacks.Count == 0 && IsWarriorWeapon(weapon.Type))
        {
            info.Append("Common Warrior weapons have only their basic attack.");
        }
        return info.ToString().TrimEnd();
    }

    private static string GetBasicActionName(WeaponType type) => type switch
    {
        WeaponType.Dagger => "stab",
        WeaponType.Axe => "cleave",
        WeaponType.Scythe => "harvest",
        WeaponType.Bow or WeaponType.Crossbow => "shoot",
        WeaponType.Wand or WeaponType.Staff => "cast",
        _ => "slash"
    };

    private static bool IsWarriorWeapon(WeaponType type) => type is WeaponType.Sword or WeaponType.Dagger or WeaponType.Axe or WeaponType.Scythe;
    private static bool IsArcherWeapon(WeaponType type) => type is WeaponType.Bow or WeaponType.Crossbow;
    private static bool IsMageWeapon(WeaponType type) => type is WeaponType.Wand or WeaponType.Staff;

    private static string CooldownText(int cooldown)
    {
        return cooldown > 0 ? $"[Cooldown: {cooldown}]" : "[Ready]";
    }

    private static WeaponType? GetWeaponTypeForAction(string action)
    {
        return action switch
        {
            "slash" => WeaponType.Sword,
            "stab" => WeaponType.Dagger,
            "cleave" => WeaponType.Axe,
            "harvest" => WeaponType.Scythe,
            "shoot" or "aim" => WeaponType.Bow,
            "cast" or "focus" => WeaponType.Staff,
            "attack" => WeaponType.Sword,
            _ => null
        };
    }

    private string ApplyWeaponEffect(Weapon weapon, Enemy target, ref int damage)
    {
        StringBuilder message = new(weapon.Effect switch
        {
            WeaponEffect.Flame => AddFlameDamage(ref damage),
            WeaponEffect.Poison => AddPoisonDamage(ref damage),
            WeaponEffect.Splash => ApplySplashDamage(target, damage),
            _ => ""
        });

        foreach (CombatEffectSpec effect in weapon.CombatEffects)
        {
            if (target.Effects.Apply(effect))
            {
                message.Append($" {effect.Type} applied.");
            }
        }

        return message.ToString();
    }

    private static string AddFlameDamage(ref int damage)
    {
        damage += 2;
        return " The flame effect adds 2 damage.";
    }

    private static string AddPoisonDamage(ref int damage)
    {
        damage += 1;
        return " Poison bites into the wound for 1 extra damage.";
    }

    private string ApplySplashDamage(Enemy primaryTarget, int damage)
    {
        int splashDamage = Math.Max(1, damage / 3);
        int hitCount = 0;
        foreach (Enemy enemy in enemies)
        {
            if (enemy != primaryTarget && enemy.IsAlive)
            {
                enemy.TakeDamage(splashDamage);
                hitCount++;
            }
        }

        return hitCount == 0 ? "" : $" The shot splashes for {splashDamage} damage across {hitCount} other target(s).";
    }

    private CombatTurnResult NoEnemyTurn(string message)
    {
        return new CombatTurnResult(false, false, false, message);
    }
}
