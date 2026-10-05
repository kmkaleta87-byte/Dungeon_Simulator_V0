using System;
using System.Linq;

namespace DungeonSimulation;

public class Player
{
    public const double CriticalDamageMultiplier = 2.0;

    private const int StartingMaxHealth = 100;
    private const int StartingMaxMana = 50;
    private const int StartingAbilityScore = 10;
    private const int StartingSpeed = 10;
    private const double StartingCriticalChance = 0.05;

    public string Name { get; set; }
    public PlayerClass Class { get; private set; }
    public bool ClassChosen { get; private set; }

    public int Level { get; private set; } = 1;
    public int Experience { get; private set; }
    public int SkillPoints { get; private set; }

    public int Health { get; private set; }
    public int MaxHealth => StartingMaxHealth + ((Level - 1) * 20) + (Math.Max(0, Constitution - StartingAbilityScore) * 10);
    public int Mana { get; private set; }
    public int MaxMana => StartingMaxMana + ((Level - 1) * 10) + (Math.Max(0, Intelligence - StartingAbilityScore) * 5);

    // Core Dungeons and Dragons ability scores.
    public int Strength { get; set; }
    public int Dexterity { get; set; }
    public int Constitution { get; set; }
    public int Intelligence { get; set; }
    public int Wisdom { get; set; }
    public int Charisma { get; set; }

    // Basic combat values that will be expanded by equipment and skills later.
    public int Speed { get; set; }
    public int EffectiveDexterity => Dexterity - (Class == PlayerClass.Ranger && Inventory.HasShield ? 3 : 0);
    public int EffectiveSpeed => Speed + (EffectiveDexterity - StartingAbilityScore) / 2 +
        (Inventory.EquippedWeapon?.SpeedModifier ?? 0) + Inventory.EquippedArmor.Values.Sum(armor => armor.SpeedModifier);
    public double CriticalChance { get; set; }

    public Inventory Inventory { get; } = new();
    public CombatEffectState Effects { get; } = new();

    public int BaseAttackDamage => Class == PlayerClass.Mage ? Intelligence : Strength;
    public int ExperienceToNextLevel => CalculateExperienceForLevel(Level);
    public bool IsAlive => Health > 0;

    public Player(string name, PlayerClass playerClass = PlayerClass.Warrior)
    {
        Name = name;
        Class = playerClass;
        Health = MaxHealth;
        Mana = MaxMana;

        Strength = StartingAbilityScore;
        Dexterity = StartingAbilityScore;
        Constitution = StartingAbilityScore;
        Intelligence = StartingAbilityScore;
        Wisdom = StartingAbilityScore;
        Charisma = StartingAbilityScore;

        Speed = StartingSpeed;
        CriticalChance = StartingCriticalChance;

    }

    public void ChooseClass(PlayerClass playerClass)
    {
        if (ClassChosen)
        {
            return;
        }

        Class = playerClass;
        ClassChosen = true;
        Weapon starterWeapon = Class switch
        {
            PlayerClass.Ranger => new Weapon("Frayed Hunting Bow", WeaponType.Bow, 3, 12, arrows: 14,
                goldValue: 4, description: "A simple bow, worn but dependable."),
            PlayerClass.Mage => new Weapon("Cracked Ember Staff", WeaponType.Staff, 8, 8, manaCost: 4,
                goldValue: 4, description: "A cracked staff with a coal that refuses to go cold.",
                spellName: "Ember Bolt", element: ElementType.Fire),
            _ => WarriorWeaponCatalog.CreateStarterSword()
        };

        Inventory.AddWeapon(starterWeapon);
        Inventory.EquipWeapon(0);
    }

    public void UpdateClassFromEquippedWeapon()
    {
        if (Inventory.EquippedWeapon == null)
        {
            return;
        }

        Class = Inventory.EquippedWeapon.Type switch
        {
            WeaponType.Bow or WeaponType.Crossbow => PlayerClass.Ranger,
            WeaponType.Wand or WeaponType.Staff => PlayerClass.Mage,
            _ => PlayerClass.Warrior
        };
        ClassChosen = true;
    }

    public int GainExperience(int amount)
    {
        int levelsGained = 0;
        if (amount > 0)
        {
            Experience += amount;

            while (Experience >= ExperienceToNextLevel)
            {
                LevelUp();
                levelsGained++;
            }
        }

        return levelsGained;
    }

    public int TakeDamage(int amount)
    {
        int reducedDamage = Math.Max(1, amount - Inventory.GetDamageReduction(this));
        int actualDamage = Math.Min(reducedDamage, Health);
        Health -= actualDamage;
        return actualDamage;
    }

    public void Heal(int amount)
    {
        if (amount > 0)
        {
            Health = Math.Min(MaxHealth, Health + amount);
        }
    }

    public void RestoreForNewFloor()
    {
        Health = MaxHealth;
        Mana = MaxMana;
    }

    public void SpendMana(int amount)
    {
        if (amount > 0)
        {
            Mana = Math.Max(0, Mana - amount);
        }
    }

    public void RestoreMana(int amount)
    {
        if (amount > 0)
        {
            Mana = Math.Min(MaxMana, Mana + amount);
        }
    }

    public AttackResult DealDamage(Weapon weapon, double additionalCriticalChance = 0, int resourceCostOverride = -1)
    {
        UpdateClassFromEquippedWeapon();

        if (weapon.Type is WeaponType.Wand or WeaponType.Staff && Inventory.HasShield)
        {
            return new AttackResult(false, false, 0, "You cannot cast while a shield is equipped. Remove the shield first.");
        }

        if (!weapon.CanUse(this, resourceCostOverride))
        {
            string reason = weapon.Type is WeaponType.Bow or WeaponType.Crossbow
                ? "The bow has no arrows."
                : "You do not have enough mana to cast that spell.";

            return new AttackResult(false, false, 0, reason);
        }

        int damage = weapon.CalculateDamage(this);
        double totalCriticalChance = Math.Clamp(CriticalChance + weapon.CriticalChance + additionalCriticalChance, 0, 1);
        bool criticalHit = Random.Shared.NextDouble() < totalCriticalChance;

        if (criticalHit)
        {
            damage = (int)Math.Round(damage * CriticalDamageMultiplier);
        }

        weapon.ConsumeResource(this, resourceCostOverride);
        string message = criticalHit ? "Critical hit!" : "Hit!";
        return new AttackResult(true, criticalHit, damage, message);
    }

    public AttackResult DealDamage()
    {
        return DealDamage(0);
    }

    public AttackResult DealDamage(double additionalCriticalChance)
    {
        if (Inventory.EquippedWeapon == null)
        {
            return new AttackResult(false, false, 0, "You do not have a weapon equipped.");
        }

        return DealDamage(Inventory.EquippedWeapon, additionalCriticalChance);
    }

    public AttackResult DealDamage(double additionalCriticalChance, int resourceCostOverride)
    {
        if (Inventory.EquippedWeapon == null)
        {
            return new AttackResult(false, false, 0, "You do not have a weapon equipped.");
        }

        return DealDamage(Inventory.EquippedWeapon, additionalCriticalChance, resourceCostOverride);
    }

    public bool LevelUp()
    {
        if (Experience < ExperienceToNextLevel)
        {
            return false;
        }

        Experience -= ExperienceToNextLevel;
        Level++;
        SkillPoints++;

        return true;
    }

    public bool SpendSkillPoint(string stat, out string message)
    {
        if (SkillPoints <= 0)
        {
            message = "You have no skill points to spend.";
            return false;
        }

        switch (stat.Trim().ToLowerInvariant())
        {
            case "str": case "strength": Strength++; break;
            case "dex": case "dexterity": Dexterity++; break;
            case "con": case "constitution":
                Constitution++;
                Health = Math.Min(MaxHealth, Health + 10);
                break;
            case "int": case "intelligence":
                Intelligence++;
                Mana = Math.Min(MaxMana, Mana + 5);
                break;
            case "wis": case "wisdom": Wisdom++; break;
            case "cha": case "charisma": Charisma++; break;
            case "speed": Speed++; break;
            case "crit": case "critical": case "critical chance": CriticalChance = Math.Min(1, CriticalChance + 0.01); break;
            default:
                message = "Choose STR, DEX, CON, INT, WIS, CHA, Speed, or Crit.";
                return false;
        }

        SkillPoints--;
        message = $"You improved {stat}. {SkillPoints} skill point(s) remain.";
        return true;
    }

    public int RespecCost => RespecCount >= 25 ? int.MaxValue : 100 * (1 << RespecCount);
    public int RespecCount { get; private set; }
    public bool HasInvestedSkillPoints => Strength > StartingAbilityScore || Dexterity > StartingAbilityScore ||
        Constitution > StartingAbilityScore || Intelligence > StartingAbilityScore || Wisdom > StartingAbilityScore ||
        Charisma > StartingAbilityScore || Speed > StartingSpeed || CriticalChance > StartingCriticalChance;

    public bool Respec(out string message)
    {
        if (!HasInvestedSkillPoints)
        {
            message = "You have no invested skill points to refund.";
            return false;
        }

        int refunded = Math.Max(0, Strength - StartingAbilityScore) + Math.Max(0, Dexterity - StartingAbilityScore) +
            Math.Max(0, Constitution - StartingAbilityScore) + Math.Max(0, Intelligence - StartingAbilityScore) +
            Math.Max(0, Wisdom - StartingAbilityScore) + Math.Max(0, Charisma - StartingAbilityScore) +
            Math.Max(0, Speed - StartingSpeed) + (int)Math.Round(Math.Max(0, CriticalChance - StartingCriticalChance) / 0.01);

        Strength = Dexterity = Constitution = Intelligence = Wisdom = Charisma = StartingAbilityScore;
        Speed = StartingSpeed;
        CriticalChance = StartingCriticalChance;
        SkillPoints += refunded;
        Health = Math.Min(Health, MaxHealth);
        Mana = Math.Min(Mana, MaxMana);
        RespecCount++;
        message = $"Your skills were reset. Refunded {refunded} point(s). Respec cost: {RespecCost} gold next time.";
        return true;
    }

    public void RestoreFromSave(PlayerSaveData saved)
    {
        Name = string.IsNullOrWhiteSpace(saved.Name) ? "Adventurer" : saved.Name;
        Class = saved.Class;
        ClassChosen = saved.ClassChosen;
        Level = Math.Max(1, saved.Level);
        Experience = Math.Max(0, saved.Experience);
        SkillPoints = Math.Max(0, saved.SkillPoints);
        Strength = Math.Max(1, saved.Strength);
        Dexterity = Math.Max(1, saved.Dexterity);
        Constitution = Math.Max(1, saved.Constitution);
        Intelligence = Math.Max(1, saved.Intelligence);
        Wisdom = Math.Max(1, saved.Wisdom);
        Charisma = Math.Max(1, saved.Charisma);
        Speed = Math.Max(1, saved.Speed);
        CriticalChance = Math.Clamp(saved.CriticalChance, 0, 1);
        RespecCount = Math.Max(0, saved.RespecCount);
        Health = Math.Clamp(saved.Health, 1, MaxHealth);
        Mana = Math.Clamp(saved.Mana, 0, MaxMana);
    }

    public static int CalculateExperienceForLevel(int level)
    {
        if (level < 1)
        {
            level = 1;
        }

        // Early levels use a predictable +100 ramp: 200, 300, ... 1000.
        if (level <= 9)
        {
            return 100 + (level * 100);
        }

        // After the 1000 XP threshold, growth becomes exponential.
        return (int)Math.Round(1000 * Math.Pow(1.3, level - 9));
    }
}
